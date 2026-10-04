import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { DUEL_QUESTION_COUNT, generateDuelCode } from "@/lib/trivia-duel"

// Create a new duel room — the creator is the host and waits for a friend
// to join with the code.
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const pool = await prisma.triviaQuestion.findMany({ where: { active: true }, select: { id: true } })
  if (pool.length < DUEL_QUESTION_COUNT) {
    return NextResponse.json({ error: "Not enough questions" }, { status: 500 })
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, DUEL_QUESTION_COUNT).map(q => q.id)

  let code = ""
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateDuelCode()
    const existing = await prisma.triviaDuel.findUnique({ where: { code: candidate } })
    if (!existing) { code = candidate; break }
  }
  if (!code) return NextResponse.json({ error: "Could not allocate a room code" }, { status: 500 })

  const duel = await prisma.triviaDuel.create({
    data: { code, hostId: session.user.id, questionIdsJson: JSON.stringify(shuffled) },
  })
  return NextResponse.json({ code: duel.code })
}
