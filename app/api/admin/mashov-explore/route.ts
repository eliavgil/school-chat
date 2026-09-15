import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { mashovLogin, mashovGet } from "@/lib/mashov/client"

// GET — logs into Mashov with the MASHOV_* env vars and probes a list of
// likely endpoint names, same idea as scripts/mashov/explore.py but running
// server-side so it can be triggered from the browser instead of needing a
// local Python setup. One-time diagnostic: run this once per school to find
// out which endpoints actually respond, then build real syncing against
// just those.
const CANDIDATES = [
  "teachers", "classes", "students", "groups",
  "attendance", "absences", "lesson/attendance",
  "grades", "marks", "gradeBook",
  "schedule", "lessons", "timetable",
  "events", "behaviors", "achievements",
  "subjects", "rooms", "parents", "contacts",
]

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const login = await mashovLogin()
  if (!login.ok) return NextResponse.json({ error: login.error, debug: login.debug }, { status: 502 })

  const results: { path: string; status: number; ok: boolean; itemCount: number | null }[] = []
  for (const path of CANDIDATES) {
    const { status, data } = await mashovGet(login.session, path)
    results.push({
      path,
      status,
      ok: status === 200,
      itemCount: Array.isArray(data) ? data.length : null,
    })
  }

  return NextResponse.json({ ok: true, results })
}
