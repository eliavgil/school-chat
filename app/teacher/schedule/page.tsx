"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Slot {
  id: string
  dayHeb: string
  period: string
  content: string
}

interface ParsedSlot {
  id: string
  num: string
  timeStr: string
  startMin: number
  endMin: number
  subject: string
  teacher: string
  room: string
}

const DAY_ORDER = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"]

function parseSlot(s: Slot): ParsedSlot {
  const periodMatch = s.period.match(/^(\d+),\s*(.+)/)
  const num = periodMatch ? periodMatch[1] : s.period
  const timeStr = periodMatch ? periodMatch[2].trim() : ""

  const parts = s.content.split(/\s{2,}/).map(p => p.trim()).filter(Boolean)
  const subject = parts[0] ?? ""
  const teacher = parts[1] ?? ""
  const room    = parts[2] ?? ""

  const m = timeStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/)
  const startMin = m ? Number(m[1]) * 60 + Number(m[2]) : 0
  const endMin   = m ? Number(m[3]) * 60 + Number(m[4]) : 0

  return { id: s.id, num, timeStr, startMin, endMin, subject, teacher, room }
}

function getTodayHeb() {
  return DAY_ORDER[new Date().getDay()] ?? null
}

function getNowMin() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function fmtMins(m: number) {
  return m < 60 ? `${m} דק'` : `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")} שע'`
}

export default function SchedulePage() {
  const [slots, setSlots]         = useState<Slot[]>([])
  const [loading, setLoading]     = useState(true)
  const [selectedDay, setSelectedDay] = useState<string>(() => getTodayHeb() ?? "ראשון")
  const [nowMin, setNowMin]       = useState(getNowMin)

  useEffect(() => {
    fetch("/api/schedule")
      .then(r => r.json())
      .then(d => setSlots(d.slots ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNowMin(getNowMin()), 30_000)
    return () => clearInterval(id)
  }, [])

  const byDay: Record<string, ParsedSlot[]> = {}
  for (const s of slots) {
    if (!byDay[s.dayHeb]) byDay[s.dayHeb] = []
    byDay[s.dayHeb].push(parseSlot(s))
  }
  for (const day of Object.keys(byDay)) {
    byDay[day].sort((a, b) => Number(a.num) - Number(b.num))
  }

  const activeDays   = DAY_ORDER.filter(d => byDay[d]?.length)
  const todayHeb     = getTodayHeb()
  const displaySlots = byDay[selectedDay] ?? []
  const isToday      = selectedDay === todayHeb

  let currentIdx = -1
  let nextIdx    = -1
  if (isToday) {
    for (let i = 0; i < displaySlots.length; i++) {
      const s = displaySlots[i]
      if (!s.startMin && !s.endMin) continue
      if (nowMin >= s.startMin && nowMin < s.endMin) { currentIdx = i; break }
      if (nowMin < s.startMin && nextIdx === -1) nextIdx = i
    }
  }

  const statusLabel = isToday
    ? currentIdx >= 0
      ? `עכשיו: ${displaySlots[currentIdx].subject}`
      : nextIdx >= 0
      ? `הבא: ${displaySlots[nextIdx].subject} · בעוד ${fmtMins(displaySlots[nextIdx].startMin - nowMin)}`
      : "יום הלימודים הסתיים"
    : "מערכת שבועית"

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-2xl interactive leading-none">←</Link>
        <div>
          <h1 className="font-semibold text-lg text-white">מערכת שעות</h1>
          <p className="text-white/40 text-xs">{statusLabel}</p>
        </div>
      </header>

      {/* Day tabs */}
      <div className="sticky top-[var(--header-h,64px)] z-10 bg-black/20 backdrop-blur-md border-b border-white/5 px-4 py-2 flex gap-2 overflow-x-auto">
        {activeDays.map(day => (
          <button key={day} onClick={() => setSelectedDay(day)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm transition-all interactive btn-press ${
              selectedDay === day ? "bg-white/20 text-white font-medium" : "text-white/45 hover:text-white/70 hover:bg-white/10"
            }`}>
            {day}
            {day === todayHeb && (
              <span className="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-white/60 align-middle mb-0.5" />
            )}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {loading && (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        )}

        {!loading && displaySlots.length === 0 && (
          <div className="glass rounded-2xl px-4 py-12 text-center">
            <p className="text-white/30 text-sm">אין שיעורים ביום {selectedDay}</p>
          </div>
        )}

        {!loading && displaySlots.length > 0 && (
          <div className="space-y-1.5">
            {displaySlots.map((s, i) => {
              const isCurrent = i === currentIdx
              const isNext    = i === nextIdx && currentIdx === -1
              const isPast    = isToday && s.endMin > 0 && nowMin >= s.endMin

              if (isCurrent) {
                const minsLeft = s.endMin - nowMin
                const progress = Math.round(((nowMin - s.startMin) / (s.endMin - s.startMin)) * 100)
                return (
                  <div key={s.id} className="bg-white/15 border border-white/30 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">▶ עכשיו</span>
                          <span className="text-white/45 text-xs">שיעור {s.num}</span>
                        </div>
                        <p className="text-white text-xl font-semibold leading-tight">{s.subject}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {s.teacher && <span className="text-white/50 text-xs">👩‍🏫 {s.teacher}</span>}
                          {s.room    && <span className="text-white/50 text-xs">🚪 {s.room}</span>}
                        </div>
                      </div>
                      <div className="text-left flex-shrink-0">
                        <div className="text-white text-lg font-light nums">עוד {fmtMins(minsLeft)}</div>
                        <div className="text-white/35 text-[11px] mt-0.5" dir="ltr">{s.timeStr}</div>
                      </div>
                    </div>
                    <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )
              }

              if (isNext) {
                const minsUntil = s.startMin - nowMin
                return (
                  <div key={s.id} className="bg-white/8 border border-white/15 rounded-2xl p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-white/15 text-white/65 text-[10px] font-medium px-2 py-0.5 rounded-full">הבא</span>
                          <span className="text-white/35 text-xs">שיעור {s.num}</span>
                        </div>
                        <p className="text-white/90 text-base font-medium">{s.subject}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {s.teacher && <span className="text-white/40 text-xs">👩‍🏫 {s.teacher}</span>}
                          {s.room    && <span className="text-white/40 text-xs">🚪 {s.room}</span>}
                        </div>
                      </div>
                      <div className="text-left flex-shrink-0">
                        <div className="text-white/65 text-base font-light nums">בעוד {fmtMins(minsUntil)}</div>
                        <div className="text-white/25 text-[11px] mt-0.5" dir="ltr">{s.timeStr}</div>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={s.id}
                  className={`glass rounded-2xl flex items-center gap-0 ${isPast ? "opacity-30" : ""} ${!s.subject ? "opacity-15" : ""}`}>
                  <div className="w-8 flex-shrink-0 flex items-center justify-center py-3 border-l border-white/5">
                    <span className="text-white/35 text-xs font-mono">{s.num}</span>
                  </div>
                  <div className="flex-1 px-3 py-2.5 min-w-0">
                    <p className={`text-sm font-medium ${isPast ? "text-white/30" : "text-white/80"}`}>{s.subject || "—"}</p>
                    {(s.teacher || s.room) && (
                      <div className="flex items-center gap-3 mt-0.5">
                        {s.teacher && <span className="text-white/25 text-[11px]">👩‍🏫 {s.teacher}</span>}
                        {s.room    && <span className="text-white/25 text-[11px]">🚪 {s.room}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && displaySlots.length > 0 && (
          <p className="text-white/15 text-[10px] text-center mt-5">
            לעריכת המערכת — עבור להגדרות ← מערכת שעות
          </p>
        )}
      </div>
    </div>
  )
}
