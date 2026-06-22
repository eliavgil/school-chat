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

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        })
        for await (const chunk of claudeStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
          }
        }
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true })}\n\n`))
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
