"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface CalendarEvent {
  id: string
  date: string
  description: string
  type: string | null
  note: string | null
  forTeacher: boolean
  forStudents: boolean
  forParents: boolean
}

const MONTH_NAMES_HE = [
  "ינואר","פברואר","מרץ","אפריל","מאי","יוני",
  "יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"
]

function groupByMonth(events: CalendarEvent[]) {
  const map: Record<string, CalendarEvent[]> = {}
  for (const ev of events) {
    const d = new Date(ev.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!map[key]) map[key] = []
    map[key].push(ev)
  }
  return map
}

function typeLabel(type: string | null) {
  if (!type) return null
  const map: Record<string, { label: string; color: string }> = {
    exam:     { label: "מבחן",   color: "bg-red-500/20 text-red-300" },
    trip:     { label: "טיול",   color: "bg-green-500/20 text-green-300" },
    event:    { label: "אירוע",  color: "bg-blue-500/20 text-blue-300" },
    meeting:  { label: "ישיבה",  color: "bg-purple-500/20 text-purple-300" },
    holiday:  { label: "חופשה", color: "bg-amber-500/20 text-amber-300" },
  }
  return map[type] ?? { label: type, color: "bg-white/10 text-white/50" }
}

function audienceIcons(ev: CalendarEvent) {
  const icons = []
  if (ev.forTeacher)  icons.push("👩‍🏫")
  if (ev.forStudents) icons.push("🧑‍🎓")
  if (ev.forParents)  icons.push("👨‍👩‍👧")
  return icons
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/events")
      .then(r => r.json())
      .then(d => setEvents(d.events ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past     = events.filter(e => e.date < today).sort((a, b) => b.date.localeCompare(a.date))

  const grouped = groupByMonth(upcoming)

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-2xl interactive leading-none">←</Link>
        <div>
          <h1 className="font-semibold text-lg text-white">לוח שנה</h1>
          <p className="text-white/40 text-xs">אירועים, מבחנים וחופשות — {upcoming.length} קרובים</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && upcoming.length === 0 && (
          <div className="glass rounded-2xl px-4 py-12 text-center">
            <p className="text-white/30 text-sm">אין אירועים קרובים</p>
            <p className="text-white/20 text-xs mt-1">ניתן להוסיף אירועים מעמוד ניהול המערכת</p>
          </div>
        )}

        {Object.entries(grouped).map(([key, evs]) => {
          const [year, month] = key.split("-").map(Number)
          return (
            <section key={key}>
              <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-3 px-1">
                {MONTH_NAMES_HE[month]} {year}
              </p>
              <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
                {evs.map(ev => {
                  const d = new Date(ev.date)
                  const isToday = ev.date.slice(0,10) === today
                  const tag = typeLabel(ev.type)
                  const icons = audienceIcons(ev)
                  return (
                    <div key={ev.id} className={`flex items-start gap-4 px-4 py-3 ${isToday ? "bg-white/10" : ""}`}>
                      {/* Date block */}
                      <div className="flex-shrink-0 w-10 text-center">
                        <div className={`text-xl font-light nums leading-none ${isToday ? "text-white" : "text-white/60"}`}>
                          {d.getDate()}
                        </div>
                        <div className="text-white/30 text-[10px] mt-0.5">
                          {d.toLocaleDateString("he-IL", { weekday: "short" })}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 py-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm leading-snug ${isToday ? "text-white font-medium" : "text-white/80"}`}>
                            {ev.description}
                          </p>
                          {isToday && <span className="text-[10px] glass rounded-full px-2 py-0.5 text-white/70">היום</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {tag && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tag.color}`}>
                              {tag.label}
                            </span>
                          )}
                          {icons.length > 0 && (
                            <span className="text-[11px]">{icons.join(" ")}</span>
                          )}
                          {ev.note && (
                            <span className="text-white/30 text-[10px] truncate">{ev.note}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}

        {/* Past events toggle */}
        {past.length > 0 && (
          <details className="group">
            <summary className="text-white/25 text-xs cursor-pointer hover:text-white/50 transition-colors px-1 list-none flex items-center gap-2">
              <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
              אירועים שעברו ({past.length})
            </summary>
            <div className="mt-3 glass rounded-2xl overflow-hidden divide-y divide-white/5">
              {past.map(ev => {
                const d = new Date(ev.date)
                return (
                  <div key={ev.id} className="flex items-center gap-4 px-4 py-2.5 opacity-40">
                    <div className="flex-shrink-0 w-10 text-center">
                      <div className="text-base font-light nums text-white/60">{d.getDate()}</div>
                      <div className="text-white/30 text-[10px]">{d.toLocaleDateString("he-IL", { month: "short" })}</div>
                    </div>
                    <p className="text-white/70 text-sm">{ev.description}</p>
                  </div>
                )
              })}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
