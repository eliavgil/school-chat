import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"

// Temporary export endpoint — fetches lesson 5 (הכרזת העצמאות) from DB
// so it can be used to build the seed file. Delete once seed file is created.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = adminClient()
  const { data, error } = await sb
    .from("lessons")
    .select("id, title, subject, slug, slides, created_at")
    .or("title.ilike.%הכרזת%,title.ilike.%שיעור 5%")
    .order("created_at")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
