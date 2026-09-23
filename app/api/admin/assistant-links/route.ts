import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// CRUD for named links the assistant bot can hand out in its answers —
// e.g. a permission-slip form — each with a description of when it's
// relevant. See buildSystemPrompt in /api/assistant/chat for how these
// get woven into the bot's prompt.

function isTeacherRole(role: string) {
  return role === "TEACHER" || role === "ADMIN"
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const links = await prisma.schoolAssistantLink.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json({ links })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { label, url, whenToUse } = await req.json()
  if (!label?.trim() || !url?.trim()) return NextResponse.json({ error: "חייב שם וקישור" }, { status: 400 })
  if (!/^https?:\/\//i.test(url.trim())) return NextResponse.json({ error: "הקישור חייב להתחיל ב-http(s)://" }, { status: 400 })

  const link = await prisma.schoolAssistantLink.create({
    data: { label: label.trim(), url: url.trim(), whenToUse: whenToUse?.trim() || "", createdById: session.user.id },
  })
  return NextResponse.json({ link })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, label, url, whenToUse } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const link = await prisma.schoolAssistantLink.update({
    where: { id },
    data: {
      ...(label !== undefined && { label: label.trim() }),
      ...(url !== undefined && { url: url.trim() }),
      ...(whenToUse !== undefined && { whenToUse: whenToUse.trim() }),
    },
  })
  return NextResponse.json({ link })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  await prisma.schoolAssistantLink.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
