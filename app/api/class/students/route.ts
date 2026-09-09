import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// GET — student list for the name spinner. Pass ?classId=<roster class id> to
// get a specific class's students (e.g. the class currently being presented
// to); without it, falls back to the teacher's own default class.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let classId = req.nextUrl.searchParams.get("classId")

  if (!classId) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { classId: true },
    })
    classId = user?.classId ?? null
  }

  if (!classId) return NextResponse.json({ error: "No class" }, { status: 404 })

  const students = await prisma.student.findMany({
    where: { classId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return NextResponse.json(students)
}
