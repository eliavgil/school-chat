import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// One-time sync: set each class's homeroom-teacher name from the roster the
// teacher gave directly, since Class.teacherDisplayName feeds the staff-task
// assignee picker (see /api/tasks/staff) and it's currently stale/wrong for
// some classes. Matched by displayName ("י1".."י7"); any class not found is
// reported instead of silently skipped, since it likely needs to be created
// first via the existing "create-class" admin action.
const ROSTER: Record<string, string> = {
  "י1": "ליטל נגר שפיצר",
  "י2": "מעיין גבע",
  "י3": "איילת פסח",
  "י4": "אליאב גיל",
  "י5": "עדית פרוכטר",
  "י6": "מוטי אברבוך",
  "י7": "אירנה רחמן",
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const classes = await prisma.class.findMany({ select: { id: true, name: true, displayName: true, teacherDisplayName: true } })
  const byDisplayName = new Map(classes.map(c => [c.displayName || c.name, c]))

  const updated: { classDisplayName: string; teacherDisplayName: string }[] = []
  const notFound: string[] = []

  for (const [classDisplayName, teacherDisplayName] of Object.entries(ROSTER)) {
    const cls = byDisplayName.get(classDisplayName)
    if (!cls) { notFound.push(classDisplayName); continue }
    if (cls.teacherDisplayName !== teacherDisplayName) {
      await prisma.class.update({ where: { id: cls.id }, data: { teacherDisplayName } })
    }
    updated.push({ classDisplayName, teacherDisplayName })
  }

  return NextResponse.json({ ok: true, updated, notFound })
}
