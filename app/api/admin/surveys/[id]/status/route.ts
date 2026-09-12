import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

function isTeacher(session: any) {
  return session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"
}

// GET — for one survey, split its intended audience (the whole school, or
// just its assigned class) into who's completed it and who hasn't yet.
// Kept separate from the main surveys list so that list stays cheap to load
// — this per-student breakdown is only fetched when a teacher expands one
// survey to see it.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const survey = await prisma.survey.findUnique({ where: { id }, select: { classId: true } })
  if (!survey) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [students, completions] = await Promise.all([
    prisma.student.findMany({
      where: survey.classId ? { classId: survey.classId } : {},
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.surveyCompletion.findMany({
      where: { surveyId: id },
      select: { studentId: true, verified: true },
    }),
  ])

  const verifiedById = new Map(completions.map(c => [c.studentId, c.verified]))
  const completed = students
    .filter(s => verifiedById.has(s.id))
    .map(s => ({ ...s, verified: verifiedById.get(s.id) ?? false }))
  const pending = students.filter(s => !verifiedById.has(s.id))

  return NextResponse.json({ completed, pending })
}
