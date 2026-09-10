import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// One-time cleanup: the teacher confirmed the ScheduleSlot rows under
// classId "class-y" are leftover example/demo data from a previous school,
// not real current data — they were surfacing confusingly on /teacher/schedule
// alongside the real uploads. This only clears the stale schedule rows; the
// "class-y" Class row itself (real, current — this school's actual י4) is untouched.
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { count } = await prisma.scheduleSlot.deleteMany({ where: { classId: "class-y" } })
  return NextResponse.json({ ok: true, deleted: count })
}
