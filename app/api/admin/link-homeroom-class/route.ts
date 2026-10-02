import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// One-time self-service fix, same pattern as sync-teacher-roster /
// fix-schedule-classid: the coordinator (ADMIN role) is also, in real life,
// י4's actual homeroom teacher — but the User.role enum only ever holds one
// value, so their account was never linked to a classId the way a regular
// TEACHER account is. Several lookups that mean "the real homeroom teacher
// of this class" (e.g. the derived-schedule bootstrap in /api/home) filter
// by classId + role:"TEACHER" and so never find them. Visit this URL once,
// logged in as the account that should be linked, to set its own classId.
const CLASS_ID = "class-y" // י4 — see ROSTER in sync-teacher-roster

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || (role !== "ADMIN" && role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const before = await prisma.user.findUnique({ where: { id: session.user.id }, select: { classId: true, name: true } })
  if (before?.classId === CLASS_ID) {
    return NextResponse.json({ ok: true, alreadyLinked: true, classId: CLASS_ID, name: before.name })
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { classId: CLASS_ID },
    select: { classId: true, name: true },
  })
  return NextResponse.json({ ok: true, alreadyLinked: false, previousClassId: before?.classId ?? null, ...updated })
}
