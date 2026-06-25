import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// GET /api/teacher/messages/bulk?studentIds=a,b,c
// Returns messages for multiple students in one round-trip
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ids = (searchParams.get("studentIds") ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 20)

  if (!ids.length) return NextResponse.json({ byStudent: {} })

  const results = await Promise.all(
    ids.map(studentId =>
      prisma.message.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { sender: { select: { name: true, email: true } } },
      })
    )
  )

  const byStudent: Record<string, unknown[]> = {}
  ids.forEach((id, i) => {
    byStudent[id] = results[i].reverse()
  })

  return NextResponse.json({ byStudent })
}
