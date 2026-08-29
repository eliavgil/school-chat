import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

function isTeacher(session: any) {
  return session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"
}

// GET — list all surveys with completion counts, for the teacher's management view.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [surveys, classes] = await Promise.all([
    prisma.survey.findMany({
      include: {
        _count: { select: { completions: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.class.findMany({ select: { id: true, name: true, displayName: true, _count: { select: { students: true } } } }),
  ])

  const classById = new Map(classes.map(c => [c.id, c]))
  const result = surveys.map(s => {
    const cls = s.classId ? classById.get(s.classId) : null
    const totalStudents = s.classId
      ? (cls?._count.students ?? 0)
      : classes.reduce((sum, c) => sum + c._count.students, 0)
    return {
      id: s.id,
      title: s.title,
      url: s.url,
      classId: s.classId,
      className: cls ? (cls.displayName || cls.name) : null,
      dueDate: s.dueDate,
      createdAt: s.createdAt,
      completedCount: s._count.completions,
      totalStudents,
    }
  })

  return NextResponse.json({ surveys: result, classes: classes.map(c => ({ id: c.id, name: c.displayName || c.name })) })
}

// POST — create a new survey link.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, url, classId, dueDate } = await req.json()
  if (!title?.trim() || !url?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const survey = await prisma.survey.create({
    data: {
      title: title.trim(),
      url: url.trim(),
      classId: classId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  })
  return NextResponse.json({ survey })
}

// DELETE — remove a survey (and its completions, via cascade).
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  await prisma.survey.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
