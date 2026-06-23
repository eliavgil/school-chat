"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ThemePicker from "@/app/components/ThemePicker"

interface Slot { id: string; dayHeb: string; period: string; content: string }
interface CalEvent { id: string; date: string; description: string; grade?: string | null }

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"]

// ── Schedule editor ───────────────────────────────────────
function ScheduleEditor() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState("")
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/schedule").then(r => r.json()).then(d => setSlots(d.slots ?? []))
  }, [])

  async function save(slot: Slot) {
    setSaving(slot.id)
    await fetch("/api/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: slot.id, content: editVal }),
    })
    setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, content: editVal } : s))
    setEditing(null)
    setSaving(null)
  }

  async function deleteSlot(id: string) {
    if (!confirm("למחוק שיעור זה?")) return
    await fetch("/api/schedule", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setSlots(prev => prev.filter(s => s.id !== id))
  }

  const byDay = DAYS.map(day => ({
    day,
    slots: slots.filter(s => s.dayHeb === day).sort((a, b) => a.period.localeCompare(b.period)),
  })).filter(d => d.slots.length > 0)

  return (
    <div className="space-y-4">
      {byDay.map(({ day, slots: daySlots }) => (
        <div key={day} className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <div className="bg-stone-50 border-b border-stone-200 px-4 py-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">יום {day}</span>
          </div>
          <div className="divide-y divide-stone-100">
            {daySlots.map(slot => (
              <div key={slot.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs text-stone-400 font-mono mt-0.5 flex-shrink-0">{slot.period}</div>
                  {editing === slot.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        autoFocus
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") save(slot); if (e.key === "Escape") setEditing(null) }}
                        className="flex-1 bg-stone-100 border-0 rounded-lg px-3 py-1.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      />
                      <button onClick={() => save(slot)} disabled={saving === slot.id}
                        className="bg-stone-900 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-stone-800 btn-press interactive disabled:opacity-50">
                        {saving === slot.id ? "..." : "שמור"}
                      </button>
                      <button onClick={() => setEditing(null)}
                        className="text-stone-400 text-xs px-2 py-1.5 hover:text-stone-700 interactive">
                        ביטול
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between gap-2 group">
                      <span className="text-sm text-stone-700 leading-snug">{slot.content}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditing(slot.id); setEditVal(slot.content) }}
                          className="text-stone-400 hover:text-stone-700 interactive p-1 rounded">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => deleteSlot(slot.id)}
                          className="text-stone-300 hover:text-red-500 interactive p-1 rounded">
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
    </div>
  )
}

// ── Events editor ─────────────────────────────────────────
function EventsEditor() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newDate, setNewDate] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newGrade, setNewGrade] = useState("")
  const [editing, setEditing] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState("")

  useEffect(() => {
    fetch("/api/events").then(r => r.json()).then(d => setEvents(d.events ?? []))
  }, [])

  async function addEvent() {
    if (!newDate || !newDesc) return
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, description: newDesc, grade: newGrade || null }),
    })
    const data = await res.json()
    setEvents(prev => [...prev, data.event].sort((a, b) => a.date.localeCompare(b.date)))
    setNewDate(""); setNewDesc(""); setNewGrade(""); setShowAdd(false)
  }

  async function saveEdit(event: CalEvent) {
    await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: event.id, description: editDesc }),
    })
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, description: editDesc } : e))
    setEditing(null)
  }

  async function deleteEvent(id: string) {
    if (!confirm("למחוק אירוע זה?")) return
    await fetch("/api/events", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-3">
      {events.map(ev => (
        <div key={ev.id} className="bg-white border border-stone-200 rounded-xl px-4 py-3 flex items-start gap-3 group">
          <div className="text-xs text-stone-400 font-mono mt-0.5 flex-shrink-0 w-20">
            {new Date(ev.date).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
          </div>
          {editing === ev.id ? (
            <div className="flex-1 flex gap-2">
              <input autoFocus value={editDesc} onChange={e => setEditDesc(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveEdit(ev); if (e.key === "Escape") setEditing(null) }}
                className="flex-1 bg-stone-100 border-0 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
              <button onClick={() => saveEdit(ev)} className="bg-stone-900 text-white text-xs px-3 py-1 rounded-lg hover:bg-stone-800 btn-press interactive">שמור</button>
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
                <button onClick={() => deleteEvent(ev.id)} className="text-stone-300 hover:text-red-500 interactive p-1 rounded">
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
              className="flex-1 bg-stone-100 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>
          <div className="flex gap-2">
            <button onClick={addEvent} disabled={!newDate || !newDesc}
              className="bg-stone-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-stone-800 disabled:opacity-40 btn-press interactive">
              הוסף
            </button>
            <button onClick={() => setShowAdd(false)} className="text-stone-400 text-sm px-3 py-2 hover:text-stone-700 interactive">ביטול</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full border-2 border-dashed border-stone-200 rounded-xl py-3 text-sm text-stone-400 hover:border-stone-400 hover:text-stone-600 interactive transition-colors">
          + הוסף אירוע
        </button>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function EditPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"schedule" | "events" | "theme">("schedule")

  return (
    <div className="min-h-screen bg-[#faf9f6]" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 pt-5 pb-0 flex-shrink-0 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-stone-900">עריכת תוכן</h1>
            <button onClick={() => router.back()} className="text-sm text-stone-400 hover:text-stone-700 interactive">← חזרה</button>
          </div>
          <div className="flex gap-6 text-sm font-medium">
            {([["schedule", "מערכת שעות"], ["events", "אירועים"], ["theme", "עיצוב"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`pb-3 border-b-2 transition-colors interactive ${tab === id ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-700"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {tab === "schedule" && <ScheduleEditor />}
        {tab === "events" && <EventsEditor />}
        {tab === "theme" && (
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <ThemePicker />
          </div>
        )}
      </div>
    </div>
  )
}
