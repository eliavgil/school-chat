"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"

interface RecentGroup {
  studentName: string
  classCode: string
  classNum: number
  date: string
  lessonsMissed: number
  subjects: string[]
  lessonNums: number[]
  anyUnjustified: boolean
}
interface SummaryRow {
  studentName: string
  classCode: string
  classNum: number
  lessonsMissed: number
  subjects: string[]
  anyUnjustified: boolean
}
interface AbsencesData {
  dates: string[]
  date: string
  summary: SummaryRow[]
  recent: RecentGroup[]
}

function fmtDay(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "numeric" })
}
function fmtShortDay(iso: string) {
  const todayStr = new Date().toISOString().slice(0, 10)
  if (iso === todayStr) return "היום"
  return new Date(`${iso}T00:00:00`).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })
}

export default function GradeHubPage() {
  const [data, setData] = useState<AbsencesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggleExpanded(key: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const load = useCallback(async (date?: string) => {
    const qs = date ? `?date=${date}` : ""
    const d = await fetch(`/api/grade-hub/absences${qs}`).then(r => r.json()).catch(() => null)
    if (d && !d.error) {
      setData(d)
      setSelectedDate(d.date)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Light auto-refresh so the live feed stays current without a manual reload
  useEffect(() => {
    const t = setInterval(() => load(selectedDate ?? undefined), 60_000)
    return () => clearInterval(t)
  }, [load, selectedDate])

  function goToDate(date: string) {
    setLoading(true)
    load(date)
  }

  const dateIdx = data && selectedDate ? data.dates.indexOf(selectedDate) : -1
  const canGoOlder = data ? dateIdx >= 0 && dateIdx < data.dates.length - 1 : false
  const canGoNewer = data ? dateIdx > 0 : false

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <div className="flex-1">
          <h1 className="font-semibold text-lg text-white">ריכוז שכבה</h1>
          <p className="text-white/40 text-xs">חיסורים — כלל כיתות השכבה</p>
        </div>
        <button onClick={() => { setLoading(true); load(selectedDate ?? undefined) }}
          className="text-white/50 hover:text-white interactive p-1.5 rounded-lg">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
        {loading && !data ? (
          <p className="text-white/40 text-sm text-center py-8">טוען...</p>
        ) : !data || data.dates.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl">🏫</span>
            <p className="text-white/40 text-sm mt-3">עדיין אין נתוני חיסורים — הסנכרון עם משוב רץ כל 15 דק׳</p>
          </div>
        ) : (
          <>
            {/* Live feed — grouped one row per student per day, subjects revealed on tap */}
            <section className="space-y-2">
              <h2 className="text-white/60 text-xs font-semibold px-1">עדכונים אחרונים</h2>
              <div className="space-y-1.5">
                {data.recent.map(g => {
                  const key = `${g.studentName}__${g.classCode}${g.classNum}__${g.date}`
                  const isOpen = expanded.has(key)
                  return (
                    <div key={key} className="bg-white/8 border border-white/10 rounded-2xl overflow-hidden">
                      <button onClick={() => toggleExpanded(key)}
                        className="w-full px-4 py-2.5 flex items-center gap-3 interactive text-right">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${g.anyUnjustified ? "bg-orange-400" : "bg-white/20"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/85 truncate">
                            {g.studentName} <span className="text-white/40">· {g.classCode}{g.classNum}</span>
                          </p>
                          <p className="text-white/35 text-[11px]">
                            {g.lessonsMissed} {g.lessonsMissed === 1 ? "שיעור" : "שיעורים"} · {fmtShortDay(g.date)}
                          </p>
                        </div>
                        <span className={`text-white/30 text-xs flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-3 pt-0.5 text-white/50 text-[12px] border-t border-white/5">
                          {g.subjects.join(", ")} · שיעורים {g.lessonNums.sort((a, b) => a - b).join(", ")}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Daily summary table */}
            <section className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-white/60 text-xs font-semibold">טבלה יומית</h2>
                <div className="flex items-center gap-2 text-white/60 text-xs">
                  <button disabled={!canGoOlder} onClick={() => goToDate(data.dates[dateIdx + 1])}
                    className="interactive disabled:opacity-20 p-1">›</button>
                  <span className="text-white/85 font-medium">{selectedDate ? fmtDay(selectedDate) : ""}</span>
                  <button disabled={!canGoNewer} onClick={() => goToDate(data.dates[dateIdx - 1])}
                    className="interactive disabled:opacity-20 p-1">‹</button>
                </div>
              </div>

              {data.summary.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-6 text-center text-white/30 text-sm">
                  אין חיסורים ביום זה
                </div>
              ) : (
                <div className="bg-white/8 border border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white/40 text-[11px] border-b border-white/10">
                        <th className="text-right font-medium px-3 py-2">תלמיד/ה</th>
                        <th className="text-right font-medium px-3 py-2">כיתה</th>
                        <th className="text-center font-medium px-3 py-2">שיעורים</th>
                        <th className="text-right font-medium px-3 py-2">מקצועות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.summary.map((row, i) => (
                        <tr key={i} className="border-b border-white/5 last:border-0">
                          <td className="px-3 py-2.5 text-white/85">
                            <span className="flex items-center gap-1.5">
                              {row.anyUnjustified && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />}
                              {row.studentName}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-white/60">{row.classCode}{row.classNum}</td>
                          <td className="px-3 py-2.5 text-white/60 text-center">{row.lessonsMissed}</td>
                          <td className="px-3 py-2.5 text-white/50 text-[12px]">{row.subjects.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-white/25 text-[11px] px-1">🟠 נקודה כתומה = חיסור שטרם הוצדק</p>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
