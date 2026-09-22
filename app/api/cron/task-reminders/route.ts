import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { sendPushToUser } from "@/lib/push"

// GET — runs on a schedule (see vercel.json), finds due-and-unsent task
// reminders and pushes them. Guarded by CRON_SECRET so this can't be
// triggered by an outside request; until that env var is set, every
// request fails the check and nothing fires (safe default, not an error).
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  let sent = 0

  // Self-heal: assignees created before a teacher's account existed (or
  // before this backfill existed) never got userId linked, since that only
  // happened at account-approval time — without it a reminder can never be
  // pushed to them. Cheap to re-check every run.
  const unlinked = await prisma.staffTaskAssignee.findMany({
    where: { userId: null, reminderAt: { not: null }, reminderSent: false },
    select: { id: true, teacherLabel: true },
  })
  if (unlinked.length) {
    const teachers = await prisma.user.findMany({
      where: { name: { in: unlinked.map(a => a.teacherLabel) }, role: "TEACHER" },
      select: { id: true, name: true },
    })
    const userIdByName = new Map(teachers.map(u => [u.name, u.id]))
    for (const a of unlinked) {
      const userId = userIdByName.get(a.teacherLabel)
      if (userId) await prisma.staffTaskAssignee.update({ where: { id: a.id }, data: { userId } })
    }
  }

  const personalDue = await prisma.personalTask.findMany({
    where: { reminderAt: { lte: now }, reminderSent: false, done: false },
    select: { id: true, userId: true, title: true, link: true },
  })
  for (const t of personalDue) {
    await sendPushToUser(t.userId, { title: "תזכורת למשימה", body: t.title, url: t.link || "/teacher/tasks" })
    await prisma.personalTask.update({ where: { id: t.id }, data: { reminderSent: true } })
    sent++
  }

  const staffDue = await prisma.staffTaskAssignee.findMany({
    where: { reminderAt: { lte: now }, reminderSent: false, done: false, userId: { not: null } },
    select: { id: true, userId: true, staffTask: { select: { title: true, link: true } } },
  })
  for (const a of staffDue) {
    await sendPushToUser(a.userId!, { title: "תזכורת למשימת צוות", body: a.staffTask.title, url: a.staffTask.link || "/teacher/tasks" })
    await prisma.staffTaskAssignee.update({ where: { id: a.id }, data: { reminderSent: true } })
    sent++
  }

  return NextResponse.json({ ok: true, sent })
}
