import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

function isTeacherRole(role: string) {
  return role === "TEACHER" || role === "ADMIN"
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const escalations = await prisma.schoolAssistantEscalation.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json({ escalations })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, resolved } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const escalation = await prisma.schoolAssistantEscalation.update({ where: { id }, data: { resolved: !!resolved } })
  return NextResponse.json({ escalation })
}
