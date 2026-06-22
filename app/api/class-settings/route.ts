import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

async function requireTeacher() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) return null
  return session
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { classId: true } })
  if (!user?.classId) return NextResponse.json({ error: "No class" }, { status: 404 })
  const cls = await prisma.class.findUnique({ where: { id: user.classId } })
  return NextResponse.json({ settings: cls })
}

export async function PATCH(req: NextRequest) {
  if (!await requireTeacher()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const session = await getServerSession(authOptions)
  const user = await prisma.user.findUnique({ where: { id: session!.user.id }, select: { classId: true } })
  if (!user?.classId) return NextResponse.json({ error: "No class" }, { status: 404 })

  const { displayName, teacherDisplayName, schoolName } = await req.json()
  const updated = await prisma.class.update({
    where: { id: user.classId },
    data: {
      ...(displayName !== undefined && { displayName }),
      ...(teacherDisplayName !== undefined && { teacherDisplayName }),
      ...(schoolName !== undefined && { schoolName }),
    },
  })
  return NextResponse.json({ settings: updated })
}
