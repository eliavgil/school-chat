import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { checkCategory } from "@/lib/bot/filter"
import { buildPrompt } from "@/lib/bot/prompt"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { content, studentId } = await req.json()
  if (!content || !studentId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  // Verify parent is linked to this student
  const link = await prisma.parentStudent.findUnique({
    where: { userId_studentId: { userId: session.user.id, studentId } },
    include: { student: true },
  })
  if (!link) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Layer 1: category whitelist
  const categoryCheck = checkCategory(content)

  if (!categoryCheck.pass) {
    // Skip bot — forward to teacher
    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        studentId,
        status: "FORWARDED",
        skipReason: categoryCheck.reason,
      },
    })
    return NextResponse.json({ message, botAnswered: false })
  }

  // Layer 2: fetch relevant records and ask Claude
  const latestImport = await prisma.dataImport.findFirst({
    orderBy: { importedAt: "desc" },
  })

  const records = latestImport
    ? await prisma.studentRecord.findMany({
        where: { studentId, importId: latestImport.id },
        orderBy: { date: "desc" },
        take: 20,
      })
    : []

  const dataAsOf = latestImport?.importedAt ?? new Date()

  const prompt = buildPrompt({
    question: content,
    studentName: link.student.name,
    category: categoryCheck.category,
    records: records.map((r: { date: Date; recordType: string; details: string }) => ({
      date: r.date,
      recordType: r.recordType,
      details: r.details,
    })),
    dataAsOf,
  })

  const claudeResponse = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  })

  const botText =
    claudeResponse.content[0].type === "text"
      ? claudeResponse.content[0].text
      : ""

  // Check if Claude flagged uncertainty
  const uncertaintyMarkers = [
    "לא נמצא מידע",
    "לא ברור",
    "לא בטוח",
    "אינני יודע",
    "לא קיים",
    "no data",
    "not found",
  ]
  const isUncertain = uncertaintyMarkers.some((m) =>
    botText.toLowerCase().includes(m)
  )

  if (isUncertain) {
    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        studentId,
        status: "FORWARDED",
        skipReason: "הבוט זיהה אי-ודאות בנתונים",
      },
    })
    return NextResponse.json({ message, botAnswered: false })
  }

  // Bot answered confidently
  const message = await prisma.message.create({
    data: {
      content,
      senderId: session.user.id,
      studentId,
      status: "BOT_ANSWERED",
      botResponse: botText,
      botAnsweredAt: new Date(),
      dataAsOf,
    },
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
  if (!studentId) {
    return NextResponse.json({ error: "Missing studentId" }, { status: 400 })
  }

  const messages = await prisma.message.findMany({
    where: { studentId, senderId: session.user.id },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ messages })
}
