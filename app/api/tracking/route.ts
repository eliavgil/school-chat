import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = adminClient()

  const [lessonsRes, sessionsRes, responsesRes, classes] = await Promise.all([
    sb.from("lessons").select("id, title, created_at").order("created_at", { ascending: true }),
    sb.from("live_sessions").select("id, lesson_id, class_id, room_code, created_at").order("created_at", { ascending: false }),
    sb.from("responses").select("session_id, student_id"),
    prisma.class.findMany({
      select: { id: true, name: true, displayName: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (lessonsRes.error) return NextResponse.json({ error: lessonsRes.error.message }, { status: 500 })
  if (sessionsRes.error) return NextResponse.json({ error: sessionsRes.error.message }, { status: 500 })
  if (responsesRes.error) return NextResponse.json({ error: responsesRes.error.message }, { status: 500 })

  const lessons = lessonsRes.data ?? []
  const sessions = sessionsRes.data ?? []
  const responses = responsesRes.data ?? []

  // Build student → classId map from Prisma
  const students = await prisma.student.findMany({ select: { id: true, classId: true } })
  const studentClassMap = new Map(students.map(s => [s.id, s.classId]))

  // For each session, determine which class it was for:
  // 1. Use session.class_id if set
  // 2. Otherwise infer from responding students (majority classId)
  const sessionClassMap = new Map<string, string | null>()

  const responsesBySession = new Map<string, string[]>()
  for (const r of responses) {
    if (!responsesBySession.has(r.session_id)) responsesBySession.set(r.session_id, [])
    responsesBySession.get(r.session_id)!.push(r.student_id)
  }

  for (const sess of sessions) {
    if (sess.class_id) {
      sessionClassMap.set(sess.id, sess.class_id)
      continue
    }

    const responders = responsesBySession.get(sess.id) ?? []
    if (responders.length === 0) {
      sessionClassMap.set(sess.id, null)
      continue
    }

    // Majority vote on classId
    const tally = new Map<string, number>()
    for (const sid of responders) {
      const cid = studentClassMap.get(sid)
      if (cid) tally.set(cid, (tally.get(cid) ?? 0) + 1)
    }
    if (tally.size === 0) { sessionClassMap.set(sess.id, null); continue }
    const winner = [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0]
    sessionClassMap.set(sess.id, winner)
  }

  // Build per-class lesson tracking
  const classMap = new Map(classes.map(c => [c.id, c.displayName || c.name]))

  const classTracking = classes.map(cls => {
    // Sessions that were for this class, newest first
    const classSessions = sessions
      .filter(s => sessionClassMap.get(s.id) === cls.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const taughtLessonIds = new Set(classSessions.map(s => s.lesson_id))

    // Map lesson → most recent session for this class
    const lessonSessionMap = new Map<string, typeof sessions[0]>()
    for (const s of [...classSessions].reverse()) {
      lessonSessionMap.set(s.lesson_id, s) // last one wins (most recent)
    }
    // Fix: keep most recent
    for (const s of classSessions) {
      if (!lessonSessionMap.has(s.lesson_id)) lessonSessionMap.set(s.lesson_id, s)
      else lessonSessionMap.set(s.lesson_id, s) // classSessions is already newest-first
    }

    let foundNext = false
    const lessonList = lessons.map(l => {
      const done = taughtLessonIds.has(l.id)
      let status: "done" | "next" | "upcoming"
      if (done) {
        status = "done"
      } else if (!foundNext) {
        status = "next"
        foundNext = true
      } else {
        status = "upcoming"
      }
      const sess = lessonSessionMap.get(l.id)
      return {
        lessonId: l.id,
        lessonTitle: l.title,
        status,
        sessionId: sess?.id ?? null,
        sessionDate: sess?.created_at ?? null,
        roomCode: sess?.room_code ?? null,
      }
    })

    const nextLesson = lessonList.find(l => l.status === "next") ?? null

    return {
      classId: cls.id,
      className: cls.displayName || cls.name,
      completedCount: taughtLessonIds.size,
      totalLessons: lessons.length,
      nextLesson,
      lessons: lessonList,
    }
  })

  // Sessions without an identified class
  const unassigned = sessions
    .filter(s => !sessionClassMap.get(s.id))
    .map(s => ({
      sessionId: s.id,
      lessonId: s.lesson_id,
      lessonTitle: lessons.find(l => l.id === s.lesson_id)?.title ?? "שיעור לא ידוע",
      date: s.created_at,
      roomCode: s.room_code,
    }))

  return NextResponse.json({
    lessons: lessons.map(l => ({ id: l.id, title: l.title, createdAt: l.created_at })),
    classes: classes.map(c => ({ id: c.id, name: c.displayName || c.name })),
    classTracking,
    unassigned,
  })
}
