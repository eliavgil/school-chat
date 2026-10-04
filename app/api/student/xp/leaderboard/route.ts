import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { computeAllStudentXp, levelFor } from "@/lib/student-xp"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const all = await computeAllStudentXp()
  const leaderboard = all
    .sort((a, b) => b.total - a.total)
    .slice(0, 50)
    .map(e => {
      const level = levelFor(e.total)
      return { name: e.name, total: e.total, levelName: level.name, levelIcon: level.icon }
    })

  return NextResponse.json({ leaderboard })
}
