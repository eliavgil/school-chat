import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tasks = await prisma.personalTask.findMany({
    where: { userId: session.user.id },
    orderBy: [{ done: "asc" }, { deadline: "asc" }, { createdAt: "desc" }],
  })
  return NextResponse.json({ tasks })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, link, deadline, importance, reminderAt } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: "Missing title" }, { status: 400 })

  const task = await prisma.personalTask.create({
    data: {
      userId: session.user.id,
      title: title.trim(),
      link: link?.trim() || null,
      deadline: deadline ? new Date(deadline) : null,
      importance: importance ?? "BLUE",
      reminderAt: reminderAt ? new Date(reminderAt) : null,
    },
  })
  return NextResponse.json({ task })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, done, title, link, deadline, importance, reminderAt } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  // Only ever touch a task that's actually owned by the caller.
  const existing = await prisma.personalTask.findUnique({ where: { id }, select: { userId: true } })
  if (!existing || existing.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const task = await prisma.personalTask.update({
    where: { id },
    data: {
      ...(done !== undefined && { done }),
      ...(title !== undefined && { title: title.trim() }),
      ...(link !== undefined && { link: link?.trim() || null }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      ...(importance !== undefined && { importance }),
      ...(reminderAt !== undefined && {
        reminderAt: reminderAt ? new Date(reminderAt) : null,
        reminderSent: false, // a changed reminder time needs to fire again
      }),
    },
  })
  return NextResponse.json({ task })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  const existing = await prisma.personalTask.findUnique({ where: { id }, select: { userId: true } })
  if (!existing || existing.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.personalTask.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
