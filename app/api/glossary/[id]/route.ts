import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// PATCH — edit a glossary term's editable fields. Teacher/admin only.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.term !== undefined) data.term = body.term
  if (body.shortDefinition !== undefined) data.shortDefinition = body.shortDefinition
  if (body.extendedArticle !== undefined) data.extendedArticle = body.extendedArticle
  if (body.practiceSlideId !== undefined) data.practiceSlideId = body.practiceSlideId || null

  const term = await prisma.glossaryTerm.update({ where: { id }, data })
  return NextResponse.json({ term })
}
