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

export default function ClassManagementPage() {
  const [students, setStudents] = useState<RosterStudent[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [openNoteFor, setOpenNoteFor] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {}
    try { return JSON.parse(localStorage.getItem("teacher-student-notes") ?? "{}") } catch { return {} }
  })

  async function load() {
    setLoading(true)
    const d = await fetch("/api/teacher/student-checklist").then(r => r.json()).catch(() => ({ students: [], checked: [] }))
    setStudents(d.students ?? [])
    setChecked(new Set(d.checked ?? []))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function saveNote(studentId: string, val: string) {
    const updated = { ...notes, [studentId]: val }
    setNotes(updated)
    try { localStorage.setItem("teacher-student-notes", JSON.stringify(updated)) } catch {}
  }

  async function toggle(studentId: string) {
    const next = !checked.has(studentId)
    setChecked(prev => {
      const copy = new Set(prev)
      next ? copy.add(studentId) : copy.delete(studentId)
      return copy
    })
    await fetch("/api/teacher/student-checklist", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, checked: next }),
    }).catch(() => {})
  }

  async function clearAll() {
    if (checked.size === 0) return
    if (!confirm("לנקות את כל הסימונים?")) return
    setClearing(true)
    setChecked(new Set())
    await fetch("/api/teacher/student-checklist", { method: "DELETE" }).catch(() => {})
    setClearing(false)
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <header className="bg-white border-b border-slate-200 px-4 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Link href="/home" className="text-slate-400 hover:text-slate-900 text-xl interactive">→</Link>
        <h1 className="font-extrabold text-lg text-slate-900 flex-1">רשימת תלמידים</h1>
        {checked.size > 0 && (
          <button onClick={clearAll} disabled={clearing}
            className="text-xs font-bold text-slate-500 hover:text-red-600 interactive disabled:opacity-40">
            נקה הכל ({checked.size})
          </button>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <span className="text-slate-500 text-sm font-semibold">תלמידי הכיתה</span>
            <span className="text-slate-400 text-xs font-medium">{students.length} תלמידים · {checked.size} מסומנים</span>
          </div>

          {loading ? (
            <div className="px-4 py-6 text-slate-400 text-sm text-center">טוען...</div>
          ) : students.length === 0 ? (
            <div className="px-4 py-6 text-slate-400 text-sm text-center">אין תלמידים בכיתה</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {students.map((s, i) => (
                <div key={s.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggle(s.id)}
                      className="w-6 h-6 rounded-lg border-2 border-slate-300 hover:border-indigo-500 flex-shrink-0 flex items-center justify-center interactive btn-press transition-colors mt-0.5">
                      {checked.has(s.id) && <span className="text-indigo-600 text-sm font-bold">✓</span>}
                    </button>
                    <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 text-[11px] font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 text-[15px] font-semibold">{s.name}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-slate-400 text-[11px] font-medium">
                        {s.track && <span>מגמה: {s.track}</span>}
                        {s.mathUnits != null && <span>יח״ל מתמטיקה: {s.mathUnits}</span>}
                        {s.englishUnits != null && <span>יח״ל אנגלית: {s.englishUnits}</span>}
                        {s.city && <span>מקום מגורים: {s.city}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => setOpenNoteFor(openNoteFor === s.id ? null : s.id)}
                      className="text-slate-300 hover:text-slate-600 text-[11px] flex-shrink-0 interactive flex items-center gap-1"
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
                      className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
