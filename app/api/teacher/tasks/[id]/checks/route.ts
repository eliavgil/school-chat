import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// Per-student checkbox state for one TeacherTask (perStudent=true), e.g.
// "who's brought their trip permission slip". A check is toggled by
// upserting/deleting a TeacherTaskCheck row — its mere existence means
// "checked", so there's nothing to backfill when a task first turns on
// perStudent tracking.
async function requireTeacherClassId() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || (role !== "TEACHER" && role !== "ADMIN")) return null
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { classId: true } })
  return user?.classId ?? "class-y"
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const classId = await requireTeacherClassId()
  if (!classId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: taskId } = await params

  const task = await prisma.teacherTask.findUnique({ where: { id: taskId }, select: { classId: true } })
  if (!task || task.classId !== classId) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { studentId, checked } = await req.json()
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 })

  if (checked) {
    await prisma.teacherTaskCheck.upsert({
      where: { taskId_studentId: { taskId, studentId } },
      create: { taskId, studentId },
      update: {},
    })
  } else {
    await prisma.teacherTaskCheck.deleteMany({ where: { taskId, studentId } })
  }

  const checks = await prisma.teacherTaskCheck.findMany({ where: { taskId }, select: { studentId: true } })
  return NextResponse.json({ checks: checks.map(c => c.studentId) })
}
