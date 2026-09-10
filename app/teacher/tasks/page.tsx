"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Importance = "RED" | "YELLOW" | "BLUE"

interface PersonalTaskT {
  id: string
  title: string
  link: string | null
  deadline: string | null
  importance: Importance
  reminderAt: string | null
  done: boolean
  createdAt: string
}

interface StaffAssigneeT {
  id: string
  teacherLabel: string
  userId: string | null
  done: boolean
}

interface StaffTaskT {
  id: string
  title: string
  link: string | null
  deadline: string | null
  importance: Importance
  assignees: StaffAssigneeT[]
}

const IMPORTANCE_OPTIONS: { value: Importance; label: string; dot: string }[] = [
  { value: "RED", label: "דחוף", dot: "bg-red-500" },
  { value: "YELLOW", label: "בינוני", dot: "bg-amber-400" },
  { value: "BLUE", label: "רגיל", dot: "bg-blue-400" },
]

function fmtDate(iso: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "2-digit" })
}
function isPast(iso: string | null) {
  if (!iso) return false
  return new Date(iso) < new Date()
}
function dotFor(importance: Importance) {
  return IMPORTANCE_OPTIONS.find(o => o.value === importance)?.dot ?? "bg-blue-400"
}

export default function TasksPage() {
  const [tab, setTab] = useState<"personal" | "staff">("personal")

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white flex-1">משימות</h1>
      </header>

      <div className="flex gap-2 px-4 pt-4">
        <button onClick={() => setTab("personal")}
          className={`px-4 py-2 rounded-xl text-sm font-medium interactive btn-press transition-colors ${tab === "personal" ? "bg-white/20 text-white" : "text-white/40 hover:text-white/70"}`}>
          המשימות שלי
        </button>
        <button onClick={() => setTab("staff")}
          className={`px-4 py-2 rounded-xl text-sm font-medium interactive btn-press transition-colors ${tab === "staff" ? "bg-white/20 text-white" : "text-white/40 hover:text-white/70"}`}>
          משימות צוות
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {tab === "personal" ? <PersonalTasksTab /> : <StaffTasksTab />}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MY TASKS
   ══════════════════════════════════════════════════════════ */
function PersonalTasksTab() {
  const [tasks, setTasks] = useState<PersonalTaskT[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [link, setLink] = useState("")
  const [deadline, setDeadline] = useState("")
  const [importance, setImportance] = useState<Importance>("BLUE")
  const [reminderAt, setReminderAt] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchTasks() }, [])

  async function fetchTasks() {
    setLoading(true)
    const d = await fetch("/api/tasks/personal").then(r => r.json()).catch(() => ({ tasks: [] }))
    setTasks(d.tasks ?? [])
    setLoading(false)
  }

  function resetForm() {
    setTitle(""); setLink(""); setDeadline(""); setImportance("BLUE"); setReminderAt(""); setEditId(null); setShowAdd(false)
  }

  async function save() {
    if (!title.trim()) return
    setSaving(true)
    const body = { title, link: link || null, deadline: deadline || null, importance, reminderAt: reminderAt || null }
    if (editId) {
      await fetch("/api/tasks/personal", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...body }) })
    } else {
      await fetch("/api/tasks/personal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    }
    setSaving(false)
    resetForm()
    fetchTasks()
  }

  async function toggleDone(t: PersonalTaskT) {
    await fetch("/api/tasks/personal", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t.id, done: !t.done }) })
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, done: !x.done } : x))
  }

  async function remove(id: string) {
    if (!confirm("למחוק משימה זו?")) return
    await fetch("/api/tasks/personal", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setTasks(prev => prev.filter(x => x.id !== id))
  }

  function startEdit(t: PersonalTaskT) {
    setEditId(t.id); setTitle(t.title); setLink(t.link ?? ""); setDeadline(t.deadline ? t.deadline.slice(0, 10) : "")
    setImportance(t.importance); setReminderAt(t.reminderAt ? t.reminderAt.slice(0, 16) : ""); setShowAdd(true)
  }

  const open = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  return (
    <div className="space-y-5">
      <button onClick={() => { resetForm(); setShowAdd(true) }}
        className="w-full bg-white/15 hover:bg-white/25 text-white text-sm font-medium py-2.5 rounded-xl interactive btn-press transition-colors">
        + משימה חדשה
      </button>

      {showAdd && (
        <TaskForm
          title={title} setTitle={setTitle}
          link={link} setLink={setLink}
          deadline={deadline} setDeadline={setDeadline}
          importance={importance} setImportance={setImportance}
          reminderAt={reminderAt} setReminderAt={setReminderAt}
          editing={!!editId} saving={saving}
          onSave={save} onCancel={resetForm}
        />
      )}

      {loading && <p className="text-white/40 text-sm text-center py-8">טוען...</p>}

      {!loading && open.length === 0 && !showAdd && (
        <div className="text-center py-10">
          <p className="text-white/30 text-4xl mb-3">✅</p>
          <p className="text-white/40 text-sm">אין משימות פתוחות</p>
        </div>
      )}

      {open.length > 0 && (
        <div className="space-y-2">
          {open.map(t => <PersonalTaskCard key={t.id} task={t} onToggle={toggleDone} onEdit={startEdit} onDelete={remove} />)}
        </div>
      )}

      {done.length > 0 && (
        <div>
          <button onClick={() => setShowDone(s => !s)} className="text-white/35 text-xs hover:text-white/60 interactive flex items-center gap-2">
            <span>{showDone ? "▲" : "▼"}</span><span>הושלמו ({done.length})</span>
          </button>
          {showDone && (
            <div className="mt-2 space-y-2">
              {done.map(t => <PersonalTaskCard key={t.id} task={t} onToggle={toggleDone} onEdit={startEdit} onDelete={remove} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TaskForm({ title, setTitle, link, setLink, deadline, setDeadline, importance, setImportance, reminderAt, setReminderAt, editing, saving, onSave, onCancel }: {
  title: string; setTitle: (v: string) => void
  link: string; setLink: (v: string) => void
  deadline: string; setDeadline: (v: string) => void
  importance: Importance; setImportance: (v: Importance) => void
  reminderAt: string; setReminderAt: (v: string) => void
  editing: boolean; saving: boolean
  onSave: () => void; onCancel: () => void
}) {
  return (
    <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
      <h2 className="text-white font-medium text-sm">{editing ? "עריכת משימה" : "משימה חדשה"}</h2>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="כותרת המשימה *"
        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
      <input value={link} onChange={e => setLink(e.target.value)} placeholder="קישור לקובץ / עמוד (אופציונלי)" dir="ltr"
        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30" />
        <div className="flex gap-1.5">
          {IMPORTANCE_OPTIONS.map(o => (
            <button key={o.value} type="button" onClick={() => setImportance(o.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs interactive btn-press transition-colors ${importance === o.value ? "bg-white/20 text-white" : "bg-white/5 text-white/40 hover:text-white/70"}`}>
              <span className={`w-2 h-2 rounded-full ${o.dot}`} />{o.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-white/40 text-xs mb-1 block">תזכורת (אופציונלי)</label>
        <input type="datetime-local" value={reminderAt} onChange={e => setReminderAt(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30" />
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} disabled={!title.trim() || saving}
          className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-xl disabled:opacity-40 btn-press interactive transition-colors">
          {saving ? "שומר..." : editing ? "עדכן" : "שמור"}
        </button>
        <button onClick={onCancel} className="text-white/40 text-sm px-3 py-2 hover:text-white interactive">ביטול</button>
      </div>
    </div>
  )
}

function PersonalTaskCard({ task, onToggle, onEdit, onDelete }: {
  task: PersonalTaskT; onToggle: (t: PersonalTaskT) => void; onEdit: (t: PersonalTaskT) => void; onDelete: (id: string) => void
}) {
  const overdue = !task.done && isPast(task.deadline)
  return (
    <div className={`bg-white/8 border rounded-2xl p-4 flex gap-3 group transition-opacity ${task.done ? "opacity-50 border-white/5" : "border-white/10"}`}>
      <button onClick={() => onToggle(task)}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 interactive transition-colors ${task.done ? "bg-green-500 border-green-500" : "border-white/30 hover:border-white/60"}`}>
        {task.done && <span className="text-white text-[10px] flex items-center justify-center w-full h-full">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotFor(task.importance)}`} />
          <p className={`text-sm ${task.done ? "line-through text-white/40" : "text-white/85"}`}>{task.title}</p>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
          {task.deadline && (
            <span className={`text-[11px] ${overdue ? "text-red-400" : "text-white/40"}`}>📅 {fmtDate(task.deadline)}{overdue && " — פג תוקף"}</span>
          )}
          {task.reminderAt && <span className="text-white/40 text-[11px]">🔔 {new Date(task.reminderAt).toLocaleString("he-IL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
          {task.link && <a href={task.link} target="_blank" rel="noopener noreferrer" className="text-blue-300/80 hover:text-blue-300 text-[11px] underline">🔗 קישור</a>}
        </div>
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

/* ══════════════════════════════════════════════════════════
   STAFF TASKS
   ══════════════════════════════════════════════════════════ */
function StaffTasksTab() {
  const [tasks, setTasks] = useState<StaffTaskT[]>([])
  const [teacherNames, setTeacherNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const [title, setTitle] = useState("")
  const [link, setLink] = useState("")
  const [deadline, setDeadline] = useState("")
  const [importance, setImportance] = useState<Importance>("BLUE")
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchTasks() }, [])

  async function fetchTasks() {
    setLoading(true)
    const d = await fetch("/api/tasks/staff").then(r => r.json()).catch(() => ({ tasks: [], teacherNames: [] }))
    setTasks(d.tasks ?? [])
    setTeacherNames(d.teacherNames ?? [])
    setLoading(false)
  }

  function resetForm() {
    setTitle(""); setLink(""); setDeadline(""); setImportance("BLUE"); setSelected([]); setShowAdd(false)
  }

  function toggleSelected(name: string) {
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  async function save() {
    if (!title.trim() || selected.length === 0) return
    setSaving(true)
    await fetch("/api/tasks/staff", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, link: link || null, deadline: deadline || null, importance, assignees: selected }),
    })
    setSaving(false)
    resetForm()
    fetchTasks()
  }

  async function toggleAssignee(assigneeId: string, done: boolean) {
    await fetch("/api/tasks/staff", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assigneeId, done: !done }) })
    setTasks(prev => prev.map(t => ({ ...t, assignees: t.assignees.map(a => a.id === assigneeId ? { ...a, done: !done } : a) })))
  }

  async function remove(id: string) {
    if (!confirm("למחוק משימת צוות זו?")) return
    await fetch("/api/tasks/staff", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="space-y-5">
      <button onClick={() => { resetForm(); setShowAdd(true) }}
        className="w-full bg-white/15 hover:bg-white/25 text-white text-sm font-medium py-2.5 rounded-xl interactive btn-press transition-colors">
        + משימת צוות חדשה
      </button>

      {showAdd && (
        <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
          <h2 className="text-white font-medium text-sm">משימת צוות חדשה</h2>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="כותרת המשימה *"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
          <input value={link} onChange={e => setLink(e.target.value)} placeholder="קישור לקובץ / עמוד (אופציונלי)" dir="ltr"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30" />
            <div className="flex gap-1.5">
              {IMPORTANCE_OPTIONS.map(o => (
                <button key={o.value} type="button" onClick={() => setImportance(o.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs interactive btn-press transition-colors ${importance === o.value ? "bg-white/20 text-white" : "bg-white/5 text-white/40 hover:text-white/70"}`}>
                  <span className={`w-2 h-2 rounded-full ${o.dot}`} />{o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-white/40 text-xs mb-1.5 block">שייך למחנכים</label>
            {teacherNames.length === 0 ? (
              <p className="text-white/25 text-xs">אין עדיין מחנכים מוגדרים במערכת (מוגדר לפי "מחנך" על כל כיתה)</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teacherNames.map(name => (
                  <button key={name} type="button" onClick={() => toggleSelected(name)}
                    className={`px-3 py-1.5 rounded-xl text-xs interactive btn-press transition-colors ${selected.includes(name) ? "bg-white/25 text-white" : "bg-white/5 text-white/40 hover:text-white/70"}`}>
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={!title.trim() || selected.length === 0 || saving}
              className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-xl disabled:opacity-40 btn-press interactive transition-colors">
              {saving ? "שומר..." : "שמור"}
            </button>
            <button onClick={resetForm} className="text-white/40 text-sm px-3 py-2 hover:text-white interactive">ביטול</button>
          </div>
        </div>
      )}

      {loading && <p className="text-white/40 text-sm text-center py-8">טוען...</p>}

      {!loading && tasks.length === 0 && !showAdd && (
        <div className="text-center py-10">
          <p className="text-white/30 text-4xl mb-3">👥</p>
          <p className="text-white/40 text-sm">אין משימות צוות</p>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map(t => {
            const overdue = isPast(t.deadline) && t.assignees.some(a => !a.done)
            return (
              <div key={t.id} className="bg-white/8 border border-white/10 rounded-2xl p-4 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotFor(t.importance)}`} />
                    <p className="text-sm text-white/85 truncate">{t.title}</p>
                  </div>
                  <button onClick={() => remove(t.id)} className="text-white/25 hover:text-red-400 interactive p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 mb-2">
                  {t.deadline && <span className={`text-[11px] ${overdue ? "text-red-400" : "text-white/40"}`}>📅 {fmtDate(t.deadline)}{overdue && " — פג תוקף"}</span>}
                  {t.link && <a href={t.link} target="_blank" rel="noopener noreferrer" className="text-blue-300/80 hover:text-blue-300 text-[11px] underline">🔗 קישור</a>}
                </div>
                <div className="space-y-1 pt-2 border-t border-white/5">
                  {t.assignees.map(a => (
                    <button key={a.id} onClick={() => toggleAssignee(a.id, a.done)}
                      className="w-full flex items-center gap-2.5 py-1 interactive text-right">
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${a.done ? "bg-green-500 border-green-500" : "border-white/30"}`}>
                        {a.done && <span className="text-white text-[8px]">✓</span>}
                      </span>
                      <span className={`text-xs ${a.done ? "text-white/35 line-through" : "text-white/70"}`}>{a.teacherLabel}</span>
                      {!a.userId && <span className="text-white/20 text-[10px]">(טרם הצטרף/ה)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
