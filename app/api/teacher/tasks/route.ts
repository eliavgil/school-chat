import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// A homeroom teacher's own class task list ("משימות בוערות" / "משימות
// נוספות" on the new home page) — always scoped to the caller's own
// classId, same fallback /api/class/roster uses. Every route here is
// TEACHER/ADMIN-only; there's no cross-class access, so no classId param
// is ever taken from the client.
async function requireTeacherClassId() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || (role !== "TEACHER" && role !== "ADMIN")) return null
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { classId: true } })
  return user?.classId ?? "class-y"
}

export async function GET() {
  const classId = await requireTeacherClassId()
  if (!classId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tasks = await prisma.teacherTask.findMany({
    where: { classId },
    orderBy: [{ done: "asc" }, { deadline: "asc" }, { createdAt: "desc" }],
    include: { checks: { select: { studentId: true } } },
  })
  return NextResponse.json({ tasks })
}

export async function POST(req: NextRequest) {
  const classId = await requireTeacherClassId()
  if (!classId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { description, responsible, deadline, note, perStudent } = await req.json()
  if (!description?.trim()) return NextResponse.json({ error: "Missing description" }, { status: 400 })

  const task = await prisma.teacherTask.create({
    data: {
      classId,
      description: description.trim(),
      responsible: responsible?.trim() || null,
      deadline: deadline ? new Date(deadline) : null,
      note: note?.trim() || null,
      perStudent: !!perStudent,
    },
  })
  return NextResponse.json({ task })
}

export async function PATCH(req: NextRequest) {
  const classId = await requireTeacherClassId()
  if (!classId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, description, responsible, deadline, note, perStudent, done } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  // Scope the update to this teacher's own class — a bare `where: { id }`
  // would let any teacher edit any class's task by guessing an id.
  const existing = await prisma.teacherTask.findUnique({ where: { id }, select: { classId: true } })
  if (!existing || existing.classId !== classId) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (description !== undefined) data.description = description.trim()
  if (responsible !== undefined) data.responsible = responsible?.trim() || null
  if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null
  if (note !== undefined) data.note = note?.trim() || null
  if (perStudent !== undefined) data.perStudent = !!perStudent
  if (done !== undefined) data.done = !!done

  const task = await prisma.teacherTask.update({ where: { id }, data })
  return NextResponse.json({ task })
}

export async function DELETE(req: NextRequest) {
  const classId = await requireTeacherClassId()
  if (!classId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const existing = await prisma.teacherTask.findUnique({ where: { id }, select: { classId: true } })
  if (!existing || existing.classId !== classId) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.teacherTask.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
