import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// A freestanding, ad-hoc checkbox list of the homeroom teacher's own class
// roster (e.g. confirming who's present for something in person) — not tied
// to any task. "נקה הכל" just deletes every mark for the class.
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

  const [students, marks] = await Promise.all([
    prisma.student.findMany({ where: { classId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.studentChecklistMark.findMany({ where: { classId }, select: { studentId: true } }),
  ])
  return NextResponse.json({ students, checked: marks.map(m => m.studentId) })
}

export async function POST(req: NextRequest) {
  const classId = await requireTeacherClassId()
  if (!classId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { studentId, checked } = await req.json()
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 })

  if (checked) {
    await prisma.studentChecklistMark.upsert({
      where: { studentId },
      create: { classId, studentId },
      update: {},
    })
  } else {
    await prisma.studentChecklistMark.deleteMany({ where: { studentId } })
  }
  return NextResponse.json({ ok: true })
}

// DELETE with no body — clears every mark for the caller's own class
export async function DELETE() {
  const classId = await requireTeacherClassId()
  if (!classId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.studentChecklistMark.deleteMany({ where: { classId } })
  return NextResponse.json({ ok: true })
}
