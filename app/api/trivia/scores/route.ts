import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { score } = await req.json()
  const safeScore = Math.max(0, Math.round(Number(score) || 0))

  const row = await prisma.triviaScore.create({
    data: { userId: session.user.id, score: safeScore },
  })
  return NextResponse.json({ score: row })
}

// GET — grade-wide leaderboard (this whole app only ever tracks grade י,
// so "שכבתית" just means every student, not scoped to one class). Best
// score per student, ranked, top 20.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await prisma.triviaScore.findMany({
    where: { user: { role: "STUDENT" } },
    orderBy: { score: "desc" },
    select: { score: true, userId: true, user: { select: { name: true } } },
    take: 300, // enough rows to dedupe down to a top-20 of distinct students
  })

  const bestByUser = new Map<string, { name: string; score: number }>()
  for (const r of rows) {
    const existing = bestByUser.get(r.userId)
    if (!existing || r.score > existing.score) {
      bestByUser.set(r.userId, { name: r.user.name ?? "תלמיד/ה", score: r.score })
    }
  }
  const leaderboard = Array.from(bestByUser.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)

  return NextResponse.json({ leaderboard })
}
