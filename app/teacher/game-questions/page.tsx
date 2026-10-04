"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"

interface GameQuestion {
  id: string
  subject: string
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctIndex: number
  active: boolean
}

const EMPTY = { subject: "math", text: "", optionA: "", optionB: "", optionC: "", optionD: "", correctIndex: 0 }

export default function GameQuestionsPage() {
  const { data: session, status } = useSession()
  const [questions, setQuestions] = useState<GameQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const isOwner = session?.user?.email === "eliavgil@gmail.com"

  async function load() {
    setLoading(true)
    const d = await fetch("/api/game/questions?admin=1").then(r => r.json()).catch(() => ({ questions: [] }))
    setQuestions(d.questions ?? [])
    setLoading(false)
  }
  useEffect(() => { if (isOwner) load() }, [isOwner])

  function resetForm() {
    setForm(EMPTY); setShowAdd(false); setEditId(null)
  }

  function startEdit(q: GameQuestion) {
    setForm({ subject: q.subject, text: q.text, optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD, correctIndex: q.correctIndex })
    setEditId(q.id)
    setShowAdd(true)
  }

  async function save() {
    if (!form.text.trim() || !form.optionA.trim() || !form.optionB.trim() || !form.optionC.trim() || !form.optionD.trim()) return
    setSaving(true)
    if (editId) {
      await fetch("/api/game/questions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...form }) })
    } else {
      await fetch("/api/game/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    }
    setSaving(false)
    resetForm()
    load()
  }

  async function toggleActive(q: GameQuestion) {
    setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, active: !x.active } : x))
    await fetch("/api/game/questions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: q.id, active: !q.active }) })
  }

  async function remove(id: string) {
    if (!confirm("למחוק שאלה זו?")) return
    await fetch("/api/game/questions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setQuestions(prev => prev.filter(x => x.id !== id))
  }

  if (status === "loading") return null
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-black/50 flex items-center justify-center text-white/40 text-sm" dir="rtl">
        אין הרשאה לעמוד זה
      </div>
    )
  }

  const OPTION_KEYS: (keyof typeof EMPTY)[] = ["optionA", "optionB", "optionC", "optionD"]

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/student/games/climb" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white flex-1">שאלות למשחק — טיפוס האילנות</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        <button onClick={() => { resetForm(); setShowAdd(true) }}
          className="w-full bg-white/15 hover:bg-white/25 text-white text-sm font-medium py-2.5 rounded-xl interactive btn-press transition-colors">
          + שאלה חדשה
        </button>

        {showAdd && (
          <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
            <div className="flex gap-2">
              {[["math", "מתמטיקה"], ["english", "אנגלית"]].map(([v, label]) => (
                <button key={v} type="button" onClick={() => setForm(f => ({ ...f, subject: v }))}
                  className={`flex-1 rounded-xl py-2 text-sm interactive btn-press transition-colors ${form.subject === v ? "bg-white/20 text-white" : "bg-white/5 text-white/40 hover:text-white/70"}`}>
                  {label}
                </button>
              ))}
            </div>
            <input value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} placeholder="נוסח השאלה *"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <div className="space-y-2">
              {OPTION_KEYS.map((key, i) => (
                <div key={key} className="flex items-center gap-2">
                  <button type="button" onClick={() => setForm(f => ({ ...f, correctIndex: i }))}
                    className={`w-6 h-6 rounded-full flex-shrink-0 border-2 flex items-center justify-center text-[10px] interactive ${form.correctIndex === i ? "bg-green-500 border-green-500 text-white" : "border-white/20 text-white/30"}`}>
                    {form.correctIndex === i ? "✓" : ""}
                  </button>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={`תשובה ${"אבגד"[i]} *`}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
                </div>
              ))}
              <p className="text-white/25 text-[11px] px-1">סמן/י את העיגול ליד התשובה הנכונה</p>
            </div>
            <div className="flex gap-2">
              <button onClick={save} disabled={saving}
                className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-xl disabled:opacity-40 btn-press interactive transition-colors">
                {saving ? "שומר..." : editId ? "עדכן" : "שמור"}
              </button>
              <button onClick={resetForm} className="text-white/40 text-sm px-3 py-2 hover:text-white interactive">ביטול</button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-white/40 text-sm text-center py-8">טוען...</p>
        ) : questions.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">אין עדיין שאלות</p>
        ) : (
          <div className="space-y-2">
            {questions.map(q => (
              <div key={q.id} className={`bg-white/8 border border-white/10 rounded-2xl p-4 ${!q.active ? "opacity-40" : ""}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-white/10 text-white/50 px-2 py-0.5 rounded-full">
                      {q.subject === "english" ? "אנגלית" : "מתמטיקה"}
                    </span>
                    {!q.active && <span className="text-[10px] bg-white/10 text-white/40 px-2 py-0.5 rounded-full">כבוי</span>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => toggleActive(q)} className="text-white/30 hover:text-white interactive p-1 text-xs">
                      {q.active ? "כבה" : "הפעל"}
                    </button>
                    <button onClick={() => startEdit(q)} className="text-white/30 hover:text-white interactive p-1">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => remove(q.id)} className="text-white/30 hover:text-red-400 interactive p-1">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                <p className="text-white text-sm font-medium mb-2">{q.text}</p>
                <div className="grid grid-cols-2 gap-1.5 text-[12px]">
                  {[q.optionA, q.optionB, q.optionC, q.optionD].map((opt, i) => (
                    <div key={i} className={`rounded-lg px-2 py-1 ${i === q.correctIndex ? "bg-green-500/20 text-green-300" : "bg-white/5 text-white/50"}`}>
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
