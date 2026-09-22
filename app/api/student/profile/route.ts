import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// GET/PATCH — the logged-in student's own track + math/English units, self-
// reported from /student/edit. Not grades, just enough context for the
// school-logistics assistant bot (/api/assistant/chat) to answer
// track-specific questions without asking every time.
function getStudentId(session: any): string | null {
  const role = session?.user?.role as string | undefined
  if (role !== "STUDENT") return null
  return (session.user.studentId as string | null) ?? null
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const studentId = getStudentId(session)
  if (!studentId) return NextResponse.json({ error: "לא מקושר לתלמיד" }, { status: 403 })

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { track: true, mathUnits: true, englishUnits: true },
  })
  return NextResponse.json({ profile: student ?? { track: null, mathUnits: null, englishUnits: null } })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const studentId = getStudentId(session)
  if (!studentId) return NextResponse.json({ error: "לא מקושר לתלמיד" }, { status: 403 })

  const { track, mathUnits, englishUnits } = await req.json()
  const student = await prisma.student.update({
    where: { id: studentId },
    data: {
      ...(track !== undefined && { track: track?.trim() || null }),
      ...(mathUnits !== undefined && { mathUnits: mathUnits === null ? null : Number(mathUnits) }),
      ...(englishUnits !== undefined && { englishUnits: englishUnits === null ? null : Number(englishUnits) }),
    },
    select: { track: true, mathUnits: true, englishUnits: true },
  })
  return NextResponse.json({ profile: student })
}
