"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ThemePicker from "@/app/components/ThemePicker"
import { BackgroundPicker } from "@/app/components/BackgroundPicker"
import {
  getPersonalEvents, addPersonalEvent, updatePersonalEvent, deletePersonalEvent,
  getPersonalScheduleNotes, addPersonalScheduleNote, updatePersonalScheduleNote, deletePersonalScheduleNote,
  getPersonalDisplayName, setPersonalDisplayName,
  type PersonalEvent, type PersonalScheduleNote,
} from "@/app/components/personalStore"

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"]

// ── Display name ──────────────────────────────────────────
function NameEditor() {
  const [name, setName] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => { setName(getPersonalDisplayName()) }, [])

  function save() {
    setPersonalDisplayName(name.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5">
      <p className="text-sm text-stone-500 mb-3">השם שיוצג לך בכותרת העמוד</p>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && save()}
          placeholder="שם תצוגה (אישי בלבד)"
          className="flex-1 bg-stone-100 border-0 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
        />
        <button
          onClick={save}
          className="bg-stone-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-stone-800 btn-press interactive transition-colors"
        >
          {saved ? "✓ נשמר" : "שמור"}
        </button>
      </div>
    </div>
  )
}

// ── Personal schedule notes ───────────────────────────────
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
    const item = addPersonalScheduleNote(newDay, newPeriod, newNote)
    setNotes(prev => [...prev, item])
    setNewDay("ראשון"); setNewPeriod(""); setNewNote(""); setShowAdd(false)
  }

  function save(id: string) {
    updatePersonalScheduleNote(id, editNote)
    setNotes(prev => prev.map(n => n.id === id ? { ...n, note: editNote } : n))
    setEditing(null)
  }

  function remove(id: string) {
    deletePersonalScheduleNote(id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const byDay = DAYS.map(day => ({
    day,
    notes: notes.filter(n => n.dayHeb === day).sort((a, b) => a.period.localeCompare(b.period)),
  })).filter(d => d.notes.length > 0)

  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-400">הערות אישיות למערכת — גלויות רק לך</p>

      {byDay.map(({ day, notes: dayNotes }) => (
        <div key={day} className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <div className="bg-stone-50 border-b border-stone-200 px-4 py-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">יום {day}</span>
          </div>
          <div className="divide-y divide-stone-100">
            {dayNotes.map(item => (
              <div key={item.id} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <div className="text-xs text-stone-400 font-mono mt-0.5 flex-shrink-0">שיעור {item.period}</div>
                  {editing === item.id ? (
                    <div className="flex-1 flex gap-2">
                      <input autoFocus value={editNote} onChange={e => setEditNote(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") save(item.id); if (e.key === "Escape") setEditing(null) }}
                        className="flex-1 bg-stone-100 border-0 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                      />
                      <button onClick={() => save(item.id)} className="bg-stone-900 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-stone-800 btn-press interactive">שמור</button>
                      <button onClick={() => setEditing(null)} className="text-stone-400 text-xs px-2 hover:text-stone-700 interactive">ביטול</button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between gap-2 group">
                      <span className="text-sm text-stone-700">{item.note}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditing(item.id); setEditNote(item.note) }}
                          className="text-stone-400 hover:text-stone-700 interactive p-1 rounded">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => remove(item.id)} className="text-stone-300 hover:text-red-500 interactive p-1 rounded">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showAdd ? (
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <select value={newDay} onChange={e => setNewDay(e.target.value)}
              className="bg-stone-100 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300">
              {DAYS.map(d => <option key={d} value={d}>יום {d}</option>)}
            </select>
            <input type="number" min="1" max="10" placeholder="שיעור" value={newPeriod} onChange={e => setNewPeriod(e.target.value)}
              className="w-20 bg-stone-100 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
            <input placeholder="הערה אישית..." value={newNote} onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => e.key === "Enter" && add()}
              className="flex-1 min-w-40 bg-stone-100 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>
          <div className="flex gap-2">
            <button onClick={add} disabled={!newPeriod || !newNote}
              className="bg-stone-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-stone-800 disabled:opacity-40 btn-press interactive">הוסף</button>
            <button onClick={() => setShowAdd(false)} className="text-stone-400 text-sm px-3 py-2 hover:text-stone-700 interactive">ביטול</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full border-2 border-dashed border-stone-200 rounded-xl py-3 text-sm text-stone-400 hover:border-stone-400 hover:text-stone-600 interactive transition-colors">
          + הוסף הערה אישית
        </button>
      )}
    </div>
  )
}

// ── Personal events editor ────────────────────────────────
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
    const ev = addPersonalEvent(newDate, newDesc)
    setEvents(prev => [...prev, ev].sort((a, b) => a.date.localeCompare(b.date)))
    setNewDate(""); setNewDesc(""); setShowAdd(false)
  }

  function save(id: string) {
    updatePersonalEvent(id, editDesc)
    setEvents(prev => prev.map(e => e.id === id ? { ...e, description: editDesc } : e))
    setEditing(null)
  }

  function remove(id: string) {
    deletePersonalEvent(id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-400">אירועים אישיים — גלויים רק לך</p>

      {events.map(ev => (
        <div key={ev.id} className="bg-white border border-stone-200 rounded-xl px-4 py-3 flex items-start gap-3 group">
          <div className="text-xs text-stone-400 font-mono mt-0.5 flex-shrink-0 w-16">
            {new Date(ev.date).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
          </div>
          {editing === ev.id ? (
            <div className="flex-1 flex gap-2">
              <input autoFocus value={editDesc} onChange={e => setEditDesc(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") save(ev.id); if (e.key === "Escape") setEditing(null) }}
                className="flex-1 bg-stone-100 border-0 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
              <button onClick={() => save(ev.id)} className="bg-stone-900 text-white text-xs px-3 py-1 rounded-lg hover:bg-stone-800 btn-press interactive">שמור</button>
              <button onClick={() => setEditing(null)} className="text-stone-400 text-xs px-2 hover:text-stone-700 interactive">ביטול</button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-between gap-2">
              <span className="text-sm text-stone-700">{ev.description}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing(ev.id); setEditDesc(ev.description) }}
                  className="text-stone-400 hover:text-stone-700 interactive p-1 rounded">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => remove(ev.id)} className="text-stone-300 hover:text-red-500 interactive p-1 rounded">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {showAdd ? (
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-4 space-y-3">
          <div className="flex gap-3">
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
              className="bg-stone-100 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
            <input placeholder="תיאור האירוע" value={newDesc} onChange={e => setNewDesc(e.target.value)}
              onKeyDown={e => e.key === "Enter" && add()}
              className="flex-1 bg-stone-100 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>
          <div className="flex gap-2">
            <button onClick={add} disabled={!newDate || !newDesc}
              className="bg-stone-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-stone-800 disabled:opacity-40 btn-press interactive">הוסף</button>
            <button onClick={() => setShowAdd(false)} className="text-stone-400 text-sm px-3 py-2 hover:text-stone-700 interactive">ביטול</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full border-2 border-dashed border-stone-200 rounded-xl py-3 text-sm text-stone-400 hover:border-stone-400 hover:text-stone-600 interactive transition-colors">
          + הוסף אירוע אישי
        </button>
      )}
    </div>
  )
}

// ── Sync from Google Sheets ───────────────────────────────
function SyncEventsButton() {
  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">("idle")
  const [count, setCount] = useState(0)
  const [errMsg, setErrMsg] = useState("")

  async function sync() {
    setStatus("syncing")
    try {
      const res = await fetch("/api/sync-events", { method: "POST" })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { throw new Error(text.slice(0, 200)) }
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setCount(data.synced)
      setStatus("done")
      setTimeout(() => setStatus("idle"), 4000)
    } catch (e: any) {
      setErrMsg(e.message)
      setStatus("error")
      setTimeout(() => setStatus("idle"), 8000)
    }
  }

  return (
    <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-white font-medium text-sm">סנכרון ארועים מ-Google Sheets</p>
          <p className="text-white/45 text-xs mt-0.5">מחליף את כל הארועים הקיימים</p>
        </div>
        <button
          onClick={sync}
          disabled={status === "syncing"}
          className="bg-white/20 hover:bg-white/30 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-xl interactive btn-press transition-colors flex items-center gap-2"
        >
          {status === "syncing" ? (
            <><span className="animate-spin">⟳</span> מסנכרן...</>
          ) : status === "done" ? (
            <>✓ סונכרנו {count} ארועים</>
          ) : status === "error" ? (
            <>✕ שגיאה</>
          ) : (
            <>⟳ סנכרן עכשיו</>
          )}
        </button>
      </div>
      {status === "error" && <p className="text-red-300 text-xs mt-1">{errMsg}</p>}
    </div>
  )
}

// ── Global data manager (DB) ──────────────────────────────
function GlobalDataManager() {
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

  if (loading) return <p className="text-sm text-white/40">טוען...</p>

  return (
    <div className="space-y-6">
      <div className="bg-amber-900/30 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-amber-300">
        שינויים כאן משפיעים על <strong>כל המשתמשים</strong>
      </div>

      {/* Sync events from Sheets */}
      <SyncEventsButton />

      {/* Schedule slots */}
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">מערכת שעות</p>
        {slots.length === 0 && <p className="text-sm text-white/30">אין שיעורים</p>}
        <div className="space-y-1.5">
          {slots.map(s => (
            <div key={s.id} className="bg-white/8 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3 group">
              <span className="text-xs text-white/40 w-16">{s.dayHeb}</span>
              <span className="text-xs text-white/40 font-mono">{s.period.split(",")[0]}</span>
              <span className="text-sm text-white/70 flex-1 truncate">{s.content.split("  ")[0]}</span>
              <button onClick={() => deleteSlot(s.id)}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 interactive p-1 rounded transition-opacity">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function EditPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"name" | "events" | "design" | "manage">("name")

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10 px-4 pt-5 pb-0 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-white">עריכה אישית</h1>
            <button onClick={() => router.back()} className="text-sm text-white/50 hover:text-white interactive">← חזרה</button>
          </div>
          <p className="text-xs text-white/40 mb-3">שינויים אלו גלויים רק לך — לא משפיעים על משתמשים אחרים</p>
          <div className="flex gap-4 text-sm font-medium overflow-x-auto">
            {([["name", "שם תצוגה"], ["events", "אירועים"], ["design", "עיצוב ורקע"], ["manage", "ניהול מערכת"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`pb-3 border-b-2 transition-colors interactive whitespace-nowrap ${tab === id ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/70"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {tab === "name" && <NameEditor />}
        {tab === "events" && <PersonalEventsEditor />}
        {tab === "manage" && <GlobalDataManager />}
        {tab === "design" && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">תמונת רקע</p>
              <BackgroundPicker />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">ערכת צבעים</p>
              <div className="bg-[var(--bg-card,white)] border border-stone-200 rounded-2xl overflow-hidden">
                <ThemePicker />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
