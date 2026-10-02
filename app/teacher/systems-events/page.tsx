"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  getRemainingSchoolDays, getDaysUntilSummer, getNextVacation, getDaysUntilNextVacation,
} from "@/lib/school-calendar"

interface ScheduleSlot { period: string; content: string }
interface BellSlotT { period: string; startTime: string; endTime: string }
interface CalendarEvent { id: string; date: string; description: string }
interface TimelineEntry { start: string; end: string; label: string; isBreak: boolean; period?: string }

function parsePeriodStr(p: string) {
  const m = p.match(/^(\d+),\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/)
  if (!m) return null
  return { num: m[1], start: m[2], end: m[3] }
}
function parseSubject(content: string) { return content.split(/\s{2,}/)[0].trim() }
function timeToMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m }
function periodNum(p: string): string {
  const m = p.match(/^\d+/)
  return m ? m[0] : p.trim()
}

function buildTimeline(slots: ScheduleSlot[], bellSlots: BellSlotT[]): TimelineEntry[] {
  const bellByPeriod = new Map(bellSlots.map(b => [b.period, { start: b.startTime, end: b.endTime }]))
  const lessons = slots
    .map(s => {
      const bell = bellByPeriod.get(periodNum(s.period))
      const embedded = parsePeriodStr(s.period)
      const start = bell?.start ?? embedded?.start
      const end = bell?.end ?? embedded?.end
      if (!start || !end) return null
      return { start, end, label: parseSubject(s.content), isBreak: false, period: periodNum(s.period) }
    })
    .filter(Boolean) as TimelineEntry[]
  const breaks: TimelineEntry[] = bellSlots
    .filter(b => !/^\d+$/.test(b.period.trim()))
    .map(b => ({ start: b.startTime, end: b.endTime, label: b.period, isBreak: true }))
  return [...lessons, ...breaks].sort((a, b) => timeToMin(a.start) - timeToMin(b.start))
}

function getNowNext(timeline: TimelineEntry[], now: Date): { current: TimelineEntry | null; next: TimelineEntry | null } {
  const nowMin = now.getHours() * 60 + now.getMinutes()
  for (let i = 0; i < timeline.length; i++) {
    const start = timeToMin(timeline[i].start), end = timeToMin(timeline[i].end)
    if (nowMin >= start && nowMin < end) return { current: timeline[i], next: timeline[i + 1] ?? null }
    if (nowMin < start) return { current: null, next: timeline[i] }
  }
  return { current: null, next: null }
}

export default function SystemsEventsPage() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(id) }, [])

  const [todaySchedule, setTodaySchedule] = useState<ScheduleSlot[]>([])
  const [bellSlots, setBellSlots] = useState<BellSlotT[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  const [todayHeb, setTodayHeb] = useState("")
  const [classId, setClassId] = useState("")

  const [classScheduleSlots, setClassScheduleSlots] = useState<(ScheduleSlot & { dayHeb: string })[]>([])
  const [classScheduleName, setClassScheduleName] = useState("")

  useEffect(() => {
    fetch("/api/home").then(r => r.json()).then(d => {
      setTodaySchedule(d.todaySchedule ?? [])
      setBellSlots(d.bellSlots ?? [])
      setUpcomingEvents(d.upcomingEvents ?? [])
      setTodayHeb(d.todayHeb ?? "")
      setClassId(d.classId ?? "")
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!classId) return
    ;(async () => {
      const classesRes = await fetch("/api/admin/schedule-classes").then(r => r.json()).catch(() => ({ classes: [] }))
      const own = (classesRes.classes ?? []).find((c: { id: string }) => c.id === classId)
      if (!own) { setClassScheduleName(""); setClassScheduleSlots([]); return }
      setClassScheduleName(own.name)
      const cs = await fetch(`/api/schedule?classId=${encodeURIComponent(own.id)}`).then(r => r.json()).catch(() => ({ slots: [] }))
      setClassScheduleSlots(cs.slots ?? [])
    })()
  }, [classId])

  const timeline = buildTimeline(todaySchedule, bellSlots)
  const nowNext = getNowNext(timeline, now)
  const todayClassSlots = classScheduleSlots.filter(s => s.dayHeb === todayHeb)
  const classTimeline = buildTimeline(todayClassSlots, bellSlots)

  const remainingDays = getRemainingSchoolDays()
  const daysToSummer = getDaysUntilSummer()
  const nextVac = getNextVacation()
  const daysToVac = getDaysUntilNextVacation()

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white">מערכות וארועים</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">

        {/* Class schedule */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
            <span className="text-white/65 text-sm font-medium">
              מערכת הכיתה{classScheduleName ? ` — ${classScheduleName}` : ""}
            </span>
            <Link href="/teacher/schedule" className="text-white/30 text-[11px] interactive">כל המערכות ←</Link>
          </div>
          <div className="divide-y divide-white/5">
            {classTimeline.length > 0 ? classTimeline.map((t, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2">
                <span className="text-[10px] font-mono w-4 flex-shrink-0 text-white/30">{t.period ?? ""}</span>
                <span className={`flex-1 text-[12px] truncate ${t.isBreak ? "text-white/35 italic" : "text-white/65"}`}>{t.label}</span>
                <span className="text-white/25 text-[10px]" dir="ltr">{t.start}–{t.end}</span>
              </div>
            )) : (
              <div className="px-4 py-4 text-white/25 text-sm text-center">
                {classScheduleSlots.length > 0 ? "אין שיעורים היום" : "אין עדיין מערכת כיתתית טעונה"}
              </div>
            )}
          </div>
        </div>

        {/* Events */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
            <span className="text-white/65 text-sm font-medium">לוח אירועים</span>
            <Link href="/teacher/calendar" className="text-white/30 text-[11px] interactive">כולם ←</Link>
          </div>
          <div className="divide-y divide-white/5">
            {upcomingEvents.length > 0 ? upcomingEvents.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 px-4 py-2">
                <div className="text-white/35 text-[10px] font-mono w-10 flex-shrink-0">
                  {new Date(ev.date).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
                </div>
                <div className="text-white/70 text-[12px] flex-1 truncate">{ev.description}</div>
              </div>
            )) : (
              <div className="px-4 py-4 text-white/25 text-sm text-center">אין אירועים קרובים</div>
            )}
          </div>
        </div>

        {/* Teacher schedule */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
            <span className="text-white/65 text-sm font-medium">מערכת המורה — היום</span>
            <Link href="/teacher/schedule" className="text-white/30 text-[11px] interactive">כל המערכת ←</Link>
          </div>
          <div className="divide-y divide-white/5">
            {timeline.length > 0 ? timeline.map((t, i) => {
              const isCurrent = nowNext.current === t
              const isNext = nowNext.next === t
              return (
                <div key={i} className={`flex items-center gap-3 px-4 py-2 ${isCurrent ? "bg-white/10" : ""}`}>
                  <span className={`text-[10px] font-mono w-4 flex-shrink-0 ${isCurrent ? "text-white" : "text-white/30"}`}>{t.period ?? ""}</span>
                  <span className={`flex-1 text-[12px] truncate ${isCurrent ? "text-white font-medium" : t.isBreak ? "text-white/35 italic" : "text-white/65"}`}>{t.label}</span>
                  <span className="text-white/25 text-[10px]" dir="ltr">{t.start}–{t.end}</span>
                  {isCurrent && <span className="text-[9px] bg-green-500/30 text-green-300 px-1.5 py-0.5 rounded-full">עכשיו</span>}
                  {isNext && <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded-full">הבא</span>}
                </div>
              )
            }) : (
              <div className="px-4 py-4 text-white/25 text-sm text-center">אין שיעורים היום</div>
            )}
          </div>
        </div>

        {/* Countdowns */}
        <div className="space-y-2">
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest text-center">ספירה לאחור</p>
          {nextVac && daysToVac > 0 && (
            <div className="glass rounded-2xl px-4 py-3 flex items-center gap-4">
              <div className="text-2xl" style={{ animation: "wiggle 2s ease-in-out infinite" }}>☕</div>
              <div className="flex-1">
                <div className="text-white/45 text-xs">ימים עד</div>
                <div className="text-white text-sm font-medium">{nextVac.name}</div>
              </div>
              <div className="text-white text-3xl font-light nums">{daysToVac}</div>
            </div>
          )}
          <div className="glass rounded-2xl px-4 py-3 flex items-center gap-4">
            <div className="text-2xl">🏖️</div>
            <div className="flex-1">
              <div className="text-white/45 text-xs">ימים עד</div>
              <div className="text-white text-sm font-medium">החופש הגדול</div>
            </div>
            <div className="text-white text-3xl font-light nums">{daysToSummer}</div>
          </div>
          <div className="glass rounded-2xl px-4 py-3 flex items-center gap-4">
            <div className="text-2xl">📝</div>
            <div className="flex-1">
              <div className="text-white/45 text-xs">ימי לימוד</div>
              <div className="text-white text-sm font-medium">שנותרו השנה</div>
            </div>
            <div className="text-white text-3xl font-light nums">{remainingDays}</div>
          </div>
        </div>

      </div>
    </div>
  )
}
