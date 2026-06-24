"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import BottomNav from "@/app/components/BottomNav"
import { NatureBackground } from "@/app/components/NatureBackground"
import {
  getRemainingSchoolDays, getDaysUntilSummer, getNextVacation, getDaysUntilNextVacation,
} from "@/lib/school-calendar"
import { getPersonalEvents, getPersonalDisplayName, getPersonalBackground, getCustomBgUrl } from "@/app/components/personalStore"
import { ROLE_DEFAULTS } from "@/app/components/NatureBackground"

// ── Types ─────────────────────────────────────────────────
interface ClassProfile { displayName: string; teacherDisplayName: string; schoolName: string }
interface CalendarEvent { id: string; date: string; description: string; grade: string | null }
interface RecentMessage { id: string; content: string; createdAt: string; sender: { name: string }; student: { name: string } }
interface ScheduleSlot { period: string; content: string }
interface Attendance { totalLessons: number; absences: number; justifiedAbsences: number }
interface GradeComponent { name: string; weight: number; score: number }
interface Grade { subject: string; weightedAverage: number | null; gradeComponents: GradeComponent[]; teacherName: string | null }
interface ParentAttendance { totalLessons: number; absences: number; justifiedAbsences: number; tardiness: number; justifiedTardiness: number }

interface TeacherTask { id: string; description: string; responsible: string | null; deadline: string | null; done: boolean; createdAt: string }
interface ClassStudent { id: string; name: string }

interface HomeData {
  classId: string
  classProfile: ClassProfile | null
  upcomingEvents: CalendarEvent[]
  openTasks: number
  recentMessages: RecentMessage[]
  recentTasks: RecentMessage[]
  teacherTasks: TeacherTask[]
  classStudents: ClassStudent[]
  todaySchedule: ScheduleSlot[]
  tomorrowSchedule: ScheduleSlot[]
  todayHeb: string
  tomorrowHeb: string
  upcomingExams: CalendarEvent[]
  attendance: Attendance | null
  parentAttendance: ParentAttendance | null
  grades: Grade[]
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

function useBg(role: "student" | "teacher" | "parent") {
  const [bgId, setBgId] = useState(() => {
    if (typeof window === "undefined") return ROLE_DEFAULTS[role]
    return getPersonalBackground() || ROLE_DEFAULTS[role]
  })
  const [customUrl, setCustomUrl] = useState(() => {
    if (typeof window === "undefined") return ""
    return getCustomBgUrl()
  })
  useEffect(() => {
    const handler = (e: Event) => {
      setBgId((e as CustomEvent).detail)
      setCustomUrl(getCustomBgUrl())
    }
    window.addEventListener("bg-changed", handler)
    return () => window.removeEventListener("bg-changed", handler)
  }, [])
  return { bgId, customUrl }
}

// ── Reusable events card with expand + edit ───────────────
function EventsCard({ merged, editHref }: {
  merged: { id: string; date: string; description: string; _personal?: true }[]
  editHref: string
}) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? merged : merged.slice(0, 3)
  return (
    <div className="glass rounded-2xl overflow-hidden group/ev">
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-white/80 text-sm font-medium">אירועים קרובים</span>
        <div className="flex items-center gap-2">
          <Link href={editHref}
            className="opacity-0 group-hover/ev:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center glass rounded-lg hover:bg-white/20"
            title="עריכה">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
          {merged.length > 3 && (
            <button onClick={() => setExpanded(v => !v)} className="text-white/40 text-xs hover:text-white/70">
              {expanded ? "▲" : `+${merged.length - 3}`}
            </button>
          )}
        </div>
      </div>
      <div className="border-t border-white/10 divide-y divide-white/5">
        {shown.map(e => (
          <div key={e.id} className="flex items-center gap-3 px-4 py-2">
            <span className="text-white/40 text-xs nums flex-shrink-0 w-12" dir="ltr">
              {new Date(e.date).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
            </span>
            <span className="text-white/75 text-xs flex-1">{e.description}</span>
            {e._personal && <span className="text-white/25 text-[10px] flex-shrink-0">אישי</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// STUDENT HOME — full-screen immersive
// ══════════════════════════════════════════════════════════
function StudentHome({ session, data }: { session: any; data: HomeData | null }) {
  const now = useTick()
  const { bgId, customUrl } = useBg("student")
  const [menuOpen, setMenuOpen] = useState(false)
  const [personalName] = useState(() => {
    if (typeof window === "undefined") return ""
    return getPersonalDisplayName()
  })
  const [personalEvents] = useState(() => {
    if (typeof window === "undefined") return []
    return getPersonalEvents()
  })
  const firstName = personalName || (session?.user?.name?.split(" ")[0] ?? "")

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

  // hero content
  let heroLabel = "", heroTitle = "", heroSub = "", nextLesson = ""
  let progressPct = 0

  if (status.type === "in-class") {
    heroLabel = "עכשיו בכיתה"
    heroTitle = status.slot.subject
    heroSub   = `${status.slot.start}–${status.slot.end}  ·  עוד ${fmtMins(status.minsLeft)}`
    progressPct = status.progress
    const idx = parsedSlots.findIndex(s => s.start === status.slot.start)
    if (idx >= 0 && parsedSlots[idx + 1]) nextLesson = `שיעור הבא: ${parsedSlots[idx + 1].subject} ${parsedSlots[idx + 1].start}`
  } else if (status.type === "break") {
    heroLabel = "הפסקה"
    heroTitle = status.next.subject
    heroSub   = `${status.next.start}–${status.next.end}  ·  בעוד ${fmtMins(status.minsUntil)}`
    const idx = parsedSlots.findIndex(s => s.start === status.next.start)
    if (idx >= 0 && parsedSlots[idx + 1]) nextLesson = `אחריו: ${parsedSlots[idx + 1].subject} ${parsedSlots[idx + 1].start}`
  } else if (status.type === "before-school") {
    heroLabel = "שיעור ראשון היום"
    heroTitle = status.first.subject
    heroSub   = `מתחיל ב-${status.first.start}`
    if (parsedSlots[1]) nextLesson = `אחריו: ${parsedSlots[1].subject} ${parsedSlots[1].start}`
  } else if (status.type === "done") {
    heroLabel = "יום הלימודים הסתיים"
    heroTitle = "כל הכבוד 🎉"
    heroSub   = data?.tomorrowSchedule?.length ? `מחר — יום ${data.tomorrowHeb}` : "מחר אין לימודים"
  } else {
    heroLabel = "שבת שלום"
    heroTitle = firstName
    heroSub   = "נתראה ביום ראשון"
  }

  const today = new Date().toISOString().slice(0, 10)
  const mergedEvents = [
    ...(data?.upcomingEvents ?? []),
    ...personalEvents.filter(e => e.date >= today).map(e => ({ ...e, _personal: true as const })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="flex flex-col h-screen" dir="rtl">
      <NatureBackground bgId={bgId} customUrl={customUrl} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/70" />

      {/* ── Header ── */}
      <header className="relative z-20 flex items-center justify-between px-5 pb-2 header-pt flex-shrink-0" dir="ltr">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(true)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] glass rounded-xl btn-press interactive">
            <span className="w-4 h-px bg-white/80 rounded-full block" />
            <span className="w-4 h-px bg-white/80 rounded-full block" />
            <span className="w-4 h-px bg-white/80 rounded-full block" />
          </button>
          <div className="text-white text-2xl font-light nums">{timeStr}</div>
        </div>
        <div dir="rtl" className="text-right">
          <p className="text-white/55 text-xs font-medium tracking-widest uppercase">{data?.classProfile?.schoolName ?? "כפר סילבר"}</p>
          <p className="text-white/85 text-sm font-medium mt-0.5">{data?.classProfile?.displayName ?? "י2 סילבר"} · שלום, {firstName}</p>
        </div>
      </header>

      {/* ── Slide-in menu (right side) ── */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="fixed top-0 bottom-0 z-40 w-64 bg-black/85 backdrop-blur-xl flex flex-col" style={{ right: 0 }} dir="rtl">
            <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-white/10">
              <span className="text-white font-semibold text-lg">תפריט</span>
              <button onClick={() => setMenuOpen(false)} className="text-white/60 hover:text-white text-xl interactive">✕</button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1">
              {[
                { label: "עמוד הבית", href: "/home", emoji: "🏠" },
                { label: "בוט לימוד", href: "/student", emoji: "🤖" },
                { label: "הגדרות אישיות", href: "/manage", emoji: "⚙️" },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 interactive transition-colors text-sm">
                  <span className="text-lg">{item.emoji}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="px-4 pb-10 border-t border-white/10 pt-4">
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/50 hover:text-red-400 hover:bg-white/5 interactive text-sm">
                <span className="text-lg">🚪</span><span>יציאה</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Scrollable content ── */}
      <main className="relative z-10 flex-1 overflow-y-auto">

        {/* ── Above fold: hero ── */}
        <div className="flex flex-col justify-center px-6 pt-2" style={{ minHeight: "calc(100svh - 70px)" }}>
          <p className="text-white/60 text-sm font-medium tracking-wide mb-2 animate-fade-in">{heroLabel}</p>
          <h1 className="text-white font-light leading-none animate-fade-in stagger-1"
            style={{ fontSize: "clamp(2.8rem, 13vw, 5.5rem)" }}>
            {heroTitle}
          </h1>
          {heroSub && <p className="text-white/75 text-lg font-light mt-3 animate-fade-in stagger-2">{heroSub}</p>}

          {status.type === "in-class" && (
            <div className="mt-4 w-full max-w-xs">
              <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/80 rounded-full" style={{ width: `${progressPct}%`, transition: "width 60s linear" }} />
              </div>
            </div>
          )}

          {nextLesson && <p className="text-white/45 text-sm mt-3 animate-fade-in stagger-2">{nextLesson}</p>}

          {/* 3 bot buttons */}
          <div className="flex gap-3 mt-8 animate-fade-in stagger-3">
            <Link href="/student"
              className="flex-1 glass rounded-2xl px-2 py-3 flex flex-col items-center gap-1.5 hover:bg-white/15 interactive btn-press transition-colors">
              <span className="text-2xl">🧑‍🏫</span>
              <span className="text-white/80 text-[11px] font-medium text-center leading-tight">בוט<br/>מורה פרטי</span>
            </Link>
            <Link href="/student"
              className="flex-1 glass rounded-2xl px-2 py-3 flex flex-col items-center gap-1.5 hover:bg-white/15 interactive btn-press transition-colors">
              <span className="text-2xl">🤖</span>
              <span className="text-white/80 text-[11px] font-medium text-center leading-tight">עוזר<br/>אישי</span>
            </Link>
            <Link href="/student"
              className="flex-1 glass rounded-2xl px-2 py-3 flex flex-col items-center gap-1.5 hover:bg-white/15 interactive btn-press transition-colors">
              <span className="text-2xl">📚</span>
              <span className="text-white/80 text-[11px] font-medium text-center leading-tight">מידע<br/>כיתתי ואישי</span>
            </Link>
          </div>

          <div className="mt-8 flex justify-center opacity-40 animate-bounce">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* ── Below fold ── */}
        <div className="px-4 pb-10 space-y-3 max-w-sm mx-auto">

          {/* Full daily schedule */}
          {parsedSlots.length > 0 && (
            <div className="glass rounded-2xl overflow-hidden group/sched">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-white/80 text-sm font-medium">מערכת — יום {data?.todayHeb}</span>
                <Link href="/manage" onClick={e => e.stopPropagation()}
                  className="opacity-0 group-hover/sched:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center glass rounded-lg">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
              </div>
              <div className="border-t border-white/10 divide-y divide-white/5">
                {parsedSlots.map((slot, i) => {
                  const s = timeToMin(slot.start), e = timeToMin(slot.end)
                  const isPast = nowMin >= e
                  const isCurrent = nowMin >= s && nowMin < e
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-2 ${isCurrent ? "bg-white/10" : ""}`}>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCurrent ? "bg-white animate-pulse" : isPast ? "bg-white/10" : "bg-white/30"}`} />
                      <span className={`text-xs nums w-20 flex-shrink-0 ${isPast ? "text-white/25" : "text-white/50"}`} dir="ltr">{slot.start}–{slot.end}</span>
                      <span className={`text-sm flex-1 ${isCurrent ? "text-white font-medium" : isPast ? "text-white/25" : "text-white/70"}`}>{slot.subject}</span>
                      {isCurrent && <span className="text-[10px] text-white/80 glass rounded-full px-2 py-0.5">עכשיו</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Events */}
          {mergedEvents.length > 0 && <EventsCard merged={mergedEvents} editHref="/manage" />}

          {/* Countdowns with fun animations */}
          <div className="space-y-2 pt-2">
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest text-center">ספירה לאחור</p>

            {nextVac && daysToVac > 0 && (
              <div className="glass rounded-2xl px-4 py-4 flex items-center gap-4">
                <div className="text-3xl" style={{ animation: "wiggle 2s ease-in-out infinite" }}>🎒</div>
                <div className="flex-1">
                  <div className="text-white/50 text-xs mb-0.5">ימים עד</div>
                  <div className="text-white text-sm font-medium">{nextVac.name}</div>
                </div>
                <div className="text-white text-4xl font-light nums" style={{ animation: "countdown-pulse 1s ease-in-out infinite" }}>{daysToVac}</div>
              </div>
            )}

            <div className="glass rounded-2xl px-4 py-4 flex items-center gap-4">
              <div className="text-3xl" style={{ animation: "sun-float 3s ease-in-out infinite" }}>☀️</div>
              <div className="flex-1">
                <div className="text-white/50 text-xs mb-0.5">ימים עד</div>
                <div className="text-white text-sm font-medium">החופש הגדול</div>
              </div>
              <div className="text-white text-4xl font-light nums" style={{ animation: "countdown-pulse 1.3s ease-in-out infinite" }}>{daysToSummer}</div>
            </div>

            <div className="glass rounded-2xl px-4 py-4 flex items-center gap-4">
              <div className="text-3xl" style={{ animation: "book-bounce 2.5s ease-in-out infinite" }}>📚</div>
              <div className="flex-1">
                <div className="text-white/50 text-xs mb-0.5">ימי לימוד</div>
                <div className="text-white text-sm font-medium">שנותרו השנה</div>
              </div>
              <div className="text-white text-4xl font-light nums" style={{ animation: "countdown-pulse 1.6s ease-in-out infinite" }}>{remainingDays}</div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// TEACHER HOME
// ══════════════════════════════════════════════════════════
function TeacherHome({ session, data }: { session: any; data: HomeData | null }) {
  const now  = useTick()
  const { bgId, customUrl } = useBg("teacher")
  const [menuOpen, setMenuOpen] = useState(false)
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {}
    try { return JSON.parse(localStorage.getItem("teacher-student-notes") ?? "{}") } catch { return {} }
  })
  const [personalName] = useState(() => {
    if (typeof window === "undefined") return ""
    return getPersonalDisplayName()
  })
  const firstName = personalName || (session?.user?.name?.split(" ")[0] ?? "")
  const isAdmin   = (session?.user as any)?.role === "ADMIN"

  const timeStr = now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
  const dateStr = now.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })

  const unreadCount  = data?.recentMessages.length ?? 0
  const openTasks    = data?.openTasks ?? 0
  const teacherTasks = data?.teacherTasks ?? []
  const classStudents = data?.classStudents ?? []
  const remainingDays = getRemainingSchoolDays()
  const daysToSummer  = getDaysUntilSummer()
  const nextVac       = getNextVacation()
  const daysToVac     = getDaysUntilNextVacation()

  const todaySlots  = data?.todaySchedule ?? []
  const recentMsgs  = data?.recentMessages ?? []

  function saveNote(studentId: string, val: string) {
    const updated = { ...studentNotes, [studentId]: val }
    setStudentNotes(updated)
    try { localStorage.setItem("teacher-student-notes", JSON.stringify(updated)) } catch {}
  }

  const LINKS = [
    { label: "מענים אישיים",        href: "/teacher/accommodations", emoji: "🧩" },
    { label: "מעקב רגשי-חברתי",     href: "/teacher/emotional",      emoji: "💙" },
    { label: "מורה מקצועי",          href: "/teacher/subject",        emoji: "📚" },
    { label: "ריכוז שכבה",           href: "/teacher/grade-hub",      emoji: "🏫" },
  ]

  return (
    <div className="flex flex-col h-screen" dir="rtl">
      <NatureBackground bgId={bgId} customUrl={customUrl} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/70" />

      {/* ── Header ── */}
      <header className="relative z-20 flex items-center justify-between px-5 pb-2 header-pt flex-shrink-0" dir="ltr">
        {/* Left: date + time + settings gear */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <p className="text-white/50 text-[11px] font-medium">{dateStr}</p>
            <div className="text-white text-2xl font-light nums leading-tight">{timeStr}</div>
          </div>
          <Link href="/manage" className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white/70 interactive transition-colors mt-1">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </Link>
        </div>
        {/* Right: school + class + hamburger */}
        <div className="flex items-center gap-3">
          <div dir="rtl" className="text-right">
            <p className="text-white/55 text-xs font-medium tracking-widest uppercase">{data?.classProfile?.schoolName ?? "כפר סילבר"}</p>
            <p className="text-white/85 text-sm font-medium mt-0.5">{firstName} · {data?.classProfile?.displayName ?? ""}</p>
          </div>
          <button onClick={() => setMenuOpen(true)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] glass rounded-xl btn-press interactive">
            <span className="w-4 h-px bg-white/80 rounded-full block" />
            <span className="w-4 h-px bg-white/80 rounded-full block" />
            <span className="w-4 h-px bg-white/80 rounded-full block" />
          </button>
        </div>
      </header>

      {/* ── Slide-in menu ── */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="fixed top-0 bottom-0 z-40 w-64 bg-black/85 backdrop-blur-xl flex flex-col" style={{ right: 0 }} dir="rtl">
            <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-white/10">
              <span className="text-white font-semibold text-lg">תפריט</span>
              <button onClick={() => setMenuOpen(false)} className="text-white/60 hover:text-white text-xl interactive">✕</button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1">
              {[
                { label: "עמוד הבית",        href: "/home",      emoji: "🏠" },
                { label: "שיחות הורים",       href: "/dashboard", emoji: "💬" },
                { label: "משימות",            href: "/teacher/tasks", emoji: "✅" },
                { label: "מענים אישיים",      href: "/teacher/accommodations", emoji: "🧩" },
                { label: "מעקב רגשי-חברתי",  href: "/teacher/emotional",      emoji: "💙" },
                { label: "מורה מקצועי",       href: "/teacher/subject",        emoji: "📚" },
                { label: "ריכוז שכבה",        href: "/teacher/grade-hub",      emoji: "🏫" },
                { label: "הגדרות",            href: "/manage",    emoji: "⚙️" },
                ...(isAdmin ? [{ label: "פרופיל", href: "/profile", emoji: "👤" }] : []),
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 interactive transition-colors text-sm">
                  <span className="text-base">{item.emoji}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="px-4 pb-10 border-t border-white/10 pt-4">
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/50 hover:text-red-400 hover:bg-white/5 interactive text-sm">
                <span className="text-lg">🚪</span><span>יציאה</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Scrollable content ── */}
      <main className="relative z-10 flex-1 overflow-y-auto">

        {/* ── Above fold ── */}
        <div className="flex flex-col px-4 pt-2 gap-2.5" style={{ minHeight: "calc(100svh - 70px)" }}>

          {/* Recording button — always visible at top */}
          <Link href="/records?autostart=true"
            className="glass rounded-2xl px-4 py-2.5 flex items-center gap-3 hover:bg-white/15 interactive btn-press transition-colors animate-fade-in">
            <span className="text-lg">🎙️</span>
            <div className="flex-1">
              <div className="text-white/80 text-sm font-medium">הכתבה קולית</div>
              <div className="text-white/35 text-[10px]">הקלטת נתונים לתלמידים</div>
            </div>
            <span className="text-white/30 text-xs">←</span>
          </Link>

          {/* Row: Tasks + Parent chat */}
          <div className="flex gap-2.5 animate-fade-in stagger-1">

            <Link href="/teacher/tasks"
              className="flex-1 glass rounded-2xl p-3 btn-press interactive hover:bg-white/10 transition-colors min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-white/55 text-[10px] font-semibold uppercase tracking-wide">משימות</span>
                <span className="text-white font-semibold text-sm nums">{teacherTasks.length}</span>
              </div>
              {teacherTasks.length > 0 ? (
                <div className="space-y-1">
                  {teacherTasks.slice(0, 2).map(t => (
                    <div key={t.id} className="flex items-start gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <div className="text-white/70 text-[11px] leading-tight line-clamp-1">{t.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/30 text-[11px]">אין משימות</p>
              )}
            </Link>

            <Link href="/dashboard"
              className="flex-1 glass rounded-2xl p-3 btn-press interactive hover:bg-white/10 transition-colors min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-white/55 text-[10px] font-semibold uppercase tracking-wide">שיח הורים</span>
                <div className="flex gap-1.5 items-center">
                  {openTasks > 0 && <span className="bg-amber-400/80 text-black text-[9px] font-bold rounded-full px-1.5">{openTasks}</span>}
                  {unreadCount > 0 && <span className="bg-blue-400/80 text-black text-[9px] font-bold rounded-full px-1.5">{unreadCount}</span>}
                </div>
              </div>
              {recentMsgs.length > 0 ? (
                <div className="space-y-1">
                  {recentMsgs.slice(0, 2).map(m => (
                    <div key={m.id} className="flex items-start gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-white/70 text-[11px] leading-tight line-clamp-1">{m.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/30 text-[11px]">אין הודעות</p>
              )}
            </Link>
          </div>

          {/* Main row: Schedule (tall, left) + Events & buttons (right) */}
          <div className="flex gap-2.5 items-start animate-fade-in stagger-2 flex-1">

            {/* Left: Today's schedule — takes 55% width, shows all lessons */}
            <Link href="/teacher/schedule"
              className="glass rounded-2xl overflow-hidden hover:bg-white/10 interactive btn-press transition-colors"
              style={{ width: "55%" }}>
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                <span className="text-white/55 text-[10px] font-semibold uppercase tracking-wide">מערכת היום</span>
                <span className="text-white/25 text-[10px]">←</span>
              </div>
              <div className="divide-y divide-white/5">
                {todaySlots.length > 0 ? todaySlots.slice(0, 9).map((s, i) => {
                  const [period] = s.period.split(",")
                  const subject  = s.content.split(/\s{2,}/)[0]
                  return (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5">
                      <span className="text-white/30 text-[10px] font-mono w-3 flex-shrink-0">{period}</span>
                      <span className="text-white/70 text-[11px] truncate">{subject}</span>
                    </div>
                  )
                }) : (
                  <div className="px-3 py-3 text-white/25 text-[11px]">אין שיעורים היום</div>
                )}
              </div>
            </Link>

            {/* Right column: Events (3 items) + 2×2 feature buttons */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">

              {/* Events */}
              <Link href="/teacher/calendar"
                className="glass rounded-2xl overflow-hidden hover:bg-white/10 interactive btn-press transition-colors">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                  <span className="text-white/55 text-[10px] font-semibold uppercase tracking-wide">ארועים</span>
                  <span className="text-white/25 text-[10px]">←</span>
                </div>
                <div className="divide-y divide-white/5">
                  {(data?.upcomingEvents.length ?? 0) > 0 ? data!.upcomingEvents.slice(0, 3).map(ev => (
                    <div key={ev.id} className="flex items-center gap-2 px-3 py-1.5">
                      <div className="text-white/35 text-[10px] font-mono flex-shrink-0">
                        {new Date(ev.date).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
                      </div>
                      <div className="text-white/65 text-[11px] truncate">{ev.description}</div>
                    </div>
                  )) : (
                    <div className="px-3 py-2 text-white/25 text-[11px]">אין אירועים</div>
                  )}
                </div>
              </Link>

              {/* 2×2 feature buttons */}
              <div className="grid grid-cols-2 gap-2">
                {LINKS.map(l => (
                  <Link key={l.href} href={l.href}
                    className="glass rounded-2xl py-2.5 px-1 flex flex-col items-center gap-1 hover:bg-white/15 interactive btn-press transition-colors">
                    <span className="text-lg">{l.emoji}</span>
                    <span className="text-white/65 text-[9px] font-medium text-center leading-tight">{l.label}</span>
                  </Link>
                ))}
              </div>

            </div>
          </div>

          <div className="mb-2 flex justify-center opacity-30">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* ── Below fold ── */}
        <div className="px-4 pb-10 space-y-4 max-w-lg mx-auto">

          {/* Student list with notes */}
          {classStudents.length > 0 && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <p className="text-white/60 text-sm font-medium">תלמידי הכיתה</p>
                <span className="text-white/30 text-xs">{classStudents.length} תלמידים</span>
              </div>
              <div className="divide-y divide-white/5">
                {classStudents.map(s => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-xs font-medium flex-shrink-0">
                      {s.name.slice(0, 1)}
                    </div>
                    <span className="text-white/80 text-sm w-28 flex-shrink-0">{s.name}</span>
                    <input
                      value={studentNotes[s.id] ?? ""}
                      onChange={e => saveNote(s.id, e.target.value)}
                      placeholder="הערה..."
                      className="flex-1 bg-transparent text-white/50 text-xs placeholder:text-white/20 focus:outline-none focus:text-white/80 min-w-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Countdowns */}
          <div className="space-y-2">
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest text-center">ספירה לאחור</p>

            {nextVac && daysToVac > 0 && (
              <div className="glass rounded-2xl px-4 py-4 flex items-center gap-4">
                <div className="text-3xl" style={{ animation: "wiggle 2s ease-in-out infinite" }}>☕</div>
                <div className="flex-1">
                  <div className="text-white/50 text-xs mb-0.5">ימים עד</div>
                  <div className="text-white text-sm font-medium">{nextVac.name}</div>
                </div>
                <div className="text-white text-4xl font-light nums">{daysToVac}</div>
              </div>
            )}

            <div className="glass rounded-2xl px-4 py-4 flex items-center gap-4">
              <div className="text-3xl">🏖️</div>
              <div className="flex-1">
                <div className="text-white/50 text-xs mb-0.5">ימים עד</div>
                <div className="text-white text-sm font-medium">החופש הגדול</div>
              </div>
              <div className="text-white text-4xl font-light nums">{daysToSummer}</div>
            </div>

            <div className="glass rounded-2xl px-4 py-4 flex items-center gap-4">
              <div className="text-3xl">📝</div>
              <div className="flex-1">
                <div className="text-white/50 text-xs mb-0.5">ימי לימוד</div>
                <div className="text-white text-sm font-medium">שנותרו השנה</div>
              </div>
              <div className="text-white text-4xl font-light nums">{remainingDays}</div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// PARENT HOME
// ══════════════════════════════════════════════════════════
function CalendarModal({ items, title, onClose }: {
  items: CalendarEvent[]
  title: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm" dir="rtl" onClick={onClose}>
      <div className="mt-auto bg-stone-900 rounded-t-3xl max-h-[75vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10">
          <span className="text-white font-semibold">{title}</span>
          <button onClick={onClose} className="text-white/50 hover:text-white text-xl interactive">✕</button>
        </div>
        <div className="overflow-y-auto px-5 py-3 space-y-2 pb-8">
          {items.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">אין נתונים</p>
          ) : items.map(e => {
            const d = new Date(e.date)
            return (
              <div key={e.id} className="flex items-start gap-4 py-3 border-b border-white/5 last:border-0">
                <div className="flex-shrink-0 text-center">
                  <div className="text-white text-xl font-light nums leading-none">{d.getDate()}</div>
                  <div className="text-white/50 text-[10px] mt-0.5">
                    {d.toLocaleDateString("he-IL", { month: "short" })}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/85 text-sm leading-snug">{e.description}</p>
                  <p className="text-white/35 text-xs mt-0.5">
                    {d.toLocaleDateString("he-IL", { weekday: "long" })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ParentHome({ session, data }: { session: any; data: HomeData | null }) {
  const now = useTick()
  const { bgId, customUrl } = useBg("parent")
  const [menuOpen, setMenuOpen] = useState(false)
  const [calModal, setCalModal] = useState<{ title: string; items: CalendarEvent[] } | null>(null)
  const [personalName] = useState(() => {
    if (typeof window === "undefined") return ""
    return getPersonalDisplayName()
  })

  const firstName = personalName || (session?.user?.name?.split(" ")[0] ?? "")
  const timeStr = now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })

  const exams  = data?.upcomingExams  ?? []
  const events = data?.upcomingEvents ?? []
  const att    = data?.parentAttendance
  const grades = data?.grades ?? []

  return (
    <div className="flex flex-col h-screen" dir="rtl">
      <NatureBackground bgId={bgId} customUrl={customUrl} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/70" />

      {calModal && <CalendarModal title={calModal.title} items={calModal.items} onClose={() => setCalModal(null)} />}

      {/* ── Header ── */}
      <header className="relative z-20 flex items-center justify-between px-5 pb-2 header-pt flex-shrink-0" dir="ltr">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(true)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] glass rounded-xl btn-press interactive">
            <span className="w-4 h-px bg-white/80 rounded-full block" />
            <span className="w-4 h-px bg-white/80 rounded-full block" />
            <span className="w-4 h-px bg-white/80 rounded-full block" />
          </button>
          <div className="text-white text-2xl font-light nums">{timeStr}</div>
        </div>
        <div dir="rtl" className="text-right">
          <p className="text-white/55 text-xs font-medium tracking-widest uppercase">{data?.classProfile?.schoolName ?? "כפר סילבר"}</p>
          <p className="text-white/85 text-sm font-medium mt-0.5">
            {data?.classProfile?.displayName} · מחנך: {data?.classProfile?.teacherDisplayName ?? "—"}
          </p>
        </div>
      </header>

      {/* ── Slide-in menu ── */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="fixed top-0 bottom-0 z-40 w-64 bg-black/85 backdrop-blur-xl flex flex-col" style={{ right: 0 }} dir="rtl">
            <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-white/10">
              <span className="text-white font-semibold text-lg">תפריט</span>
              <button onClick={() => setMenuOpen(false)} className="text-white/60 hover:text-white text-xl interactive">✕</button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1">
              {[
                { label: "עמוד הבית",   href: "/home",         emoji: "🏠" },
                { label: "צ׳אט עם המחנך", href: "/chat",       emoji: "💬" },
                { label: "הגדרות אישיות", href: "/manage", emoji: "⚙️" },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 interactive transition-colors text-sm">
                  <span className="text-lg">{item.emoji}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="px-4 pb-10 border-t border-white/10 pt-4">
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/50 hover:text-red-400 hover:bg-white/5 interactive text-sm">
                <span className="text-lg">🚪</span><span>יציאה</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Scrollable content ── */}
      <main className="relative z-10 flex-1 overflow-y-auto">

        {/* ── Above fold ── */}
        <div className="flex flex-col justify-center px-6 pt-2" style={{ minHeight: "calc(100svh - 70px)" }}>
          <p className="text-white/60 text-sm font-medium tracking-wide mb-2 animate-fade-in">
            {now.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="text-white font-light leading-none animate-fade-in stagger-1"
            style={{ fontSize: "clamp(2.8rem, 13vw, 5rem)" }}>
            שלום, {firstName}
          </h1>

          {/* Chat CTA */}
          <Link href="/chat"
            className="mt-6 glass rounded-2xl px-4 py-3.5 flex items-center gap-3 btn-press interactive hover:bg-white/15 transition-colors animate-fade-in stagger-2">
            <span className="text-2xl">💬</span>
            <div className="flex-1">
              <div className="text-white font-medium text-sm">פנייה למחנך</div>
              <div className="text-white/50 text-xs">מענה מיידי דרך הבוט</div>
            </div>
            <span className="text-white/40">←</span>
          </Link>

          {/* Exams + Events side by side */}
          <div className="flex gap-3 mt-4 animate-fade-in stagger-3">
            {/* Exams */}
            <button
              onClick={() => setCalModal({ title: "מבחנים קרובים", items: exams })}
              className="flex-1 glass rounded-2xl px-3 py-3 text-right hover:bg-white/15 interactive btn-press transition-colors">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wide mb-2">מבחנים קרובים</p>
              {exams.length === 0 ? (
                <p className="text-white/30 text-xs">אין מבחנים</p>
              ) : exams.slice(0, 3).map(e => (
                <div key={e.id} className="flex items-center gap-2 mb-1.5 last:mb-0">
                  <span className="text-white/40 text-[10px] nums flex-shrink-0" dir="ltr">
                    {new Date(e.date).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
                  </span>
                  <span className="text-white/75 text-xs truncate leading-tight">{e.description}</span>
                </div>
              ))}
              {exams.length > 3 && <p className="text-white/30 text-[10px] mt-1">+{exams.length - 3} עוד ←</p>}
            </button>

            {/* Events */}
            <button
              onClick={() => setCalModal({ title: "אירועים קרובים", items: events })}
              className="flex-1 glass rounded-2xl px-3 py-3 text-right hover:bg-white/15 interactive btn-press transition-colors">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wide mb-2">אירועים</p>
              {events.length === 0 ? (
                <p className="text-white/30 text-xs">אין אירועים</p>
              ) : events.slice(0, 3).map(e => (
                <div key={e.id} className="flex items-center gap-2 mb-1.5 last:mb-0">
                  <span className="text-white/40 text-[10px] nums flex-shrink-0" dir="ltr">
                    {new Date(e.date).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
                  </span>
                  <span className="text-white/75 text-xs truncate leading-tight">{e.description}</span>
                </div>
              ))}
              {events.length > 3 && <p className="text-white/30 text-[10px] mt-1">+{events.length - 3} עוד ←</p>}
            </button>
          </div>

          <div className="mt-8 flex justify-center opacity-40 animate-bounce">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* ── Below fold ── */}
        <div className="px-4 pb-10 space-y-3 max-w-sm mx-auto">

          {/* Behavior stats */}
          {att && (
            <div className="glass rounded-2xl p-4">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wide mb-3">נוכחות והתנהגות</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "חיסורים", val: att.absences, sub: att.justifiedAbsences > 0 ? `${att.justifiedAbsences} מוצדקים` : null, color: att.absences > 5 ? "text-red-300" : "text-white" },
                  { label: "איחורים", val: att.tardiness, sub: att.justifiedTardiness > 0 ? `${att.justifiedTardiness} מוצדקים` : null, color: att.tardiness > 3 ? "text-amber-300" : "text-white" },
                  { label: "סה״כ שיעורים", val: att.totalLessons, sub: null, color: "text-white" },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 rounded-xl px-2 py-3 text-center">
                    <div className={`text-2xl font-light nums ${s.color}`}>{s.val}</div>
                    <div className="text-white/50 text-[10px] mt-1 leading-tight">{s.label}</div>
                    {s.sub && <div className="text-white/30 text-[9px] mt-0.5">{s.sub}</div>}
                  </div>
                ))}
              </div>
              {att.totalLessons > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-white/40 mb-1">
                    <span>נוכחות</span>
                    <span>{Math.round(((att.totalLessons - att.absences) / att.totalLessons) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white/60 rounded-full"
                      style={{ width: `${Math.round(((att.totalLessons - att.absences) / att.totalLessons) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grades */}
          {grades.length > 0 && (
            <div className="glass rounded-2xl p-4">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wide mb-3">ציונים</p>
              <div className="space-y-3">
                {grades.map((g, i) => {
                  const avg = g.weightedAverage != null ? Math.round(g.weightedAverage) : null
                  const components = Array.isArray(g.gradeComponents) ? g.gradeComponents : []
                  return (
                    <div key={i} className="border-b border-white/8 last:border-0 pb-3 last:pb-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white/85 text-sm font-medium">{g.subject}</span>
                        {avg != null && (
                          <span className={`text-lg font-light nums ${avg >= 80 ? "text-green-300" : avg >= 60 ? "text-amber-300" : "text-red-300"}`}>
                            {avg}
                          </span>
                        )}
                      </div>
                      {components.length > 0 && (
                        <div className="space-y-1">
                          {components.map((c, j) => (
                            <div key={j} className="flex items-center justify-between text-xs">
                              <span className="text-white/45 truncate max-w-[160px]">{c.name}</span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-white/30 text-[10px]">{Math.round(c.weight * 100)}%</span>
                                <span className="text-white/65 nums">{c.score}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {g.teacherName && (
                        <p className="text-white/30 text-[10px] mt-1">{g.teacherName}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state for grades/behavior */}
          {!att && grades.length === 0 && (
            <div className="glass rounded-2xl px-4 py-8 text-center">
              <p className="text-white/30 text-sm">אין נתוני תלמיד זמינים עדיין</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════
const HOME_CACHE_KEY = "home-data-cache"

function loadCachedHomeData(): HomeData | null {
  try {
    const s = localStorage.getItem(HOME_CACHE_KEY)
    return s ? JSON.parse(s) : null
  } catch { return null }
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<HomeData | null>(() => {
    if (typeof window === "undefined") return null
    return loadCachedHomeData()
  })
  const role = (session?.user as any)?.role ?? "PARENT"

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/home")
    if (res.ok) {
      const json = await res.json()
      setData(json)
      try { localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(json)) } catch {}
    }
  }, [])

  useEffect(() => { if (status !== "loading") fetchData() }, [fetchData, status])

  // Show skeleton only if no cached data AND still loading auth
  if (status === "loading" && !data) return <LoadingSkeleton />

  if (role === "STUDENT") return <StudentHome session={session} data={data} />
  if (role === "TEACHER" || role === "ADMIN") return <TeacherHome session={session} data={data} />
  return <ParentHome session={session} data={data} />
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-stone-900" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-b from-stone-800 to-stone-900 animate-pulse" />
      <div className="relative z-10 flex flex-col justify-center px-6 h-full gap-4">
        <div className="h-3 w-24 bg-white/10 rounded-full" />
        <div className="h-16 w-56 bg-white/10 rounded-2xl" />
        <div className="h-4 w-40 bg-white/10 rounded-full" />
        <div className="flex gap-3 mt-4">
          {[1,2,3].map(i => <div key={i} className="flex-1 h-20 bg-white/10 rounded-2xl" />)}
        </div>
      </div>
    </div>
  )
}
