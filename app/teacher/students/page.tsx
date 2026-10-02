"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface ClassStudent { id: string; name: string }
interface CalendarEvent { id: string; date: string; description: string }

export default function StudentsPage() {
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {}
    try { return JSON.parse(localStorage.getItem("teacher-student-notes") ?? "{}") } catch { return {} }
  })

  useEffect(() => {
    fetch("/api/home").then(r => r.json()).then(d => {
      setClassStudents(d.classStudents ?? [])
      setUpcomingEvents(d.upcomingEvents ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  function saveNote(studentId: string, val: string) {
    const updated = { ...studentNotes, [studentId]: val }
    setStudentNotes(updated)
    try { localStorage.setItem("teacher-student-notes", JSON.stringify(updated)) } catch {}
  }

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white">תלמידי חינוך</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">

        {/* 2-col student grid */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
            <span className="text-white/65 text-sm font-medium">תלמידי הכיתה</span>
            <span className="text-white/30 text-xs">{classStudents.length} תלמידים</span>
          </div>
          {loading ? (
            <div className="px-4 py-6 text-white/25 text-sm text-center">טוען...</div>
          ) : classStudents.length > 0 ? (
            <div className="grid grid-cols-2 divide-x divide-x-reverse divide-white/5">
              {classStudents.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
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
  )
}
