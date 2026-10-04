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
]

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = req.nextUrl.searchParams.get("admin") === "1"
  if (admin && !isOwner(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const count = await prisma.gameQuestion.count()
  if (count === 0) {
    await prisma.gameQuestion.createMany({ data: STARTER_QUESTIONS })
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
