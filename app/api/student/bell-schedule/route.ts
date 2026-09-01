import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// GET — the school-wide bell schedule (period → clock times), read-only.
// Not per-class, so any authenticated user (student, previewing teacher, parent) can read it.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const slots = await prisma.bellSlot.findMany({ orderBy: [{ dayType: "asc" }, { order: "asc" }] })
  return NextResponse.json({ slots })
}
