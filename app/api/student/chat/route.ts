import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { buildStudentPrompt } from "@/lib/bot/student-prompt"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, studentId: true },
  })
  if (user?.role !== "STUDENT" || !user.studentId) {
    return NextResponse.json({ error: "No student record linked" }, { status: 403 })
  }

  const { question, isFirstMessage } = await req.json()
  if (!question?.trim()) return NextResponse.json({ error: "Empty question" }, { status: 400 })

  const studentId = user.studentId

  // Fetch all data in parallel
  const [student, gradesRaw, attendance, scheduleRaw, calendarEvents, allGrades] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId }, select: { name: true, classId: true } }),
    prisma.studentGrade.findMany({ where: { studentId }, orderBy: { subject: "asc" } }),
    prisma.studentAttendance.findUnique({ where: { studentId } }),
    prisma.scheduleSlot.findMany({ where: { classId: "class-y" }, orderBy: [{ dayHeb: "asc" }, { period: "asc" }] }),
    prisma.calendarEvent.findMany({ where: { date: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } }, orderBy: { date: "asc" }, take: 30 }),
    // All grades for class averages
    prisma.studentGrade.findMany({ select: { subject: true, weightedAverage: true } }),
  ])

  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

  // Compute class averages per subject
  const subjectMap: Record<string, number[]> = {}
  for (const g of allGrades) {
    if (g.weightedAverage == null) continue
    if (!subjectMap[g.subject]) subjectMap[g.subject] = []
    subjectMap[g.subject].push(g.weightedAverage)
  }
  const classAverages = Object.entries(subjectMap).map(([subject, vals]) => ({
    subject,
    classAvg: vals.reduce((a, b) => a + b, 0) / vals.length,
    studentCount: vals.length,
  }))

  const DAY_ORDER = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"]
  const schedule = scheduleRaw
    .sort((a, b) => DAY_ORDER.indexOf(a.dayHeb) - DAY_ORDER.indexOf(b.dayHeb))
    .map(s => ({ dayHeb: s.dayHeb, period: s.period, content: s.content }))

  const grades = gradesRaw.map(g => ({
    subject: g.subject,
    teacherName: g.teacherName,
    weightedAverage: g.weightedAverage,
    gradeComponents: g.gradeComponents as any,
  }))

  const prompt = buildStudentPrompt(question, {
    studentName: student.name,
    grades,
    classAverages,
    attendance: attendance
      ? {
          totalLessons: attendance.totalLessons,
          absences: attendance.absences,
          justifiedAbsences: attendance.justifiedAbsences,
          tardiness: attendance.tardiness,
          justifiedTardiness: attendance.justifiedTardiness,
        }
      : null,
    schedule,
    calendarEvents: calendarEvents.map(e => ({
      date: e.date,
      description: e.description,
      grade: e.grade,
    })),
  }, isFirstMessage ?? false)

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  })

  const response = msg.content[0].type === "text" ? msg.content[0].text : ""

  return NextResponse.json({ response })
}
