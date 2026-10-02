import { NextRequest, NextResponse } from "next/server"
import { runTaskReminders } from "@/lib/task-reminders"

// GET — runs on a schedule (see .github/workflows/task-reminders.yml —
// GitHub throttles scheduled runs on a low-traffic repo well below the
// nominal 15-minute interval, so /api/home also piggybacks this same
// logic opportunistically on real page loads to cover the gap). Guarded by
// CRON_SECRET so this can't be triggered by an outside request; until that
// env var is set, every request fails the check and nothing fires (safe
// default, not an error).
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { sent } = await runTaskReminders()
  return NextResponse.json({ ok: true, sent })
}
