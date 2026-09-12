import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

function isTeacher(session: any) {
  return session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"
}

// GET — the team announcements feed, newest first.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const posts = await prisma.teamPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  })
  return NextResponse.json({
    posts: posts.map(p => ({ id: p.id, content: p.content, createdAt: p.createdAt, authorId: p.authorId, authorName: p.author.name })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: "Missing content" }, { status: 400 })

  const post = await prisma.teamPost.create({
    data: { content: content.trim(), authorId: session.user.id },
    include: { author: { select: { name: true } } },
  })
  return NextResponse.json({ post: { id: post.id, content: post.content, createdAt: post.createdAt, authorId: post.authorId, authorName: post.author.name } })
}

// DELETE — an admin can remove any post; a teacher can only remove their own.
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const existing = await prisma.teamPost.findUnique({ where: { id }, select: { authorId: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const role = (session.user as any).role
  if (existing.authorId !== session.user.id && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.teamPost.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
