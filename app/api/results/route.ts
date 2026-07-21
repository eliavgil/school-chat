import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import { prisma } from "@/lib/db/prisma"
import type { Slide } from "@/lib/lessons/types"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const classIdFilter = searchParams.get("class_id")

  const sb = adminClient()

  const [lessonsRes, sessionsRes, responsesRes, classes] = await Promise.all([
    sb.from("lessons").select("id, title, slides"),
    sb.from("live_sessions").select("id, lesson_id, room_code, created_at").order("created_at", { ascending: false }),
    sb.from("responses").select("session_id, student_id, slide_id, question_id, answer"),
    prisma.class.findMany({ include: { students: { select: { id: true, name: true, classId: true } } } }),
  ])

  if (lessonsRes.error) return NextResponse.json({ error: lessonsRes.error.message }, { status: 500 })
  if (sessionsRes.error) return NextResponse.json({ error: sessionsRes.error.message }, { status: 500 })
  if (responsesRes.error) return NextResponse.json({ error: responsesRes.error.message }, { status: 500 })

  const lessonMap = new Map((lessonsRes.data ?? []).map(l => [l.id, l]))
  const allResponses = responsesRes.data ?? []

  const allStudents = classes.flatMap(c =>
    c.students.map(s => ({ ...s, className: c.displayName || c.name }))
  )
  const filteredStudents = classIdFilter
    ? allStudents.filter(s => s.classId === classIdFilter)
    : allStudents
  const studentMap = new Map(filteredStudents.map(s => [s.id, s]))
  const filteredIds = new Set(filteredStudents.map(s => s.id))

  const sessions = (sessionsRes.data ?? []).map(sess => {
    const lesson = lessonMap.get(sess.lesson_id)
    const slides: Slide[] = lesson?.slides ?? []

    const slidesWithQuestions = slides
      .filter(s => s.questions && s.questions.length > 0)
      .map(s => ({
        slideId: s.id,
        slideTitle: s.title,
        slideType: s.type,
        questions: (s.questions ?? []).map(q => ({
          id: q.id,
          text: q.text,
          options: q.options,
          correctIndex: q.correct_index,
        })),
      }))

    const sessionResponses = allResponses.filter(r =>
      r.session_id === sess.id &&
      (filteredIds.size === 0 || filteredIds.has(r.student_id))
    )

    // Group by student
    const byStudent = new Map<string, Record<string, string>>()
    for (const r of sessionResponses) {
      if (!byStudent.has(r.student_id)) byStudent.set(r.student_id, {})
      byStudent.get(r.student_id)![`${r.slide_id}__${r.question_id}`] = r.answer
    }

    const quizPairs = slidesWithQuestions.flatMap(s =>
      s.questions
        .filter(q => q.correctIndex !== null)
        .map(q => ({ key: `${s.slideId}__${q.id}`, correctIndex: q.correctIndex! }))
    )

    const studentResults = Array.from(byStudent.entries()).map(([sid, answers]) => {
      const student = studentMap.get(sid)
      const correct = quizPairs.filter(p => answers[p.key] === String(p.correctIndex)).length
      return {
        studentId: sid,
        studentName: student?.name ?? sid,
        classId: student?.classId ?? null,
        answers,
        quizCorrect: correct,
        quizTotal: quizPairs.length,
        quizScore: quizPairs.length > 0 ? correct / quizPairs.length : null,
      }
    })

    return {
      id: sess.id,
      lessonId: sess.lesson_id,
      lessonTitle: lesson?.title ?? "שיעור ללא שם",
      roomCode: sess.room_code,
      createdAt: sess.created_at,
      slidesWithQuestions,
      studentResults,
    }
  })

  const studentAverages = filteredStudents.map(student => {
    const participated = sessions
      .filter(s => s.studentResults.some(r => r.studentId === student.id))
      .map(s => {
        const r = s.studentResults.find(r => r.studentId === student.id)!
        return {
          sessionId: s.id,
          lessonTitle: s.lessonTitle,
          createdAt: s.createdAt,
          score: r.quizScore,
          correct: r.quizCorrect,
          total: r.quizTotal,
        }
      })

    const scored = participated.filter(s => s.score !== null)
    const avg = scored.length > 0
      ? scored.reduce((sum, s) => sum + s.score!, 0) / scored.length
      : null

    return {
      studentId: student.id,
      studentName: student.name,
      classId: student.classId,
      className: student.className,
      sessionsParticipated: participated.length,
      averageScore: avg,
      sessions: participated,
    }
  })

  return NextResponse.json({
    classes: classes.map(c => ({ id: c.id, name: c.displayName || c.name })),
    sessions,
    studentAverages,
  })
}
