import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"

// One-time cleanup route — deletes a single lesson (by exact title match)
// along with any live_sessions / responses tied to it (required first —
// foreign keys block deleting the lesson otherwise). Pass ?title=...
// Remove this file after running it.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const title = new URL(request.url).searchParams.get("title")
  if (!title) return NextResponse.json({ error: "Missing ?title=" }, { status: 400 })

  const sb = adminClient()

  const { data: lessons, error: selectError } = await sb
    .from("lessons")
    .select("id, title, slug")
    .eq("title", title)

  if (selectError) return NextResponse.json({ error: selectError.message }, { status: 500 })

  if (!lessons || lessons.length === 0) {
    return NextResponse.json({ message: "Nothing to delete — no matching lesson found", deleted: [] })
  }

  const lessonIds = lessons.map(l => l.id)

  const { data: sessions, error: sessionsSelectError } = await sb
    .from("live_sessions")
    .select("id")
    .in("lesson_id", lessonIds)

  if (sessionsSelectError) return NextResponse.json({ error: sessionsSelectError.message }, { status: 500 })

  const sessionIds = (sessions ?? []).map(s => s.id)

  const { error: responsesError } = await sb
    .from("responses")
    .delete()
    .in("lesson_id", lessonIds)
  if (responsesError) return NextResponse.json({ error: responsesError.message }, { status: 500 })

  const { error: sessionsError } = await sb
    .from("live_sessions")
    .delete()
    .in("lesson_id", lessonIds)
  if (sessionsError) return NextResponse.json({ error: sessionsError.message }, { status: 500 })

  const { error: deleteError } = await sb
    .from("lessons")
    .delete()
    .eq("title", title)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  return NextResponse.json({
    message: "Deleted",
    deleted: lessons.map(l => ({ id: l.id, title: l.title, slug: l.slug })),
    sessionsDeleted: sessionIds.length,
  })
}
