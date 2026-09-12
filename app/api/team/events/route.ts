import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

function isTeacher(session: any) {
  return session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"
}

// GET — the team's own events (meetings, internal deadlines — not the
// school-wide calendar), soonest first.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const events = await prisma.teamEvent.findMany({ orderBy: { date: "asc" } })
  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, date, link } = await req.json()
  if (!title?.trim() || !date) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const event = await prisma.teamEvent.create({
    data: { title: title.trim(), date: new Date(date), link: link?.trim() || null, createdById: session.user.id },
  })
  return NextResponse.json({ event })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  await prisma.teamEvent.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
