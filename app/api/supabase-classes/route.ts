import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

// GET — classes for the "start lesson" picker. Reads the real class roster
// (Prisma) directly, so it always matches what's in /manage with no separate
// copy that can fall out of sync. The ids returned here are Prisma class ids;
// /api/sessions resolves (and creates, if needed) the matching row in the
// Supabase lessons project's own "classes" table when a session is started.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const classes = await prisma.class.findMany({
    select: { id: true, name: true, displayName: true },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(classes.map((c) => ({ id: c.id, name: c.displayName || c.name })))
}
