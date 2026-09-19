import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

function isTeacher(session: any) {
  return session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"
}

// GET — behave-log data for a grade-hub page (absences, discipline, or
// positive notes — selected via ?code=), generic across all three: a live
// feed of the most recent events (any date) plus a per-day summary table
// (one row per student, how many events that day, which subjects, and
// whether any is unjustified — only meaningful for absences). Backed by
// MashovBehaveEvent, which the mashov-absences cron keeps filled in —
// this route only reads it.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const achvaCode = Number(url.searchParams.get("code") ?? "1")
  const dateParam = url.searchParams.get("date")

  const distinctDates = await prisma.mashovBehaveEvent.findMany({
    where: { achvaCode },
    distinct: ["lessonDate"],
    select: { lessonDate: true },
    orderBy: { lessonDate: "desc" },
    take: 60,
  })
  const dates = distinctDates.map(d => d.lessonDate.toISOString().slice(0, 10))
  const date = dateParam && dates.includes(dateParam) ? dateParam : (dates[0] ?? new Date().toISOString().slice(0, 10))

  const dayStart = new Date(`${date}T00:00:00`)
  const dayEnd = new Date(`${date}T23:59:59.999`)
  const dayEvents = await prisma.mashovBehaveEvent.findMany({
    where: { achvaCode, lessonDate: { gte: dayStart, lte: dayEnd } },
    orderBy: { lessonNum: "asc" },
  })

  const bySt = new Map<string, {
    studentId: string; studentName: string; classCode: string; classNum: number
    count: number; subjects: string[]; anyUnjustified: boolean
  }>()
  for (const e of dayEvents) {
    const key = `${e.studentName}__${e.classCode}${e.classNum}`
    if (!bySt.has(key)) {
      bySt.set(key, { studentId: e.mashovKey.split(":")[0], studentName: e.studentName, classCode: e.classCode, classNum: e.classNum, count: 0, subjects: [], anyUnjustified: false })
    }
    const row = bySt.get(key)!
    row.count++
    if (!row.subjects.includes(e.subjectName)) row.subjects.push(e.subjectName)
    if (!e.justified) row.anyUnjustified = true
  }
  const summaryRows = Array.from(bySt.values()).sort((a, b) => a.classNum - b.classNum || b.count - a.count)

  // "Recent" is grouped the same way as the daily summary — one row per
  // student per day, not one row per lesson — since achvaEvent.timestamp
  // reflects when the record was entered into Mashov (often long after the
  // fact), not the real lesson time, so it's not a trustworthy sort/display
  // key. lessonDate + lessonNum are.
  const pool = await prisma.mashovBehaveEvent.findMany({
    where: { achvaCode },
    orderBy: [{ lessonDate: "desc" }, { lessonNum: "desc" }],
    take: 100,
  })
  const recentBy = new Map<string, {
    studentId: string; studentName: string; classCode: string; classNum: number; date: string
    count: number; subjects: string[]; lessonNums: number[]; anyUnjustified: boolean
    sortKey: number
  }>()
  for (const e of pool) {
    const dateStr = e.lessonDate.toISOString().slice(0, 10)
    const key = `${e.studentName}__${e.classCode}${e.classNum}__${dateStr}`
    if (!recentBy.has(key)) {
      recentBy.set(key, {
        studentId: e.mashovKey.split(":")[0], studentName: e.studentName, classCode: e.classCode, classNum: e.classNum, date: dateStr,
        count: 0, subjects: [], lessonNums: [], anyUnjustified: false,
        sortKey: e.lessonDate.getTime() + e.lessonNum,
      })
    }
    const row = recentBy.get(key)!
    row.count++
    if (!row.subjects.includes(e.subjectName)) row.subjects.push(e.subjectName)
    row.lessonNums.push(e.lessonNum)
    if (!e.justified) row.anyUnjustified = true
  }
  const recentRows = Array.from(recentBy.values())
    .sort((a, b) => b.sortKey - a.sortKey)
    .slice(0, 12)
    .map(({ sortKey, ...row }) => row)

  // Year-to-date total of this same achva type per student — shown next to
  // every row so a single new event reads in context ("is this a pattern?"),
  // not just as an isolated count for that one day.
  const studentIds = Array.from(new Set([...summaryRows, ...recentRows].map(r => r.studentId)))
  const yearTotals = new Map<string, number>(
    await Promise.all(studentIds.map(async id => [
      id,
      await prisma.mashovBehaveEvent.count({ where: { achvaCode, mashovKey: { startsWith: `${id}:` } } }),
    ] as const))
  )

  const summary = summaryRows.map(({ studentId, ...row }) => ({ ...row, yearTotal: yearTotals.get(studentId) ?? row.count }))
  const recent = recentRows.map(({ studentId, ...row }) => ({ ...row, yearTotal: yearTotals.get(studentId) ?? row.count }))

  return NextResponse.json({ dates, date, summary, recent })
}
