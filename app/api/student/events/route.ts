import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// GET — calendar events visible to students (forStudents or forAll), from today onward.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const events = await prisma.calendarEvent.findMany({
    where: {
      date: { gte: startOfToday },
      OR: [{ forStudents: true }, { forAll: true }],
    },
    orderBy: { date: "asc" },
    take: 100,
  })
  return NextResponse.json({ events })
}
