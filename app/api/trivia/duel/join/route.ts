import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await req.json()
  const normalized = String(code ?? "").trim().toUpperCase()
  if (!normalized) return NextResponse.json({ error: "חוסר קוד חדר" }, { status: 400 })

  const duel = await prisma.triviaDuel.findUnique({ where: { code: normalized } })
  if (!duel) return NextResponse.json({ error: "קוד חדר לא נמצא" }, { status: 404 })
  if (duel.hostId === session.user.id) return NextResponse.json({ error: "זה החדר שלך — שלח/י את הקוד לחבר/ה" }, { status: 400 })
  if (duel.guestId && duel.guestId !== session.user.id) return NextResponse.json({ error: "החדר הזה כבר תפוס" }, { status: 400 })

  if (!duel.guestId) {
    await prisma.triviaDuel.update({
      where: { id: duel.id },
      data: { guestId: session.user.id, status: "active", currentIndex: 0, questionStartedAt: new Date() },
    })
  }
  return NextResponse.json({ code: duel.code })
}
