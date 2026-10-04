import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

const DIFFICULTIES = ["easy", "medium", "hard"]

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { difficulty, guessesUsed, maxGuesses, timeMs, score } = await req.json()
  const safeDifficulty = DIFFICULTIES.includes(difficulty) ? difficulty : "easy"
  const safeScore = Math.max(0, Math.round(Number(score) || 0))
  const safeGuesses = Math.max(1, Math.round(Number(guessesUsed) || 1))
  const safeMaxGuesses = Math.max(safeGuesses, Math.round(Number(maxGuesses) || safeGuesses))
  const safeTimeMs = Math.max(0, Math.round(Number(timeMs) || 0))

  const row = await prisma.mastermindScore.create({
    data: { userId: session.user.id, difficulty: safeDifficulty, guessesUsed: safeGuesses, maxGuesses: safeMaxGuesses, timeMs: safeTimeMs, score: safeScore },
  })
  return NextResponse.json({ score: row })
}

// GET — grade-wide leaderboard, best score per student regardless of
// difficulty (harder difficulties naturally score higher, which is fine —
// same tradeoff as any single combined board).
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await prisma.mastermindScore.findMany({
    where: { user: { role: "STUDENT" } },
    orderBy: { score: "desc" },
    select: { score: true, difficulty: true, userId: true, user: { select: { name: true } } },
    take: 300,
  })

  const bestByUser = new Map<string, { name: string; score: number; difficulty: string }>()
  for (const r of rows) {
    const existing = bestByUser.get(r.userId)
    if (!existing || r.score > existing.score) {
      bestByUser.set(r.userId, { name: r.user.name ?? "תלמיד/ה", score: r.score, difficulty: r.difficulty })
    }
  }
  const leaderboard = Array.from(bestByUser.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)

  return NextResponse.json({ leaderboard })
}
