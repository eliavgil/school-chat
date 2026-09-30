"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { getPersonalEvents, addPersonalEvent, updatePersonalEvent, deletePersonalEvent, type PersonalEvent } from "@/app/components/personalStore"

interface SchoolEvent {
  id: string
  date: string
  description: string
  type: string | null
  note: string | null
}

const TYPE_STYLE: Record<string, { label: string; color: string }> = {
  exam:    { label: "מבחן",          color: "bg-red-500/20 text-red-300" },
  trip:    { label: "טיול",          color: "bg-green-500/20 text-green-300" },
  event:   { label: "אירוע",         color: "bg-blue-500/20 text-blue-300" },
  meeting: { label: "ישיבה / פגישה", color: "bg-purple-500/20 text-purple-300" },
  holiday: { label: "חופשה",         color: "bg-amber-500/20 text-amber-300" },
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "numeric" })
}

/* ── One row: school event (read-only) or personal event (editable) ──── */
function EventRow({ date, description, type, isPersonal, onEdit, onDelete }: {
  date: string; description: string; type?: string | null
  isPersonal: boolean; onEdit?: () => void; onDelete?: () => void
}) {
  const style = type ? TYPE_STYLE[type] : null
  return (
    <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
      <div className="flex-shrink-0 text-center w-14">
        <div className="text-white/70 text-xs font-medium">{fmt(date)}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/85 text-sm">{description}</p>
        {style && <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${style.color}`}>{style.label}</span>}
        {isPersonal && <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">אישי</span>}
      </div>
      {isPersonal && (
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onEdit} className="text-white/30 hover:text-white interactive p-1">✎</button>
          <button onClick={onDelete} className="text-white/30 hover:text-red-400 interactive p-1">✕</button>
        </div>
      )}
    </div>
  )
}

export default function EventsPage() {
  const [tab, setTab] = useState<"events" | "exams">("events")
  const [schoolEvents, setSchoolEvents] = useState<SchoolEvent[]>([])
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([])
  const [loading, setLoading] = useState(true)

  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [newDate, setNewDate] = useState("")
  const [newDesc, setNewDesc] = useState("")

  function reloadPersonal() { setPersonalEvents(getPersonalEvents()) }

  useEffect(() => {
    reloadPersonal()
    fetch("/api/student/events").then(r => r.json()).then(d => setSchoolEvents(d.events ?? [])).finally(() => setLoading(false))
  }, [])

  const exams = useMemo(() => schoolEvents.filter(e => e.type === "exam").sort((a, b) => a.date.localeCompare(b.date)), [schoolEvents])

  const merged = useMemo(() => {
    const school = schoolEvents.filter(e => e.type !== "exam").map(e => ({ id: e.id, date: e.date, description: e.description, type: e.type, personal: false }))
    const personal = personalEvents.map(e => ({ id: e.id, date: e.date, description: e.description, type: null as string | null, personal: true }))
    return [...school, ...personal].sort((a, b) => a.date.localeCompare(b.date))
  }, [schoolEvents, personalEvents])

  function resetForm() { setNewDate(""); setNewDesc(""); setEditId(null); setShowAdd(false) }

  function save() {
    if (!newDate || !newDesc.trim()) return
    if (editId) updatePersonalEvent(editId, newDesc.trim())
    else addPersonalEvent(newDate, newDesc.trim())
    reloadPersonal()
    resetForm()
  }

  function startEdit(ev: PersonalEvent) {
    setEditId(ev.id); setNewDate(ev.date.slice(0, 10)); setNewDesc(ev.description); setShowAdd(true)
  }

  function remove(id: string) {
    if (!confirm("למחוק את האירוע?")) return
    deletePersonalEvent(id)
    reloadPersonal()
  }

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/student/logistics" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white flex-1">אירועים ומועדים</h1>
      </header>

      <div className="flex gap-2 px-4 pt-4">
        <button onClick={() => setTab("events")}
          className={`px-4 py-2 rounded-xl text-sm font-medium interactive btn-press transition-colors ${tab === "events" ? "bg-white/20 text-white" : "text-white/40 hover:text-white/70"}`}>
          אירועים
        </button>
        <button onClick={() => setTab("exams")}
          className={`px-4 py-2 rounded-xl text-sm font-medium interactive btn-press transition-colors ${tab === "exams" ? "bg-white/20 text-white" : "text-white/40 hover:text-white/70"}`}>
          לוח מבחנים
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {tab === "events" && (
          <>
            <button onClick={() => { resetForm(); setShowAdd(true) }}
              className="w-full bg-white/15 hover:bg-white/25 text-white text-sm font-medium py-2.5 rounded-xl interactive btn-press transition-colors">
              + הוספת אירוע אישי
            </button>

            {showAdd && (
              <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
                <h2 className="text-white font-medium text-sm">{editId ? "עריכת אירוע" : "אירוע חדש"}</h2>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} disabled={!!editId}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white disabled:opacity-50" />
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="תיאור האירוע"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30" />
                <div className="flex gap-2">
                  <button onClick={save} disabled={!newDate || !newDesc.trim()}
                    className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-xl disabled:opacity-40 btn-press interactive transition-colors">
                    {editId ? "עדכן" : "שמור"}
                  </button>
                  <button onClick={resetForm} className="text-white/40 text-sm px-3 py-2 hover:text-white interactive">ביטול</button>
                </div>
              </div>
            )}

            {loading && <p className="text-white/40 text-sm text-center py-8">טוען...</p>}

            {!loading && merged.length === 0 && (
              <div className="glass rounded-2xl px-4 py-10 text-center">
                <p className="text-white/30 text-sm">אין אירועים קרובים</p>
              </div>
            )}

            {!loading && merged.length > 0 && (
              <div className="space-y-2">
                {merged.map(e => (
                  <EventRow key={e.id} date={e.date} description={e.description} type={e.type} isPersonal={e.personal}
                    onEdit={() => startEdit(personalEvents.find(p => p.id === e.id)!)}
                    onDelete={() => remove(e.id)} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "exams" && (
          <>
            {loading && <p className="text-white/40 text-sm text-center py-8">טוען...</p>}
            {!loading && exams.length === 0 && (
              <div className="glass rounded-2xl px-4 py-10 text-center">
                <p className="text-white/30 text-sm">אין מבחנים קרובים בלוח</p>
              </div>
            )}
            {!loading && exams.length > 0 && (
              <div className="space-y-2">
                {exams.map(e => (
                  <div key={e.id} className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className="flex-shrink-0 text-center w-14">
                      <div className="text-white/70 text-xs font-medium">{fmt(e.date)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/85 text-sm">{e.description}</p>
                      {e.note && <p className="text-white/40 text-xs mt-0.5">{e.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
