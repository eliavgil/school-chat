"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface TaskT {
  id: string
  description: string
  responsible: string | null
  deadline: string | null
  note: string | null
  done: boolean
  perStudent: boolean
  checks: { studentId: string }[]
}
interface ClassStudent { id: string; name: string }

const BLANK = { description: "", responsible: "", deadline: "", note: "", perStudent: false }

function fmtDeadline(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "numeric" })
}

export default function TeacherTasksPage() {
  return (
    <Suspense fallback={null}>
      <TeacherTasksPageInner />
    </Suspense>
  )
}

function TeacherTasksPageInner() {
  const searchParams = useSearchParams()
  const autoExpandTaskId = searchParams.get("task")

  const [tasks, setTasks] = useState<TaskT[]>([])
  const [students, setStudents] = useState<ClassStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(autoExpandTaskId)
  const [showDone, setShowDone] = useState(false)

  async function load() {
    setLoading(true)
    const [tasksRes, rosterRes] = await Promise.all([
      fetch("/api/teacher/tasks").then(r => r.json()).catch(() => ({ tasks: [] })),
      fetch("/api/class/roster").then(r => r.json()).catch(() => ({ students: [] })),
    ])
    setTasks(tasksRes.tasks ?? [])
    setStudents(rosterRes.students ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function addTask() {
    if (!form.description.trim()) return
    setSaving(true)
    await fetch("/api/teacher/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: form.description, responsible: form.responsible || null,
        deadline: form.deadline || null, note: form.note || null, perStudent: form.perStudent,
      }),
    })
    setForm(BLANK); setShowAdd(false)
    await load()
    setSaving(false)
  }

  async function toggleDone(t: TaskT) {
    setTasks(ts => ts.map(x => x.id === t.id ? { ...x, done: !t.done } : x))
    await fetch("/api/teacher/tasks", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, done: !t.done }),
    })
  }

  async function removeTask(id: string) {
    if (!confirm("למחוק משימה זו?")) return
    await fetch("/api/teacher/tasks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    await load()
  }

  async function toggleStudent(task: TaskT, studentId: string) {
    const isChecked = task.checks.some(c => c.studentId === studentId)
    setTasks(ts => ts.map(t => t.id !== task.id ? t : {
      ...t,
      checks: isChecked ? t.checks.filter(c => c.studentId !== studentId) : [...t.checks, { studentId }],
    }))
    await fetch(`/api/teacher/tasks/${task.id}/checks`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, checked: !isChecked }),
    })
  }

  const openTasks = tasks.filter(t => !t.done)
  const doneTasks = tasks.filter(t => t.done)

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <header className="bg-white border-b border-slate-200 px-4 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Link href="/home" className="text-slate-400 hover:text-slate-900 text-xl interactive">→</Link>
        <h1 className="font-extrabold text-lg text-slate-900 flex-1">משימות הכיתה</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5">
        <button onClick={() => setShowAdd(v => !v)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-3 rounded-xl interactive btn-press transition-colors mb-4">
          {showAdd ? "ביטול" : "+ משימה חדשה"}
        </button>

        {showAdd && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 mb-5 shadow-sm">
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="תיאור המשימה *" dir="rtl"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <div className="flex gap-2">
              <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))}
                placeholder="אחראי (אופציונלי)" dir="rtl"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="הערה (אופציונלי)" rows={2} dir="rtl"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            <label className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer">
              <input type="checkbox" checked={form.perStudent} onChange={e => setForm(f => ({ ...f, perStudent: e.target.checked }))}
                className="w-4 h-4 accent-indigo-600" />
              דורש סימון וי מול כל תלמיד (למשל: אישורי יציאה)
            </label>
            <button onClick={addTask} disabled={saving || !form.description.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl disabled:opacity-40 btn-press interactive transition-colors">
              {saving ? "שומר..." : "שמור משימה"}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-slate-400 text-sm text-center py-8">טוען...</p>
        ) : (
          <>
            {openTasks.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-slate-400 text-sm font-medium">אין משימות פתוחות</p>
              </div>
            ) : (
              <div className="space-y-3">
                {openTasks.map(t => (
                  <TaskCard key={t.id} task={t} students={students}
                    expanded={expanded === t.id} onToggleExpand={() => setExpanded(expanded === t.id ? null : t.id)}
                    onToggleDone={() => toggleDone(t)} onDelete={() => removeTask(t.id)}
                    onToggleStudent={sid => toggleStudent(t, sid)} />
                ))}
              </div>
            )}

            {doneTasks.length > 0 && (
              <div className="mt-6">
                <button onClick={() => setShowDone(v => !v)} className="text-slate-400 hover:text-slate-600 text-xs font-bold interactive">
                  {showDone ? "▲ הסתר משימות שבוצעו" : `▼ הצג משימות שבוצעו (${doneTasks.length})`}
                </button>
                {showDone && (
                  <div className="space-y-3 mt-3 opacity-60">
                    {doneTasks.map(t => (
                      <TaskCard key={t.id} task={t} students={students}
                        expanded={expanded === t.id} onToggleExpand={() => setExpanded(expanded === t.id ? null : t.id)}
                        onToggleDone={() => toggleDone(t)} onDelete={() => removeTask(t.id)}
                        onToggleStudent={sid => toggleStudent(t, sid)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TaskCard({ task, students, expanded, onToggleExpand, onToggleDone, onDelete, onToggleStudent }: {
  task: TaskT; students: ClassStudent[]; expanded: boolean
  onToggleExpand: () => void; onToggleDone: () => void; onDelete: () => void; onToggleStudent: (studentId: string) => void
}) {
  const checkedIds = new Set(task.checks.map(c => c.studentId))
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3.5 flex items-start gap-3">
        <button onClick={onToggleDone}
          className="w-6 h-6 rounded-lg border-2 border-slate-300 hover:border-indigo-500 flex-shrink-0 flex items-center justify-center interactive btn-press transition-colors mt-0.5">
          {task.done && <span className="text-indigo-600 text-sm font-bold">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-slate-900 text-[15px] font-semibold leading-snug ${task.done ? "line-through text-slate-400" : ""}`}>{task.description}</p>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
            {task.deadline && <span className="text-xs font-bold text-slate-500">⏰ {fmtDeadline(task.deadline)}</span>}
            {task.responsible && <span className="text-xs text-slate-400">אחראי: {task.responsible}</span>}
          </div>
          {task.note && <p className="text-slate-500 text-xs mt-1.5 whitespace-pre-wrap">{task.note}</p>}
          {task.perStudent && (
            <button onClick={onToggleExpand} className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 interactive">
              👥 {checkedIds.size}/{students.length} תלמידים {expanded ? "▲" : "▼"}
            </button>
          )}
        </div>
        <button onClick={onDelete} className="text-slate-300 hover:text-red-500 interactive p-1 flex-shrink-0">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>

      {expanded && task.perStudent && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          {students.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-2">אין תלמידים בכיתה</p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {students.map(s => (
                <label key={s.id} className="flex items-center gap-2 text-sm text-slate-700 py-1 cursor-pointer">
                  <input type="checkbox" checked={checkedIds.has(s.id)} onChange={() => onToggleStudent(s.id)}
                    className="w-4 h-4 accent-indigo-600 flex-shrink-0" />
                  <span className="truncate">{s.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
