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
//
// Attendance/grades/schedule all 404 as flat top-level paths — Mashov scopes
// them per student or class, same as fetch.py's old comment warned
// ("Attendance and grades are per-class — discover classId from /classes
// first."). So alongside the flat probe, this also returns a small sample
// of the working list endpoints (teachers/classes/students/groups) and the
// login response body, so the real id field names can be read directly
// instead of guessed blind.
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
  const samples: Record<string, unknown> = {}
  for (const path of CANDIDATES) {
    const { status, data } = await mashovGet(login.session, path)
    results.push({
      path,
      status,
      ok: status === 200,
      itemCount: Array.isArray(data) ? data.length : null,
    })
    if (status === 200 && Array.isArray(data) && data.length > 0) {
      samples[path] = data.slice(0, 2)
    }
  }

  return NextResponse.json({ ok: true, results, samples, loginBody: login.session.loginBody })
}
