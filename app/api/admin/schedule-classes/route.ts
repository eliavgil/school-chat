import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { TEACHER_OWN_SCHEDULE_ID } from "@/lib/bellSchedule"

// GET — which real classes actually have an uploaded weekly schedule
// (excludes the teacher's own personal-schedule placeholder id), so the
// schedule page can show a real class schedule without guessing which one.
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rows = await prisma.scheduleSlot.findMany({
    where: { classId: { not: TEACHER_OWN_SCHEDULE_ID } },
    select: { classId: true },
    distinct: ["classId"],
  })
  const classIds = rows.map(r => r.classId)
  if (classIds.length === 0) return NextResponse.json({ classes: [] })

  const classes = await prisma.class.findMany({
    where: { id: { in: classIds } },
    select: { id: true, displayName: true, name: true },
  })

  return NextResponse.json({
    classes: classes.map(c => ({ id: c.id, name: c.displayName || c.name })),
  })
}
