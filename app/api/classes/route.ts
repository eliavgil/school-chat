import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// GET — the class list for pickers where role hasn't been decided yet (e.g.
// the "I'm a teacher, which class?" step on /pending) — any signed-in user,
// not just approved teachers, since a pending user has neither role yet.
// Just names, nothing sensitive.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const classes = await prisma.class.findMany({
    select: { id: true, name: true, displayName: true },
    orderBy: { name: "asc" },
  })
  return NextResponse.json({ classes: classes.map(c => ({ id: c.id, name: c.displayName || c.name })) })
}
