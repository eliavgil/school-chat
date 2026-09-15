import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

function isTeacher(session: any) {
  return session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"
}

// GET — absence data for the grade-hub page: a live feed of the most
// recent events (any date) plus a per-day summary table (one row per
// student, how many lessons they missed that day, which subjects, and
// whether any of it is unjustified). Backed by MashovAbsenceEvent, which
// the mashov-absences cron keeps filled in — this route only reads it.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const dateParam = url.searchParams.get("date")

  const distinctDates = await prisma.mashovAbsenceEvent.findMany({
    distinct: ["lessonDate"],
    select: { lessonDate: true },
    orderBy: { lessonDate: "desc" },
    take: 60,
  })
  const dates = distinctDates.map(d => d.lessonDate.toISOString().slice(0, 10))
  const date = dateParam && dates.includes(dateParam) ? dateParam : (dates[0] ?? new Date().toISOString().slice(0, 10))

  const dayStart = new Date(`${date}T00:00:00`)
  const dayEnd = new Date(`${date}T23:59:59.999`)
  const dayEvents = await prisma.mashovAbsenceEvent.findMany({
    where: { lessonDate: { gte: dayStart, lte: dayEnd } },
    orderBy: { lessonNum: "asc" },
  })

  const bySt = new Map<string, {
    studentName: string; classCode: string; classNum: number
    lessonsMissed: number; subjects: string[]; anyUnjustified: boolean
  }>()
  for (const e of dayEvents) {
    const key = `${e.studentName}__${e.classCode}${e.classNum}`
    if (!bySt.has(key)) {
      bySt.set(key, { studentName: e.studentName, classCode: e.classCode, classNum: e.classNum, lessonsMissed: 0, subjects: [], anyUnjustified: false })
    }
    const row = bySt.get(key)!
    row.lessonsMissed++
    if (!row.subjects.includes(e.subjectName)) row.subjects.push(e.subjectName)
    if (!e.justified) row.anyUnjustified = true
  }
  const summary = Array.from(bySt.values()).sort((a, b) => a.classNum - b.classNum || b.lessonsMissed - a.lessonsMissed)

  const recent = await prisma.mashovAbsenceEvent.findMany({ orderBy: { reportedAt: "desc" }, take: 20 })

  return NextResponse.json({ dates, date, summary, recent })
}
