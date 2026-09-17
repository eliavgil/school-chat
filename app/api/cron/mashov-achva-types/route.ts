import { NextRequest, NextResponse } from "next/server"
import { mashovLogin, mashovGet } from "@/lib/mashov/client"

// GET — one-time diagnostic, not part of any recurring flow. Lists every
// distinct achva {code, name} seen across the grade's behave logs, so the
// real codes for "הערה חיובית" / "הפרת משמעת" (beyond the already-known
// code 1 = "חיסור") can be read directly instead of guessed. Guarded by
// CRON_SECRET, same as the other cron routes.
const CLASSES: { code: string; num: number }[] = [1, 2, 3, 4, 5, 6, 7].map(num => ({ code: "י", num }))

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const login = await mashovLogin()
  if (!login.ok) return NextResponse.json({ error: login.error, debug: login.debug }, { status: 502 })

  const types = new Map<number, { code: number; name: string; achvaType: number | null; count: number }>()

  for (const { code, num } of CLASSES) {
    const { status, data } = await mashovGet(login.session, `classes/${code}/${num}/behave`)
    if (status !== 200 || !Array.isArray(data)) continue
    for (const item of data as any[]) {
      const a = item?.achva
      if (!a || typeof a.code !== "number") continue
      const existing = types.get(a.code)
      if (existing) existing.count++
      else types.set(a.code, { code: a.code, name: a.name ?? "", achvaType: a.achvaType ?? null, count: 1 })
    }
  }

  return NextResponse.json({ ok: true, types: Array.from(types.values()).sort((x, y) => x.code - y.code) })
}
