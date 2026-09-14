import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"

// One-time reset: wipe all recorded live-session results before the first
// "official" lesson that'll actually count toward a grade, so the results
// page starts clean instead of full of test runs and sessions that never
// captured real answers. Only touches session/response history —
// live_sessions, responses, session_participants, student_activity — never
// the lesson content itself (the "lessons" table, i.e. the actual slide
// decks) or the class roster.
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sb = adminClient()
  const results: { table: string; ok: boolean; error?: string }[] = []

  // Deleted in dependency order — student_activity has no ON DELETE CASCADE
  // back to live_sessions, so it has to go first or its rows would block
  // (or just orphan) the live_sessions delete. session_participants has no
  // "id" column (its primary key is session_id+student_id), so it needs its
  // own match-everything filter.
  const tables: { table: string; matchColumn: string }[] = [
    { table: "student_activity", matchColumn: "id" },
    { table: "responses", matchColumn: "id" },
    { table: "session_participants", matchColumn: "session_id" },
    { table: "live_sessions", matchColumn: "id" },
  ]
  for (const { table, matchColumn } of tables) {
    const { error } = await sb.from(table).delete().not(matchColumn, "is", null)
    results.push({ table, ok: !error, error: error?.message })
  }

  return NextResponse.json({ ok: results.every(r => r.ok), results })
}
