import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// One-time diagnostic: a teacher reported students outside י4 seeing י4's
// data. Check for duplicate/ambiguous Class rows and how students actually
// resolve to a classId, without guessing.
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const classes = await prisma.class.findMany({
    select: { id: true, name: true, displayName: true, teacherDisplayName: true },
  })

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: {
      id: true, name: true, email: true, classId: true, studentId: true,
      class: { select: { id: true, displayName: true } },
      studentRecord: { select: { id: true, name: true, classId: true } },
    },
  })

  return NextResponse.json({ ok: true, classes, students })
}
