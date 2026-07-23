"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import BottomNav from "@/app/components/BottomNav"
import { NatureBackground, BG_OPTIONS } from "@/app/components/NatureBackground"
import VoiceButton from "@/app/home/VoiceButton"
import {
  getRemainingSchoolDays, getDaysUntilSummer, getNextVacation, getDaysUntilNextVacation,
} from "@/lib/school-calendar"
import {
  getPersonalEvents, getPersonalDisplayName, getPersonalBackground, getCustomBgUrl, getQuoteCategories,
  setPersonalBackground as storeSaveBg, setPersonalDisplayName as storeSaveName, setQuoteCategories as storeSaveQCats,
} from "@/app/components/personalStore"
import PushManager from "@/app/components/PushManager"
import { getDailyQuote, getCategoryEmoji, CATEGORIES, type Quote, type QuoteCategory } from "@/lib/quotes"
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
  const router = useRouter()
  const { bgId, customUrl } = useBg("student")
  const [menuOpen, setMenuOpen] = useState(false)
  const [joinCode, setJoinCode] = useState("")
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
      <div className="fixed inset-0" style={{ zIndex: -2 }}><NatureBackground bgId={bgId} customUrl={customUrl} /></div>
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-black/50 via-black/10 to-black/70" style={{ zIndex: -1 }} />

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

          {/* Join lesson */}
          <div className="mt-5 glass rounded-2xl px-4 py-3 flex items-center gap-2 animate-fade-in stagger-3">
            <span className="text-white/60 text-xs font-semibold whitespace-nowrap">📡 קוד שיעור</span>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              onKeyDown={e => { if (e.key === "Enter" && joinCode.length === 6) router.push(`/live/${joinCode}`) }}
              placeholder="XXXXXX"
              maxLength={6}
              dir="ltr"
              className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white placeholder:text-white/25 text-sm font-mono tracking-widest focus:outline-none focus:border-white/50 text-center"
            />
            <button
              onClick={() => { if (joinCode.length === 6) router.push(`/live/${joinCode}`) }}
              disabled={joinCode.length !== 6}
              className="bg-white/20 disabled:opacity-30 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors interactive">
              כנס
            </button>
          </div>

          <div className="mt-6 flex justify-center opacity-40 animate-bounce">
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
// SETTINGS PANEL (page 5 of teacher swipe flow)
// ══════════════════════════════════════════════════════════
function SettingsPanel({ isAdmin }: { isAdmin: boolean }) {
  const [displayName, setDisplayNameState] = useState(() =>
    typeof window !== "undefined" ? getPersonalDisplayName() : ""
  )
  const [selectedBg, setSelectedBg] = useState(() =>
    typeof window !== "undefined" ? getPersonalBackground() : ""
  )
  const [qCats, setQCatsState] = useState<QuoteCategory[]>(() =>
    typeof window !== "undefined" ? getQuoteCategories() : ["חינוך", "הומור", "הידעת"]
  )

  function saveName(val: string) {
    storeSaveName(val.trim())
  }

  function pickBg(id: string) {
    setSelectedBg(id)
    storeSaveBg(id)
    window.dispatchEvent(new CustomEvent("bg-changed", { detail: id }))
  }

  function toggleCat(cat: QuoteCategory) {
    const next = qCats.includes(cat) ? qCats.filter(c => c !== cat) : [...qCats, cat]
    if (!next.length) return
    setQCatsState(next)
    storeSaveQCats(next)
  }

  return (
    <div className="space-y-3">

      {/* Profile */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest">פרופיל</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-base font-semibold flex-shrink-0">
            {displayName ? displayName.slice(0, 1) : "?"}
          </div>
          <input
            value={displayName}
            onChange={e => setDisplayNameState(e.target.value)}
            onBlur={e => saveName(e.target.value)}
            placeholder="שם תצוגה"
            dir="rtl"
            className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:bg-white/15 transition-colors"
          />
        </div>
      </div>

      {/* Background */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest">רקע</p>
        <div className="grid grid-cols-4 gap-2">
          {BG_OPTIONS.map(bg => (
            <button
              key={bg.id}
              onClick={() => pickBg(bg.id)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all ${
                selectedBg === bg.id
                  ? "bg-white/25 ring-1 ring-white/40"
                  : "bg-white/5 hover:bg-white/15"
              }`}
            >
              <span className="text-xl">{bg.emoji}</span>
              <span className="text-white/50 text-[9px] text-center leading-tight px-0.5">{bg.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Daily quote categories */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest">ציטוטים יומיים</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => toggleCat(cat)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                qCats.includes(cat)
                  ? "bg-white/25 text-white"
                  : "bg-white/5 text-white/40 hover:bg-white/12"
              }`}
            >
              {getCategoryEmoji(cat)} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Push notifications */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest">התראות</p>
        <PushManager />
      </div>

      {/* Admin-only links */}
      {isAdmin && (
        <>
          <Link href="/manage?tab=import"
            className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-white/15 interactive btn-press transition-colors">
            <span className="text-2xl">📋</span>
            <div className="flex-1">
              <div className="text-white/80 text-sm font-medium">ייבוא נתונים</div>
              <div className="text-white/40 text-xs">מערכת, אירועים, ציונים</div>
            </div>
            <span className="text-white/30">←</span>
          </Link>
          <Link href="/manage?tab=users"
            className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-white/15 interactive btn-press transition-colors">
            <span className="text-2xl">👥</span>
            <div className="flex-1">
              <div className="text-white/80 text-sm font-medium">ניהול משתמשים</div>
              <div className="text-white/40 text-xs">תלמידים, הורים, מורים</div>
            </div>
            <span className="text-white/30">←</span>
          </Link>
        </>
      )}

      {/* Sign out */}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-white/10 interactive btn-press transition-colors">
        <span className="text-xl">🚪</span>
        <span className="text-white/50 text-sm">יציאה</span>
      </button>

    </div>
  )
}

// ══════════════════════════════════════════════════════════
// TEACHER HOME
// ══════════════════════════════════════════════════════════
function TeacherHome({ session, data }: { session: any; data: HomeData | null }) {
  const now  = useTick()
  const router = useRouter()
  const { bgId, customUrl } = useBg("teacher")
  const [menuOpen, setMenuOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [dragDelta, setDragDelta] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {}
    try { return JSON.parse(localStorage.getItem("teacher-student-notes") ?? "{}") } catch { return {} }
  })
  const [personalName] = useState(() => {
    if (typeof window === "undefined") return ""
    return getPersonalDisplayName()
  })
  const [quoteOffset, setQuoteOffset] = useState(0)
  const quoteCategories = typeof window !== "undefined" ? getQuoteCategories() : []
  const dailyQuote = getDailyQuote(quoteCategories, quoteOffset)
  const firstName = personalName || (session?.user?.name?.split(" ")[0] ?? "")
  const isAdmin   = (session?.user as any)?.role === "ADMIN"

  const timeStr = now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
  const dateStr = now.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })

  const recentMsgs    = data?.recentMessages ?? []
  const openTasks     = data?.openTasks ?? 0
  const teacherTasks  = data?.teacherTasks ?? []
  const classStudents = data?.classStudents ?? []
  const todaySlots    = data?.todaySchedule ?? []
  const upcomingEvents = data?.upcomingEvents ?? []
  const remainingDays = getRemainingSchoolDays()
  const daysToSummer  = getDaysUntilSummer()
  const nextVac       = getNextVacation()
  const daysToVac     = getDaysUntilNextVacation()
  const lessonStatus  = getLessonStatus(todaySlots, now)

  // Personal tasks sorted by urgency (closest deadline first, no-deadline last), max 7
  const sortedTasks = [...teacherTasks]
    .filter(t => !t.done)
    .sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    })
    .slice(0, 6)

  // Schedule: parsed slots with current/next detection
  const parsedSlots: ParsedSlot[] = todaySlots
    .map(s => { const p = parsePeriodStr(s.period); if (!p) return null; return { ...p, subject: parseSubject(s.content), content: s.content } })
    .filter(Boolean) as ParsedSlot[]

  function isCurrentSlot(slot: ParsedSlot) {
    return lessonStatus.type === "in-class" && (lessonStatus as any).slot?.start === slot.start
  }
  function isNextSlot(slot: ParsedSlot) {
    return lessonStatus.type === "break" && (lessonStatus as any).next?.start === slot.start
  }

  function saveNote(studentId: string, val: string) {
    const updated = { ...studentNotes, [studentId]: val }
    setStudentNotes(updated)
    try { localStorage.setItem("teacher-student-notes", JSON.stringify(updated)) } catch {}
  }

  function fmtDeadline(dl: string | null) {
    if (!dl) return null
    const d = new Date(dl)
    const today = new Date(); today.setHours(0,0,0,0)
    const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000)
    if (diff < 0)  return { text: "פג תוקף", urgent: true }
    if (diff === 0) return { text: "היום", urgent: true }
    if (diff === 1) return { text: "מחר", urgent: true }
    if (diff <= 7)  return { text: `${diff} ימים`, urgent: false }
    return { text: d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" }), urgent: false }
  }

  const NUM_PAGES = 5
  const NUM_LABELS = ["בית", "יומן", "תפריט", "כיתה"] // kept for accessibility/future use
  const MENU_LINKS = [
    { label: "שיעורים חיים",      href: "/lessons",                emoji: "🎓", soon: false },
    { label: "מענים אישיים",     href: "/teacher/accommodations", emoji: "🧩", soon: false },
    { label: "מעקב רגשי-חברתי",  href: "/teacher/emotional",      emoji: "💙", soon: false },
    { label: "לוח KPI",           href: "/kpi",                    emoji: "📊", soon: false },
    { label: "מורה מקצועי",       href: "/teacher/subject",        emoji: "📚", soon: false },
    { label: "ניהול שכבה",        href: "/teacher/grade-hub",      emoji: "🏫", soon: false },
    { label: "הגדרות",            href: "/manage",                 emoji: "⚙️", soon: false },
    { label: "גרסת תלמיד",        href: "#",                       emoji: "🎒", soon: true  },
  ]

  // Swipe handlers — distinguish horizontal (page) from vertical (scroll)
  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    setDragging(false)
    setDragDelta(0)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return
    const dx = e.touches[0].clientX - touchStart.current.x
    const dy = e.touches[0].clientY - touchStart.current.y
    if (!dragging && Math.abs(dx) < 8 && Math.abs(dy) < 8) return
    if (!dragging) {
      if (Math.abs(dx) > Math.abs(dy) * 1.5) {
        setDragging(true)
      } else {
        touchStart.current = null
        return
      }
    }
    if (dragging) {
      setDragDelta(Math.max(-140, Math.min(140, dx)))
    }
  }

  function onTouchEnd() {
    if (!dragging) return
    if (dragDelta < -40 && page < NUM_PAGES - 1) setPage(p => p + 1)
    if (dragDelta > 40 && page > 0) setPage(p => p - 1)
    setDragging(false)
    setDragDelta(0)
    touchStart.current = null
  }

  const translateX = `calc(${-page * 100}vw + ${dragDelta}px)`

  return (
    <div className="flex flex-col h-screen" dir="rtl">
      <div className="fixed inset-0" style={{ zIndex: -2 }}><NatureBackground bgId={bgId} customUrl={customUrl} /></div>
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-black/50 via-black/10 to-black/70" style={{ zIndex: -1 }} />

      {/* ── Header ── */}
      <header className="relative z-20 flex items-center justify-between px-4 pb-1.5 header-pt flex-shrink-0" dir="ltr">
        <p className="text-white/45 text-[11px] font-medium">{dateStr}</p>
        <div className="flex items-center gap-2.5">
          <div dir="rtl" className="text-right leading-tight">
            <p className="text-white/80 text-[12px] font-medium">{firstName} · {data?.classProfile?.displayName ?? ""}</p>
          </div>
          <button onClick={() => setMenuOpen(true)}
            className="w-7 h-7 flex items-center justify-center glass rounded-lg btn-press interactive">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-white/80">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Slide-in hamburger menu ── */}
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
                { label: "עמוד הבית",       href: "/home",                   emoji: "🏠" },
                { label: "שיעורים חיים",     href: "/lessons",                emoji: "🎓" },
                { label: "שיחות הורים",      href: "/dashboard",              emoji: "💬" },
                { label: "משימות",           href: "/teacher/tasks",          emoji: "✅" },
                { label: "מענים אישיים",     href: "/teacher/accommodations", emoji: "🧩" },
                { label: "מעקב רגשי-חברתי", href: "/teacher/emotional",      emoji: "💙" },
                { label: "מורה מקצועי",      href: "/teacher/subject",        emoji: "📚" },
                { label: "ניהול שכבה",       href: "/teacher/grade-hub",      emoji: "🏫" },
                { label: "הגדרות",           href: "/manage",                 emoji: "⚙️" },
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

      {/* ── Page tabs ── */}
      <div className="relative z-10 flex items-center justify-center gap-1 pb-1.5 flex-shrink-0 px-4">
        {([
          { i: 0, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/></svg> },
          { i: 1, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { i: 2, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg> },
          { i: 3, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
          { i: 4, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
        ] as const).map(({ i, icon }) => (
          <button key={i} onClick={() => setPage(i)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all btn-press ${
              page === i ? "bg-white/20 text-white" : "text-white/30 hover:text-white/60"
            }`}>
            {icon}
          </button>
        ))}
      </div>

      {/* ── Swipeable pages ── */}
      <main
        dir="ltr"
        className="relative z-10 flex-1 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          dir="ltr"
          className="flex h-full"
          style={{
            width: `${NUM_PAGES * 100}vw`,
            transform: `translateX(${translateX})`,
            transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >

          {/* ══ PAGE 1: בית ══ */}
          <div dir="rtl" className="overflow-y-auto" style={{ width: "100vw" }}>
            <div className="flex flex-col px-4 pt-2 pb-10 gap-3">

              {/* Parent chat */}
              <Link href="/dashboard" className="glass rounded-2xl overflow-hidden hover:bg-white/10 interactive btn-press transition-colors">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💬</span>
                    <span className="text-white/70 text-sm font-medium">שיחות הורים</span>
                  </div>
                  <div className="flex gap-1.5">
                    {openTasks > 0 && <span className="bg-amber-400/80 text-black text-[9px] font-bold rounded-full px-1.5 py-0.5">{openTasks} משימות</span>}
                    {recentMsgs.length > 0 && <span className="bg-blue-400/80 text-black text-[9px] font-bold rounded-full px-1.5 py-0.5">{recentMsgs.length} חדש</span>}
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  {recentMsgs.length > 0 ? recentMsgs.slice(0, 3).map(m => (
                    <div key={m.id} className="flex items-start gap-2.5 px-4 py-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-white/50 text-[10px]">{m.sender?.name ?? m.student?.name}</span>
                        </div>
                        <div className="text-white/75 text-[11px] leading-tight line-clamp-1">{m.content}</div>
                      </div>
                    </div>
                  )) : (
                    <div className="px-4 py-3 text-white/25 text-xs">אין הודעות שלא נקראו</div>
                  )}
                </div>
              </Link>

              {/* Personal tasks */}
              <Link href="/teacher/tasks" className="glass rounded-2xl overflow-hidden hover:bg-white/10 interactive btn-press transition-colors">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-base">✅</span>
                    <span className="text-white/70 text-sm font-medium">משימות אישיות</span>
                  </div>
                  {sortedTasks.length > 0 && (
                    <span className="text-white/40 text-xs">{sortedTasks.length} פתוחות</span>
                  )}
                </div>
                {sortedTasks.length > 0 ? (
                  <div className="grid grid-cols-2 gap-px p-2">
                    {sortedTasks.map(t => {
                      const dl = fmtDeadline(t.deadline)
                      return (
                        <div key={t.id} className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${dl?.urgent ? "bg-red-400" : "bg-amber-400"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-white/80 text-[11px] leading-snug line-clamp-2">{t.description}</div>
                            {dl && (
                              <div className={`text-[10px] mt-0.5 font-medium ${dl.urgent ? "text-red-400" : "text-white/35"}`}>
                                {dl.text}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-white/25 text-xs">אין משימות פתוחות</div>
                )}
              </Link>

              {/* Daily quote */}
              {dailyQuote && (
                <button
                  onClick={() => setQuoteOffset(o => o + 1)}
                  className="glass rounded-2xl px-4 py-3 w-full text-right active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-base flex-shrink-0 mt-0.5">{getCategoryEmoji(dailyQuote.category)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/75 text-sm leading-relaxed">{dailyQuote.text}</p>
                      {dailyQuote.author && (
                        <p className="text-white/30 text-[11px] mt-1">— {dailyQuote.author}</p>
                      )}
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-white/20 flex-shrink-0 mt-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </button>
              )}

              {/* Voice assistant */}
              <VoiceButton />

            </div>
          </div>

          {/* ══ PAGE 2: מערכות ══ */}
          <div dir="rtl" className="overflow-y-auto" style={{ width: "100vw" }}>
            <div className="px-4 pt-2 pb-10 space-y-3">

              {/* Teacher schedule */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
                  <span className="text-white/65 text-sm font-medium">מערכת המורה — היום</span>
                  <Link href="/teacher/schedule" className="text-white/30 text-[11px] interactive">כל המערכת ←</Link>
                </div>
                <div className="divide-y divide-white/5">
                  {parsedSlots.length > 0 ? parsedSlots.map((s, i) => {
                    const isCurrent = isCurrentSlot(s)
                    const isNext    = isNextSlot(s)
                    return (
                      <div key={i} className={`flex items-center gap-3 px-4 py-2 ${isCurrent ? "bg-white/10" : ""}`}>
                        <span className={`text-[10px] font-mono w-4 flex-shrink-0 ${isCurrent ? "text-white" : "text-white/30"}`}>{s.num}</span>
                        <span className={`flex-1 text-[12px] truncate ${isCurrent ? "text-white font-medium" : "text-white/65"}`}>{s.subject}</span>
                        <span className="text-white/25 text-[10px]">{s.start}–{s.end}</span>
                        {isCurrent && <span className="text-[9px] bg-green-500/30 text-green-300 px-1.5 py-0.5 rounded-full">עכשיו</span>}
                        {isNext    && <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded-full">הבא</span>}
                      </div>
                    )
                  }) : (
                    <div className="px-4 py-4 text-white/25 text-sm text-center">אין שיעורים היום</div>
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

              {/* Class schedule placeholder */}
              <div className="glass rounded-2xl overflow-hidden border border-dashed border-white/10">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
                  <span className="text-white/40 text-sm font-medium">מערכת הכיתה</span>
                  <span className="text-[9px] bg-white/10 text-white/35 px-1.5 py-0.5 rounded-full">בקרוב</span>
                </div>
                <div className="px-4 py-4 text-white/20 text-xs text-center">מערכת שעות של הכיתה תופיע כאן</div>
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

          {/* ══ PAGE 3: תפריט ══ */}
          <div dir="rtl" className="overflow-y-auto" style={{ width: "100vw" }}>
            <div className="px-4 pt-3 pb-10">
              <div className="grid grid-cols-2 gap-3">
                {MENU_LINKS.map(l => (
                  l.soon ? (
                    <div key={l.label} className="glass rounded-2xl py-6 flex flex-col items-center gap-2 opacity-40 relative border border-dashed border-white/20">
                      <span className="text-3xl">{l.emoji}</span>
                      <span className="text-white/60 text-xs font-medium text-center leading-tight">{l.label}</span>
                      <span className="absolute top-2 left-2 text-[9px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full">בקרוב</span>
                    </div>
                  ) : (
                    <Link key={l.label} href={l.href}
                      className="glass rounded-2xl py-6 flex flex-col items-center gap-2 hover:bg-white/15 interactive btn-press transition-colors">
                      <span className="text-3xl">{l.emoji}</span>
                      <span className="text-white/75 text-xs font-medium text-center leading-tight">{l.label}</span>
                    </Link>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* ══ PAGE 4: ניהול כיתה ══ */}
          <div dir="rtl" className="overflow-y-auto" style={{ width: "100vw" }}>
            <div className="px-4 pt-2 pb-10 space-y-3">

              {/* 2-col student grid */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
                  <span className="text-white/65 text-sm font-medium">תלמידי הכיתה</span>
                  <span className="text-white/30 text-xs">{classStudents.length} תלמידים</span>
                </div>
                {classStudents.length > 0 ? (
                  <div className="grid grid-cols-2 divide-x divide-x-reverse divide-white/5">
                    {classStudents.map((s, i) => (
                      <div key={s.id} className={`flex items-center gap-2 px-3 py-2.5 ${i % 2 === 0 ? "border-b border-white/5" : "border-b border-white/5"}`}>
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-[10px] font-medium flex-shrink-0">
                          {s.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-white/80 text-[11px] truncate">{s.name}</div>
                          <input
                            value={studentNotes[s.id] ?? ""}
                            onChange={e => saveNote(s.id, e.target.value)}
                            placeholder="הערה..."
                            className="w-full bg-transparent text-white/40 text-[10px] placeholder:text-white/15 focus:outline-none focus:text-white/70"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-white/25 text-sm text-center">אין תלמידים</div>
                )}
              </div>

              {/* Tests/assignments board — placeholder */}
              <div className="glass rounded-2xl overflow-hidden border border-dashed border-white/10">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
                  <span className="text-2xl">📋</span>
                  <span className="text-white/40 text-sm font-medium">לוח מבחנים ומשימות</span>
                  <span className="text-[9px] bg-white/10 text-white/35 px-1.5 py-0.5 rounded-full">בקרוב</span>
                </div>
                <div className="px-4 py-4 text-white/20 text-xs text-center">מבחנים ומשימות כיתתיות יופיעו כאן</div>
              </div>

              {/* Events (class) */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
                  <span className="text-white/65 text-sm font-medium">אירועי כיתה</span>
                  <Link href="/teacher/calendar" className="text-white/30 text-[11px] interactive">כולם ←</Link>
                </div>
                <div className="divide-y divide-white/5">
                  {upcomingEvents.length > 0 ? upcomingEvents.slice(0, 5).map(ev => (
                    <div key={ev.id} className="flex items-center gap-3 px-4 py-2">
                      <div className="text-white/35 text-[10px] font-mono w-10 flex-shrink-0">
                        {new Date(ev.date).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
                      </div>
                      <div className="text-white/70 text-[12px] flex-1 truncate">{ev.description}</div>
                    </div>
                  )) : (
                    <div className="px-4 py-3 text-white/25 text-xs text-center">אין אירועים</div>
                  )}
                </div>
              </div>

              {/* Forum placeholder */}
              <div className="glass rounded-2xl overflow-hidden border border-dashed border-white/10">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
                  <span className="text-2xl">📢</span>
                  <span className="text-white/40 text-sm font-medium">פורום כיתתי</span>
                  <span className="text-[9px] bg-white/10 text-white/35 px-1.5 py-0.5 rounded-full">בקרוב</span>
                </div>
                <div className="px-4 py-4 text-white/20 text-xs text-center">הודעות, טפסים וקבצים משותפים</div>
              </div>

              {/* Seating placeholder */}
              <div className="glass rounded-2xl overflow-hidden border border-dashed border-white/10">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
                  <span className="text-2xl">🪑</span>
                  <span className="text-white/40 text-sm font-medium">תצוגת כיתה</span>
                  <span className="text-[9px] bg-white/10 text-white/35 px-1.5 py-0.5 rounded-full">בקרוב</span>
                </div>
                <div className="px-4 py-4 text-white/20 text-xs text-center">סידור ישיבה עם שמות התלמידים</div>
              </div>

            </div>
          </div>

          {/* ══ PAGE 5: הגדרות ══ */}
          <div dir="rtl" className="overflow-y-auto" style={{ width: "100vw" }}>
            <div className="px-4 pt-3 pb-10">
              <SettingsPanel isAdmin={isAdmin} />
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
      <div className="fixed inset-0" style={{ zIndex: -2 }}><NatureBackground bgId={bgId} customUrl={customUrl} /></div>
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-black/50 via-black/10 to-black/70" style={{ zIndex: -1 }} />

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
  const role = (session?.user as any)?.role as string | undefined

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/home")
    if (res.ok) {
      const json = await res.json()
      setData(json)
      try { localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(json)) } catch {}
    }
  }, [])

  useEffect(() => { if (status !== "loading") fetchData() }, [fetchData, status])

  // Block render until role is known — avoids flash of wrong role
  if (status === "loading" || !role) return <LoadingSkeleton />

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
