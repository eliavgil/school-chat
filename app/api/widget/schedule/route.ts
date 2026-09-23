import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { dayTypeForWeekday, teacherOwnScheduleId } from "@/lib/bellSchedule"

// GET — today's schedule timeline for a home-screen widget (Scriptable,
// Shortcuts), authenticated by ?token= (see /api/widget/token) instead of
// a session cookie, since a widget refreshes in the background with no
// browser around to carry one. Mirrors the same timeline the home page
// builds client-side (app/home/page.tsx's buildTimeline) so the widget
// shows exactly what the home page shows — duplicated here rather than
// shared, since that logic currently lives in a "use client" page file.
const DAY_TO_HEB = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]

interface ScheduleSlotT { period: string; content: string }
interface BellSlotT { period: string; startTime: string; endTime: string }
interface TimelineEntry { start: string; end: string; label: string; isBreak: boolean; period?: string }

function parsePeriodStr(p: string): { start: string; end: string } | null {
  const m = p.match(/^(\d+),\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/)
  if (!m) return null
  return { start: m[2], end: m[3] }
}
function periodNum(p: string): string {
  const m = p.match(/^\d+/)
  return m ? m[0] : p.trim()
}
function parseSubject(content: string) { return content.split(/\s{2,}/)[0].trim() }
function timeToMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m }

// The home page computes "now" in the browser, so it's naturally the
// viewer's own local time. This route runs on Vercel's server (UTC),
// where a plain new Date().getHours()/getDay() would be wrong by Israel's
// UTC+2/+3 offset — a real bug this route hit (a 15:36 Israel request
// read as 12:36, landing on the wrong "current" period). Resolve the
// weekday/hour/minute explicitly in Asia/Jerusalem instead, DST-safe.
function israelNow(): { weekday: number; hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date())
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]))
  const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const hourStr = map.hour === "24" ? "0" : map.hour // some ICU builds emit "24" for midnight even with hour12:false
  return { weekday: WEEKDAYS[map.weekday] ?? 0, hours: Number(hourStr), minutes: Number(map.minute) }
}

function buildTimeline(slots: ScheduleSlotT[], bellSlots: BellSlotT[]): TimelineEntry[] {
  const bellByPeriod = new Map(bellSlots.map(b => [b.period, { start: b.startTime, end: b.endTime }]))

  const lessons = slots
    .map(s => {
      const bell = bellByPeriod.get(periodNum(s.period))
      const embedded = parsePeriodStr(s.period)
      const start = bell?.start ?? embedded?.start
      const end = bell?.end ?? embedded?.end
      if (!start || !end) return null
      return { start, end, label: parseSubject(s.content), isBreak: false, period: periodNum(s.period) }
    })
    .filter(Boolean) as TimelineEntry[]

  const breaks: TimelineEntry[] = bellSlots
    .filter(b => !/^\d+$/.test(b.period.trim()))
    .map(b => ({ start: b.startTime, end: b.endTime, label: b.period, isBreak: true }))

  return [...lessons, ...breaks].sort((a, b) => timeToMin(a.start) - timeToMin(b.start))
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token")
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { widgetToken: token },
    select: { id: true, role: true, classId: true, studentId: true, parentStudents: { select: { studentId: true } } },
  })
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

  const isStudent = user.role === "STUDENT"
  const isTeacher = user.role === "TEACHER" || user.role === "ADMIN"
  const isParent = !isStudent && !isTeacher
  const parentStudentId = isParent ? (user.parentStudents?.[0]?.studentId ?? null) : null

  // See app/api/home/route.ts for why this prefers the linked Student's own
  // classId over User.classId (which is only ever set once at signup and
  // never updated on a class transfer).
  const linkedStudentId = isStudent ? user.studentId : parentStudentId
  const classId = (linkedStudentId
    ? (await prisma.student.findFirst({ where: { id: linkedStudentId }, select: { classId: true } }))?.classId
    : null)
    ?? user.classId
    ?? "class-y"

  const { weekday: todayJS, hours: nowHours, minutes: nowMinutes } = israelNow()
  const todayHeb = DAY_TO_HEB[todayJS]
  const todayDayType = dayTypeForWeekday(todayJS)
  const scheduleClassId = isTeacher ? teacherOwnScheduleId(user.id) : classId

  const [classProfile, todaySchedule, bellSlots] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId }, select: { displayName: true, name: true } }),
    prisma.scheduleSlot.findMany({
      where: { classId: scheduleClassId, dayHeb: todayHeb },
      orderBy: { period: "asc" },
      select: { period: true, content: true },
    }),
    todayDayType
      ? prisma.bellSlot.findMany({ where: { dayType: todayDayType }, orderBy: { order: "asc" }, select: { period: true, startTime: true, endTime: true } })
      : Promise.resolve([]),
  ])

  const timeline = buildTimeline(todaySchedule, bellSlots)

  let nowIndex = -1
  const nowMin = nowHours * 60 + nowMinutes
  for (let i = 0; i < timeline.length; i++) {
    if (nowMin >= timeToMin(timeline[i].start) && nowMin < timeToMin(timeline[i].end)) { nowIndex = i; break }
  }

  // Mirrors the home page's own DayState (app/home/page.tsx's getNowNext):
  // "no-school" (Fri/Sat or nothing published), "before-school" (hasn't
  // started yet — show what's first), "now" (mid-lesson/break), "done"
  // (everything for today has already finished).
  let dayState: "no-school" | "before-school" | "now" | "done" = "no-school"
  if (todayDayType !== null && timeline.length > 0) {
    if (nowMin < timeToMin(timeline[0].start)) dayState = "before-school"
    else if (nowIndex !== -1) dayState = "now"
    else dayState = "done"
  }

  return NextResponse.json({
    dayHeb: todayHeb,
    className: classProfile?.displayName || classProfile?.name || "",
    hasSchoolToday: todayDayType !== null,
    timeline,
    nowIndex,
    dayState,
  })
}
