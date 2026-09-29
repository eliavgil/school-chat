import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// GET — seating charts for a class (?classId=...), newest first.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const classId = req.nextUrl.searchParams.get("classId")
  if (!classId) return NextResponse.json({ error: "classId required" }, { status: 400 })

  const charts = await prisma.seatingChart.findMany({
    where: { classId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, classId: true, updatedAt: true, createdAt: true },
  })
  return NextResponse.json({ charts })
}

// POST — create a new seating chart.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { classId, name, rows, boardSide, doorSide, roster, assignments } = body
  if (!classId || !Array.isArray(rows) || !Array.isArray(roster) || !Array.isArray(assignments)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const chart = await prisma.seatingChart.create({
    data: {
      classId,
      createdById: session.user.id,
      name: name ?? "",
      rows,
      boardSide: boardSide ?? "top",
      doorSide: doorSide ?? "bottom",
      roster,
      assignments,
    },
  })
  return NextResponse.json({ chart })
}
