"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Slot {
  id: string
  dayHeb: string
  period: string  // e.g. "1, 08:45 - 09:30"
  content: string // e.g. "מתמטיקה  מר לוי  חדר 12"
}

interface ParsedSlot {
  id: string
  num: string
  time: string
  subject: string
  teacher: string
  room: string
  raw: string
}

const DAY_ORDER = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"]

function parseSlot(s: Slot): ParsedSlot {
  const periodMatch = s.period.match(/^(\d+),\s*(.+)/)
  const num  = periodMatch ? periodMatch[1] : s.period
  const time = periodMatch ? periodMatch[2].trim() : ""

  // content format: "subject  teacher  room" (2+ spaces as separator)
  const parts = s.content.split(/\s{2,}/).map(p => p.trim()).filter(Boolean)
  const subject = parts[0] ?? ""
  const teacher = parts[1] ?? ""
  const room    = parts[2] ?? ""

  return { id: s.id, num, time, subject, teacher, room, raw: s.content }
}

function getTodayHeb() {
  const day = new Date().getDay()
  // 0=Sun=ראשון, 1=Mon=שני, ...5=Fri=שישי, 6=Sat
  return DAY_ORDER[day] ?? null
}

export default function SchedulePage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string>(() => getTodayHeb() ?? "ראשון")

  useEffect(() => {
    fetch("/api/schedule")
      .then(r => r.json())
      .then(d => setSlots(d.slots ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Group by day
  const byDay: Record<string, ParsedSlot[]> = {}
  for (const s of slots) {
    if (!byDay[s.dayHeb]) byDay[s.dayHeb] = []
    byDay[s.dayHeb].push(parseSlot(s))
  }
  for (const day of Object.keys(byDay)) {
    byDay[day].sort((a, b) => Number(a.num) - Number(b.num))
  }

  const activeDays = DAY_ORDER.filter(d => byDay[d]?.length)
  const todayHeb = getTodayHeb()
  const displaySlots = byDay[selectedDay] ?? []

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-2xl interactive leading-none">←</Link>
        <div>
          <h1 className="font-semibold text-lg text-white">מערכת שעות</h1>
          <p className="text-white/40 text-xs">מערכת שבועית מפורטת</p>
        </div>
      </header>

      {/* Day tabs */}
      <div className="sticky top-[var(--header-h,64px)] z-10 bg-black/20 backdrop-blur-md border-b border-white/5 px-4 py-2 flex gap-2 overflow-x-auto">
        {activeDays.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm transition-all interactive btn-press ${
              selectedDay === day
                ? "bg-white/20 text-white font-medium"
                : "text-white/45 hover:text-white/70 hover:bg-white/10"
            }`}
          >
            {day}
            {day === todayHeb && (
              <span className="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-white/60 align-middle mb-0.5" />
            )}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {loading && (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && displaySlots.length === 0 && (
          <div className="glass rounded-2xl px-4 py-12 text-center">
            <p className="text-white/30 text-sm">אין שיעורים ביום {selectedDay}</p>
          </div>
        )}

        {!loading && displaySlots.length > 0 && (
          <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
            {displaySlots.map((s, i) => {
              const isEmpty = !s.subject
              return (
                <div key={s.id} className={`flex items-stretch gap-0 ${isEmpty ? "opacity-30" : ""}`}>
                  {/* Period number */}
                  <div className="w-10 flex-shrink-0 flex flex-col items-center justify-center bg-white/5 py-3 border-l border-white/5">
                    <span className="text-white/50 text-xs font-mono font-semibold">{s.num}</span>
                  </div>

                  {/* Time */}
                  <div className="w-24 flex-shrink-0 flex items-center px-3 py-3 border-l border-white/5">
                    <span className="text-white/35 text-[10px] font-mono leading-tight" dir="ltr">{s.time}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 px-3 py-2.5 min-w-0">
                    <p className="text-white/90 text-sm font-medium leading-tight">{s.subject || "—"}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {s.teacher && (
                        <span className="flex items-center gap-1 text-white/40 text-[11px]">
                          <span className="text-[10px]">👩‍🏫</span>
                          {s.teacher}
                        </span>
                      )}
                      {s.room && (
                        <span className="flex items-center gap-1 text-white/40 text-[11px]">
                          <span className="text-[10px]">🚪</span>
                          {s.room}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        {!loading && displaySlots.length > 0 && (
          <p className="text-white/20 text-[10px] text-center mt-4">
            לעריכת המערכת — עבור להגדרות ← מערכת שעות
          </p>
        )}
      </div>
    </div>
  )
}
