import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { DAY_TYPE_B } from "@/lib/bellSchedule"

// One-time seed: ב' turned out to run a different bell schedule from ה'
// (they'd been treated as the same pattern until now — see lib/bellSchedule.ts),
// transcribed from the teacher-provided printed timetable for יום ב'. The
// "מעבר" (fast-transition) notes on the source sheet describe a sub-window
// inside a double lesson, not a separate period, so they aren't rows here.
const MONDAY_SLOTS: { period: string; startTime: string; endTime: string }[] = [
  { period: "1", startTime: "08:30", endTime: "09:15" },
  { period: "2", startTime: "09:15", endTime: "10:00" },
  { period: "הפסקה", startTime: "10:00", endTime: "10:20" },
  { period: "3", startTime: "10:20", endTime: "11:05" },
  { period: "4", startTime: "11:05", endTime: "11:50" },
  { period: "הפסקה", startTime: "11:50", endTime: "12:05" },
  { period: "5", startTime: "12:05", endTime: "12:50" },
  { period: "6", startTime: "12:50", endTime: "13:35" },
  { period: "הפסקה", startTime: "13:35", endTime: "13:45" },
  { period: "7", startTime: "13:45", endTime: "14:30" },
  { period: "8", startTime: "14:30", endTime: "15:15" },
]

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await prisma.bellSlot.deleteMany({ where: { dayType: DAY_TYPE_B } })
  await prisma.bellSlot.createMany({
    data: MONDAY_SLOTS.map((s, order) => ({ ...s, dayType: DAY_TYPE_B, order })),
  })

  return NextResponse.json({ ok: true, inserted: MONDAY_SLOTS.length })
}
