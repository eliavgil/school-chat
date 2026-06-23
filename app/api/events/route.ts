import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

function isTeacher(session: any) {
  return session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const events = await prisma.calendarEvent.findMany({ orderBy: { date: "asc" } })
  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { date, description, grade } = await req.json()
  if (!date || !description) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const event = await prisma.calendarEvent.create({
    data: { date: new Date(date), description, grade: grade ?? null },
  })
  return NextResponse.json({ event })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, date, description, grade } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const event = await prisma.calendarEvent.update({
    where: { id },
    data: { ...(date && { date: new Date(date) }), ...(description && { description }), grade: grade ?? null },
  })
  return NextResponse.json({ event })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  await prisma.calendarEvent.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
