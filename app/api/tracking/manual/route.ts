import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

function isTeacher(session: any) {
  return session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"
}

// POST — manually mark a lesson done for a class in the tracking matrix,
// for when it was actually taught but never produced a live-session row
// (e.g. the slide deck wasn't finished, or the live-session flow wasn't
// used at all that day).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { lessonId, classId } = await req.json()
  if (!lessonId || !classId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  await prisma.lessonManualDone.upsert({
    where: { lessonId_classId: { lessonId, classId } },
    create: { lessonId, classId, markedById: session.user.id },
    update: {},
  })
  return NextResponse.json({ ok: true })
}

// DELETE — undo a manual mark (misclick recovery). No-op if the lesson is
// only "done" via a real session — that's not stored here, so there's
// nothing to remove.
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { lessonId, classId } = await req.json()
  if (!lessonId || !classId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  await prisma.lessonManualDone.deleteMany({ where: { lessonId, classId } })
  return NextResponse.json({ ok: true })
}
