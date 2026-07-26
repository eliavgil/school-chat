import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"

// One-time cleanup route — deletes the pre-redesign lessons that were
// replaced by the new civics-lesson-1 (formerly -6) and civics-lesson-2.
// Remove this file after running it once.
const SLUGS_TO_DELETE = [
  "civics-state-components-1",
  "civics-nation-state-law-3",
  "civics-jewish-legislation-4",
  "civics-declaration-of-independence-5",
  "civics-event-question-guide",
]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = adminClient()

  const { data: existing, error: selectError } = await sb
    .from("lessons")
    .select("id, title, slug")
    .in("slug", SLUGS_TO_DELETE)

  if (selectError) return NextResponse.json({ error: selectError.message }, { status: 500 })

  if (!existing || existing.length === 0) {
    return NextResponse.json({ message: "Nothing to delete — no matching lessons found", deleted: [] })
  }

  const { error: deleteError } = await sb
    .from("lessons")
    .delete()
    .in("slug", SLUGS_TO_DELETE)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  return NextResponse.json({
    message: "Deleted",
    deleted: existing.map(l => ({ id: l.id, title: l.title, slug: l.slug })),
  })
}
