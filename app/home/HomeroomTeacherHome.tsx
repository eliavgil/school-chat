"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { getPersonalDisplayName } from "@/app/components/personalStore"

// ── Local types (mirrors app/home/page.tsx's HomeData shape for the fields
// this component actually uses — kept separate rather than imported, same
// call app/api/widget/schedule/route.ts made for its own timeline helpers:
// duplicating a little pure logic beats threading shared types through a
// "use client" page file). ──
interface ScheduleSlot { period: string; content: string }
interface BellSlotT { period: string; startTime: string; endTime: string }
interface TeacherTaskT {
  id: string
  description: string
  responsible: string | null
  deadline: string | null
  done: boolean
  perStudent: boolean
  checks: { studentId: string }[]
}
interface ClassStudent { id: string; name: string }
interface TeamPostT { id: string; content: string; createdAt: string; author: { name: string | null } | null }

export interface HomeroomHomeData {
  classProfile: { displayName: string; teacherDisplayName: string; schoolName: string } | null
  classTodaySchedule: ScheduleSlot[]
  bellSlots: BellSlotT[]
  teacherTasks: TeacherTaskT[]
  classStudents: ClassStudent[]
  teamPosts: TeamPostT[]
  openCoordinatorRequests: number
}

interface TimelineEntry { start: string; end: string; label: string; isBreak: boolean; period?: string }

function periodNum(p: string): string {
  const m = p.match(/^\d+/)
  return m ? m[0] : p.trim()
}
function parsePeriodStr(p: string) {
  const m = p.match(/^(\d+),\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/)
  if (!m) return null
  return { start: m[2], end: m[3] }
}
function parseSubject(content: string) { return content.split(/\s{2,}/)[0].trim() }
function timeToMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m }

function buildTimeline(slots: ScheduleSlot[], bellSlots: BellSlotT[]): TimelineEntry[] {
  const bellByPeriod = new Map(bellSlots.map(b => [b.period, { start: b.startTime, end: b.endTime }]))
  const lessons = slots.map(s => {
    const bell = bellByPeriod.get(periodNum(s.period))
    const embedded = parsePeriodStr(s.period)
    const start = bell?.start ?? embedded?.start
    const end = bell?.end ?? embedded?.end
    if (!start || !end) return null
    return { start, end, label: parseSubject(s.content), isBreak: false, period: periodNum(s.period) }
  }).filter(Boolean) as TimelineEntry[]
  const breaks: TimelineEntry[] = bellSlots
    .filter(b => !/^\d+$/.test(b.period.trim()))
    .map(b => ({ start: b.startTime, end: b.endTime, label: b.period, isBreak: true }))
  return [...lessons, ...breaks].sort((a, b) => timeToMin(a.start) - timeToMin(b.start))
}

type DayState = "no-school" | "before-school" | "now" | "done"
function getNowNext(timeline: TimelineEntry[], now: Date, hasSchoolToday: boolean): {
  state: DayState; current: TimelineEntry | null; next: TimelineEntry | null
} {
  if (!hasSchoolToday || timeline.length === 0) return { state: "no-school", current: null, next: null }
  const nowMin = now.getHours() * 60 + now.getMinutes()
  if (nowMin < timeToMin(timeline[0].start)) return { state: "before-school", current: null, next: timeline[0] }
  for (let i = 0; i < timeline.length; i++) {
    const start = timeToMin(timeline[i].start), end = timeToMin(timeline[i].end)
    if (nowMin >= start && nowMin < end) return { state: "now", current: timeline[i], next: timeline[i + 1] ?? null }
  }
  return { state: "done", current: null, next: null }
}

function useTick(ms = 30000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), ms); return () => clearInterval(id) }, [ms])
  return now
}

function fmtDeadline(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const days = Math.round((new Date(d.toDateString()).getTime() - new Date(today.toDateString()).getTime()) / 86400000)
  const dateStr = d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })
  if (days < 0) return { text: `${dateStr} · באיחור`, urgent: true }
  if (days === 0) return { text: `${dateStr} · היום`, urgent: true }
  if (days === 1) return { text: `${dateStr} · מחר`, urgent: true }
  return { text: dateStr, urgent: days <= 3 }
}

function fmtPostTime(iso: string) {
  return new Date(iso).toLocaleString("he-IL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })
}

const MENU_LINKS = [
  { label: "לוח מבחנים וארועים", href: "/teacher/calendar", emoji: "📅" },
  { label: "קבצים/לינקים חשובים", href: "/teacher/team?tab=files", emoji: "📁" },
  { label: "מערכת שעות", href: "/teacher/schedule", emoji: "🗓️" },
  { label: "לטיפול רכז", href: "/teacher/coordinator-requests", emoji: "🧑‍💼" },
  { label: "רשימת תלמידים", href: "/teacher/students", emoji: "👥" },
]

export default function HomeroomTeacherHome({ session, data }: { session: any; data: HomeroomHomeData | null }) {
  const now = useTick()
  const [menuOpen, setMenuOpen] = useState(false)
  const [personalName] = useState(() => (typeof window === "undefined" ? "" : getPersonalDisplayName()))
  const firstName = personalName || (session?.user?.name?.split(" ")[0] ?? "")

  const [tasks, setTasks] = useState<TeacherTaskT[]>(data?.teacherTasks ?? [])
  useEffect(() => { setTasks(data?.teacherTasks ?? []) }, [data?.teacherTasks])

  const dateStr = now.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })
  const bellSlots = data?.bellSlots ?? []
  const classTimeline = buildTimeline(data?.classTodaySchedule ?? [], bellSlots)
  const classNowNext = getNowNext(classTimeline, now, bellSlots.length > 0)

  const totalStudents = data?.classStudents.length ?? 0
  const urgentTasks = tasks.filter(t => !t.done).slice(0, 2)
  const posts = (data?.teamPosts ?? []).slice(0, 2)

  async function toggleDone(task: TeacherTaskT) {
    const next = !task.done
    setTasks(ts => ts.map(t => t.id === task.id ? { ...t, done: next } : t))
    await fetch("/api/teacher/tasks", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, done: next }),
    }).catch(() => {})
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 header-pt pb-3 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-slate-400 text-[11px] font-medium">{dateStr}</p>
          <p className="text-slate-900 text-base font-bold leading-tight mt-0.5">
            {firstName ? `שלום, ${firstName}` : "שלום"} · {data?.classProfile?.displayName ?? ""}
          </p>
        </div>
        <button onClick={() => setMenuOpen(true)}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl interactive btn-press transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="text-slate-700">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* ── Menu drawer ── */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="fixed top-0 bottom-0 z-40 w-72 bg-white flex flex-col shadow-2xl" style={{ right: 0 }} dir="rtl">
            <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-slate-200">
              <span className="text-slate-900 font-bold text-lg">תפריט</span>
              <button onClick={() => setMenuOpen(false)} className="text-slate-400 hover:text-slate-700 text-xl interactive">✕</button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {MENU_LINKS.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-700 hover:bg-slate-100 interactive transition-colors text-[15px] font-medium">
                  <span className="text-xl">{item.emoji}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/teacher/coordinator-requests" && (data?.openCoordinatorRequests ?? 0) > 0 && (
                    <span className="bg-amber-500 text-white text-[11px] font-bold rounded-full px-2 py-0.5">{data?.openCoordinatorRequests}</span>
                  )}
                </Link>
              ))}
              <div className="h-px bg-slate-200 my-2" />
              <Link href="/teacher/team" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-700 hover:bg-slate-100 interactive transition-colors text-[15px] font-medium">
                <span className="text-xl">👨‍🏫</span><span>צוות מחנכי י</span>
              </Link>
              <Link href="/teacher/general-education" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-700 hover:bg-slate-100 interactive transition-colors text-[15px] font-medium">
                <span className="text-xl">📖</span><span>השכלה כללית חינוכית</span>
              </Link>
              <Link href="/teacher/seating-chart" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-700 hover:bg-slate-100 interactive transition-colors text-[15px] font-medium">
                <span className="text-xl">🪑</span><span>סידור ישיבה</span>
              </Link>
              <Link href="/assistant" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-700 hover:bg-slate-100 interactive transition-colors text-[15px] font-medium">
                <span className="text-xl">🤖</span><span>מיסטר פקפקובי</span>
              </Link>
            </nav>
            <div className="px-4 pb-10 border-t border-slate-200 pt-4">
              <Link href="/manage" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:bg-slate-100 interactive text-sm mb-1">
                <span className="text-lg">⚙️</span><span>הגדרות</span>
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 interactive text-sm">
                <span className="text-lg">🚪</span><span>יציאה</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Main ── */}
      <main className="px-4 pt-4 pb-12 max-w-3xl mx-auto">
        {/* Current / next lesson — the class's own day */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {classNowNext.state === "no-school" && (
            <div className="sm:col-span-2 bg-white rounded-2xl px-6 py-8 text-center border border-slate-200">
              <div className="text-3xl mb-2">🌿</div>
              <p className="text-slate-700 text-xl font-bold">אין לימודים היום</p>
            </div>
          )}
          {classNowNext.state === "done" && (
            <div className="sm:col-span-2 bg-white rounded-2xl px-6 py-8 text-center border border-slate-200">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-slate-700 text-xl font-bold">יום הלימודים הסתיים</p>
            </div>
          )}
          {(classNowNext.state === "now" || classNowNext.state === "before-school") && (
            <div className="bg-indigo-600 rounded-2xl px-5 py-5 text-white shadow-sm">
              <p className="text-indigo-100 text-xs font-bold uppercase tracking-wide mb-1.5">
                {classNowNext.state === "now" ? "השיעור הנוכחי" : "עוד לא התחיל"}
              </p>
              {classNowNext.state === "now" ? (
                <>
                  <p className="font-extrabold tabular-nums leading-none text-3xl" dir="ltr">
                    {classNowNext.current!.start}–{classNowNext.current!.end}
                  </p>
                  <h1 className="font-bold leading-tight mt-2 text-lg">{classNowNext.current!.label}</h1>
                </>
              ) : (
                <p className="text-indigo-50 text-lg font-semibold">הלימודים עוד לא התחילו</p>
              )}
            </div>
          )}
          {(classNowNext.state === "now" || classNowNext.state === "before-school") && classNowNext.next && (
            <div className="bg-white rounded-2xl px-5 py-5 border border-slate-200">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-1.5">השיעור הבא</p>
              <p className="text-slate-900 font-extrabold tabular-nums leading-none text-2xl" dir="ltr">
                {classNowNext.next.start}–{classNowNext.next.end}
              </p>
              <h2 className="text-slate-600 font-semibold leading-tight mt-2 text-base">{classNowNext.next.label}</h2>
            </div>
          )}
        </div>

        {/* Tasks + Announcements, side by side on wider screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* ── משימות בוערות ── */}
          <section>
            <h2 className="text-slate-900 text-base font-extrabold mb-2.5 flex items-center gap-1.5">🔥 משימות בוערות</h2>
            {urgentTasks.length === 0 ? (
              <div className="bg-white rounded-2xl px-4 py-6 text-center border border-slate-200">
                <p className="text-slate-400 text-sm font-medium">אין משימות פתוחות</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {urgentTasks.map(t => {
                  const deadline = t.deadline ? fmtDeadline(t.deadline) : null
                  return (
                    <div key={t.id} className="bg-white rounded-2xl border border-slate-200 px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggleDone(t)}
                          className="w-6 h-6 rounded-lg border-2 border-slate-300 hover:border-indigo-500 flex-shrink-0 flex items-center justify-center interactive btn-press transition-colors mt-0.5">
                          {t.done && <span className="text-indigo-600 text-sm font-bold">✓</span>}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900 text-[15px] font-semibold leading-snug">{t.description}</p>
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
                            {deadline && (
                              <span className={`text-xs font-bold ${deadline.urgent ? "text-red-600" : "text-slate-400"}`}>⏰ {deadline.text}</span>
                            )}
                            {t.perStudent && (
                              <Link href={`/teacher/class-tasks?task=${t.id}`} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 interactive">
                                👥 {t.checks.length}/{totalStudents} תלמידים
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <Link href="/teacher/class-tasks" className="mt-2.5 flex items-center justify-between bg-slate-100 hover:bg-slate-200 rounded-xl px-4 py-2.5 interactive btn-press transition-colors">
              <span className="text-slate-600 text-sm font-semibold">משימות נוספות</span>
              <span className="text-slate-400">←</span>
            </Link>
          </section>

          {/* ── הודעות ── */}
          <section>
            <h2 className="text-slate-900 text-base font-extrabold mb-2.5 flex items-center gap-1.5">📣 הודעות</h2>
            {posts.length === 0 ? (
              <div className="bg-white rounded-2xl px-4 py-6 text-center border border-slate-200">
                <p className="text-slate-400 text-sm font-medium">אין עדיין הודעות</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {posts.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl border border-slate-200 px-4 py-3.5">
                    <p className="text-slate-900 text-[15px] font-medium leading-snug whitespace-pre-wrap break-words">{p.content}</p>
                    <p className="text-slate-400 text-xs font-semibold mt-1.5">{p.author?.name ?? "מורה"} · {fmtPostTime(p.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
            <Link href="/teacher/team?tab=forum" className="mt-2.5 flex items-center justify-between bg-slate-100 hover:bg-slate-200 rounded-xl px-4 py-2.5 interactive btn-press transition-colors">
              <span className="text-slate-600 text-sm font-semibold">לוח הודעות</span>
              <span className="text-slate-400">←</span>
            </Link>
          </section>
        </div>
      </main>
    </div>
  )
}
