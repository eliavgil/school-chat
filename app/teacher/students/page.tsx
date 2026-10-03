"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface RosterStudent {
  id: string
  name: string
  track: string | null
  mathUnits: number | null
  englishUnits: number | null
  city: string | null
}

const TABS = [
  { id: "students", label: "תלמידי הכיתה" },
  // More tabs (מבחנים ומשימות, פורום כיתתי, סידור ישיבה...) land here later.
] as const

export default function ClassManagementPage() {
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("students")
  const [students, setStudents] = useState<RosterStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [openNoteFor, setOpenNoteFor] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {}
    try { return JSON.parse(localStorage.getItem("teacher-student-notes") ?? "{}") } catch { return {} }
  })

  useEffect(() => {
    fetch("/api/class/roster").then(r => r.json()).then(d => setStudents(d.students ?? []))
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  function saveNote(studentId: string, val: string) {
    const updated = { ...notes, [studentId]: val }
    setNotes(updated)
    try { localStorage.setItem("teacher-student-notes", JSON.stringify(updated)) } catch {}
  }

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white">ניהול כיתה</h1>
      </header>

      <div className="flex gap-2 px-4 pt-4">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium interactive btn-press transition-colors ${tab === t.id ? "bg-white/20 text-white" : "text-white/40 hover:text-white/70"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {tab === "students" && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
              <span className="text-white/65 text-sm font-medium">תלמידי הכיתה</span>
              <span className="text-white/30 text-xs">{students.length} תלמידים</span>
            </div>

            {loading ? (
              <div className="px-4 py-6 text-white/25 text-sm text-center">טוען...</div>
            ) : students.length === 0 ? (
              <div className="px-4 py-6 text-white/25 text-sm text-center">אין תלמידים בכיתה</div>
            ) : (
              <div className="divide-y divide-white/5">
                {students.map((s, i) => (
                  <div key={s.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-white/50 text-[11px] font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{s.name}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-white/40 text-[11px]">
                          {s.track && <span>מגמה: {s.track}</span>}
                          {s.mathUnits != null && <span>יח״ל מתמטיקה: {s.mathUnits}</span>}
                          {s.englishUnits != null && <span>יח״ל אנגלית: {s.englishUnits}</span>}
                          {s.city && <span>מקום מגורים: {s.city}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => setOpenNoteFor(openNoteFor === s.id ? null : s.id)}
                        className="text-white/30 hover:text-white/60 text-[11px] flex-shrink-0 interactive flex items-center gap-1"
                      >
                        {notes[s.id] ? "✏️" : "💬"} הערה
                      </button>
                    </div>
                    {openNoteFor === s.id && (
                      <input
                        autoFocus
                        value={notes[s.id] ?? ""}
                        onChange={e => saveNote(s.id, e.target.value)}
                        placeholder="הערה על התלמיד/ה..."
                        dir="rtl"
                        className="mt-2 w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
