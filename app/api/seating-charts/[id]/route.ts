import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const chart = await prisma.seatingChart.findUnique({ where: { id } })
  if (!chart) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ chart })
}

// PATCH — update layout/roster/assignments/name after generation or manual edits.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.rows !== undefined) data.rows = body.rows
  if (body.boardSide !== undefined) data.boardSide = body.boardSide
  if (body.doorSide !== undefined) data.doorSide = body.doorSide
  if (body.roster !== undefined) data.roster = body.roster
  if (body.assignments !== undefined) data.assignments = body.assignments

  const chart = await prisma.seatingChart.update({ where: { id }, data })
  return NextResponse.json({ chart })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  await prisma.seatingChart.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
