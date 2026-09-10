import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { parseICS } from "@/lib/ics"

// POST — sync events from a public/secret Google Calendar iCal (.ics) feed
// into CalendarEvent. Each synced row is tagged via `note = "gcal:<uid>"` so
// re-syncing updates the same rows instead of duplicating them, without
// needing a schema change for a dedicated source/uid column.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { url } = await req.json().catch(() => ({ url: null }))
  if (!url || typeof url !== "string") return NextResponse.json({ error: "חסר קישור" }, { status: 400 })

  let icsText: string
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    icsText = await res.text()
  } catch (e: any) {
    return NextResponse.json({ error: `לא הצלחתי להוריד את היומן: ${e.message}` }, { status: 502 })
  }

  if (!icsText.trim().toUpperCase().startsWith("BEGIN:VCALENDAR")) {
    return NextResponse.json({
      error: "זה לא נראה כמו קובץ ICS תקין. ב-Google Calendar: הגדרות היומן → \"שילוב היומן\" → העתק את \"הכתובת הציבורית בפורמט iCal\" (מסתיימת ב-.ics), לא את קישור השיתוף הרגיל.",
    }, { status: 400 })
  }

  const events = parseICS(icsText)
  if (events.length === 0) return NextResponse.json({ ok: true, created: 0, updated: 0, total: 0 })

  let created = 0, updated = 0
  for (const ev of events) {
    const y = Number(ev.dateStr.slice(0, 4)), m = Number(ev.dateStr.slice(4, 6)), d = Number(ev.dateStr.slice(6, 8))
    if (!y || !m || !d) continue
    const date = new Date(Date.UTC(y, m - 1, d))
    const marker = `gcal:${ev.uid}`

    const existing = await prisma.calendarEvent.findFirst({ where: { note: marker } })
    if (existing) {
      await prisma.calendarEvent.update({ where: { id: existing.id }, data: { date, description: ev.summary } })
      updated++
    } else {
      await prisma.calendarEvent.create({ data: { date, description: ev.summary, note: marker, forAll: true } })
      created++
    }
  }

  return NextResponse.json({ ok: true, created, updated, total: events.length })
}
