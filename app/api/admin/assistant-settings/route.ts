import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// GET/PATCH — the teacher's behavioral instructions for the assistant bot
// (tone, fallback behavior, hard boundaries) — kept separate from the
// SchoolKnowledgeDoc facts. Single row, fixed id.
const SETTINGS_ID = "default"

function isTeacherRole(role: string) {
  return role === "TEACHER" || role === "ADMIN"
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const settings = await prisma.schoolAssistantSettings.findUnique({ where: { id: SETTINGS_ID } })
  return NextResponse.json({ instructions: settings?.instructions ?? "" })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { instructions } = await req.json()
  const settings = await prisma.schoolAssistantSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, instructions: instructions ?? "" },
    update: { instructions: instructions ?? "" },
  })
  return NextResponse.json({ instructions: settings.instructions })
}
