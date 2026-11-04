"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Urgency = "LOW" | "NORMAL" | "HIGH"
interface RequestT {
  id: string
  title: string
  note: string | null
  urgency: Urgency
  done: boolean
  createdAt: string
  createdBy: { name: string | null }
}

const URGENCY_STYLE: Record<Urgency, { label: string; color: string; dot: string }> = {
  LOW:    { label: "רגיל",  color: "text-slate-500 bg-slate-100",  dot: "bg-slate-400" },
  NORMAL: { label: "בינוני", color: "text-amber-700 bg-amber-100",  dot: "bg-amber-500" },
  HIGH:   { label: "דחוף",  color: "text-red-700 bg-red-100",      dot: "bg-red-500" },
}

const BLANK = { title: "", note: "", urgency: "NORMAL" as Urgency }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })
}

export default function CoordinatorRequestsPage() {
  const [requests, setRequests] = useState<RequestT[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [showDone, setShowDone] = useState(false)

  async function load() {
    setLoading(true)
    const d = await fetch("/api/teacher/coordinator-requests").then(r => r.json()).catch(() => ({ requests: [] }))
    setRequests(d.requests ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function add() {
    if (!form.title.trim()) return
    setSaving(true)
    await fetch("/api/teacher/coordinator-requests", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, note: form.note || null, urgency: form.urgency }),
    })
    setForm(BLANK); setShowAdd(false)
    await load()
    setSaving(false)
  }

  async function toggleDone(r: RequestT) {
    setRequests(rs => rs.map(x => x.id === r.id ? { ...x, done: !r.done } : x))
    await fetch("/api/teacher/coordinator-requests", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, done: !r.done }),
    })
  }

  async function remove(id: string) {
    if (!confirm("למחוק פנייה זו?")) return
    await fetch("/api/teacher/coordinator-requests", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    await load()
  }

  const open = requests.filter(r => !r.done)
  const done = requests.filter(r => r.done)

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <header className="bg-white border-b border-slate-200 px-4 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Link href="/home" className="text-slate-400 hover:text-slate-900 text-xl interactive">→</Link>
        <h1 className="font-extrabold text-lg text-slate-900 flex-1">לטיפול רכז</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5">
        <button onClick={() => setShowAdd(v => !v)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-3 rounded-xl interactive btn-press transition-colors mb-4">
          {showAdd ? "ביטול" : "+ פנייה חדשה לרכז"}
        </button>

        {showAdd && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 mb-5 shadow-sm">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="מה הפנייה? *" dir="rtl"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="פרטים נוספים (אופציונלי)" rows={2} dir="rtl"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            <div className="flex gap-2">
              {(["LOW", "NORMAL", "HIGH"] as Urgency[]).map(u => (
                <button key={u} onClick={() => setForm(f => ({ ...f, urgency: u }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold interactive btn-press transition-colors ${
                    form.urgency === u ? URGENCY_STYLE[u].color + " ring-2 ring-offset-1 ring-indigo-400" : "bg-slate-50 text-slate-400"
                  }`}>
                  {URGENCY_STYLE[u].label}
                </button>
              ))}
            </div>
            <button onClick={add} disabled={saving || !form.title.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl disabled:opacity-40 btn-press interactive transition-colors">
              {saving ? "שולח..." : "שלח לרכז"}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-slate-400 text-sm text-center py-8">טוען...</p>
        ) : open.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-slate-400 text-sm font-medium">אין פניות פתוחות</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {open.map(r => <RequestRow key={r.id} r={r} onToggle={() => toggleDone(r)} onDelete={() => remove(r.id)} />)}
          </div>
        )}

        {done.length > 0 && (
          <div className="mt-6">
            <button onClick={() => setShowDone(v => !v)} className="text-slate-400 hover:text-slate-600 text-xs font-bold interactive">
              {showDone ? "▲ הסתר פניות שטופלו" : `▼ הצג פניות שטופלו (${done.length})`}
            </button>
            {showDone && (
              <div className="space-y-2.5 mt-3 opacity-60">
                {done.map(r => <RequestRow key={r.id} r={r} onToggle={() => toggleDone(r)} onDelete={() => remove(r.id)} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function RequestRow({ r, onToggle, onDelete }: { r: RequestT; onToggle: () => void; onDelete: () => void }) {
  const style = URGENCY_STYLE[r.urgency]
  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3.5 flex items-start gap-3">
      <button onClick={onToggle}
        className="w-6 h-6 rounded-lg border-2 border-slate-300 hover:border-indigo-500 flex-shrink-0 flex items-center justify-center interactive btn-press transition-colors mt-0.5">
        {r.done && <span className="text-indigo-600 text-sm font-bold">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-slate-900 text-[15px] font-semibold leading-snug ${r.done ? "line-through text-slate-400" : ""}`}>{r.title}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${style.color}`}>{style.label}</span>
        </div>
        {r.note && <p className="text-slate-500 text-xs mt-1 whitespace-pre-wrap">{r.note}</p>}
        <p className="text-slate-300 text-[11px] mt-1">{r.createdBy?.name ?? "מחנך"} · {fmtDate(r.createdAt)}</p>
      </div>
      <button onClick={onDelete} className="text-slate-300 hover:text-red-500 interactive p-1 flex-shrink-0">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>
  )
}
