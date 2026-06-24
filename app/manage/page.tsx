"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import ThemePicker from "@/app/components/ThemePicker"
import { BackgroundPicker } from "@/app/components/BackgroundPicker"
import {
  getPersonalEvents, addPersonalEvent, updatePersonalEvent, deletePersonalEvent,
  getPersonalScheduleNotes, addPersonalScheduleNote, updatePersonalScheduleNote, deletePersonalScheduleNote,
  getPersonalDisplayName, setPersonalDisplayName,
  type PersonalEvent, type PersonalScheduleNote,
} from "@/app/components/personalStore"

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"]

// ────────────────────────────────────────────────────────────
// Shared personal editors (localStorage only)
// ────────────────────────────────────────────────────────────
function NameEditor() {
  const [name, setName] = useState("")
  const [saved, setSaved] = useState(false)
  useEffect(() => { setName(getPersonalDisplayName()) }, [])
  function save() { setPersonalDisplayName(name.trim()); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  return (
    <div className="space-y-2">
      <p className="text-xs text-white/40">השם שיוצג לך בכותרת — אישי בלבד</p>
      <div className="flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && save()}
          placeholder="שם תצוגה"
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
        <button onClick={save}
          className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2.5 rounded-xl interactive btn-press transition-colors">
          {saved ? "✓ נשמר" : "שמור"}
        </button>
      </div>
    </div>
  )
}

function DesignEditor() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">תמונת רקע</p>
        <BackgroundPicker />
      </div>
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">ערכת צבעים</p>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <ThemePicker />
        </div>
      </div>
    </div>
  )
}

function PersonalEventsEditor() {
  const [events, setEvents] = useState<PersonalEvent[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newDate, setNewDate] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [editing, setEditing] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState("")
  useEffect(() => { setEvents(getPersonalEvents()) }, [])
  function add() {
    if (!newDate || !newDesc) return
    setEvents(prev => [...prev, addPersonalEvent(newDate, newDesc)].sort((a, b) => a.date.localeCompare(b.date)))
    setNewDate(""); setNewDesc(""); setShowAdd(false)
  }
  function save(id: string) { updatePersonalEvent(id, editDesc); setEvents(prev => prev.map(e => e.id === id ? { ...e, description: editDesc } : e)); setEditing(null) }
  function remove(id: string) { deletePersonalEvent(id); setEvents(prev => prev.filter(e => e.id !== id)) }
  const EditIcon = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
  const TrashIcon = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40">אירועים אישיים — גלויים רק לך</p>
      {events.map(ev => (
        <div key={ev.id} className="bg-white/8 border border-white/10 rounded-xl px-4 py-3 flex items-start gap-3 group">
          <div className="text-xs text-white/40 font-mono mt-0.5 flex-shrink-0 w-14">
            {new Date(ev.date).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
          </div>
          {editing === ev.id ? (
            <div className="flex-1 flex gap-2">
              <input autoFocus value={editDesc} onChange={e => setEditDesc(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") save(ev.id); if (e.key === "Escape") setEditing(null) }}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30" />
              <button onClick={() => save(ev.id)} className="bg-white/20 text-white text-xs px-3 py-1 rounded-lg hover:bg-white/30 btn-press interactive">שמור</button>
              <button onClick={() => setEditing(null)} className="text-white/40 text-xs px-2 hover:text-white interactive">ביטול</button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-between gap-2">
              <span className="text-sm text-white/80">{ev.description}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing(ev.id); setEditDesc(ev.description) }} className="text-white/30 hover:text-white interactive p-1 rounded"><EditIcon /></button>
                <button onClick={() => remove(ev.id)} className="text-white/30 hover:text-red-400 interactive p-1 rounded"><TrashIcon /></button>
              </div>
            </div>
          )}
        </div>
      ))}
      {showAdd ? (
        <div className="bg-white/8 border border-white/10 rounded-xl px-4 py-4 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30" />
            <input placeholder="תיאור האירוע" value={newDesc} onChange={e => setNewDesc(e.target.value)}
              onKeyDown={e => e.key === "Enter" && add()}
              className="flex-1 min-w-36 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
          </div>
          <div className="flex gap-2">
            <button onClick={add} disabled={!newDate || !newDesc}
              className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-40 btn-press interactive">הוסף</button>
            <button onClick={() => setShowAdd(false)} className="text-white/40 text-sm px-3 py-2 hover:text-white interactive">ביטול</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full border-2 border-dashed border-white/15 rounded-xl py-3 text-sm text-white/35 hover:border-white/30 hover:text-white/60 interactive transition-colors">
          + הוסף אירוע אישי
        </button>
      )}
    </div>
  )
}

function ScheduleNotesEditor() {
  const [notes, setNotes] = useState<PersonalScheduleNote[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newDay, setNewDay] = useState("ראשון")
  const [newPeriod, setNewPeriod] = useState("")
  const [newNote, setNewNote] = useState("")
  const [editing, setEditing] = useState<string | null>(null)
  const [editNote, setEditNote] = useState("")
  useEffect(() => { setNotes(getPersonalScheduleNotes()) }, [])
  function add() {
    if (!newPeriod || !newNote) return
    setNotes(prev => [...prev, addPersonalScheduleNote(newDay, newPeriod, newNote)])
    setNewDay("ראשון"); setNewPeriod(""); setNewNote(""); setShowAdd(false)
  }
  function save(id: string) { updatePersonalScheduleNote(id, editNote); setNotes(prev => prev.map(n => n.id === id ? { ...n, note: editNote } : n)); setEditing(null) }
  function remove(id: string) { deletePersonalScheduleNote(id); setNotes(prev => prev.filter(n => n.id !== id)) }
  const byDay = DAYS.map(day => ({ day, notes: notes.filter(n => n.dayHeb === day).sort((a, b) => a.period.localeCompare(b.period)) })).filter(d => d.notes.length > 0)
  return (
    <div className="space-y-4">
      <p className="text-xs text-white/40">הערות אישיות למערכת — גלויות רק לך</p>
      {byDay.map(({ day, notes: dayNotes }) => (
        <div key={day} className="bg-white/8 border border-white/10 rounded-2xl overflow-hidden">
          <div className="bg-white/5 border-b border-white/10 px-4 py-2">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">יום {day}</span>
          </div>
          <div className="divide-y divide-white/5">
            {dayNotes.map(item => (
              <div key={item.id} className="px-4 py-3 flex items-start gap-2">
                <div className="text-xs text-white/35 font-mono mt-0.5 flex-shrink-0">שיעור {item.period}</div>
                {editing === item.id ? (
                  <div className="flex-1 flex gap-2">
                    <input autoFocus value={editNote} onChange={e => setEditNote(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") save(item.id); if (e.key === "Escape") setEditing(null) }}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30" />
                    <button onClick={() => save(item.id)} className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-white/30 btn-press interactive">שמור</button>
                    <button onClick={() => setEditing(null)} className="text-white/40 text-xs px-2 hover:text-white interactive">ביטול</button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between gap-2 group">
                    <span className="text-sm text-white/70">{item.note}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditing(item.id); setEditNote(item.note) }} className="text-white/30 hover:text-white interactive p-1 rounded">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => remove(item.id)} className="text-white/30 hover:text-red-400 interactive p-1 rounded">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {showAdd ? (
        <div className="bg-white/8 border border-white/10 rounded-xl px-4 py-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <select value={newDay} onChange={e => setNewDay(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30">
              {DAYS.map(d => <option key={d} value={d}>יום {d}</option>)}
            </select>
            <input type="number" min="1" max="10" placeholder="שיעור" value={newPeriod} onChange={e => setNewPeriod(e.target.value)}
              className="w-20 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <input placeholder="הערה אישית..." value={newNote} onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => e.key === "Enter" && add()}
              className="flex-1 min-w-40 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
          </div>
          <div className="flex gap-2">
            <button onClick={add} disabled={!newPeriod || !newNote}
              className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-40 btn-press interactive">הוסף</button>
            <button onClick={() => setShowAdd(false)} className="text-white/40 text-sm px-3 py-2 hover:text-white interactive">ביטול</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full border-2 border-dashed border-white/15 rounded-xl py-3 text-sm text-white/35 hover:border-white/30 hover:text-white/60 interactive transition-colors">
          + הוסף הערה אישית
        </button>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Teacher: Import tab
// ────────────────────────────────────────────────────────────
interface ImportJob { type: string; label: string; accept?: string; isUrl?: boolean; isSheets?: boolean }

const IMPORT_JOBS: ImportJob[] = [
  { type: "sync-events",      label: "אירועים (Google Sheets)",       isSheets: true },
  { type: "grades",           label: "ציונים שוטפים",                accept: ".xlsx,.xls" },
  { type: "attendance",       label: "מונה התנהגות",                  accept: ".xlsx,.xls" },
  { type: "schedule",         label: "מערכת שעות כיתתית",            accept: ".xlsx,.xls" },
  { type: "teachers",         label: "אלפון מורים",                   accept: ".xlsx,.xls" },
  { type: "calendar-url",     label: "לוח מבחנים (Google Sheets)",   isUrl: true },
]

function ImportTab() {
  const [results, setResults]     = useState<Record<string, string>>({})
  const [loading, setLoading]     = useState<Record<string, boolean>>({})
  const [urlValues, setUrlValues] = useState<Record<string, string>>({})
  const [classId, setClassId]     = useState("class-y")

  async function syncSheets() {
    setLoading(l => ({ ...l, "sync-events": true }))
    setResults(r => ({ ...r, "sync-events": "" }))
    try {
      const res = await fetch("/api/sync-events", { method: "POST" })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { throw new Error(text.slice(0, 200)) }
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setResults(r => ({ ...r, "sync-events": `✓ סונכרנו ${data.synced} ארועים` }))
    } catch (e: any) {
      setResults(r => ({ ...r, "sync-events": `✗ ${e.message}` }))
    }
    setLoading(l => ({ ...l, "sync-events": false }))
  }

  async function runImport(job: ImportJob, file: File | null, sheetUrl?: string) {
    setLoading(l => ({ ...l, [job.type]: true }))
    setResults(r => ({ ...r, [job.type]: "" }))
    try {
      const fd = new FormData()
      fd.append("type", job.type); fd.append("classId", classId)
      if (file) fd.append("file", file)
      if (sheetUrl) fd.append("sheetUrl", sheetUrl)
      const d = await fetch("/api/admin/import", { method: "POST", body: fd }).then(r => r.json())
      setResults(r => ({ ...r, [job.type]: d.ok ? `✓ יובאו ${d.count} רשומות` : `✗ ${d.error}` }))
    } catch { setResults(r => ({ ...r, [job.type]: "✗ שגיאת רשת" })) }
    setLoading(l => ({ ...l, [job.type]: false }))
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-900/30 border border-amber-500/25 rounded-xl px-4 py-3 text-xs text-amber-300">
        ייבוא נתונים משפיע על <strong>כל המשתמשים</strong>
      </div>

      {/* Class ID */}
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
        <label className="text-sm text-white/60 flex-shrink-0">מזהה כיתה:</label>
        <input value={classId} onChange={e => setClassId(e.target.value)}
          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30" dir="ltr" />
      </div>

      {/* Import rows */}
      {IMPORT_JOBS.map(job => (
        <div key={job.type} className="bg-white/8 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-white text-sm">{job.label}</span>
            {results[job.type] && (
              <span className={`text-xs font-medium ${results[job.type].startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                {results[job.type]}
              </span>
            )}
          </div>

          {/* Google Sheets sync button */}
          {job.isSheets && (
            <button onClick={syncSheets} disabled={loading[job.type]}
              className="w-full bg-white/15 hover:bg-white/25 disabled:opacity-40 text-white text-sm py-2.5 rounded-xl interactive btn-press transition-colors flex items-center justify-center gap-2">
              {loading[job.type] ? <><span className="animate-spin inline-block">⟳</span> מסנכרן...</> : "⟳ סנכרן עכשיו"}
            </button>
          )}

          {/* URL input */}
          {job.isUrl && (
            <div className="flex gap-2">
              <input type="url" placeholder="https://docs.google.com/spreadsheets/..."
                value={urlValues[job.type] || ""} onChange={e => setUrlValues(v => ({ ...v, [job.type]: e.target.value }))}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" dir="ltr" />
              <button onClick={() => runImport(job, null, urlValues[job.type])}
                disabled={loading[job.type] || !urlValues[job.type]}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-40 btn-press interactive">
                {loading[job.type] ? "..." : "ייבא"}
              </button>
            </div>
          )}

          {/* File upload */}
          {!job.isSheets && !job.isUrl && (
            <label className="cursor-pointer block">
              <div className="border-2 border-dashed border-white/15 rounded-xl py-4 text-center hover:border-white/30 transition-colors">
                {loading[job.type]
                  ? <span className="text-white/50 text-sm">מייבא...</span>
                  : <>
                    <span className="text-white/50 text-sm">גרור קובץ לכאן או </span>
                    <span className="text-white/80 text-sm font-medium underline">בחר קובץ</span>
                    <p className="text-white/30 text-xs mt-1">{job.accept}</p>
                  </>}
              </div>
              <input type="file" accept={job.accept} className="hidden" disabled={loading[job.type]}
                onChange={e => { const f = e.target.files?.[0]; if (f) { runImport(job, f); e.target.value = "" } }} />
            </label>
          )}
        </div>
      ))}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Teacher: Schedule tab
// ────────────────────────────────────────────────────────────
function ScheduleTab() {
  const [slots, setSlots] = useState<{ id: string; dayHeb: string; period: string; content: string }[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch("/api/schedule").then(r => r.json()).catch(() => ({ slots: [] }))
      .then(sc => { setSlots(sc.slots ?? []); setLoading(false) })
  }, [])
  async function deleteSlot(id: string) {
    if (!confirm("למחוק שיעור זה לכולם?")) return
    await fetch("/api/schedule", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setSlots(prev => prev.filter(s => s.id !== id))
  }
  if (loading) return <p className="text-white/40 text-sm text-center py-8">טוען...</p>
  if (!slots.length) return <p className="text-white/30 text-sm text-center py-8">אין שיעורים בבסיס הנתונים</p>
  return (
    <div className="space-y-3">
      <div className="bg-amber-900/30 border border-amber-500/25 rounded-xl px-4 py-3 text-xs text-amber-300">
        מחיקת שיעורים משפיעה על <strong>כל המשתמשים</strong>
      </div>
      <div className="space-y-1.5">
        {slots.map(s => (
          <div key={s.id} className="bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3 group">
            <span className="text-xs text-white/35 w-16 flex-shrink-0">{s.dayHeb}</span>
            <span className="text-xs text-white/35 font-mono flex-shrink-0">{s.period.split(",")[0]}</span>
            <span className="text-sm text-white/65 flex-1 truncate">{s.content.split("  ")[0]}</span>
            <button onClick={() => deleteSlot(s.id)}
              className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 interactive p-1 rounded transition-opacity">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Teacher: Users tab (from admin page)
// ────────────────────────────────────────────────────────────
interface PendingParent  { id: string; name: string | null; email: string | null; phone: string | null; requestedChildName: string | null; parentType: string | null }
interface PendingStudent { id: string; name: string | null; email: string | null; requestedChildName: string | null }
interface ParentUser     { id: string; name: string | null; email: string | null; phone: string | null; parentStudents: { student: { id: string; name: string } }[] }
interface StudentUser    { id: string; name: string | null; email: string | null; studentRecord: { id: string; name: string } | null }
interface Student        { id: string; name: string }

function ApproveWithLink({ label, students, onApprove, onDeny, onCancel, loading }: {
  label: string; students: Student[]; loading: boolean
  onApprove: (sid?: string) => void; onDeny: () => void; onCancel: () => void
}) {
  const [sel, setSel] = useState("")
  return (
    <div className="mt-3 space-y-2">
      <select value={sel} onChange={e => setSel(e.target.value)}
        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30">
        <option value="">קשר לתלמיד/ה (אופציונלי)</option>
        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <div className="flex gap-2">
        <button onClick={() => onApprove(sel || undefined)} disabled={loading}
          className="flex-1 bg-white/20 hover:bg-white/30 text-white rounded-lg py-2 text-xs font-medium disabled:opacity-50 btn-press interactive">{label}</button>
        <button onClick={onDeny} disabled={loading}
          className="border border-red-400/40 text-red-400 rounded-lg px-3 py-2 text-xs hover:bg-red-400/10 disabled:opacity-50 interactive">דחה</button>
        <button onClick={onCancel} className="text-white/40 text-xs hover:text-white px-2 interactive">ביטול</button>
      </div>
    </div>
  )
}

function UsersTab() {
  const [pendingParents, setPendingParents]   = useState<PendingParent[]>([])
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([])
  const [approvedParents, setApprovedParents] = useState<ParentUser[]>([])
  const [approvedStudents, setApprovedStudents] = useState<StudentUser[]>([])
  const [students, setStudents]               = useState<Student[]>([])
  const [usersLoading, setUsersLoading]       = useState(false)
  const [actionLoading, setActionLoading]     = useState<string | null>(null)
  const [expandedId, setExpandedId]           = useState<string | null>(null)
  const [linkingStudentId, setLinkingStudentId] = useState<string | null>(null)
  const [linkSel, setLinkSel]                 = useState<Record<string, string>>({})
  const [preEmail, setPreEmail]               = useState("")
  const [preStudentId, setPreStudentId]       = useState("")
  const [preLoading, setPreLoading]           = useState(false)
  const [preMsg, setPreMsg]                   = useState("")

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setUsersLoading(true)
    const d = await fetch("/api/admin/users").then(r => r.json())
    setPendingParents(d.pendingParents ?? [])
    setPendingStudents(d.pendingStudents ?? [])
    setApprovedParents(d.approvedParents ?? [])
    setApprovedStudents(d.approvedStudents ?? [])
    setStudents(d.students ?? [])
    setUsersLoading(false)
  }

  async function action(userId: string, type: string, studentId?: string) {
    setActionLoading(userId)
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action: type, studentId }) })
    setExpandedId(null)
    await fetchUsers()
    setActionLoading(null)
  }

  async function preRegister() {
    if (!preEmail.trim() || !preStudentId) return
    setPreLoading(true)
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: preEmail.trim(), studentId: preStudentId }) })
    setPreLoading(false)
    if (res.ok) { setPreMsg("✓ נשמר"); setPreEmail(""); setPreStudentId(""); await fetchUsers() }
    else setPreMsg("✗ שגיאה — בדוק את הפרטים")
    setTimeout(() => setPreMsg(""), 4000)
  }

  if (usersLoading) return <p className="text-white/40 text-sm text-center py-8">טוען...</p>

  const totalPending = pendingParents.length + pendingStudents.length

  return (
    <div className="space-y-6">
      {/* Pre-register */}
      <div className="bg-white/8 border border-white/10 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white">הוספת תלמיד/ה מראש 🎒</h3>
        <p className="text-xs text-white/45">הזן מייל של תלמיד/ה וקשר לרשימת הכיתה — הכניסה הראשונה תאושר אוטומטית</p>
        <div className="flex gap-2 flex-wrap">
          <input type="email" placeholder="מייל התלמיד/ה" value={preEmail} onChange={e => setPreEmail(e.target.value)}
            className="flex-1 min-w-48 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" dir="ltr" />
          <select value={preStudentId} onChange={e => setPreStudentId(e.target.value)}
            className="flex-1 min-w-40 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30">
            <option value="">בחר תלמיד/ה</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={preRegister} disabled={preLoading || !preEmail.trim() || !preStudentId}
            className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 btn-press interactive">
            {preLoading ? "שומר..." : "הוסף"}
          </button>
        </div>
        {preMsg && <p className={`text-xs ${preMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>{preMsg}</p>}
      </div>

      {/* Pending requests */}
      {totalPending > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-amber-300">בקשות ממתינות ({totalPending})</h3>
          {pendingParents.map(u => (
            <div key={u.id} className="bg-amber-900/20 border border-amber-500/25 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div className="text-sm space-y-0.5">
                  <div className="font-medium text-white">{u.name ?? "—"}</div>
                  <div className="text-white/50 text-xs">{u.email}</div>
                  {u.phone && <div className="text-white/40 text-xs" dir="ltr">{u.phone}</div>}
                  {u.requestedChildName && <div className="text-amber-300 text-xs mt-1">{u.parentType ?? "הורה"} של: {u.requestedChildName}</div>}
                </div>
                <button onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                  className="bg-white/10 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-white/20 interactive">
                  {expandedId === u.id ? "ביטול" : "אשר גישה"}
                </button>
              </div>
              {expandedId === u.id && (
                <ApproveWithLink students={students} loading={actionLoading === u.id}
                  onApprove={sid => action(u.id, "approve-parent", sid)}
                  onDeny={() => action(u.id, "deny")}
                  onCancel={() => setExpandedId(null)}
                  label="אשר הורה 👨‍👩‍👧" />
              )}
            </div>
          ))}
          {pendingStudents.map(u => (
            <div key={u.id} className="bg-amber-900/20 border border-amber-500/25 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div className="text-sm space-y-0.5">
                  <div className="font-medium text-white">{u.name ?? "—"}</div>
                  <div className="text-white/50 text-xs">{u.email}</div>
                  {u.requestedChildName && <div className="text-amber-300 text-xs mt-1">שם שהוזן: {u.requestedChildName}</div>}
                </div>
                <button onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                  className="bg-white/10 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-white/20 interactive">
                  {expandedId === u.id ? "ביטול" : "אשר"}
                </button>
              </div>
              {expandedId === u.id && (
                <ApproveWithLink students={students} loading={actionLoading === u.id}
                  onApprove={sid => action(u.id, "approve-student", sid)}
                  onDeny={() => action(u.id, "deny")}
                  onCancel={() => setExpandedId(null)}
                  label="אשר תלמיד/ה 🎒" />
              )}
            </div>
          ))}
        </div>
      )}
      {totalPending === 0 && <p className="text-white/30 text-xs text-center">אין בקשות ממתינות</p>}

      {/* Approved parents */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 mb-2">הורים מאושרים ({approvedParents.length})</h3>
        {approvedParents.length === 0
          ? <p className="text-white/30 text-xs">אין</p>
          : <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5">
            {approvedParents.map(p => (
              <div key={p.id} className="px-4 py-3 flex items-start justify-between gap-4">
                <div className="text-sm space-y-0.5">
                  <div className="font-medium text-white/85">{p.name ?? "—"}</div>
                  <div className="text-white/40 text-xs">{p.email}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.parentStudents.map(({ student }) => (
                      <span key={student.id} className="bg-white/10 text-white/60 text-xs rounded-full px-2 py-0.5 flex items-center gap-1">
                        {student.name}
                        <button onClick={() => action(p.id, "unlink-parent", student.id)} className="text-white/30 hover:text-red-400 interactive">×</button>
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={() => action(p.id, "deny")} className="text-xs text-red-400/70 hover:text-red-400 interactive whitespace-nowrap">בטל גישה</button>
              </div>
            ))}
          </div>}
      </div>

      {/* Approved students */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 mb-2">תלמידים מאושרים ({approvedStudents.length})</h3>
        {approvedStudents.length === 0
          ? <p className="text-white/30 text-xs">אין</p>
          : <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5">
            {approvedStudents.map(s => (
              <div key={s.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm space-y-0.5">
                    <div className="font-medium text-white/85">{s.name ?? "—"}</div>
                    <div className="text-white/40 text-xs">{s.email}</div>
                    {s.studentRecord
                      ? <span className="bg-white/10 text-white/60 text-xs rounded-full px-2 py-0.5 mt-1 inline-flex items-center gap-1">
                          {s.studentRecord.name}
                          <button onClick={() => action(s.id, "unlink-student")} className="text-white/30 hover:text-red-400 interactive">×</button>
                        </span>
                      : <span className="text-amber-400 text-xs mt-1 inline-block">⚠️ לא מקושר</span>}
                  </div>
                  <div className="flex gap-2 items-center flex-shrink-0">
                    <button onClick={() => setLinkingStudentId(linkingStudentId === s.id ? null : s.id)}
                      className="text-xs text-white/50 hover:text-white border border-white/15 rounded-lg px-2 py-1 interactive">
                      {linkingStudentId === s.id ? "ביטול" : (s.studentRecord ? "שנה" : "קשר")}
                    </button>
                    <button onClick={() => action(s.id, "deny")} className="text-xs text-red-400/70 hover:text-red-400 interactive">בטל</button>
                  </div>
                </div>
                {linkingStudentId === s.id && (
                  <div className="mt-2 flex gap-2">
                    <select value={linkSel[s.id] ?? ""} onChange={e => setLinkSel(prev => ({ ...prev, [s.id]: e.target.value }))}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30">
                      <option value="">בחר תלמיד/ה</option>
                      {students.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                    </select>
                    <button disabled={!linkSel[s.id] || actionLoading === s.id}
                      onClick={async () => { await action(s.id, "link-student", linkSel[s.id]); setLinkingStudentId(null); setLinkSel(prev => ({ ...prev, [s.id]: "" })) }}
                      className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 btn-press interactive">
                      {actionLoading === s.id ? "..." : "קשר"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────
type TeacherTab = "settings" | "import" | "schedule" | "users"
type UserTab    = "settings" | "events" | "notes" | "design"

export default function ManagePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const role = (session?.user as any)?.role as string | undefined
  const isTeacher = role === "TEACHER" || role === "ADMIN"

  const [teacherTab, setTeacherTab] = useState<TeacherTab>("settings")
  const [userTab, setUserTab]       = useState<UserTab>("settings")
  const [pendingCount, setPendingCount] = useState(0)

  // Badge: fetch pending count when teacher mounts
  useEffect(() => {
    if (!isTeacher) return
    fetch("/api/admin/users").then(r => r.json()).then(d => {
      setPendingCount((d.pendingParents?.length ?? 0) + (d.pendingStudents?.length ?? 0))
    }).catch(() => {})
  }, [isTeacher])

  if (status === "loading") {
    return <div className="min-h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center"><div className="text-white/40 text-sm">טוען...</div></div>
  }

  if (!session) { router.replace("/"); return null }

  const teacherTabs: [TeacherTab, string][] = [
    ["settings", "הגדרות"],
    ["import",   "ייבוא נתונים"],
    ["schedule", "מערכת שעות"],
    ["users",    "משתמשים"],
  ]

  const userTabs: [UserTab, string][] = [
    ["settings", "הגדרות"],
    ["events",   "אירועים"],
    ["notes",    "הערות מערכת"],
    ["design",   "עיצוב"],
  ]

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      {/* Sticky header + tabs */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10 px-4 pt-5 pb-0 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-white">{isTeacher ? "הגדרות" : "הגדרות אישיות"}</h1>
            <button onClick={() => router.back()} className="text-sm text-white/50 hover:text-white interactive">← חזרה</button>
          </div>

          {/* Teacher tabs */}
          {isTeacher && (
            <div className="flex gap-5 text-sm font-medium overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {teacherTabs.map(([id, label]) => (
                <button key={id} onClick={() => setTeacherTab(id)}
                  className={`pb-3 border-b-2 transition-colors interactive whitespace-nowrap relative ${teacherTab === id ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/70"}`}>
                  {label}
                  {id === "users" && pendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-3 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Parent/Student tabs */}
          {!isTeacher && (
            <div className="flex gap-5 text-sm font-medium overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {userTabs.map(([id, label]) => (
                <button key={id} onClick={() => setUserTab(id)}
                  className={`pb-3 border-b-2 transition-colors interactive whitespace-nowrap ${userTab === id ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/70"}`}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {isTeacher && teacherTab === "settings"  && (
          <>
            <p className="text-xs text-white/30">שינויים אלו גלויים רק לך</p>
            <NameEditor />
            <div className="pt-2"><DesignEditor /></div>
          </>
        )}
        {isTeacher && teacherTab === "import"    && <ImportTab />}
        {isTeacher && teacherTab === "schedule"  && <ScheduleTab />}
        {isTeacher && teacherTab === "users"     && <UsersTab />}

        {!isTeacher && userTab === "settings"   && (
          <>
            <p className="text-xs text-white/30">שינויים אלו גלויים רק לך</p>
            <NameEditor />
          </>
        )}
        {!isTeacher && userTab === "events"     && <PersonalEventsEditor />}
        {!isTeacher && userTab === "notes"      && <ScheduleNotesEditor />}
        {!isTeacher && userTab === "design"     && <DesignEditor />}
      </div>
    </div>
  )
}
