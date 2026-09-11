"use client"

import { useEffect, useState, Component, type ReactNode } from "react"
import Link from "next/link"
import { dayTypeForWeekday, TEACHER_OWN_SCHEDULE_ID } from "@/lib/bellSchedule"

// Events synced from the main spreadsheet never carry a `type` value (always
// null in practice) — holidays can only be told apart by name, not a field.
const HOLIDAY_PATTERN = /ראש השנה|יום כיפור|סוכות|שמחת תורה|איסרו חג|חנוכה|טו בשבט|פורים|פסח|שבועות|ל"ג בעומר|צום|תענית|חג הסיגד|יום העצמאות|יום הזיכרון|יום ירושלים|יום השואה/
function isHolidayEvent(ev: { description: string }) { return HOLIDAY_PATTERN.test(ev.description) }

// Catches a render-time crash in any section below and shows it directly on
// the page — a blank screen with no visible error is much harder to debug
// than a message you can screenshot straight from a phone.
class SectionErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(err: any) {
    return { error: err?.message ?? String(err) }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="bg-red-950/40 border border-red-500/30 rounded-2xl px-4 py-4">
          <p className="text-red-300 text-sm font-semibold mb-1">שגיאה בטעינת הקטע הזה</p>
          <p className="text-red-300/70 text-xs" dir="ltr">{this.state.error}</p>
        </div>
      )
    }
    return this.props.children
  }
}

interface Slot {
  id: string
  dayHeb: string
  period: string
  content: string
}

interface BellSlotT {
  period: string
  startTime: string
  endTime: string
  dayType: string
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

interface EventT {
  id: string
  date: string
  description: string
  type: string | null
}

const DAY_ORDER = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"]

function periodNum(p: string): string {
  const m = p.match(/^\d+/)
  return m ? m[0] : p.trim()
}

function timeToMin(t: string): number {
  const m = t.match(/(\d{1,2}):(\d{2})/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0
}

type BellByDayType = Map<string, Map<string, { start: string; end: string }>>

// Each weekday runs one of two bell patterns (א/ג/ד vs ב/ה) — a bare period
// number like "1" only resolves to a real clock time once we know which
// pattern applies to that specific day, via the bell-schedule table.
function parseSlot(s: Slot, bellByDayType: BellByDayType): ParsedSlot {
  const num = periodNum(s.period)

  const parts = s.content.split(/\s{2,}/).map(p => p.trim()).filter(Boolean)
  const subject = parts[0] ?? ""
  const teacher = parts[1] ?? ""
  const room    = parts[2] ?? ""

  const jsDay = DAY_ORDER.indexOf(s.dayHeb)
  const dayType = jsDay >= 0 ? dayTypeForWeekday(jsDay) : null
  const bell = dayType ? bellByDayType.get(dayType)?.get(num) : undefined

  // Fall back to the older "1, 08:45-09:30" embedded-time format, in case
  // any schedule still carries it.
  const embeddedMatch = s.period.match(/^\d+,\s*(.+)/)
  const embedded = embeddedMatch?.[1]?.trim()

  const timeStr = bell ? `${bell.start}-${bell.end}` : (embedded ?? "")
  const startMin = bell ? timeToMin(bell.start) : (embedded ? timeToMin(embedded) : 0)
  const endMin   = bell ? timeToMin(bell.end)   : (embedded ? timeToMin(embedded.split("-")[1] ?? "") : 0)

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

/* ── One weekly schedule (day tabs + list), reused for both the class
   schedule and the teacher's own personal schedule ─────────────────── */
function ScheduleSection({ title, slots, bellByDayType, loading, emptyText }: {
  title: string; slots: Slot[]; bellByDayType: BellByDayType; loading: boolean; emptyText: string
}) {
  const [selectedDay, setSelectedDay] = useState<string>(() => getTodayHeb() ?? "ראשון")
  const [nowMin, setNowMin] = useState(getNowMin)

  useEffect(() => {
    const id = setInterval(() => setNowMin(getNowMin()), 30_000)
    return () => clearInterval(id)
  }, [])

  const byDay: Record<string, ParsedSlot[]> = {}
  for (const s of slots) {
    if (!byDay[s.dayHeb]) byDay[s.dayHeb] = []
    byDay[s.dayHeb].push(parseSlot(s, bellByDayType))
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

  if (!loading && slots.length === 0) {
    return (
      <section>
        <h2 className="text-white/70 text-sm font-semibold mb-2 px-1">{title}</h2>
        <div className="glass rounded-2xl px-4 py-8 text-center">
          <p className="text-white/35 text-sm">{emptyText}</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-white/70 text-sm font-semibold mb-2 px-1">{title}</h2>

      {activeDays.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-3 pb-1">
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
      )}

      {loading && (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!loading && displaySlots.length === 0 && (
        <div className="glass rounded-2xl px-4 py-8 text-center">
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
                {s.timeStr && (
                  <div className="flex-shrink-0 px-3 text-white/25 text-[11px]" dir="ltr">{s.timeStr}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

/* ── Condensed upcoming-events list, with a link to the full calendar ── */
function EventsSection({ events, loading }: { events: EventT[]; loading: boolean }) {
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = events.filter(e => e.date >= today && !isHolidayEvent(e)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6)

  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-white/70 text-sm font-semibold">לוח ארועים</h2>
        <Link href="/teacher/calendar" className="text-white/40 text-xs hover:text-white interactive">כל הארועים ←</Link>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1,2].map(i => <div key={i} className="h-12 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!loading && upcoming.length === 0 && (
        <div className="glass rounded-2xl px-4 py-8 text-center">
          <p className="text-white/35 text-sm">אין ארועים קרובים</p>
        </div>
      )}

      {!loading && upcoming.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
          {upcoming.map(ev => {
            const d = new Date(ev.date)
            const isToday = ev.date.slice(0, 10) === today
            return (
              <div key={ev.id} className={`flex items-center gap-3 px-4 py-2.5 ${isToday ? "bg-white/10" : ""}`}>
                <div className="flex-shrink-0 w-9 text-center">
                  <div className={`text-base font-light nums leading-none ${isToday ? "text-white" : "text-white/60"}`}>{d.getDate()}</div>
                  <div className="text-white/30 text-[9px] mt-0.5">{d.toLocaleDateString("he-IL", { month: "short" })}</div>
                </div>
                <p className={`text-sm flex-1 truncate ${isToday ? "text-white font-medium" : "text-white/75"}`}>{ev.description}</p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default function SchedulePage() {
  const [classSchedules, setClassSchedules] = useState<{ id: string; name: string; slots: Slot[] }[]>([])
  const [ownSlots, setOwnSlots]         = useState<Slot[]>([])
  const [bellSlots, setBellSlots]       = useState<BellSlotT[]>([])
  const [events, setEvents]             = useState<EventT[]>([])
  const [loading, setLoading]           = useState(true)
  const [loadError, setLoadError]       = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const [ownRes, bellRes, eventsRes, classesRes] = await Promise.all([
          fetch("/api/schedule").then(r => r.json()).catch(() => ({ slots: [] })),
          fetch("/api/student/bell-schedule").then(r => r.json()).catch(() => ({ slots: [] })),
          fetch("/api/events").then(r => r.json()).catch(() => ({ events: [] })),
          fetch("/api/admin/schedule-classes").then(r => r.json()).catch(() => ({ classes: [] })),
        ])
        setOwnSlots(ownRes.slots ?? [])
        setBellSlots(bellRes.slots ?? [])
        setEvents(eventsRes.events ?? [])

        // Every real class that has an uploaded schedule gets its own section —
        // picking just "the first" one risks showing stale data instead of
        // whatever was actually just uploaded.
        const classes = (classesRes.classes ?? []) as { id: string; name: string }[]
        const withSlots = await Promise.all(classes.map(async c => {
          const cs = await fetch(`/api/schedule?classId=${encodeURIComponent(c.id)}`).then(r => r.json()).catch(() => ({ slots: [] }))
          return { ...c, slots: (cs.slots ?? []) as Slot[] }
        }))
        setClassSchedules(withSlots)
      } catch (err: any) {
        // Surfaced directly on the page — no dev tools needed to see what broke.
        setLoadError(err?.message ?? String(err))
      }
      setLoading(false)
    })()
  }, [])

  const bellByDayType: BellByDayType = new Map()
  for (const b of bellSlots) {
    if (!bellByDayType.has(b.dayType)) bellByDayType.set(b.dayType, new Map())
    bellByDayType.get(b.dayType)!.set(b.period, { start: b.startTime, end: b.endTime })
  }

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-2xl interactive leading-none">←</Link>
        <div>
          <h1 className="font-semibold text-lg text-white">מערכות וארועים</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-8">
        {loadError && (
          <div className="bg-red-950/40 border border-red-500/30 rounded-2xl px-4 py-4">
            <p className="text-red-300 text-sm font-semibold mb-1">שגיאה בטעינת הנתונים</p>
            <p className="text-red-300/70 text-xs" dir="ltr">{loadError}</p>
          </div>
        )}

        <SectionErrorBoundary>
          {!loading && classSchedules.length === 0 ? (
            <ScheduleSection title="מערכת כיתתית" slots={[]} bellByDayType={bellByDayType} loading={loading}
              emptyText="אין עדיין מערכת כיתתית טעונה" />
          ) : (
            classSchedules.map(c => (
              <ScheduleSection key={c.id} title={`מערכת כיתתית — ${c.name}`} slots={c.slots} bellByDayType={bellByDayType} loading={loading}
                emptyText="אין עדיין מערכת כיתתית טעונה" />
            ))
          )}
        </SectionErrorBoundary>

        <SectionErrorBoundary>
          <EventsSection events={events} loading={loading} />
        </SectionErrorBoundary>

        <SectionErrorBoundary>
          <ScheduleSection title="המערכת שלי" slots={ownSlots} bellByDayType={bellByDayType} loading={loading}
            emptyText="אין עדיין מערכת אישית טעונה" />
        </SectionErrorBoundary>

        <p className="text-white/15 text-[10px] text-center">
          לעריכת המערכות — עבור להגדרות ← ייבוא נתונים
        </p>
      </div>
    </div>
  )
}
