import { prisma } from "@/lib/db/prisma"
import { sendPushToUser } from "@/lib/push"
import { matchTeacherUsersByName } from "@/lib/teacher-name-match"

// Shared by the GitHub Actions-pinged /api/cron/task-reminders (every 15
// minutes on paper, but GitHub throttles scheduled runs on a low-traffic
// repo to every few hours in practice) and an opportunistic piggyback call
// from /api/home (hit on every real page load) — whichever fires first
// catches a given due reminder, so real usage of the app covers the gaps
// between the unreliable scheduled runs.
export async function runTaskReminders(): Promise<{ sent: number }> {
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
    const userIdByName = await matchTeacherUsersByName(unlinked.map(a => a.teacherLabel))
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

  return { sent }
}

// In-memory, per-serverless-instance throttle for the opportunistic
// /api/home piggyback — the query itself is cheap, but there's no reason to
// re-run it on every single page load when ten people open the home page
// within the same minute.
let lastOpportunisticRun = 0

export function runTaskRemindersOpportunistically() {
  const now = Date.now()
  if (now - lastOpportunisticRun < 60_000) return
  lastOpportunisticRun = now
  runTaskReminders().catch(err => console.error("[task-reminders] opportunistic run failed:", err))
}
