"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface CalendarEvent {
  id: string
  date: string
  description: string
  type: string | null
  note: string | null
  forTeacher: boolean
  forStudents: boolean
  forParents: boolean
  forAll: boolean
}

const MONTH_NAMES_HE = [
  "ינואר","פברואר","מרץ","אפריל","מאי","יוני",
  "יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר",
]

const TYPE_OPTIONS = [
  { value: "",        label: "— סוג —" },
  { value: "event",   label: "אירוע" },
  { value: "meeting", label: "ישיבה / פגישה" },
  { value: "exam",    label: "מבחן" },
  { value: "trip",    label: "טיול" },
  { value: "holiday", label: "חופשה" },
]

const TYPE_STYLE: Record<string, { label: string; color: string }> = {
  exam:    { label: "מבחן",        color: "bg-red-500/20 text-red-300" },
  trip:    { label: "טיול",        color: "bg-green-500/20 text-green-300" },
  event:   { label: "אירוע",       color: "bg-blue-500/20 text-blue-300" },
  meeting: { label: "ישיבה / פגישה", color: "bg-purple-500/20 text-purple-300" },
  holiday: { label: "חופשה",       color: "bg-amber-500/20 text-amber-300" },
}

function groupByMonth(events: CalendarEvent[]) {
  const map: Record<string, CalendarEvent[]> = {}
  for (const ev of events) {
    const d = new Date(ev.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!map[key]) map[key] = []
    map[key].push(ev)
  }
  return map
}

const BLANK = { date: "", description: "", type: "", note: "", forTeacher: true, forStudents: false, forParents: false, forAll: false }

export default function CalendarPage() {
  const [events, setEvents]   = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]   = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState(BLANK)

  useEffect(() => { fetchEvents() }, [])

  async function fetchEvents() {
    setLoading(true)
    const d = await fetch("/api/events").then(r => r.json()).catch(() => ({ events: [] }))
    setEvents(d.events ?? [])
    setLoading(false)
  }

  function setF(k: keyof typeof BLANK, v: unknown) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function openAdd() {
    setEditId(null)
    setForm(BLANK)
    setShowForm(true)
  }

  function openEdit(ev: CalendarEvent) {
    setEditId(ev.id)
    setForm({
      date: ev.date.slice(0, 10),
      description: ev.description,
      type: ev.type ?? "",
      note: ev.note ?? "",
      forTeacher: ev.forTeacher,
      forStudents: ev.forStudents,
      forParents: ev.forParents,
      forAll: ev.forAll,
    })
    setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditId(null) }

  async function save() {
    if (!form.date || !form.description.trim()) return
    setSaving(true)
    const method = editId ? "PATCH" : "POST"
    const body = editId ? { id: editId, ...form } : form
    await fetch("/api/events", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setSaving(false)
    closeForm()
    fetchEvents()
  }

  async function remove(id: string) {
    if (!confirm("למחוק אירוע זה?")) return
    await fetch("/api/events", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const today    = new Date().toISOString().slice(0, 10)
  const upcoming = events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past     = events.filter(e => e.date < today).sort((a, b) => b.date.localeCompare(a.date))
  const grouped  = groupByMonth(upcoming)

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-2xl interactive leading-none">←</Link>
        <div className="flex-1">
          <h1 className="font-semibold text-lg text-white">לוח ארועים ופגישות</h1>
          <p className="text-white/40 text-xs">{upcoming.length} ארועים קרובים</p>
        </div>
        <button onClick={openAdd}
          className="bg-white/15 hover:bg-white/25 text-white text-sm px-3 py-1.5 rounded-xl interactive btn-press transition-colors">
          + הוסף
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">

        {/* Add / Edit form */}
        {showForm && (
          <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
            <h2 className="text-white font-medium text-sm">{editId ? "עריכת ארוע" : "ארוע חדש"}</h2>

            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.date} onChange={e => setF("date", e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30" />
              <select value={form.type} onChange={e => setF("type", e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30">
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <textarea value={form.description} onChange={e => setF("description", e.target.value)} rows={2}
              placeholder="תיאור *"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none" />

            <input value={form.note} onChange={e => setF("note", e.target.value)} placeholder="הערה (אופציונלי)"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.forTeacher} onChange={e => setF("forTeacher", e.target.checked)} className="accent-white" />
                <span className="text-white/60 text-sm">מחנך</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.forStudents} onChange={e => setF("forStudents", e.target.checked)} className="accent-white" />
                <span className="text-white/60 text-sm">תלמידים</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.forParents} onChange={e => setF("forParents", e.target.checked)} className="accent-white" />
                <span className="text-white/60 text-sm">הורים</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button onClick={save} disabled={!form.date || !form.description.trim() || saving}
                className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-xl disabled:opacity-40 btn-press interactive transition-colors">
                {saving ? "שומר..." : editId ? "עדכן" : "שמור"}
              </button>
              <button onClick={closeForm} className="text-white/40 text-sm px-3 py-2 hover:text-white interactive">ביטול</button>
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        )}

        {!loading && upcoming.length === 0 && !showForm && (
          <div className="glass rounded-2xl px-4 py-12 text-center">
            <p className="text-white/30 text-sm">אין ארועים קרובים</p>
            <button onClick={openAdd} className="text-white/40 text-xs mt-2 hover:text-white interactive underline">הוסף ארוע ראשון</button>
          </div>
        )}

        {Object.entries(grouped).map(([key, evs]) => {
          const [year, month] = key.split("-").map(Number)
          return (
            <section key={key}>
              <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-3 px-1">
                {MONTH_NAMES_HE[month]} {year}
              </p>
              <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
                {evs.map(ev => {
                  const d       = new Date(ev.date)
                  const isToday = ev.date.slice(0,10) === today
                  const tag     = ev.type ? TYPE_STYLE[ev.type] : null
                  const audience = [ev.forTeacher && "👩‍🏫", ev.forStudents && "🧑‍🎓", ev.forParents && "👨‍👩‍👧"].filter(Boolean)
                  return (
                    <div key={ev.id} className={`flex items-start gap-4 px-4 py-3 group ${isToday ? "bg-white/10" : ""}`}>
                      <div className="flex-shrink-0 w-10 text-center">
                        <div className={`text-xl font-light nums leading-none ${isToday ? "text-white" : "text-white/60"}`}>
                          {d.getDate()}
                        </div>
                        <div className="text-white/30 text-[10px] mt-0.5">
                          {d.toLocaleDateString("he-IL", { weekday: "short" })}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 py-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm leading-snug ${isToday ? "text-white font-medium" : "text-white/80"}`}>
                            {ev.description}
                          </p>
                          {isToday && <span className="text-[10px] glass rounded-full px-2 py-0.5 text-white/70">היום</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {tag && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tag.color}`}>{tag.label}</span>}
                          {audience.length > 0 && <span className="text-[11px]">{audience.join(" ")}</span>}
                          {ev.note && <span className="text-white/30 text-[10px] truncate">{ev.note}</span>}
                        </div>
                      </div>

                      {/* Edit / Delete — visible on hover */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-0.5">
                        <button onClick={() => openEdit(ev)}
                          className="text-white/30 hover:text-white interactive p-1.5 rounded-lg hover:bg-white/10">
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => remove(ev.id)}
                          className="text-white/30 hover:text-red-400 interactive p-1.5 rounded-lg hover:bg-white/10">
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}

        {past.length > 0 && (
          <details className="group">
            <summary className="text-white/25 text-xs cursor-pointer hover:text-white/50 transition-colors px-1 list-none flex items-center gap-2">
              <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
              ארועים שעברו ({past.length})
            </summary>
            <div className="mt-3 glass rounded-2xl overflow-hidden divide-y divide-white/5">
              {past.map(ev => {
                const d = new Date(ev.date)
                return (
                  <div key={ev.id} className="flex items-center gap-4 px-4 py-2.5 opacity-40 group">
                    <div className="flex-shrink-0 w-10 text-center">
                      <div className="text-base font-light nums text-white/60">{d.getDate()}</div>
                      <div className="text-white/30 text-[10px]">{d.toLocaleDateString("he-IL", { month: "short" })}</div>
                    </div>
                    <p className="text-white/70 text-sm flex-1">{ev.description}</p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => remove(ev.id)}
                        className="text-white/30 hover:text-red-400 interactive p-1.5 rounded-lg">
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
