import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// GET — per class, which students have (and haven't) linked their account
// yet. A student who answers a live-lesson question from an unlinked
// account still gets recorded, but under a less reliable name and outside
// the class-average view — this is the pre-flight check for that.
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const classes = await prisma.class.findMany({
    include: {
      students: {
        select: { id: true, name: true, userAccount: { select: { id: true, email: true } } },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  })

  const result = classes
    .map(c => {
      const students = c.students.map(s => ({ id: s.id, name: s.name, linked: !!s.userAccount, email: s.userAccount?.email ?? null }))
      return {
        classId: c.id,
        className: c.displayName || c.name,
        total: students.length,
        linkedCount: students.filter(s => s.linked).length,
        students,
      }
    })
    .filter(c => c.total > 0)

  return NextResponse.json({ classes: result })
}
