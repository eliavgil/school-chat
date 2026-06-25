import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [students, unreadCounts] = await Promise.all([
    prisma.student.findMany({
      where: { messages: { some: {} } },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { name: true, email: true } } },
        },
        parents: {
          include: { user: { select: { name: true, parentType: true } } },
        },
      },
    }),
    prisma.message.groupBy({
      by: ["studentId"],
      where: { teacherSeenAt: null },
      _count: { id: true },
    }),
  ])

  const unreadMap = Object.fromEntries(unreadCounts.map((r) => [r.studentId, r._count.id]))

  const conversations = students
    .map((s) => {
      const unreadCount = unreadMap[s.id] ?? 0
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
