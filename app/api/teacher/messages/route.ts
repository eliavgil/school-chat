import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// GET /api/teacher/messages?studentId=xxx — get all messages for a student and mark as seen
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")

  if (!studentId) {
    // Fallback: return all messages (old behaviour)
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      include: { sender: { select: { name: true, email: true } }, student: { select: { name: true } } },
    })
    return NextResponse.json({ messages })
  }

  const messages = await prisma.message.findMany({
    where: { studentId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { name: true, email: true } } },
  })

  // Mark all unseen messages as seen
  await prisma.message.updateMany({
    where: { studentId, teacherSeenAt: null },
    data: { teacherSeenAt: new Date() },
  })

  return NextResponse.json({ messages })
}

// PATCH /api/teacher/messages — approve bot answer or mark as task
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { messageId, action } = await req.json()
  if (!messageId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const data: Record<string, any> = {}
  if (action === "approve") data.teacherApproved = true
  if (action === "unapprove") data.teacherApproved = false
  if (action === "task") data.isTask = true
  if (action === "untask") data.isTask = false

  const message = await prisma.message.update({ where: { id: messageId }, data })
  return NextResponse.json({ message })
}

// POST /api/teacher/messages — teacher reply to a specific message thread
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { messageId, response } = await req.json()
  if (!messageId || !response) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const message = await prisma.message.update({
    where: { id: messageId },
    data: { teacherResponse: response, teacherAnsweredAt: new Date(), status: "TEACHER_ANSWERED" },
  })
  return NextResponse.json({ message })
}
