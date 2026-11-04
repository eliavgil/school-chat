import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// "לטיפול רכז" — a homeroom teacher's own requests to the grade coordinator,
// the reverse direction from StaffTask (coordinator → teacher). A plain
// TEACHER only ever sees their own class's requests; ADMIN (the coordinator)
// sees every class's, since they're the one meant to be working through them.
async function requireSession() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || (role !== "TEACHER" && role !== "ADMIN")) return null
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { classId: true, role: true } })
  return { userId: session.user.id as string, classId: user?.classId ?? "class-y", isAdmin: role === "ADMIN" }
}

export async function GET() {
  const ctx = await requireSession()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const requests = await prisma.coordinatorRequest.findMany({
    where: ctx.isAdmin ? {} : { classId: ctx.classId },
    orderBy: [{ done: "asc" }, { urgency: "desc" }, { createdAt: "desc" }],
    include: { createdBy: { select: { name: true } } },
  })
  return NextResponse.json({ requests })
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, note, urgency } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: "Missing title" }, { status: 400 })

  const request = await prisma.coordinatorRequest.create({
    data: {
      classId: ctx.classId,
      createdById: ctx.userId,
      title: title.trim(),
      note: note?.trim() || null,
      urgency: urgency === "LOW" || urgency === "HIGH" ? urgency : "NORMAL",
    },
  })
  return NextResponse.json({ request })
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, done, urgency, note } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const existing = await prisma.coordinatorRequest.findUnique({ where: { id }, select: { classId: true } })
  if (!existing || (!ctx.isAdmin && existing.classId !== ctx.classId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (done !== undefined) data.done = !!done
  if (urgency !== undefined) data.urgency = urgency
  if (note !== undefined) data.note = note?.trim() || null

  const request = await prisma.coordinatorRequest.update({ where: { id }, data })
  return NextResponse.json({ request })
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const existing = await prisma.coordinatorRequest.findUnique({ where: { id }, select: { classId: true, createdById: true } })
  if (!existing || (!ctx.isAdmin && existing.classId !== ctx.classId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.coordinatorRequest.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
