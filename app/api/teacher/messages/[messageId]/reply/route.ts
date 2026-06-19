import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { response } = await req.json()
  if (!response?.trim()) {
    return NextResponse.json({ error: "Empty response" }, { status: 400 })
  }

  const message = await prisma.message.update({
    where: { id: params.messageId },
    data: {
      teacherResponse: response,
      teacherAnsweredAt: new Date(),
      status: "TEACHER_ANSWERED",
    },
  })

  return NextResponse.json({ message })
}
