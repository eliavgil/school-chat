import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { teacherOwnScheduleId } from "@/lib/bellSchedule"

// One-time migration: personal schedules used to live in one shared
// ScheduleSlot bucket (classId "teacher-own") since only one teacher ever
// used this app — now that each teacher gets their own bucket
// (teacherOwnScheduleId), that legacy bucket's rows need to move to
// whichever teacher actually owns them. Run this once, logged in as that
// teacher — it moves the old shared rows to *your* new per-teacher id.
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const newId = teacherOwnScheduleId(session.user.id)
  const existing = await prisma.scheduleSlot.count({ where: { classId: newId } })
  if (existing > 0) {
    return NextResponse.json({
      ok: false,
      error: `כבר יש לך ${existing} שורות במערכת האישית החדשה — לא מזיז, כדי לא לשכפל`,
    })
  }

  const { count } = await prisma.scheduleSlot.updateMany({
    where: { classId: "teacher-own" },
    data: { classId: newId },
  })
  return NextResponse.json({ ok: true, moved: count })
}
