import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

function isTeacher(session: any) {
  return session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"
}

// GET — study-material links for the civics page, newest first.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const materials = await prisma.studyMaterial.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json({ materials })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, url } = await req.json()
  if (!title?.trim() || !url?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const material = await prisma.studyMaterial.create({
    data: { title: title.trim(), url: url.trim(), createdById: session.user.id },
  })
  return NextResponse.json({ material })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  await prisma.studyMaterial.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
