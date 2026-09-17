import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { sendPushToUser } from "@/lib/push"

// GET — one-time catch-up utility, not part of the recurring poll. Push
// only fires for an absence the moment it's first synced into
// MashovAbsenceEvent (see /api/cron/mashov-absences) — an event synced
// before a recipient had a push subscription yet silently gets no
// notification, and never gets a second chance since it's no longer "new"
// on later runs. This re-sends today's unjustified absences to the
// current homeroom teacher + grade coordinator regardless of whether they
// were "new" this run, for exactly that catch-up case. Safe to run more
// than once — worst case is a duplicate notification for something
// already delivered. Guarded by CRON_SECRET, same as the recurring cron.
const GRADE_COORDINATOR_EMAIL = "eliavgil@gmail.com"

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const coordinator = await prisma.user.findUnique({
    where: { email: GRADE_COORDINATOR_EMAIL },
    select: { id: true },
  })

  const todayStr = new Date().toISOString().slice(0, 10)
  const dayStart = new Date(`${todayStr}T00:00:00`)
  const dayEnd = new Date(`${todayStr}T23:59:59.999`)

  const events = await prisma.mashovAbsenceEvent.findMany({
    where: { lessonDate: { gte: dayStart, lte: dayEnd }, justified: false },
  })

  let notified = 0
  const homeroomCache = new Map<string, string | null>()

  for (const e of events) {
    const classKey = `${e.classCode}${e.classNum}`
    if (!homeroomCache.has(classKey)) {
      const cls = await prisma.class.findFirst({
        where: { OR: [{ displayName: classKey }, { name: classKey }] },
        select: { id: true },
      })
      const teacher = cls
        ? await prisma.user.findFirst({ where: { classId: cls.id, role: "TEACHER" }, select: { id: true } })
        : null
      homeroomCache.set(classKey, teacher?.id ?? null)
    }
    const homeroomId = homeroomCache.get(classKey)

    const recipients = Array.from(new Set([homeroomId, coordinator?.id].filter((id): id is string => !!id)))
    for (const userId of recipients) {
      await sendPushToUser(userId, {
        title: "חיסור נרשם",
        body: `${e.studentName} — ${e.subjectName} (${classKey}, שיעור ${e.lessonNum})`,
      })
      notified++
    }
  }

  return NextResponse.json({ ok: true, eventsToday: events.length, notified })
}
