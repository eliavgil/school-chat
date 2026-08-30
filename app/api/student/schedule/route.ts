import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// GET — the logged-in student's own class schedule (read-only).
// A teacher/admin previewing the student app (see "גרסת תלמיד") has no
// studentId of their own, so they see the app's single default class —
// same "class-y" convention already used for schedule lookups elsewhere
// (e.g. the student chat bot).
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as any).role as string | undefined
  const studentId = (session.user as any).studentId as string | null

  let classId: string
  if (role === "TEACHER" || role === "ADMIN") {
    classId = "class-y"
  } else {
    if (!studentId) return NextResponse.json({ error: "לא מקושר לתלמיד" }, { status: 403 })
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { classId: true } })
    if (!student) return NextResponse.json({ error: "לא מקושר לתלמיד" }, { status: 403 })
    classId = student.classId
  }

  const slots = await prisma.scheduleSlot.findMany({
    where: { classId },
    orderBy: [{ dayHeb: "asc" }, { period: "asc" }],
  })
  return NextResponse.json({ slots })
}
