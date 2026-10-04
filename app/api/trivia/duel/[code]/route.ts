import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { duelQuestionIds, resolveAndAdvance, QUESTION_MS } from "@/lib/trivia-duel"

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await params
  const found = await prisma.triviaDuel.findUnique({
    where: { code: code.toUpperCase() },
    include: { host: { select: { name: true } }, guest: { select: { name: true } } },
  })
  if (!found) return NextResponse.json({ error: "החדר לא נמצא" }, { status: 404 })
  const youAre = found.hostId === session.user.id ? "host" : found.guestId === session.user.id ? "guest" : null
  if (!youAre) return NextResponse.json({ error: "אין לך גישה לחדר הזה" }, { status: 403 })

  const duel = { ...(await resolveAndAdvance(found)), host: found.host, guest: found.guest }

  const ids = duelQuestionIds(duel)
  const total = ids.length
  const revealed = !!duel.revealedAt

  const base = {
    code: duel.code,
    status: duel.status,
    youAre,
    hostName: duel.host.name ?? "מחנך/ת",
    guestName: duel.guest?.name ?? null,
    currentIndex: duel.currentIndex,
    total,
    hostScore: duel.hostScore,
    guestScore: duel.guestScore,
    revealed,
    questionStartedAt: duel.questionStartedAt?.toISOString() ?? null,
    questionMs: QUESTION_MS,
    yourAnswerIndex: youAre === "host" ? duel.hostAnswerIndex : duel.guestAnswerIndex,
    opponentAnswered: youAre === "host" ? duel.guestAnswerIndex !== null : duel.hostAnswerIndex !== null,
  }

  if (duel.status === "done") {
    const winner = duel.hostScore === duel.guestScore ? "draw" : duel.hostScore > duel.guestScore ? "host" : "guest"
    return NextResponse.json({ ...base, winner })
  }
  if (duel.status === "waiting") {
    return NextResponse.json(base)
  }

  const question = await prisma.triviaQuestion.findUnique({ where: { id: ids[duel.currentIndex] } })
  if (!question) return NextResponse.json({ error: "שאלה חסרה" }, { status: 500 })

  return NextResponse.json({
    ...base,
    question: {
      category: question.category,
      text: question.text,
      optionA: question.optionA, optionB: question.optionB, optionC: question.optionC, optionD: question.optionD,
      ...(revealed && { correctIndex: question.correctIndex }),
    },
    opponentAnswerIndex: revealed ? (youAre === "host" ? duel.guestAnswerIndex : duel.hostAnswerIndex) : null,
  })
}
