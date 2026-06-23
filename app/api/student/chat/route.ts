import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { buildStudentPrompt } from "@/lib/bot/student-prompt"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── In-memory rate limiting ───────────────────────────────────
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const MAX_BOT_REQUESTS_PER_HOUR = 20
const RATE_WINDOW_MS = 60 * 60 * 1000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= MAX_BOT_REQUESTS_PER_HOUR) return false
  entry.count++
  return true
}

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

  // Rate limit check
  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json(
      { error: "הגעת למגבלת הבקשות לשעה (20 בקשות). נסה שוב בעוד שעה." },
      { status: 429 }
    )
  }

  const { question, isFirstMessage } = await req.json()
  if (!question?.trim()) return NextResponse.json({ error: "Empty question" }, { status: 400 })

  const studentId = user.studentId

  // Cache check — exact match within 24h for this user
  const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000)
  const cached = await prisma.botCache.findFirst({
    where: { userId: session.user.id, question, fromBot: "student", createdAt: { gte: oneDayAgo } },
  })
  if (cached) {
    const encoder = new TextEncoder()
    const cachedAnswer = cached.answer
    const stream = new ReadableStream({
      start(controller) {
        // Stream cached response in chunks for consistent UX
        const chunkSize = 20
        let i = 0
        const interval = setInterval(() => {
          if (i >= cachedAnswer.length) {
            clearInterval(interval)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, fromCache: true })}\n\n`))
            controller.close()
            return
          }
          const chunk = cachedAnswer.slice(i, i + chunkSize)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
          i += chunkSize
        }, 20)
      },
    })
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    })
  }

  // Fetch all data in parallel
  const [student, gradesRaw, attendance, scheduleRaw, calendarEvents, allGrades] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId }, select: { name: true, classId: true } }),
    prisma.studentGrade.findMany({ where: { studentId }, orderBy: { subject: "asc" } }),
    prisma.studentAttendance.findUnique({ where: { studentId } }),
    prisma.scheduleSlot.findMany({ where: { classId: "class-y" }, orderBy: [{ dayHeb: "asc" }, { period: "asc" }] }),
    prisma.calendarEvent.findMany({ where: { date: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) }, OR: [{ forAll: true }, { forStudents: true }] }, orderBy: { date: "asc" }, take: 30 }),
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
      type: e.type,
    })),
  }, isFirstMessage ?? false)

  const encoder = new TextEncoder()
  const userId = session.user.id
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = ""
      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        })
        for await (const chunk of claudeStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            fullText += chunk.delta.text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
          }
        }
        // Save to cache (fire & forget)
        if (fullText) {
          prisma.botCache.create({
            data: { userId, question, answer: fullText, fromBot: "student" },
          }).catch(() => {})
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
