import { prisma } from "@/lib/db/prisma"

// Point sources feeding the unified "level" that shows up on the student's
// home screen. Each is capped where a single lucky run could otherwise
// dwarf everything else; surveys are deliberately uncapped since that's
// real, repeatable participation we want to keep rewarding.
const CLIMB_SCORE_CAP = 300
const TRIVIA_SCORE_CAP = 300
const DUEL_WIN_XP = 30
const DUEL_DRAW_XP = 10
const SURVEY_XP = 15

export interface XpBreakdown {
  userId: string
  name: string
  climb: number
  trivia: number
  duel: number
  mastermind: number
  wordle: number
  surveys: number
  total: number
}

export const LEVELS = [
  { min: 0, name: "מתחיל", icon: "🌱" },
  { min: 150, name: "חניך", icon: "📗" },
  { min: 400, name: "לוחם", icon: "⚔️" },
  { min: 800, name: "מומחה", icon: "🔥" },
  { min: 1400, name: "אלוף", icon: "🏆" },
  { min: 2200, name: "אגדה", icon: "👑" },
] as const

export function levelFor(xp: number) {
  let current = LEVELS[0] as typeof LEVELS[number]
  let next: typeof LEVELS[number] | null = null
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) current = LEVELS[i]
    else { next = LEVELS[i]; break }
  }
  const progress = next ? (xp - current.min) / (next.min - current.min) : 1
  return { name: current.name, icon: current.icon, min: current.min, next, progress: Math.max(0, Math.min(1, progress)), xp }
}

// Computed fresh on every request rather than kept as a running counter —
// the class is small (~30-40 students), so re-aggregating from the real
// score tables on each call is cheap and never drifts out of sync with them.
export async function computeAllStudentXp(): Promise<XpBreakdown[]> {
  const students = await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true, name: true, studentId: true } })
  const byUser = new Map<string, XpBreakdown>()
  for (const s of students) {
    byUser.set(s.id, { userId: s.id, name: s.name ?? "תלמיד/ה", climb: 0, trivia: 0, duel: 0, mastermind: 0, wordle: 0, surveys: 0, total: 0 })
  }
  if (byUser.size === 0) return []

  const [climbBests, triviaBests, mmBests, wordleBests, duels, surveyCounts] = await Promise.all([
    prisma.gameScore.groupBy({ by: ["userId"], _max: { score: true } }),
    prisma.triviaScore.groupBy({ by: ["userId"], _max: { score: true } }),
    prisma.mastermindScore.groupBy({ by: ["userId", "difficulty"], _max: { score: true } }),
    prisma.wordleScore.groupBy({ by: ["userId"], _max: { score: true } }),
    prisma.triviaDuel.findMany({ where: { status: "done", guestId: { not: null } }, select: { hostId: true, guestId: true, hostScore: true, guestScore: true } }),
    prisma.surveyCompletion.groupBy({ by: ["studentId"], _count: { _all: true } }),
  ])

  for (const row of climbBests) {
    const e = byUser.get(row.userId)
    if (e) e.climb = Math.min(row._max.score ?? 0, CLIMB_SCORE_CAP)
  }
  for (const row of triviaBests) {
    const e = byUser.get(row.userId)
    if (e) e.trivia = Math.min(row._max.score ?? 0, TRIVIA_SCORE_CAP)
  }
  for (const row of mmBests) {
    const e = byUser.get(row.userId)
    if (e) e.mastermind += row._max.score ?? 0
  }
  for (const row of wordleBests) {
    const e = byUser.get(row.userId)
    if (e) e.wordle = row._max.score ?? 0
  }
  for (const d of duels) {
    const hostEntry = byUser.get(d.hostId)
    const guestEntry = d.guestId ? byUser.get(d.guestId) : undefined
    if (d.hostScore === d.guestScore) {
      if (hostEntry) hostEntry.duel += DUEL_DRAW_XP
      if (guestEntry) guestEntry.duel += DUEL_DRAW_XP
    } else {
      const winnerEntry = d.hostScore > d.guestScore ? hostEntry : guestEntry
      if (winnerEntry) winnerEntry.duel += DUEL_WIN_XP
    }
  }
  const studentIdToUserId = new Map(students.filter(s => s.studentId).map(s => [s.studentId as string, s.id]))
  for (const row of surveyCounts) {
    const userId = studentIdToUserId.get(row.studentId)
    const e = userId ? byUser.get(userId) : undefined
    if (e) e.surveys = row._count._all * SURVEY_XP
  }

  for (const e of byUser.values()) e.total = e.climb + e.trivia + e.duel + e.mastermind + e.wordle + e.surveys
  return Array.from(byUser.values())
}
