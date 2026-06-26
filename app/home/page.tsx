"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import BottomNav from "@/app/components/BottomNav"
import { AnimatedLandscape } from "@/app/components/AnimatedLandscape"
import VoiceButton from "@/app/home/VoiceButton"
import {
  getRemainingSchoolDays, getDaysUntilSummer, getNextVacation, getDaysUntilNextVacation,
} from "@/lib/school-calendar"

// ── Types ─────────────────────────────────────────────────
interface ClassProfile { displayName: string; teacherDisplayName: string; schoolName: string }
interface CalendarEvent { id: string; date: string; description: string; grade: string | null }
interface RecentMessage { id: string; content: string; createdAt: string; sender: { name: string }; student: { name: string } }
interface ScheduleSlot { period: string; content: string }
interface Attendance { totalLessons: number; absences: number; justifiedAbsences: number }
interface HomeData {
  classProfile: ClassProfile | null
  upcomingEvents: CalendarEvent[]
  openTasks: number
  recentMessages: RecentMessage[]
  todaySchedule: ScheduleSlot[]
  tomorrowSchedule: ScheduleSlot[]
  todayHeb: string
  tomorrowHeb: string
  upcomingExams: CalendarEvent[]
  attendance: Attendance | null
}

// ── Schedule helpers ───────────────────────────────────────
function parsePeriodStr(p: string) {
  const m = p.match(/^(\d+),\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/)
  if (!m) return null
  return { num: m[1], start: m[2], end: m[3] }
}
function parseSubject(content: string) { return content.split(/\s{2,}/)[0].trim() }
function timeToMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m }
function fmtMins(m: number) { return m < 60 ? `${m} דק'` : `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")} שע'` }

interface ParsedSlot { num: string; start: string; end: string; subject: string; content: string }

type LessonStatus =
  | { type: "before-school"; first: ParsedSlot }
  | { type: "in-class";  slot: ParsedSlot; minsLeft: number; progress: number }
  | { type: "break";     next: ParsedSlot; minsUntil: number }
  | { type: "done" }
  | { type: "no-school" }

function getLessonStatus(slots: ScheduleSlot[], now: Date): LessonStatus {
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const day = now.getDay()
  if (day === 6) return { type: "no-school" }

  const parsed: ParsedSlot[] = slots
    .map(s => { const p = parsePeriodStr(s.period); if (!p) return null; return { ...p, subject: parseSubject(s.content), content: s.content } })
    .filter(Boolean) as ParsedSlot[]

  if (!parsed.length) return { type: "no-school" }
  if (nowMin < timeToMin(parsed[0].start)) return { type: "before-school", first: parsed[0] }

  for (let i = 0; i < parsed.length; i++) {
    const s = parsed[i]
    const start = timeToMin(s.start), end = timeToMin(s.end)
    if (nowMin >= start && nowMin < end) {
      const total = end - start
      return { type: "in-class", slot: s, minsLeft: end - nowMin, progress: Math.round(((nowMin - start) / total) * 100) }
    }
    if (nowMin < start) return { type: "break", next: s, minsUntil: start - nowMin }
  }
  return { type: "done" }
}

// ── Icons ──────────────────────────────────────────────────
const IHome     = () => <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
const IChat     = () => <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
const ISettings = () => <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
const IAnalytics= () => <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
const IAssist   = () => <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
const IDoc      = () => <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
const IInfo     = () => <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
const IBook     = () => <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
const IStar     = () => <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>

function useTick(ms = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), ms); return () => clearInterval(id) }, [ms])
  return now
}

// ══════════════════════════════════════════════════════════
// STUDENT HOME — full-screen immersive
// ══════════════════════════════════════════════════════════
function StudentHome({ session, data }: { session: any; data: HomeData | null }) {
  const now = useTick()
  const [showSchedule, setShowSchedule] = useState(false)
  const firstName = session?.user?.name?.split(" ")[0] ?? ""

  const todaySlots: ScheduleSlot[] = data?.todaySchedule ?? []
  const status = getLessonStatus(todaySlots, now)

  const remainingDays = getRemainingSchoolDays()
  const daysToSummer  = getDaysUntilSummer()
  const nextVac       = getNextVacation()
  const daysToVac     = getDaysUntilNextVacation()

  const parsedSlots: ParsedSlot[] = todaySlots
    .map(s => { const p = parsePeriodStr(s.period); if (!p) return null; return { ...p, subject: parseSubject(s.content), content: s.content } })
    .filter(Boolean) as ParsedSlot[]

  const nowMin = now.getHours() * 60 + now.getMinutes()
  const timeStr = now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })

  const navTabs = [
    { label: "בית",  href: "/home",    icon: <IHome /> },
    { label: "מידע", href: "/student", icon: <IInfo /> },
    { label: "לימוד",icon: <IBook />,  comingSoon: true },
    { label: "עוזר", icon: <IStar />,  comingSoon: true },
  ]

  // hero content by status
  let heroLabel = ""
  let heroTitle = ""
  let heroSub   = ""
  let heroExtra: React.ReactNode = null

  if (status.type === "in-class") {
    heroLabel = "עכשיו בכיתה"
    heroTitle = status.slot.subject
    heroSub   = `${status.slot.start} – ${status.slot.end}  ·  נגמר בעוד ${fmtMins(status.minsLeft)}`
    heroExtra = (
      <div className="mt-6 w-full max-w-xs">
        <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/80 rounded-full transition-all duration-60000" style={{ width: `${status.progress}%` }} />
        </div>
      </div>
    )
  } else if (status.type === "break") {
    heroLabel = "שיעור הבא"
    heroTitle = status.next.subject
    heroSub   = `${status.next.start} – ${status.next.end}  ·  בעוד ${fmtMins(status.minsUntil)}`
  } else if (status.type === "before-school") {
    heroLabel = "שיעור ראשון היום"
    heroTitle = status.first.subject
    heroSub   = `מתחיל ב-${status.first.start}`
  } else if (status.type === "done") {
    heroLabel = "יום הלימודים הסתיים"
    heroTitle = data?.tomorrowSchedule?.length ? "מחר — יום " + data.tomorrowHeb : "מחר אין לימודים"
    if (data?.tomorrowSchedule?.length) {
      const first = data.tomorrowSchedule.find(s => parsePeriodStr(s.period))
      if (first) {
        const p = parsePeriodStr(first.period)
        heroTitle = parseSubject(first.content)
        heroSub   = `מחר · מתחיל ב-${p?.start}`
      }
    }
  } else {
    heroLabel = "שבת שלום"
    heroTitle = firstName
    heroSub   = "נתראה ביום ראשון"
  }

  return (
    <div className="flex flex-col h-screen" dir="rtl">
      {/* Animated Thailand beach — sunset */}
      <AnimatedLandscape variant="sunset" />
      {/* Dark vignette for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 pb-2 header-pt">
        <div>
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase">
            {data?.classProfile?.schoolName ?? "כפר סילבר"}
          </p>
          <p className="text-white/90 text-sm font-medium mt-0.5">
            {data?.classProfile?.displayName ?? "י2 סילבר"} · שלום, {firstName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-white text-2xl font-light nums" dir="ltr">{timeStr}</div>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="glass rounded-full px-3 py-1 text-white/70 text-xs hover:text-white btn-press">
            יציאה
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-4">
        <p className="text-white/60 text-sm font-medium tracking-wide mb-2 animate-fade-in">{heroLabel}</p>
        <h1 className="text-white font-light leading-none animate-fade-in stagger-1"
          style={{ fontSize: "clamp(2.8rem, 13vw, 5.5rem)" }}>
          {heroTitle}
        </h1>
        {heroSub && (
          <p className="text-white/75 text-lg font-light mt-3 animate-fade-in stagger-2">{heroSub}</p>
        )}
        {heroExtra}

        {/* Stats row */}
        <div className="flex gap-3 mt-8 animate-fade-in stagger-3">
          <div className="glass rounded-2xl px-4 py-3 text-center flex-1">
            <div className="text-white text-2xl font-semibold nums">{remainingDays}</div>
            <div className="text-white/60 text-[11px] mt-0.5">ימי לימוד</div>
          </div>
          <div className="glass rounded-2xl px-4 py-3 text-center flex-1">
            <div className="text-white text-2xl font-semibold nums">{daysToSummer}</div>
            <div className="text-white/60 text-[11px] mt-0.5">לחופש גדול</div>
          </div>
          {nextVac && daysToVac > 0 && (
            <div className="glass rounded-2xl px-4 py-3 text-center flex-1">
              <div className="text-white text-2xl font-semibold nums">{daysToVac}</div>
              <div className="text-white/60 text-[11px] mt-0.5">{nextVac.name.split(" ")[0]}</div>
            </div>
          )}
        </div>

        {/* Schedule toggle */}
        {parsedSlots.length > 0 && (
          <button
            onClick={() => setShowSchedule(v => !v)}
            className="mt-4 glass rounded-2xl px-4 py-2.5 text-white/80 text-sm w-full text-right flex items-center justify-between btn-press animate-fade-in stagger-4">
            <span>מערכת שעות — יום {data?.todayHeb}</span>
            <span className="text-white/50 text-xs">{showSchedule ? "▲ סגור" : "▼ פתח"}</span>
          </button>
        )}

        {/* Inline schedule */}
        {showSchedule && parsedSlots.length > 0 && (
          <div className="glass-dark rounded-2xl overflow-hidden mt-1 animate-scale-in">
            {parsedSlots.map((slot, i) => {
              const start = timeToMin(slot.start), end = timeToMin(slot.end)
              const isPast = nowMin >= end
              const isCurrent = nowMin >= start && nowMin < end
              const isNext = !isPast && !isCurrent && parsedSlots.findIndex(s => timeToMin(s.start) > nowMin) === i
              return (
                <div key={i} className={`flex items-center gap-3 px-4 py-2 ${isCurrent ? "bg-white/10" : ""}`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCurrent ? "bg-white animate-pulse" : isNext ? "bg-white/50" : "bg-white/20"}`} />
                  <span className={`text-xs nums w-20 flex-shrink-0 ${isPast ? "text-white/25" : "text-white/50"}`} dir="ltr">{slot.start}–{slot.end}</span>
                  <span className={`text-sm flex-1 truncate ${isCurrent ? "text-white font-medium" : isPast ? "text-white/25" : "text-white/70"}`}>{slot.subject}</span>
                  {isCurrent && <span className="text-[10px] text-white/80 glass rounded-full px-2 py-0.5">עכשיו</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* Events */}
        {(data?.upcomingEvents.length ?? 0) > 0 && !showSchedule && (
          <div className="mt-3 glass rounded-2xl px-4 py-3 animate-fade-in stagger-5">
            {data!.upcomingEvents.slice(0, 2).map(e => (
              <div key={e.id} className="flex items-center gap-3 py-1">
                <span className="text-white/40 text-xs nums" dir="ltr">
                  {new Date(e.date).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
                </span>
                <span className="text-white/70 text-xs truncate">{e.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming exams */}
        {(data?.upcomingExams?.length ?? 0) > 0 && !showSchedule && (
          <div className="mt-3 glass rounded-2xl px-4 py-3 animate-fade-in">
            <p className="text-white/50 text-[10px] font-semibold mb-2 uppercase tracking-wide">מבחנים קרובים</p>
            <div className="flex flex-wrap gap-2">
              {data!.upcomingExams.map(e => (
                <div key={e.id} className="bg-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
                  <span className="text-white/50 text-xs nums" dir="ltr">
                    {new Date(e.date).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
                  </span>
                  <span className="text-white/80 text-xs font-medium truncate max-w-[120px]">{e.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance */}
        {data?.attendance && data.attendance.totalLessons > 0 && (
          <div className="mt-3 glass rounded-2xl px-4 py-3 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wide">נוכחות</p>
              <span className="text-white/70 text-xs">
                {Math.round(((data.attendance.totalLessons - data.attendance.absences) / data.attendance.totalLessons) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/70 rounded-full transition-all"
                style={{ width: `${Math.round(((data.attendance.totalLessons - data.attendance.absences) / data.attendance.totalLessons) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-white/35 text-[10px]">נעדרתי {data.attendance.absences} שיעורים</span>
              <span className="text-white/35 text-[10px]">{data.attendance.totalLessons} שיעורים סה"כ</span>
            </div>
          </div>
        )}
      </main>

      {/* BottomNav — glass overlay */}
      <div className="relative z-10">
        <BottomNav
          tabs={navTabs}
          activeColor="text-white"
          activeBg="bg-white/20"
          glassMode
        />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// TEACHER HOME — immersive dark blue
// ══════════════════════════════════════════════════════════
function TeacherHome({ session, data }: { session: any; data: HomeData | null }) {
  const now  = useTick()
  const firstName = session?.user?.name?.split(" ")[0] ?? ""
  const isAdmin   = (session?.user as any)?.role === "ADMIN"

  const timeStr = now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
  const dateStr = now.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })

  const navTabs = [
    { label: "בית",   href: "/home",      icon: <IHome /> },
    { label: "שיחות", href: "/dashboard", icon: <IChat /> },
    { label: "ניהול", href: "/admin",     icon: <ISettings /> },
    { label: "ניתוח", icon: <IAnalytics />, comingSoon: true },
    { label: "עוזר",  icon: <IAssist />,   comingSoon: true },
  ]

  const unreadCount = data?.recentMessages.length ?? 0

  return (
    <div className="flex flex-col h-screen" dir="rtl">
      {/* Animated Thailand beach — night */}
      <AnimatedLandscape variant="night" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/70" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 pb-2 header-pt">
        <div>
          <p className="text-white/50 text-xs font-medium tracking-widest uppercase">
            {data?.classProfile?.schoolName ?? "כפר סילבר"}
          </p>
          <p className="text-white/90 text-sm font-medium mt-0.5">
            {data?.classProfile?.displayName} · {firstName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-white text-2xl font-light nums" dir="ltr">{timeStr}</div>
          <div className="flex items-center gap-2">
            {isAdmin && <Link href="/profile" className="glass rounded-full px-3 py-1 text-white/60 text-xs hover:text-white btn-press interactive">עריכה</Link>}
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="glass rounded-full px-3 py-1 text-white/60 text-xs hover:text-white btn-press interactive">יציאה</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-4 overflow-y-auto">
        <p className="text-white/50 text-sm font-medium tracking-wide mb-2 animate-fade-in">{dateStr}</p>

        {/* Big unread count */}
        <div className="flex items-end gap-4 mb-6 animate-fade-in stagger-1">
          <div>
            <div className="text-white font-light nums leading-none" style={{ fontSize: "clamp(4rem, 18vw, 7rem)" }}>
              {unreadCount}
            </div>
            <p className="text-white/60 text-base font-light mt-1">
              {unreadCount === 1 ? "הודעה חדשה" : unreadCount === 0 ? "אין הודעות חדשות" : "הודעות חדשות"}
            </p>
          </div>
          {data?.openTasks ? (
            <div className="mb-3 glass rounded-2xl px-4 py-3 text-center">
              <div className="text-white text-xl font-semibold nums">{data.openTasks}</div>
              <div className="text-white/50 text-[11px] mt-0.5">משימות</div>
            </div>
          ) : null}
        </div>

        {/* Recent messages */}
        {(data?.recentMessages.length ?? 0) > 0 && (
          <div className="glass-dark rounded-2xl overflow-hidden mb-4 animate-fade-in stagger-2">
            {data!.recentMessages.slice(0, 4).map(m => (
              <Link key={m.id} href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 interactive border-b border-white/5 last:border-0">
                <div className="w-8 h-8 rounded-full bg-white/15 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {m.sender.name?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white/90 text-xs font-semibold">{m.student.name}</div>
                  <div className="text-white/45 text-xs truncate mt-0.5">{m.content}</div>
                </div>
                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full flex-shrink-0" />
              </Link>
            ))}
            <Link href="/dashboard" className="flex items-center justify-center px-4 py-2.5 text-white/50 text-xs hover:text-white/80 interactive">
              כל השיחות ←
            </Link>
          </div>
        )}

        {/* Stats + quick nav */}
        <div className="grid grid-cols-3 gap-2 animate-fade-in stagger-3">
          {[
            { val: getRemainingSchoolDays(), label: "ימי לימוד", href: undefined },
            { val: "💬", label: "שיחות", href: "/dashboard" },
            { val: "⚙️", label: "ניהול", href: "/admin" },
          ].map(c => (
            c.href
              ? <Link key={c.label} href={c.href} className="glass rounded-2xl py-3 text-center btn-press card-lift">
                  <div className="text-white text-2xl">{c.val}</div>
                  <div className="text-white/50 text-[11px] mt-0.5">{c.label}</div>
                </Link>
              : <div key={c.label} className="glass rounded-2xl py-3 text-center">
                  <div className="text-white text-xl font-semibold nums">{c.val}</div>
                  <div className="text-white/50 text-[11px] mt-0.5">{c.label}</div>
                </div>
          ))}
        </div>

        {/* Events */}
        {(data?.upcomingEvents.length ?? 0) > 0 && (
          <div className="mt-3 glass rounded-2xl px-4 py-3 animate-fade-in stagger-4">
            <p className="text-white/50 text-xs font-semibold mb-2 uppercase tracking-wide">אירועים קרובים</p>
            {data!.upcomingEvents.slice(0, 3).map(e => (
              <div key={e.id} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                <span className="text-white/35 text-xs nums" dir="ltr">
                  {new Date(e.date).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
                </span>
                <span className="text-white/65 text-xs truncate">{e.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Voice assistant */}
        <div className="mt-4 animate-fade-in stagger-4">
          <VoiceButton />
        </div>
      </main>

      <div className="relative z-10">
        <BottomNav tabs={navTabs} activeColor="text-white" activeBg="bg-white/20" glassMode />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// PARENT HOME — immersive green
// ══════════════════════════════════════════════════════════
function ParentHome({ session, data }: { session: any; data: HomeData | null }) {
  const now = useTick()
  const firstName = session?.user?.name?.split(" ")[0] ?? ""

  const timeStr = now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
  const dateStr = now.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })

  const navTabs = [
    { label: "בית",   href: "/home", icon: <IHome /> },
    { label: "צ'אט",  href: "/chat", icon: <IChat /> },
    { label: "טפסים", icon: <IDoc />, comingSoon: true },
  ]

  return (
    <div className="flex flex-col h-screen" dir="rtl">
      {/* Animated Thailand beach — tropical */}
      <AnimatedLandscape variant="tropical" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/65" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 pb-2 header-pt">
        <div>
          <p className="text-white/50 text-xs font-medium tracking-widest uppercase">
            {data?.classProfile?.schoolName ?? "כפר סילבר"}
          </p>
          <p className="text-white/90 text-sm font-medium mt-0.5">
            {data?.classProfile?.displayName} · שלום, {firstName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-white text-2xl font-light nums" dir="ltr">{timeStr}</div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="glass rounded-full px-3 py-1 text-white/60 text-xs hover:text-white btn-press interactive">יציאה</button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-4">
        <p className="text-white/50 text-sm mb-1 animate-fade-in">{dateStr}</p>
        <h1 className="text-white font-light leading-tight animate-fade-in stagger-1"
          style={{ fontSize: "clamp(2.4rem, 11vw, 4.5rem)" }}>
          שלום,<br />{firstName}
        </h1>

        {/* Big CTA */}
        <Link href="/chat"
          className="mt-8 glass-dark rounded-2xl p-5 flex items-center gap-4 btn-press animate-fade-in stagger-2">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold">פנייה למחנך</div>
            <div className="text-white/55 text-sm mt-0.5">סילבר בוט · מענה מיידי</div>
          </div>
          <span className="text-white/40 text-lg">←</span>
        </Link>

        {/* Class info */}
        <div className="mt-3 glass rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in stagger-3">
          <span className="text-xl">🏫</span>
          <div>
            <div className="text-white/80 text-sm font-medium">{data?.classProfile?.displayName}</div>
            <div className="text-white/45 text-xs">מחנך/ת: {data?.classProfile?.teacherDisplayName ?? "—"}</div>
          </div>
        </div>

        {/* Events */}
        {(data?.upcomingEvents.length ?? 0) > 0 && (
          <div className="mt-3 glass rounded-2xl px-4 py-3 animate-fade-in stagger-4">
            <p className="text-white/40 text-xs font-semibold mb-2 uppercase tracking-wide">אירועים קרובים</p>
            {data!.upcomingEvents.slice(0, 3).map(e => (
              <div key={e.id} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                <span className="text-white/35 text-xs nums" dir="ltr">
                  {new Date(e.date).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
                </span>
                <span className="text-white/65 text-xs truncate">{e.description}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="relative z-10">
        <BottomNav tabs={navTabs} activeColor="text-white" activeBg="bg-white/20" glassMode />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════
export default function HomePage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<HomeData | null>(null)
  const role = (session?.user as any)?.role ?? "PARENT"

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/home")
    if (res.ok) setData(await res.json())
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  if (status === "loading") return null

  if (role === "STUDENT") return <StudentHome session={session} data={data} />
  if (role === "TEACHER" || role === "ADMIN") return <TeacherHome session={session} data={data} />
  return <ParentHome session={session} data={data} />
}
