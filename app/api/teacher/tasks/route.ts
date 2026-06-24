import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

async function getTeacherClassId(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { classId: true } })
  return user?.classId ?? "class-y"
}

function isTeacherRole(role: string) {
  return role === "TEACHER" || role === "ADMIN"
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = (session.user as any).role
  if (!isTeacherRole(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const classId = await getTeacherClassId(session.user.id)
  const tasks = await prisma.teacherTask.findMany({
    where: { classId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ tasks })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = (session.user as any).role
  if (!isTeacherRole(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const classId = await getTeacherClassId(session.user.id)
  const { description, responsible, deadline, note } = await req.json()
  if (!description?.trim()) return NextResponse.json({ error: "Description required" }, { status: 400 })

  const task = await prisma.teacherTask.create({
    data: {
      classId,
      description: description.trim(),
      responsible: responsible?.trim() || null,
      deadline: deadline ? new Date(deadline) : null,
      note: note?.trim() || null,
    },
  })
  return NextResponse.json({ task })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = (session.user as any).role
  if (!isTeacherRole(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id, done, description, responsible, deadline, note } = await req.json()
  const task = await prisma.teacherTask.update({
    where: { id },
    data: {
      ...(done !== undefined && { done }),
      ...(description !== undefined && { description }),
      ...(responsible !== undefined && { responsible: responsible || null }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      ...(note !== undefined && { note: note || null }),
    },
  })
  return NextResponse.json({ task })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = (session.user as any).role
  if (!isTeacherRole(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await req.json()
  await prisma.teacherTask.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
