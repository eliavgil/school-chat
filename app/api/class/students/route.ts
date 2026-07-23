import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { classId: true },
  })

  if (!user?.classId) return NextResponse.json({ error: "No class" }, { status: 404 })

  const students = await prisma.student.findMany({
    where: { classId: user.classId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return NextResponse.json(students)
}
