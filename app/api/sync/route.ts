import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { listSheets } from "@/lib/sheets/client"
import {
  syncEvents,
  syncExams,
  syncStudents,
  syncSubjectTeachers,
  syncAccommodations,
} from "@/lib/sheets/syncHandlers"

type SyncTarget = "events" | "exams" | "students" | "teachers" | "accommodations" | "all"

const HANDLERS: Record<Exclude<SyncTarget, "all">, () => Promise<number>> = {
  events:         syncEvents,
  exams:          syncExams,
  students:       () => syncStudents("class-y"),
  teachers:       syncSubjectTeachers,
  accommodations: syncAccommodations,
}

// GET — list available sheets in the spreadsheet
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== "TEACHER" && role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const sheets = await listSheets()
    return NextResponse.json({ sheets })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST — run sync for one or all targets
// Body: { target: "all" | "events" | "exams" | "students" | "teachers" | "accommodations" }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== "TEACHER" && role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { target = "all" } = await req.json().catch(() => ({}))

  const results: Record<string, number | string> = {}
  const targets: Exclude<SyncTarget, "all">[] =
    target === "all" ? Object.keys(HANDLERS) as any : [target]

  for (const t of targets) {
    const fn = HANDLERS[t]
    if (!fn) { results[t] = "unknown target"; continue }
    try {
      results[t] = await fn()
    } catch (e: any) {
      results[t] = `error: ${e.message}`
    }
  }

  return NextResponse.json({ ok: true, results, syncedAt: new Date().toISOString() })
}
