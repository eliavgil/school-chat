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

  const claudeResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  })

  const botText =
    claudeResponse.content[0].type === "text" ? claudeResponse.content[0].text : ""

  console.log("CATEGORY:", category, "| GRADES COUNT:", grades?.length, "| BOT:", botText.slice(0, 200))
  const isUncertain = UNCERTAINTY_MARKERS.some((m) => botText.toLowerCase().includes(m))
  console.log("IS_UNCERTAIN:", isUncertain, "| MARKER:", UNCERTAINTY_MARKERS.find(m => botText.toLowerCase().includes(m)))

  if (isUncertain) {
    const message = await prisma.message.create({
      data: { content, senderId: session.user.id, studentId, status: "FORWARDED", skipReason: "הבוט זיהה אי-ודאות בנתונים", botResponse: botText },
    })
    return NextResponse.json({ message, botAnswered: false })
  }

  const message = await prisma.message.create({
    data: { content, senderId: session.user.id, studentId, status: "BOT_ANSWERED", botResponse: botText, botAnsweredAt: new Date(), dataAsOf },
  })

  return NextResponse.json({ message, botAnswered: true, botResponse: botText })
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
