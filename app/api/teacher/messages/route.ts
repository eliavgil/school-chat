import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Teacher sees messages for students in their class
  const messages = await prisma.message.findMany({
    where: user.classId ? { student: { classId: user.classId } } : {},
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { name: true, email: true } },
      student: { select: { name: true } },
    },
  })

  return NextResponse.json({ messages })
}
