import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { duelQuestionIds, resolveAndAdvance, QUESTION_MS } from "@/lib/trivia-duel"

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { optionIndex } = await req.json()
  const idx = Number(optionIndex)
  if (![0, 1, 2, 3].includes(idx)) return NextResponse.json({ error: "תשובה לא תקינה" }, { status: 400 })

  const { code } = await params
  const duel = await prisma.triviaDuel.findUnique({ where: { code: code.toUpperCase() } })
  if (!duel) return NextResponse.json({ error: "החדר לא נמצא" }, { status: 404 })
  const youAre = duel.hostId === session.user.id ? "host" : duel.guestId === session.user.id ? "guest" : null
  if (!youAre) return NextResponse.json({ error: "אין לך גישה לחדר הזה" }, { status: 403 })

  // Ignore a stale/duplicate answer: wrong phase, round already resolved,
  // or this player already answered the current round.
  const alreadyAnswered = youAre === "host" ? duel.hostAnswerIndex !== null : duel.guestAnswerIndex !== null
  if (duel.status === "active" && !duel.revealedAt && !alreadyAnswered && duel.questionStartedAt) {
    const ids = duelQuestionIds(duel)
    const question = await prisma.triviaQuestion.findUnique({ where: { id: ids[duel.currentIndex] } })
    if (question) {
      const correct = idx === question.correctIndex
      const remainingMs = Math.max(0, QUESTION_MS - (Date.now() - duel.questionStartedAt.getTime()))
      const points = correct ? 10 + Math.floor(remainingMs / 1000) : 0
      await prisma.triviaDuel.update({
        where: { id: duel.id },
        data: youAre === "host"
          ? { hostAnswerIndex: idx, hostScore: duel.hostScore + points }
          : { guestAnswerIndex: idx, guestScore: duel.guestScore + points },
      })
    }
  }

  const refreshed = await prisma.triviaDuel.findUnique({ where: { id: duel.id } })
  if (refreshed) await resolveAndAdvance(refreshed)
  return NextResponse.json({ ok: true })
}
