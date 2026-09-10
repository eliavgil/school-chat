import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// One-time diagnostic: holiday-filtering assumed type === "holiday" (the
// manual-add form's literal value), but most events come from the main
// spreadsheet sync, whose `type` column is free text — likely a different
// (probably Hebrew) value. List real type values instead of guessing again.
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const events = await prisma.calendarEvent.findMany({
    where: { date: { gte: new Date() } },
    orderBy: { date: "asc" },
    select: { date: true, description: true, type: true },
    take: 60,
  })

  return NextResponse.json({ ok: true, events })
}
