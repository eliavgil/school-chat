import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { computeAllStudentXp, levelFor } from "@/lib/student-xp"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const all = await computeAllStudentXp()
  const mine = all.find(e => e.userId === session.user.id)
  if (!mine) {
    // Not a student (e.g. a teacher previewing the student app) — a flat
    // zero state rather than an error, same convention as /api/student/surveys.
    return NextResponse.json({ preview: true, ...levelFor(0), breakdown: { climb: 0, trivia: 0, duel: 0, mastermind: 0, wordle: 0, surveys: 0 } })
  }

  const sorted = [...all].sort((a, b) => b.total - a.total)
  const rank = sorted.findIndex(e => e.userId === mine.userId) + 1

  return NextResponse.json({
    preview: false,
    ...levelFor(mine.total),
    rank,
    outOf: sorted.length,
    breakdown: { climb: mine.climb, trivia: mine.trivia, duel: mine.duel, mastermind: mine.mastermind, wordle: mine.wordle, surveys: mine.surveys },
  })
}
