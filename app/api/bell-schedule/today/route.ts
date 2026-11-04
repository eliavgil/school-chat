import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { dayTypeForWeekday } from "@/lib/bellSchedule"

// GET — today's bell slots (period/break → start/end clock time), for a
// client-side countdown to the end of the current period. Takes ?weekday=
// (JS Date.getDay(), 0=Sunday) from the caller instead of computing "today"
// here, since this runs on Vercel's server (UTC) and a presenting teacher's
// own device already has the correct Israel wall-clock day — see
// app/api/widget/schedule/route.ts's israelNow() for why that mismatch
// matters near a UTC/Israel day boundary.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const weekdayStr = new URL(req.url).searchParams.get("weekday")
  const weekday = weekdayStr === null ? NaN : Number(weekdayStr)
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    return NextResponse.json({ error: "Missing or invalid weekday" }, { status: 400 })
  }

  const dayType = dayTypeForWeekday(weekday)
  if (!dayType) return NextResponse.json({ dayType: null, slots: [] })

  const slots = await prisma.bellSlot.findMany({
    where: { dayType },
    orderBy: { order: "asc" },
    select: { period: true, startTime: true, endTime: true },
  })
  return NextResponse.json({ dayType, slots })
}
