import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import { prisma } from "@/lib/db/prisma"

// GET — classes for the "start lesson" picker. This list lives in the Supabase
// lessons project, separate from the real class roster (Prisma). Before
// returning it, sync in any roster class that doesn't have a row here yet, so
// a class created via /manage always shows up here too without manual steps.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = adminClient()

  const [{ data: existing }, rosterClasses] = await Promise.all([
    sb.from("classes").select("id, name"),
    prisma.class.findMany({ select: { name: true, displayName: true } }),
  ])

  const existingNames = new Set((existing ?? []).map((c) => c.name))
  const missing = rosterClasses
    .map((c) => c.displayName || c.name)
    .filter((name) => name && !existingNames.has(name))

  if (missing.length > 0) {
    await sb.from("classes").insert(missing.map((name) => ({ name })))
  }

  const { data, error } = await sb.from("classes").select("id, name").order("name")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
