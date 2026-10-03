import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// One-time self-service fix, same pattern as sync-teacher-roster /
// fix-schedule-classid: the coordinator (ADMIN role) is also, in real life,
// י4's actual homeroom teacher — but the User.role enum only ever holds one
// value, so their account was never linked the way a regular TEACHER account
// is. Two separate consequences, both fixed here:
//
// 1. classId — several lookups that mean "the real homeroom teacher of this
//    class" (e.g. the derived-schedule bootstrap in /api/home) filter by
//    classId + role:"TEACHER"/"ADMIN" and so never find this account without
//    its own classId set to class-y.
//
// 2. name — every team-task assignee and the ROSTER in sync-teacher-roster
//    uses the Hebrew display name "אליאב גיל" (matching every other
//    teacher's Hebrew name in the system), but this account's own User.name
//    was set from its Google sign-in profile: "Eliav Gil" in Latin. Staff-
//    task reminder matching (lib/teacher-name-match.ts) compares teacherLabel
//    against User.name case/whitespace-insensitively, but "אליאב גיל" and
//    "Eliav Gil" aren't the same string in any script — every team task
//    assigned to "אליאב גיל" (confirmed via the cron's diagnostic output:
//    4 such assignees, all permanently unmatched) could never link to this
//    account, so its reminder could never fire. Visit this URL once, logged
//    in as the account that should be fixed, to correct both.
const CLASS_ID = "class-y" // י4 — see ROSTER in sync-teacher-roster
const CANONICAL_NAME = "אליאב גיל" // matches ROSTER["י4"] in sync-teacher-roster

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || (role !== "ADMIN" && role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const before = await prisma.user.findUnique({ where: { id: session.user.id }, select: { classId: true, name: true } })
  const needsClassId = before?.classId !== CLASS_ID
  const needsName = before?.name !== CANONICAL_NAME

  if (!needsClassId && !needsName) {
    return NextResponse.json({ ok: true, alreadyLinked: true, classId: CLASS_ID, name: before?.name })
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(needsClassId && { classId: CLASS_ID }),
      ...(needsName && { name: CANONICAL_NAME }),
    },
    select: { classId: true, name: true },
  })

  // A name change here doesn't retroactively relink existing unmatched
  // staff-task assignees on its own — they get re-checked (and linked) the
  // next time the reminder cron or an /api/home page load runs its
  // self-heal pass, which happens automatically; no need to do it inline
  // here too.
  return NextResponse.json({
    ok: true, alreadyLinked: false,
    previousClassId: before?.classId ?? null, previousName: before?.name ?? null,
    ...updated,
  })
}
