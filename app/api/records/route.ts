import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const records = await prisma.teacherRecord.findMany({
    where: { teacherId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { records } = body as {
    records: { classId: string; classLabel: string; studentName: string; category: string; note?: string; source?: string }[]
  }

  if (!Array.isArray(records) || records.length === 0)
    return NextResponse.json({ error: "No records" }, { status: 400 })

  try {
    const created = await prisma.teacherRecord.createMany({
      data: records.map(r => ({
        teacherId:   session.user.id,
        classId:     r.classId,
        classLabel:  r.classLabel,
        studentName: r.studentName,
        category:    r.category,
        note:        r.note ?? null,
        source:      r.source ?? "הכתבה קולית",
      })),
    })
    return NextResponse.json({ saved: created.count })
  } catch (e: any) {
    console.error("[records POST]", e)
    return NextResponse.json({ error: e.message ?? "DB error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  const record = await prisma.teacherRecord.findUnique({ where: { id } })
  if (!record || record.teacherId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.teacherRecord.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, studentName, category, note } = await req.json()
  const record = await prisma.teacherRecord.findUnique({ where: { id } })
  if (!record || record.teacherId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.teacherRecord.update({
    where: { id },
    data: { studentName, category, note },
  })
  return NextResponse.json(updated)
}
