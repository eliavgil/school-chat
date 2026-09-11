import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// One-time fix: the real י4 (class-y) weekly schedule was uploaded while the
// admin import panel's class-ID field still held a stale value from an
// earlier import (cmtukyba1000012kn8ya08v5k — the real י1 class), so all 36
// rows landed under י1's class ID instead of class-y's. Reassigns them to
// the right class. Only moves if class-y is still empty, so this can't
// silently duplicate or clobber a fresh upload made since.
const WRONG_CLASS_ID = "cmtukyba1000012kn8ya08v5k"
const RIGHT_CLASS_ID = "class-y"

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existing = await prisma.scheduleSlot.count({ where: { classId: RIGHT_CLASS_ID } })
  if (existing > 0) {
    return NextResponse.json({
      ok: false,
      error: `class-y already has ${existing} rows — not moving, to avoid duplicating or overwriting real data`,
    })
  }

  const { count } = await prisma.scheduleSlot.updateMany({
    where: { classId: WRONG_CLASS_ID },
    data: { classId: RIGHT_CLASS_ID },
  })
  return NextResponse.json({ ok: true, moved: count })
}
