import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// GET — the logged-in student's own class schedule (read-only).
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const studentId = (session.user as any).studentId as string | null
  if (!studentId) return NextResponse.json({ error: "לא מקושר לתלמיד" }, { status: 403 })

  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { classId: true } })
  if (!student) return NextResponse.json({ error: "לא מקושר לתלמיד" }, { status: 403 })

  const slots = await prisma.scheduleSlot.findMany({
    where: { classId: student.classId },
    orderBy: [{ dayHeb: "asc" }, { period: "asc" }],
  })
  return NextResponse.json({ slots })
}
