import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

async function getStudentId(): Promise<{ studentId: string; classId: string } | { error: NextResponse }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const studentId = (session.user as any).studentId as string | null
  if (!studentId) return { error: NextResponse.json({ error: "לא מקושר לתלמיד" }, { status: 403 }) }

  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { classId: true } })
  if (!student) return { error: NextResponse.json({ error: "לא מקושר לתלמיד" }, { status: 403 }) }

  return { studentId, classId: student.classId }
}

// GET — surveys assigned to the student's class (or all classes), each flagged with completed/not.
// Completion is self-reported by the student (there's no live Google Forms integration yet),
// so this reflects "the student says they filled it out," not a verified submission.
export async function GET() {
  const resolved = await getStudentId()
  if ("error" in resolved) return resolved.error
  const { studentId, classId } = resolved

  const surveys = await prisma.survey.findMany({
    where: { OR: [{ classId: null }, { classId }] },
    include: { completions: { where: { studentId }, select: { completedAt: true } } },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  })

  const result = surveys.map(s => ({
    id: s.id,
    title: s.title,
    url: s.url,
    dueDate: s.dueDate,
    createdAt: s.createdAt,
    completed: s.completions.length > 0,
    completedAt: s.completions[0]?.completedAt ?? null,
  }))

  return NextResponse.json({
    surveys: result,
    totalCount: result.length,
    completedCount: result.filter(s => s.completed).length,
  })
}

// POST — self-report a survey as completed.
export async function POST(req: NextRequest) {
  const resolved = await getStudentId()
  if ("error" in resolved) return resolved.error
  const { studentId } = resolved

  const { surveyId } = await req.json()
  if (!surveyId) return NextResponse.json({ error: "Missing surveyId" }, { status: 400 })

  await prisma.surveyCompletion.upsert({
    where: { surveyId_studentId: { surveyId, studentId } },
    create: { surveyId, studentId },
    update: {},
  })
  return NextResponse.json({ ok: true })
}

// DELETE — undo a self-reported completion (misclick recovery).
export async function DELETE(req: NextRequest) {
  const resolved = await getStudentId()
  if ("error" in resolved) return resolved.error
  const { studentId } = resolved

  const { surveyId } = await req.json()
  if (!surveyId) return NextResponse.json({ error: "Missing surveyId" }, { status: 400 })

  await prisma.surveyCompletion.deleteMany({ where: { surveyId, studentId } })
  return NextResponse.json({ ok: true })
}
