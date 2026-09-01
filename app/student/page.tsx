"use client"

import { useState, useRef, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import BottomNav from "@/app/components/BottomNav"
import ComingSoon from "@/app/components/ComingSoon"
import { getPersonalDisplayName } from "@/app/components/personalStore"

interface Message {
  role: "user" | "bot"
  text: string
}

const QUICK_ACTIONS = [
  { label: "📊 הציונים שלי", text: "מה הציונים שלי?" },
  { label: "📅 מה יש היום?", text: "מה יש לי היום במערכת השעות?" },
  { label: "📝 מבחנים קרובים", text: "אילו מבחנים קרובים?" },
  { label: "📈 ממוצע הכיתה", text: "מה ממוצע הכיתה?" },
]

const IconHome = () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
const IconInfo = () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const IconCalendar = () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
const IconTrophy = () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6v5a3 3 0 11-6 0V4z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H6a1 1 0 00-1 1v1a3 3 0 003 3M15 5h3a1 1 0 011 1v1a3 3 0 01-3 3m-6 6h6m-3-3v3m-3 3h6" /></svg>
const IconBook = () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
const IconStar = () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>

function BotThinking() {
  return (
    <div className="flex gap-2 items-start">
      <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow">
        <span className="text-white text-xs font-bold">כ</span>
      </div>
      <div className="bg-stone-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 150, 300].map(d => (
          <span key={d} className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  )
}

const CHAT_STORAGE_KEY = "student-chat-history"

/* ── Board tab: countdowns + today's schedule + upcoming events ────── */
const HEB_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"]

interface ScheduleSlotT { id: string; dayHeb: string; period: string; content: string }
interface EventT { id: string; date: string; description: string; type: string | null; note: string | null }
interface BellSlotT { id: string; period: string; startTime: string; endTime: string; dayType: string; order: number }

function parsePeriod(period: string): { num: number; start?: string; end?: string } {
  const [numPart, timePart] = period.split(",").map(s => s.trim())
  const num = parseInt(numPart, 10) || 0
  if (!timePart) return { num }
  const [start, end] = timePart.split("-").map(s => s.trim())
  return { num, start, end }
}

function timeToMinutes(t?: string): number | null {
  if (!t) return null
  const m = t.match(/(\d{1,2}):(\d{2})/)
  if (!m) return null
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function fmtEventDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })
}

// Matched against free-text type/description fields from the school's own event
// spreadsheet — there's no fixed category enum, so this is a best-effort keyword
// match rather than a guaranteed classification.
function isVacationEvent(ev: EventT) { return /חופש/.test(`${ev.type ?? ""} ${ev.description ?? ""}`) }
function isSummerEvent(ev: EventT) { return /(חופש[^׀-ת]{0,6}גדול|קיץ)/.test(`${ev.type ?? ""} ${ev.description ?? ""}`) }
function isExamEvent(ev: EventT) { return /(מבחן|בוחן)/.test(`${ev.type ?? ""} ${ev.description ?? ""}`) }

function CountdownCard({ emoji, label, event }: { emoji: string; label: string; event: EventT | null }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 px-4 py-3 flex-1 min-w-[112px]">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-[11px] text-stone-400 mb-1">{label}</div>
      {event ? (
        <>
          <div className="text-2xl font-bold text-stone-900">{daysUntil(event.date)}</div>
          <div className="text-[11px] text-stone-500 mt-0.5 truncate" title={event.description}>{event.description}</div>
        </>
      ) : (
        <div className="text-sm text-stone-300">—</div>
      )}
    </div>
  )
}

function BoardTab() {
  const [slots, setSlots] = useState<ScheduleSlotT[]>([])
  const [events, setEvents] = useState<EventT[]>([])
  const [bellSlots, setBellSlots] = useState<BellSlotT[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/student/schedule").then(r => r.ok ? r.json() : { slots: [] }).catch(() => ({ slots: [] })),
      fetch("/api/student/events").then(r => r.ok ? r.json() : { events: [] }).catch(() => ({ events: [] })),
      fetch("/api/student/bell-schedule").then(r => r.ok ? r.json() : { slots: [] }).catch(() => ({ slots: [] })),
    ]).then(([sc, ev, bell]) => {
      setSlots(sc.slots ?? [])
      setEvents(ev.events ?? [])
      setBellSlots(bell.slots ?? [])
      setLoading(false)
    })
  }, [])

  const todayIdx = new Date().getDay() // 0=Sunday .. 6=Saturday
  const todayHeb = HEB_DAYS[todayIdx] // undefined on Saturday — no school

  // Canonical period → clock-time lookup, for schedule rows that only give a bare
  // period number and rely on the school-wide bell schedule for actual times.
  const bellByPeriod = new Map(
    bellSlots.filter(b => b.dayType === "רגיל").map(b => [b.period, { start: b.startTime, end: b.endTime }])
  )
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()

  const todaySlots = slots
    .filter(s => s.dayHeb === todayHeb)
    .map(s => {
      const parsed = parsePeriod(s.period)
      const bell = bellByPeriod.get(String(parsed.num))
      return { ...s, ...parsed, start: parsed.start ?? bell?.start, end: parsed.end ?? bell?.end }
    })
    .sort((a, b) => a.num - b.num)

  // First slot that hasn't ended yet — the one to highlight as "next up".
  const nextIdx = todayHeb ? todaySlots.findIndex(s => {
    const end = timeToMinutes(s.end)
    return end === null || end > nowMin
  }) : -1

  const nextVacation = events.find(isVacationEvent) ?? null
  const summerBreak = events.find(isSummerEvent) ?? null
  const nextExam = events.find(isExamEvent) ?? null

  if (loading) return <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">טוען...</div>

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 bg-[#faf9f6]">
      {/* Countdowns */}
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        <CountdownCard emoji="🏖️" label="לחופשה הקרובה" event={nextVacation} />
        <CountdownCard emoji="☀️" label="לחופש הגדול" event={summerBreak} />
        <CountdownCard emoji="📝" label="למבחן הבא" event={nextExam} />
      </div>

      {/* Today's schedule */}
      <div>
        <h3 className="text-sm font-bold text-stone-800 mb-2">היום{todayHeb ? ` · יום ${todayHeb}` : ""}</h3>
        {!todayHeb ? (
          <div className="bg-white rounded-2xl border border-stone-200 px-4 py-6 text-center text-stone-400 text-sm">שבת שלום, אין לימודים היום 🌿</div>
        ) : todaySlots.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 px-4 py-6 text-center text-stone-400 text-sm">אין עדיין מערכת שעות טעונה</div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
            {todaySlots.map((s, i) => {
              const isNext = i === nextIdx
              return (
                <div key={s.id} className={`px-4 py-3 flex items-center gap-3 ${isNext ? "bg-orange-50" : ""}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isNext ? "bg-orange-500 text-white" : "bg-stone-100 text-stone-500"}`}>
                    {s.num || "•"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm truncate ${isNext ? "font-bold text-orange-900" : "text-stone-700"}`}>{s.content.split("  ")[0]}</div>
                    {s.start && <div className="text-[11px] text-stone-400" dir="ltr">{s.start}{s.end ? ` – ${s.end}` : ""}</div>}
                  </div>
                  {isNext && <span className="text-[10px] font-bold text-orange-600 bg-orange-100 rounded-full px-2 py-0.5 flex-shrink-0">הבא</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Upcoming events */}
      <div>
        <h3 className="text-sm font-bold text-stone-800 mb-2">אירועים קרובים</h3>
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 px-4 py-6 text-center text-stone-400 text-sm">אין אירועים קרובים</div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
            {events.slice(0, 10).map(ev => (
              <div key={ev.id} className="px-4 py-3 flex items-center gap-3">
                <div className="text-xs font-mono text-stone-400 w-11 flex-shrink-0" dir="ltr">{fmtEventDate(ev.date)}</div>
                <div className="flex-1 min-w-0 text-sm text-stone-700 truncate">{ev.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Surveys tab: assigned questionnaires + self-reported completion ── */
interface SurveyT { id: string; title: string; url: string; dueDate: string | null; completed: boolean; completedAt: string | null }

function SurveysTab({ isPreview }: { isPreview: boolean }) {
  const [surveys, setSurveys] = useState<SurveyT[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    const d = await fetch("/api/student/surveys").then(r => r.ok ? r.json() : { surveys: [] }).catch(() => ({ surveys: [] }))
    setSurveys(d.surveys ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function toggle(s: SurveyT) {
    setBusyId(s.id)
    await fetch("/api/student/surveys", {
      method: s.completed ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surveyId: s.id }),
    })
    await load()
    setBusyId(null)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">טוען...</div>

  const total = surveys.length
  const done = surveys.filter(s => s.completed).length
  const allDone = total > 0 && done === total

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#faf9f6]">
      {/* Summary */}
      <div className={`rounded-2xl px-5 py-4 flex items-center justify-between ${allDone ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-white border border-stone-200"}`}>
        <div>
          <div className={`text-xs ${allDone ? "text-white/80" : "text-stone-400"}`}>שאלונים שמולאו</div>
          <div className={`text-2xl font-bold ${allDone ? "text-white" : "text-stone-900"}`}>{done} מתוך {total}</div>
        </div>
        {allDone && <div className="text-4xl">👑</div>}
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 px-4 py-8 text-center text-stone-400 text-sm">אין שאלונים פעילים כרגע</div>
      ) : (
        <div className="space-y-2.5">
          {surveys.map(s => (
            <div key={s.id} className={`bg-white rounded-2xl border px-4 py-3.5 ${s.completed ? "border-green-200 bg-green-50/40" : "border-stone-200"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-stone-900 text-sm">{s.title}</div>
                  {s.dueDate && <div className="text-xs text-stone-400 mt-0.5">עד {new Date(s.dueDate).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}</div>}
                </div>
                {s.completed && <span className="text-lg flex-shrink-0">✅</span>}
              </div>
              <div className="flex gap-2 mt-3">
                <a href={s.url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 text-center bg-stone-900 text-white text-xs font-bold py-2 rounded-xl hover:bg-stone-800 interactive btn-press">
                  פתח שאלון
                </a>
                {isPreview ? (
                  <div className="flex-1 text-center text-[11px] text-stone-400 py-2 rounded-xl bg-stone-50 border border-dashed border-stone-200 flex items-center justify-center">
                    סימון זמין לתלמיד/ה בלבד
                  </div>
                ) : (
                  <button onClick={() => toggle(s)} disabled={busyId === s.id}
                    className={`flex-1 text-xs font-bold py-2 rounded-xl interactive btn-press disabled:opacity-50 ${
                      s.completed ? "bg-stone-100 text-stone-500 hover:bg-stone-200" : "bg-green-600 text-white hover:bg-green-700"
                    }`}>
                    {busyId === s.id ? "..." : s.completed ? "בטל סימון" : "סימנתי שמילאתי"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function StudentPage() {
  const { data: session, status } = useSession()
  const role = (session?.user as any)?.role as string | undefined
  const isPreview = !!role && role !== "STUDENT"
  const router = useRouter()
  const [mainTab, setMainTab] = useState("מידע")
  const [joinCode, setJoinCode] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [isFirst, setIsFirst] = useState(true)
  const [noStudent, setNoStudent] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Message[]
        const last50 = parsed.slice(-50)
        setMessages(last50)
        if (last50.length > 0) setIsFirst(false)
      }
    } catch {}
    setHistoryLoaded(true)
  }, [])

  // Save to localStorage whenever messages change (after initial load)
  useEffect(() => {
    if (!historyLoaded) return
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-50)))
    } catch {}
  }, [messages, historyLoaded])

  function clearChat() {
    setMessages([])
    setIsFirst(true)
    localStorage.removeItem(CHAT_STORAGE_KEY)
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, loading])

  async function send(text?: string) {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setInput("")
    setMessages(prev => [...prev, { role: "user", text: q }])
    setLoading(true)
    setStreamingText("")

    const res = await fetch("/api/student/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, isFirstMessage: isFirst }),
    })

    if (res.status === 403) { setNoStudent(true); setLoading(false); return }
    if (res.status === 429) {
      const data = await res.json()
      setMessages(prev => [...prev, { role: "bot", text: data.error ?? "הגעת למגבלת הבקשות. נסה שוב בעוד שעה." }])
      setLoading(false)
      return
    }
    if (!res.body) { setLoading(false); return }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let fullText = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n\n")
      buffer = lines.pop() ?? ""
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        try {
          const json = JSON.parse(line.slice(6))
          if (json.text) { fullText += json.text; setStreamingText(fullText) }
          if (json.done) {
            setMessages(prev => [...prev, { role: "bot", text: fullText || "שגיאה — נסה שוב" }])
            setStreamingText("")
          }
        } catch {}
      }
    }
    setIsFirst(false)
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const navTabs = [
    { label: "בית",     href: isPreview ? "/home?preview=student" : "/home", icon: <IconHome /> },
    { label: "מידע",    icon: <IconInfo /> },
    { label: "לוח",     icon: <IconCalendar /> },
    { label: "שאלונים", icon: <IconTrophy /> },
    { label: "לימוד",   icon: <IconBook />, comingSoon: true },
    { label: "עוזר",    icon: <IconStar />, comingSoon: true },
  ]

  if (status === "loading") return null

  const [personalName, setPersonalName] = useState("")
  useEffect(() => { setPersonalName(getPersonalDisplayName()) }, [])
  const firstName = personalName || (session?.user?.name?.split(" ")[0] ?? "")

  return (
    <div className="flex flex-col h-screen bg-[#faf9f6]" dir="rtl">

      {/* Preview-mode banner — shown when a teacher/admin opens "גרסת תלמיד" */}
      {isPreview && (
        <div className="bg-amber-400 text-amber-950 text-xs font-bold px-4 py-1.5 flex items-center justify-center gap-1.5 flex-shrink-0 safe-top">
          🎒 תצוגה מקדימה — כך התלמיד/ה רואה את האפליקציה
        </div>
      )}

      {/* Header */}
      <header className={`bg-white border-b border-stone-200 px-4 py-3 flex-shrink-0${isPreview ? "" : " safe-top"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-orange-700 font-bold text-sm">כ</span>
            </div>
            <div>
              <div className="font-semibold text-stone-900 text-sm">שלום {firstName}</div>
              <div className="text-xs text-stone-400">בוט הכיתה שלך</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button onClick={clearChat} className="text-xs text-stone-400 hover:text-stone-600 interactive px-2 py-1 rounded-lg hover:bg-stone-100" title="נקה שיחה">
                נקה
              </button>
            )}
            <a href="/student/edit" title="הגדרות אישיות"
              className="w-8 h-8 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 interactive transition-colors">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs text-stone-400 hover:text-stone-700 interactive px-2 py-1">
              יציאה
            </button>
          </div>
        </div>
      </header>

      {/* Join lesson bar */}
      <div className="bg-[#1B2A4A] px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
        <span className="text-[#B08D3F] text-sm font-bold whitespace-nowrap">📚 קוד שיעור:</span>
        <input
          value={joinCode}
          onChange={e => setJoinCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
          onKeyDown={e => { if (e.key === "Enter" && joinCode.length === 2) router.push(`/live/${joinCode}`) }}
          placeholder="00"
          maxLength={2}
          dir="ltr"
          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white placeholder:text-white/30 text-sm font-mono tracking-widest focus:outline-none focus:border-[#B08D3F]"
        />
        <button
          onClick={() => { if (joinCode.length === 2) router.push(`/live/${joinCode}`) }}
          disabled={joinCode.length !== 2}
          className="bg-[#A23B2E] disabled:opacity-40 text-white text-sm font-bold px-4 py-1.5 rounded-lg whitespace-nowrap transition-opacity">
          כנס
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {mainTab === "מידע" && (
          <>
            {isPreview ? (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div>
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <span className="text-white text-2xl font-bold">כ</span>
                  </div>
                  <p className="text-stone-800 font-bold">בוט הכיתה</p>
                  <p className="text-stone-500 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
                    כאן התלמיד/ה שואל/ת על ציונים, מבחנים ומערכת שעות אישית — מבוסס על הנתונים שלו/ה בפועל.
                  </p>
                  <p className="text-stone-400 text-xs mt-2">בתצוגה מקדימה זו לא מוצגות תשובות חיות, כדי לא להציג נתונים של תלמיד/ה אמיתי/ת.</p>
                </div>
              </div>
            ) : noStudent ? (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div>
                  <div className="text-4xl mb-3">🔗</div>
                  <p className="text-gray-700 font-medium">החשבון שלך עדיין לא מקושר לרשימת הכיתה</p>
                  <p className="text-gray-500 text-sm mt-1">פנה/י למחנך/ת כדי שיקשר את החשבון</p>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#faf9f6]">
                  {messages.length === 0 && (
                    <div className="text-center pt-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
                        <span className="text-white text-2xl font-bold">כ</span>
                      </div>
                      <p className="font-bold text-stone-800">בוט הכיתה</p>
                      <p className="text-stone-500 text-sm mt-1">שאל/י אותי על ציונים, מבחנים, מערכת שעות ועוד</p>

                      <div className="flex flex-wrap justify-center gap-2 mt-4">
                        {QUICK_ACTIONS.map(qa => (
                          <button key={qa.text} onClick={() => send(qa.text)}
                            className="bg-white border border-stone-200 text-stone-700 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-stone-50 interactive btn-press">
                            {qa.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-2 items-start ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      {m.role === "bot" && (
                        <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow">
                          <span className="text-white text-xs font-bold">כ</span>
                        </div>
                      )}
                      <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                        m.role === "user"
                          ? "bg-stone-900 text-white rounded-tr-sm"
                          : "bg-stone-100 text-stone-800 rounded-tl-sm"
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}

                  {loading && !streamingText && <BotThinking />}
                  {streamingText && (
                    <div className="flex gap-2 items-start">
                      <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow">
                        <span className="text-white text-xs font-bold">כ</span>
                      </div>
                      <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-stone-100 text-stone-800 rounded-tl-sm text-sm whitespace-pre-wrap">
                        {streamingText}<span className="inline-block w-0.5 h-3.5 bg-stone-400 animate-pulse ml-0.5 align-middle" />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="bg-white border-t border-stone-100 px-3 py-2.5 flex gap-2 items-center flex-shrink-0">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                    placeholder="שאל/י שאלה..."
                    disabled={loading}
                    className="flex-1 bg-stone-100 border-0 rounded-full px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-300 text-stone-900 placeholder-stone-400" style={{ fontSize: "16px" }}
                  />
                  <button onClick={() => send()} disabled={loading || !input.trim()}
                    className="bg-stone-900 text-white rounded-full w-9 h-9 flex items-center justify-center disabled:opacity-40 hover:bg-stone-800 flex-shrink-0 btn-press interactive">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {mainTab === "לוח" && <BoardTab />}

        {mainTab === "שאלונים" && <SurveysTab isPreview={isPreview} />}

        {mainTab === "לימוד" && (
          <ComingSoon icon="📚" title="עזרה לימודית"
            description="בוט שמכיר את חומרי הלימוד שלך — שאל שאלות, קבל הסברים, תרגל לקראת מבחנים."
            featureKey="student-learning-bot" accentColor="bg-stone-900" accentLight="bg-stone-100" accentText="text-stone-700" />
        )}

        {mainTab === "עוזר" && (
          <ComingSoon icon="🧠" title="עוזר אישי"
            description="תכנון שבועי, מעקב משימות ותזכורות חכמות — כדי שלא תפספס כלום."
            featureKey="student-assistant" accentColor="bg-stone-900" accentLight="bg-stone-100" accentText="text-stone-700" />
        )}

      </div>

      <BottomNav tabs={navTabs} activeColor="text-stone-900" activeBg="bg-stone-100" activeTab={mainTab} onTabChange={setMainTab} />
    </div>
  )
}
