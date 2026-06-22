import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { checkCategory } from "@/lib/bot/filter"
import { buildPrompt } from "@/lib/bot/prompt"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const UNCERTAINTY_MARKERS = [
  "לא ברור",
  "לא בטוח",
  "אינני יודע",
  "no data",
]

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { content, studentId } = await req.json()
  if (!content || !studentId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const link = await prisma.parentStudent.findUnique({
    where: { userId_studentId: { userId: session.user.id, studentId } },
    include: { student: true },
  })
  if (!link) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Layer 1: category filter
  const categoryCheck = checkCategory(content)
  if (!categoryCheck.pass) {
    const message = await prisma.message.create({
      data: { content, senderId: session.user.id, studentId, status: "FORWARDED", skipReason: categoryCheck.reason },
    })
    return NextResponse.json({ message, botAnswered: false })
  }

  const category = categoryCheck.category
  const dataAsOf = new Date()

  // Fetch all relevant data in parallel — let Claude pick what's relevant
  const [grades, attendance, schedule, calendarEvents, teachers] = await Promise.all([
    prisma.studentGrade.findMany({ where: { studentId } }),
    prisma.studentAttendance.findFirst({ where: { studentId } }),
    prisma.scheduleSlot.findMany({ where: { classId: link.student.classId }, orderBy: [{ dayHeb: "asc" }, { period: "asc" }] }),
    prisma.calendarEvent.findMany({
      where: { OR: [{ grade: null }, { grade: "כללי" }, { grade: { contains: "י" } }] },
      orderBy: { date: "asc" },
      take: 30,
    }),
    prisma.teacher.findMany({ take: 200 }),
  ])

  const prompt = buildPrompt({
    question: content,
    studentName: link.student.name,
    category,
    data: {
      grades: grades?.map((g) => ({
        subject: g.subject,
        teacherName: g.teacherName,
        weightedAverage: g.weightedAverage,
        gradeComponents: g.gradeComponents as any,
      })),
      attendance: attendance ?? null,
      schedule,
      calendarEvents,
      teachers,
    },
    dataAsOf,
  })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = ""
      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 400,
          messages: [{ role: "user", content: prompt }],
        })
        for await (const chunk of claudeStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            fullText += chunk.delta.text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
          }
        }
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true })}\n\n`))
        controller.close()
        return
      }

      const isUncertain = UNCERTAINTY_MARKERS.some((m) => fullText.toLowerCase().includes(m))
      let message
      if (isUncertain) {
        message = await prisma.message.create({
          data: { content, senderId: session.user.id, studentId, status: "FORWARDED", skipReason: "הבוט זיהה אי-ודאות בנתונים", botResponse: fullText },
        })
      } else {
        message = await prisma.message.create({
          data: { content, senderId: session.user.id, studentId, status: "BOT_ANSWERED", botResponse: fullText, botAnsweredAt: new Date(), dataAsOf },
        })
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, message, botAnswered: !isUncertain })}\n\n`))
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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 })

  const messages = await prisma.message.findMany({
    where: { studentId, senderId: session.user.id },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ messages })
}
