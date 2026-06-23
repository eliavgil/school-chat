import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

function isTeacher(session: any) {
  return session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"
}

// GET — fetch all schedule slots for a class
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const classId = new URL(req.url).searchParams.get("classId") ?? "class-y"
  const slots = await prisma.scheduleSlot.findMany({
    where: { classId },
    orderBy: [{ dayHeb: "asc" }, { period: "asc" }],
  })
  return NextResponse.json({ slots })
}

// PATCH — update a single slot's content
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, content } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const slot = await prisma.scheduleSlot.update({ where: { id }, data: { content } })
  return NextResponse.json({ slot })
}

// DELETE — delete a slot
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  await prisma.scheduleSlot.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

// POST — add a new slot
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { classId = "class-y", dayHeb, period, content } = await req.json()
  const slot = await prisma.scheduleSlot.create({ data: { classId, dayHeb, period, content } })
  return NextResponse.json({ slot })
}
