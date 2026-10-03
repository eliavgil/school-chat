import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// GET — the full "ניהול כיתה" roster for the caller's own homeroom class:
// track/mathUnits/englishUnits/city come from the admin's אלפון + קבוצות
// לימוד imports (or the student's own /student/edit self-report) — read
// here as-is, no new import path needed.
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { classId: true } })
  // Same fallback /api/home uses — most TEACHER accounts get classId set
  // at approval time, but "class-y" (י4) is the one class several admin
  // flows still default to when it's unset.
  const classId = user?.classId ?? "class-y"

  const students = await prisma.student.findMany({
    where: { classId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, track: true, mathUnits: true, englishUnits: true, city: true },
  })

  return NextResponse.json({ classId, students })
}
