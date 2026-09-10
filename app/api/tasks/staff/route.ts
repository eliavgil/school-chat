import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

function isTeacherRole(role: string) {
  return role === "TEACHER" || role === "ADMIN"
}

// GET — the coordinator's staff tasks, each with its per-teacher assignees,
// plus the list of known homeroom-teacher names (from Class.teacherDisplayName)
// to pick from when assigning — most of them don't have real accounts yet,
// so assignment is by display name, not a User relation, for now.
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [tasks, classes] = await Promise.all([
    prisma.staffTask.findMany({
      where: { createdById: session.user.id },
      include: { assignees: true },
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
    }),
    prisma.class.findMany({
      where: { teacherDisplayName: { not: "" } },
      select: { teacherDisplayName: true },
      distinct: ["teacherDisplayName"],
    }),
  ])

  const teacherNames = classes.map(c => c.teacherDisplayName).filter(Boolean)
  return NextResponse.json({ tasks, teacherNames })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, link, deadline, importance, assignees } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: "Missing title" }, { status: 400 })
  const names: string[] = Array.isArray(assignees) ? assignees.map((n: string) => n.trim()).filter(Boolean) : []
  if (names.length === 0) return NextResponse.json({ error: "Missing assignees" }, { status: 400 })

  const task = await prisma.staffTask.create({
    data: {
      createdById: session.user.id,
      title: title.trim(),
      link: link?.trim() || null,
      deadline: deadline ? new Date(deadline) : null,
      importance: importance ?? "BLUE",
      assignees: { create: names.map(teacherLabel => ({ teacherLabel })) },
    },
    include: { assignees: true },
  })
  return NextResponse.json({ task })
}

// PATCH — edit the task itself, or toggle one assignee's done state
// (assigneeId + done), depending on which fields are sent.
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, assigneeId, done, title, link, deadline, importance } = await req.json()

  if (assigneeId) {
    const assignee = await prisma.staffTaskAssignee.findUnique({
      where: { id: assigneeId },
      select: { userId: true, staffTask: { select: { createdById: true } } },
    })
    if (!assignee) return NextResponse.json({ error: "Not found" }, { status: 404 })
    // Either the coordinator who created the task, or the linked teacher
    // themselves once their account exists, can toggle this.
    const isOwner = assignee.staffTask.createdById === session.user.id
    const isAssignee = assignee.userId === session.user.id
    if (!isOwner && !isAssignee) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const updated = await prisma.staffTaskAssignee.update({ where: { id: assigneeId }, data: { done: !!done } })
    return NextResponse.json({ assignee: updated })
  }

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const existing = await prisma.staffTask.findUnique({ where: { id }, select: { createdById: true } })
  if (!existing || existing.createdById !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const task = await prisma.staffTask.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(link !== undefined && { link: link?.trim() || null }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      ...(importance !== undefined && { importance }),
    },
    include: { assignees: true },
  })
  return NextResponse.json({ task })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  const existing = await prisma.staffTask.findUnique({ where: { id }, select: { createdById: true } })
  if (!existing || existing.createdById !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.staffTask.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
