import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// Question-bank editing is eliavgil-only while this game is being trialed —
// same gate used for the glossary and other trial features.
function isOwner(session: any) {
  return session?.user?.email === "eliavgil@gmail.com"
}

const STARTER_QUESTIONS: { subject: string; text: string; optionA: string; optionB: string; optionC: string; optionD: string; correctIndex: number }[] = [
  { subject: "math", text: "7 × 8 = ?", optionA: "54", optionB: "56", optionC: "64", optionD: "48", correctIndex: 1 },
  { subject: "math", text: "144 ÷ 12 = ?", optionA: "12", optionB: "11", optionC: "14", optionD: "10", correctIndex: 0 },
  { subject: "math", text: "15% מ-200 = ?", optionA: "20", optionB: "25", optionC: "30", optionD: "35", correctIndex: 2 },
  { subject: "math", text: "3² + 4² = ?", optionA: "25", optionB: "49", optionC: "12", optionD: "7", correctIndex: 0 },
  { subject: "math", text: "9 × 9 = ?", optionA: "72", optionB: "81", optionC: "99", optionD: "90", correctIndex: 1 },
  { subject: "math", text: "½ + ⅓ = ?", optionA: "⅚", optionB: "⅔", optionC: "1", optionD: "⅕", correctIndex: 0 },
  { subject: "english", text: "\"Beautiful\" is a...", optionA: "Verb", optionB: "Adjective", optionC: "Noun", optionD: "Adverb", correctIndex: 1 },
  { subject: "english", text: "Past tense of \"go\"?", optionA: "goed", optionB: "gone", optionC: "went", optionD: "going", correctIndex: 2 },
  { subject: "english", text: "Opposite of \"brave\"?", optionA: "Strong", optionB: "Coward", optionC: "Fast", optionD: "Happy", correctIndex: 1 },
  { subject: "english", text: "\"They ___ happy.\" — fill in", optionA: "is", optionB: "am", optionC: "are", optionD: "be", correctIndex: 2 },
  { subject: "english", text: "Plural of \"child\"?", optionA: "childs", optionB: "children", optionC: "childes", optionD: "childrens", correctIndex: 1 },
  { subject: "english", text: "\"I have ___ apple.\" — fill in", optionA: "a", optionB: "an", optionC: "the", optionD: "—", correctIndex: 1 },
  { subject: "math", text: "6 × 7 = ?", optionA: "42", optionB: "36", optionC: "48", optionD: "35", correctIndex: 0 },
  { subject: "math", text: "100 ÷ 4 = ?", optionA: "20", optionB: "25", optionC: "30", optionD: "15", correctIndex: 1 },
  { subject: "math", text: "20% מ-150 = ?", optionA: "20", optionB: "25", optionC: "30", optionD: "35", correctIndex: 2 },
  { subject: "math", text: "2³ = ?", optionA: "6", optionB: "8", optionC: "9", optionD: "4", correctIndex: 1 },
  { subject: "math", text: "¾ - ¼ = ?", optionA: "½", optionB: "¼", optionC: "1", optionD: "⅓", correctIndex: 0 },
  { subject: "math", text: "11 × 11 = ?", optionA: "111", optionB: "121", optionC: "110", optionD: "122", correctIndex: 1 },
  { subject: "math", text: "√64 = ?", optionA: "6", optionB: "7", optionC: "8", optionD: "9", correctIndex: 2 },
  { subject: "math", text: "90 ÷ 3 = ?", optionA: "27", optionB: "30", optionC: "33", optionD: "28", correctIndex: 1 },
  { subject: "math", text: "5² - 3² = ?", optionA: "16", optionB: "10", optionC: "25", optionD: "9", correctIndex: 0 },
  { subject: "math", text: "⅕ + ⅕ = ?", optionA: "⅖", optionB: "⅗", optionC: "1", optionD: "⅒", correctIndex: 0 },
  { subject: "math", text: "13 × 4 = ?", optionA: "42", optionB: "52", optionC: "48", optionD: "44", correctIndex: 1 },
  { subject: "math", text: "60% מ-50 = ?", optionA: "20", optionB: "25", optionC: "30", optionD: "35", correctIndex: 2 },
  { subject: "math", text: "8 × 8 = ?", optionA: "72", optionB: "64", optionC: "68", optionD: "56", correctIndex: 1 },
  { subject: "math", text: "150 ÷ 5 = ?", optionA: "20", optionB: "25", optionC: "30", optionD: "35", correctIndex: 2 },
  { subject: "math", text: "4² + 2² = ?", optionA: "18", optionB: "20", optionC: "16", optionD: "22", correctIndex: 1 },
  { subject: "english", text: "Opposite of \"big\"?", optionA: "Small", optionB: "Tall", optionC: "Huge", optionD: "Wide", correctIndex: 0 },
  { subject: "english", text: "Past tense of \"eat\"?", optionA: "eated", optionB: "ate", optionC: "eaten", optionD: "eating", correctIndex: 1 },
  { subject: "english", text: "\"She ___ to school every day.\" — fill in", optionA: "go", optionB: "goes", optionC: "going", optionD: "gone", correctIndex: 1 },
  { subject: "english", text: "Plural of \"mouse\"?", optionA: "mouses", optionB: "mice", optionC: "mouse", optionD: "mices", correctIndex: 1 },
  { subject: "english", text: "\"Quickly\" is a...", optionA: "Noun", optionB: "Verb", optionC: "Adjective", optionD: "Adverb", correctIndex: 3 },
  { subject: "english", text: "Opposite of \"hot\"?", optionA: "Warm", optionB: "Cold", optionC: "Mild", optionD: "Dry", correctIndex: 1 },
  { subject: "english", text: "\"I ___ a book yesterday.\" — fill in", optionA: "read", optionB: "reads", optionC: "reading", optionD: "readed", correctIndex: 0 },
  { subject: "english", text: "Comparative of \"good\"?", optionA: "gooder", optionB: "best", optionC: "better", optionD: "more good", correctIndex: 2 },
  { subject: "english", text: "\"Happiness\" is a...", optionA: "Verb", optionB: "Adjective", optionC: "Noun", optionD: "Adverb", correctIndex: 2 },
  { subject: "english", text: "Plural of \"foot\"?", optionA: "foots", optionB: "feet", optionC: "footes", optionD: "feets", correctIndex: 1 },
  { subject: "english", text: "\"They have ___ car.\" — fill in", optionA: "a", optionB: "an", optionC: "the", optionD: "—", correctIndex: 0 },
  { subject: "english", text: "Opposite of \"easy\"?", optionA: "Simple", optionB: "Hard", optionC: "Light", optionD: "Fast", correctIndex: 1 },
  { subject: "english", text: "\"Run\" in past tense?", optionA: "runned", optionB: "ran", optionC: "running", optionD: "runs", correctIndex: 1 },
  { subject: "english", text: "\"Carefully\" describes a...", optionA: "Noun", optionB: "Verb", optionC: "Adverb", optionD: "Adjective", correctIndex: 2 },
  { subject: "english", text: "\"He is taller ___ me.\" — fill in", optionA: "then", optionB: "that", optionC: "than", optionD: "so", correctIndex: 2 },
]

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = req.nextUrl.searchParams.get("admin") === "1"
  if (admin && !isOwner(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Insert any starter question whose exact text isn't in the bank yet —
  // not just on first run — so growing STARTER_QUESTIONS (e.g. adding more
  // questions later) backfills into an already-seeded production DB
  // without touching or duplicating existing rows.
  const existing = await prisma.gameQuestion.findMany({ select: { text: true } })
  const existingTexts = new Set(existing.map(q => q.text))
  const missing = STARTER_QUESTIONS.filter(q => !existingTexts.has(q.text))
  if (missing.length > 0) {
    await prisma.gameQuestion.createMany({ data: missing })
  }

  const questions = await prisma.gameQuestion.findMany({
    where: admin ? {} : { active: true },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json({ questions })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isOwner(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { subject, text, optionA, optionB, optionC, optionD, correctIndex } = await req.json()
  if (!text?.trim() || !optionA?.trim() || !optionB?.trim() || !optionC?.trim() || !optionD?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }
  const question = await prisma.gameQuestion.create({
    data: {
      subject: subject === "english" ? "english" : "math",
      text: text.trim(), optionA: optionA.trim(), optionB: optionB.trim(), optionC: optionC.trim(), optionD: optionD.trim(),
      correctIndex: Number(correctIndex) || 0,
    },
  })
  return NextResponse.json({ question })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isOwner(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, subject, text, optionA, optionB, optionC, optionD, correctIndex, active } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const question = await prisma.gameQuestion.update({
    where: { id },
    data: {
      ...(subject !== undefined && { subject: subject === "english" ? "english" : "math" }),
      ...(text !== undefined && { text: text.trim() }),
      ...(optionA !== undefined && { optionA: optionA.trim() }),
      ...(optionB !== undefined && { optionB: optionB.trim() }),
      ...(optionC !== undefined && { optionC: optionC.trim() }),
      ...(optionD !== undefined && { optionD: optionD.trim() }),
      ...(correctIndex !== undefined && { correctIndex: Number(correctIndex) }),
      ...(active !== undefined && { active: !!active }),
    },
  })
  return NextResponse.json({ question })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isOwner(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.gameQuestion.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
