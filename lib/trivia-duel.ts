import { prisma } from "@/lib/db/prisma"
import type { TriviaDuel } from "@prisma/client"

export const DUEL_QUESTION_COUNT = 10
export const QUESTION_MS = 15_000
export const REVEAL_MS = 2_500

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789" // no 0/O, 1/I/L — easier to read aloud

export function generateDuelCode() {
  let code = ""
  for (let i = 0; i < 5; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return code
}

export function duelQuestionIds(duel: TriviaDuel): string[] {
  return JSON.parse(duel.questionIdsJson)
}

// Both players' clients just poll GET /api/trivia/duel/[code] every ~1.2s;
// this is the only place the room's round actually moves forward — called
// at the top of every GET and right after every POST answer. No cron, no
// websocket: whichever request happens to land after the deadline does the
// advancing, which is enough since someone is always about to poll again.
export async function resolveAndAdvance(duel: TriviaDuel): Promise<TriviaDuel> {
  if (duel.status !== "active") return duel
  const now = Date.now()

  if (duel.revealedAt) {
    if (now - duel.revealedAt.getTime() < REVEAL_MS) return duel
    const ids = duelQuestionIds(duel)
    if (duel.currentIndex + 1 >= ids.length) {
      return prisma.triviaDuel.update({ where: { id: duel.id }, data: { status: "done" } })
    }
    return prisma.triviaDuel.update({
      where: { id: duel.id },
      data: { currentIndex: duel.currentIndex + 1, questionStartedAt: new Date(), revealedAt: null, hostAnswerIndex: null, guestAnswerIndex: null },
    })
  }

  const bothAnswered = duel.hostAnswerIndex !== null && duel.guestAnswerIndex !== null
  const timeUp = duel.questionStartedAt ? now - duel.questionStartedAt.getTime() >= QUESTION_MS : false
  if (!bothAnswered && !timeUp) return duel

  return prisma.triviaDuel.update({
    where: { id: duel.id },
    data: {
      revealedAt: new Date(),
      ...(duel.hostAnswerIndex === null && { hostAnswerIndex: -1 }),
      ...(duel.guestAnswerIndex === null && { guestAnswerIndex: -1 }),
    },
  })
}
