import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const students = await prisma.student.findMany({
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        include: { sender: { select: { name: true, email: true } } },
      },
      parents: {
        include: { user: { select: { name: true, parentType: true } } },
      },
    },
  })

  const conversations = students
    .filter((s) => s.messages.length > 0)
    .map((s) => {
      const unreadCount = s.messages.filter((m) => !m.teacherSeenAt).length
      const lastMessage = s.messages[0]

      const parentLabels = s.parents.map(({ user }) => {
        const firstName = user.name?.split(" ")[0] ?? ""
        return `${firstName} (${user.parentType ?? "הורה"})`
      })

      return {
        studentId: s.id,
        studentName: s.name,
        parentLabels,
        lastMessage: {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          status: lastMessage.status,
        },
        unreadCount,
        totalMessages: s.messages.length,
      }
    })
    .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime())

  const studentIds = students.map(s => s.id)
  const totalTasks = await prisma.message.count({ where: { isTask: true, studentId: { in: studentIds } } })

  return NextResponse.json({ conversations, totalTasks })
}
