"use client"

import { useEffect, useState } from "react"

export type Importance = "RED" | "YELLOW" | "BLUE"

export const IMPORTANCE_OPTIONS: { value: Importance; label: string; dot: string }[] = [
  { value: "RED", label: "דחוף", dot: "bg-red-500" },
  { value: "YELLOW", label: "בינוני", dot: "bg-amber-400" },
  { value: "BLUE", label: "רגיל", dot: "bg-blue-400" },
]

export function fmtDate(iso: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "2-digit" })
}
export function isPast(iso: string | null) {
  if (!iso) return false
  return new Date(iso) < new Date()
}
export function dotFor(importance: Importance) {
  return IMPORTANCE_OPTIONS.find(o => o.value === importance)?.dot ?? "bg-blue-400"
}

interface StaffAssigneeT {
  id: string
  teacherLabel: string
  userId: string | null
  done: boolean
  note: string | null
}

interface StaffTaskT {
  id: string
  title: string
  link: string | null
  deadline: string | null
  note: string | null
  importance: Importance
  assignees: StaffAssigneeT[]
}

/* ══════════════════════════════════════════════════════════
   STAFF TASKS — shared between /teacher/tasks and /teacher/team,
   since a grade team's shared to-dos are the same underlying feature as
   the coordinator's staff-task assignments, just viewed from the team's
   own page instead of the general tasks page.
   ══════════════════════════════════════════════════════════ */
export function StaffTasksTab() {
  const [tasks, setTasks] = useState<StaffTaskT[]>([])
  const [teacherNames, setTeacherNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const [title, setTitle] = useState("")
  const [link, setLink] = useState("")
  const [deadline, setDeadline] = useState("")
  const [importance, setImportance] = useState<Importance>("BLUE")
  const [selected, setSelected] = useState<string[]>([])
  const [reminderAt, setReminderAt] = useState("")
  const [reminderTeachers, setReminderTeachers] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Per-assignee note being edited right now (id -> draft text), and the
  // task-level general note being edited (task id -> draft text) — both
  // null/absent means "not currently open for editing".
  const [editingAssigneeNote, setEditingAssigneeNote] = useState<Record<string, string>>({})
  const [editingTaskNote, setEditingTaskNote] = useState<Record<string, string>>({})

  useEffect(() => { fetchTasks() }, [])

  async function fetchTasks() {
    setLoading(true)
    const d = await fetch("/api/tasks/staff").then(r => r.json()).catch(() => ({ tasks: [], teacherNames: [] }))
    setTasks(d.tasks ?? [])
    setTeacherNames(d.teacherNames ?? [])
    setLoading(false)
  }

  function resetForm() {
    setTitle(""); setLink(""); setDeadline(""); setImportance("BLUE"); setSelected([])
    setReminderAt(""); setReminderTeachers([]); setShowAdd(false)
  }

  function toggleSelected(name: string) {
    const wasSelected = selected.includes(name)
    setSelected(prev => wasSelected ? prev.filter(n => n !== name) : [...prev, name])
    // A teacher removed from "assigned to" can't still be picked "to remind"
    if (wasSelected) setReminderTeachers(prev => prev.filter(n => n !== name))
  }

  function toggleReminderTeacher(name: string) {
    setReminderTeachers(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  async function save() {
    if (!title.trim() || selected.length === 0) return
    setSaving(true)
    await fetch("/api/tasks/staff", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, link: link || null, deadline: deadline || null, importance, assignees: selected,
        reminderAt: reminderAt || null, reminderTeachers,
      }),
    })
    setSaving(false)
    resetForm()
    fetchTasks()
  }

  async function toggleAssignee(assigneeId: string, done: boolean) {
    await fetch("/api/tasks/staff", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assigneeId, done: !done }) })
    setTasks(prev => prev.map(t => ({ ...t, assignees: t.assignees.map(a => a.id === assigneeId ? { ...a, done: !done } : a) })))
  }

  async function saveAssigneeNote(assigneeId: string) {
    const note = editingAssigneeNote[assigneeId] ?? ""
    await fetch("/api/tasks/staff", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assigneeId, note }) })
    setTasks(prev => prev.map(t => ({ ...t, assignees: t.assignees.map(a => a.id === assigneeId ? { ...a, note: note || null } : a) })))
    setEditingAssigneeNote(prev => { const next = { ...prev }; delete next[assigneeId]; return next })
  }

  async function saveTaskNote(taskId: string) {
    const note = editingTaskNote[taskId] ?? ""
    await fetch("/api/tasks/staff", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: taskId, note }) })
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, note: note || null } : t))
    setEditingTaskNote(prev => { const next = { ...prev }; delete next[taskId]; return next })
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
          {selected.length > 0 && (
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">תזכורת (אופציונלי)</label>
              <input type="datetime-local" value={reminderAt} onChange={e => setReminderAt(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30" />
              {reminderAt && (
                <div className="mt-2 space-y-1.5">
                  <p className="text-white/30 text-[11px]">למי לשלוח את התזכורת:</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.map(name => (
                      <button key={name} type="button" onClick={() => toggleReminderTeacher(name)}
                        className={`px-3 py-1.5 rounded-xl text-xs interactive btn-press transition-colors ${reminderTeachers.includes(name) ? "bg-blue-500/40 text-white" : "bg-white/5 text-white/40 hover:text-white/70"}`}>
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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

                {/* General note on the task itself */}
                <div className="mb-2">
                  {t.id in editingTaskNote ? (
                    <div className="flex gap-1.5">
                      <input value={editingTaskNote[t.id]} onChange={e => setEditingTaskNote(prev => ({ ...prev, [t.id]: e.target.value }))}
                        placeholder="הערה כללית..." autoFocus
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30" />
                      <button onClick={() => saveTaskNote(t.id)} className="text-[11px] text-white/70 hover:text-white interactive px-1.5">שמור</button>
                    </div>
                  ) : t.note ? (
                    <button onClick={() => setEditingTaskNote(prev => ({ ...prev, [t.id]: t.note ?? "" }))}
                      className="text-white/50 text-[11px] text-right w-full hover:text-white/70 interactive">
                      💬 {t.note}
                    </button>
                  ) : (
                    <button onClick={() => setEditingTaskNote(prev => ({ ...prev, [t.id]: "" }))}
                      className="text-white/25 text-[11px] hover:text-white/50 interactive">
                      + הערה כללית
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  {t.assignees.map(a => {
                    const editingNote = a.id in editingAssigneeNote
                    return (
                      <div key={a.id}>
                        <div className="w-full flex items-center gap-2">
                          <button onClick={() => toggleAssignee(a.id, a.done)}
                            className="flex-1 min-w-0 flex items-center gap-2.5 py-0.5 interactive text-right">
                            <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${a.done ? "bg-green-500 border-green-500" : "border-white/30"}`}>
                              {a.done && <span className="text-white text-[8px]">✓</span>}
                            </span>
                            <span className={`text-xs ${a.done ? "text-white/35 line-through" : "text-white/70"}`}>{a.teacherLabel}</span>
                            {!a.userId && <span className="text-white/20 text-[10px]">(טרם הצטרף/ה)</span>}
                          </button>
                          <button onClick={() => setEditingAssigneeNote(prev => ({ ...prev, [a.id]: a.note ?? "" }))}
                            className="text-white/25 hover:text-white text-[10px] interactive flex-shrink-0 px-1">
                            {a.note ? "✎" : "+ הערה"}
                          </button>
                        </div>
                        {!editingNote && a.note && <p className="text-white/35 text-[11px] pr-6 mt-0.5">{a.note}</p>}
                        {editingNote && (
                          <div className="flex gap-1.5 mt-1 pr-6">
                            <input value={editingAssigneeNote[a.id]} onChange={e => setEditingAssigneeNote(prev => ({ ...prev, [a.id]: e.target.value }))}
                              placeholder="הערה..." autoFocus
                              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30" />
                            <button onClick={() => saveAssigneeNote(a.id)} className="text-[11px] text-white/70 hover:text-white interactive px-1.5">שמור</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
