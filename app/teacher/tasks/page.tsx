"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface Task {
  id: string
  description: string
  responsible: string | null
  deadline: string | null
  note: string | null
  done: boolean
  createdAt: string
}

function fmtDate(iso: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "2-digit" })
}

export default function TeacherTasksPage() {
  const { data: session } = useSession()
  const [tasks, setTasks]         = useState<Task[]>([])
  const [loading, setLoading]     = useState(true)
  const [showAdd, setShowAdd]     = useState(false)
  const [showDone, setShowDone]   = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)

  // Form state
  const [desc, setDesc]           = useState("")
  const [resp, setResp]           = useState("")
  const [deadline, setDeadline]   = useState("")
  const [note, setNote]           = useState("")
  const [saving, setSaving]       = useState(false)

  useEffect(() => { fetchTasks() }, [])

  async function fetchTasks() {
    setLoading(true)
    const d = await fetch("/api/teacher/tasks").then(r => r.json())
    setTasks(d.tasks ?? [])
    setLoading(false)
  }

  function resetForm() { setDesc(""); setResp(""); setDeadline(""); setNote(""); setEditId(null); setShowAdd(false) }

  async function save() {
    if (!desc.trim()) return
    setSaving(true)
    if (editId) {
      await fetch("/api/teacher/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, description: desc, responsible: resp, deadline: deadline || null, note }) })
    } else {
      await fetch("/api/teacher/tasks", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, responsible: resp, deadline: deadline || null, note }) })
    }
    setSaving(false)
    resetForm()
    fetchTasks()
  }

  async function toggleDone(t: Task) {
    await fetch("/api/teacher/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, done: !t.done }) })
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, done: !x.done } : x))
  }

  async function remove(id: string) {
    if (!confirm("למחוק משימה זו?")) return
    await fetch("/api/teacher/tasks", { method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }) })
    setTasks(prev => prev.filter(x => x.id !== id))
  }

  function startEdit(t: Task) {
    setEditId(t.id); setDesc(t.description); setResp(t.responsible ?? "")
    setDeadline(t.deadline ? t.deadline.slice(0, 10) : ""); setNote(t.note ?? ""); setShowAdd(true)
  }

  const open = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white flex-1">משימות שלי</h1>
        <button onClick={() => { resetForm(); setShowAdd(true) }}
          className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-xl interactive btn-press transition-colors">
          + הוסף
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* Add / Edit form */}
        {showAdd && (
          <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
            <h2 className="text-white font-medium text-sm">{editId ? "עריכת משימה" : "משימה חדשה"}</h2>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="תיאור המשימה *"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none" />
            <div className="grid grid-cols-2 gap-2">
              <input value={resp} onChange={e => setResp(e.target.value)} placeholder="אחראי ביצוע"
                className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30" />
            </div>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="הערה (אופציונלי)"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <div className="flex gap-2">
              <button onClick={save} disabled={!desc.trim() || saving}
                className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-xl disabled:opacity-40 btn-press interactive transition-colors">
                {saving ? "שומר..." : editId ? "עדכן" : "שמור"}
              </button>
              <button onClick={resetForm} className="text-white/40 text-sm px-3 py-2 hover:text-white interactive">ביטול</button>
            </div>
          </div>
        )}

        {loading && <p className="text-white/40 text-sm text-center py-8">טוען...</p>}

        {/* Open tasks */}
        {!loading && open.length === 0 && !showAdd && (
          <div className="text-center py-10">
            <p className="text-white/30 text-4xl mb-3">✅</p>
            <p className="text-white/40 text-sm">אין משימות פתוחות</p>
          </div>
        )}

        {open.length > 0 && (
          <div className="space-y-2">
            {open.map(t => (
              <TaskCard key={t.id} task={t} onToggle={toggleDone} onEdit={startEdit} onDelete={remove} />
            ))}
          </div>
        )}

        {/* Completed tasks toggle */}
        {done.length > 0 && (
          <div>
            <button onClick={() => setShowDone(s => !s)}
              className="text-white/35 text-xs hover:text-white/60 interactive flex items-center gap-2">
              <span>{showDone ? "▲" : "▼"}</span>
              <span>הושלמו ({done.length})</span>
            </button>
            {showDone && (
              <div className="mt-2 space-y-2">
                {done.map(t => (
                  <TaskCard key={t.id} task={t} onToggle={toggleDone} onEdit={startEdit} onDelete={remove} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TaskCard({ task, onToggle, onEdit, onDelete }: {
  task: Task
  onToggle: (t: Task) => void
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
}) {
  const overdue = !task.done && isPast(task.deadline)
  return (
    <div className={`bg-white/8 border rounded-2xl p-4 flex gap-3 group transition-opacity ${task.done ? "opacity-50 border-white/5" : "border-white/10"}`}>
      <button onClick={() => onToggle(task)}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 interactive transition-colors ${task.done ? "bg-green-500 border-green-500" : "border-white/30 hover:border-white/60"}`}>
        {task.done && <span className="text-white text-[10px] flex items-center justify-center w-full h-full">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${task.done ? "line-through text-white/40" : "text-white/85"}`}>{task.description}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
          {task.responsible && (
            <span className="text-white/40 text-[11px]">👤 {task.responsible}</span>
          )}
          {task.deadline && (
            <span className={`text-[11px] ${overdue ? "text-red-400" : "text-white/40"}`}>
              📅 {fmtDate(task.deadline)}{overdue && " — פג תוקף"}
            </span>
          )}
          <span className="text-white/25 text-[11px]">הוזן {fmtDate(task.createdAt)}</span>
        </div>
        {task.note && <p className="text-white/35 text-[11px] mt-1 italic">{task.note}</p>}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => onEdit(task)} className="text-white/30 hover:text-white interactive p-1 rounded">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button onClick={() => onDelete(task.id)} className="text-white/30 hover:text-red-400 interactive p-1 rounded">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  )
}

function isPast(iso: string | null) {
  if (!iso) return false
  return new Date(iso) < new Date()
}
