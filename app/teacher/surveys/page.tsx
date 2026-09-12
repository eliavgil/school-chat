"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface SurveyRow {
  id: string; title: string; url: string; classId: string | null; className: string | null
  dueDate: string | null; createdAt: string; completedCount: number; totalStudents: number
  responseSheetUrl: string | null; lastSyncedAt: string | null
}
interface StudentRow { id: string; name: string; verified?: boolean }
interface SyncResult { matched: number; totalRows: number; unmatched: string[] }

function fmtDate(iso: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })
}
function fmtDateTime(iso: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<SurveyRow[]>([])
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [classId, setClassId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [sheetUrl, setSheetUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [status, setStatus] = useState<Record<string, { completed: StudentRow[]; pending: StudentRow[] }>>({})
  const [statusLoading, setStatusLoading] = useState<string | null>(null)

  const [sheetEditId, setSheetEditId] = useState<string | null>(null)
  const [sheetEditVal, setSheetEditVal] = useState("")
  const [savingSheet, setSavingSheet] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<Record<string, SyncResult | string>>({})

  async function load() {
    setLoading(true)
    const d = await fetch("/api/admin/surveys").then(r => r.json()).catch(() => ({ surveys: [], classes: [] }))
    setSurveys(d.surveys ?? [])
    setClasses(d.classes ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function add() {
    if (!title.trim() || !url.trim()) return
    setSaving(true)
    await fetch("/api/admin/surveys", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), url: url.trim(), classId: classId || null, dueDate: dueDate || null, responseSheetUrl: sheetUrl || null }),
    })
    setTitle(""); setUrl(""); setClassId(""); setDueDate(""); setSheetUrl(""); setShowAdd(false)
    await load()
    setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm("למחוק שאלון זה? כל נתוני המילוי יימחקו.")) return
    setDeletingId(id)
    await fetch("/api/admin/surveys", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    await load()
    setDeletingId(null)
  }

  async function loadStatus(id: string) {
    setStatusLoading(id)
    const d = await fetch(`/api/admin/surveys/${id}/status`).then(r => r.json()).catch(() => ({ completed: [], pending: [] }))
    setStatus(prev => ({ ...prev, [id]: { completed: d.completed ?? [], pending: d.pending ?? [] } }))
    setStatusLoading(null)
  }

  async function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!status[id]) await loadStatus(id)
  }

  async function saveSheetUrl(id: string) {
    setSavingSheet(true)
    await fetch("/api/admin/surveys", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, responseSheetUrl: sheetEditVal || null }),
    })
    setSheetEditId(null)
    await load()
    setSavingSheet(false)
  }

  async function syncSheet(id: string) {
    setSyncingId(id)
    setSyncResult(prev => { const n = { ...prev }; delete n[id]; return n })
    try {
      const res = await fetch(`/api/admin/surveys/${id}/sync-sheet`, { method: "POST" })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? "שגיאה")
      setSyncResult(prev => ({ ...prev, [id]: { matched: d.matched, totalRows: d.totalRows, unmatched: d.unmatched ?? [] } }))
      await Promise.all([load(), loadStatus(id)])
    } catch (e: any) {
      setSyncResult(prev => ({ ...prev, [id]: e.message ?? "שגיאה" }))
    }
    setSyncingId(null)
  }

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white flex-1">שאלונים</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <button onClick={() => setShowAdd(v => !v)}
          className="w-full bg-white/15 hover:bg-white/25 text-white text-sm font-medium py-2.5 rounded-xl interactive btn-press transition-colors">
          {showAdd ? "ביטול" : "+ שאלון חדש"}
        </button>

        {showAdd && (
          <div className="bg-white/8 border border-white/10 rounded-2xl p-4 space-y-3">
            <input placeholder="כותרת (למשל: סקר שביעות רצון)" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <input placeholder="קישור לגוגל פורמס" value={url} onChange={e => setUrl(e.target.value)} dir="ltr"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <div className="flex gap-2 flex-wrap">
              <select value={classId} onChange={e => setClassId(e.target.value)}
                className="flex-1 min-w-40 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30">
                <option value="">כל הכיתות</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30" />
            </div>
            <div>
              <input placeholder="קישור לגיליון תשובות (אופציונלי)" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} dir="ltr"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
              <p className="text-white/25 text-[10px] mt-1">
                מאפשר לאמת בפועל מי ענה, במקום להסתמך רק על דיווח של התלמיד. אם כמה כיתות חולקות אותו גיליון — צריך עמודת "כיתה" ועמודת שם/ת.ז. בטופס.
              </p>
            </div>
            <button onClick={add} disabled={saving || !title.trim() || !url.trim()}
              className="w-full bg-white/20 hover:bg-white/30 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 btn-press interactive">
              {saving ? "שומר..." : "הוסף שאלון"}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-white/40 text-sm text-center py-8">טוען...</p>
        ) : surveys.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">אין שאלונים עדיין</p>
        ) : (
          <div className="space-y-2">
            {surveys.map(s => {
              const st = status[s.id]
              const isOpen = expandedId === s.id
              const sr = syncResult[s.id]
              return (
                <div key={s.id} className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <button onClick={() => toggleExpand(s.id)} className="min-w-0 flex-1 text-right interactive">
                      <div className="text-sm font-medium text-white truncate">{s.title}</div>
                      <div className="text-xs text-white/40 mt-0.5">
                        {s.className ?? "כל הכיתות"}{s.dueDate ? ` · עד ${fmtDate(s.dueDate)}` : ""}
                      </div>
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={s.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-white/50 hover:text-white interactive px-2 py-1 rounded-lg hover:bg-white/10">
                        פתח שאלון ↗
                      </a>
                      <button onClick={() => remove(s.id)} disabled={deletingId === s.id}
                        className="text-xs text-red-400/70 hover:text-red-400 interactive disabled:opacity-40">
                        {deletingId === s.id ? "..." : "מחק"}
                      </button>
                    </div>
                  </div>

                  <button onClick={() => toggleExpand(s.id)} className="mt-2 flex items-center gap-2 w-full interactive">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: s.totalStudents > 0 ? `${(s.completedCount / s.totalStudents) * 100}%` : "0%" }} />
                    </div>
                    <span className="text-xs text-white/50 flex-shrink-0">{s.completedCount}/{s.totalStudents}</span>
                  </button>

                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                      {/* Response sheet: link + sync */}
                      <div className="bg-white/5 rounded-xl p-3 space-y-2">
                        {sheetEditId === s.id ? (
                          <div className="flex gap-2">
                            <input value={sheetEditVal} onChange={e => setSheetEditVal(e.target.value)} dir="ltr"
                              placeholder="קישור לגיליון תשובות"
                              className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
                            <button onClick={() => saveSheetUrl(s.id)} disabled={savingSheet}
                              className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg interactive disabled:opacity-50">
                              {savingSheet ? "..." : "שמור"}
                            </button>
                          </div>
                        ) : s.responseSheetUrl ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-white/50 text-[11px]">מחובר לגיליון תשובות</p>
                              {s.lastSyncedAt && <p className="text-white/25 text-[10px] mt-0.5">סונכרן לאחרונה: {fmtDateTime(s.lastSyncedAt)}</p>}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button onClick={() => syncSheet(s.id)} disabled={syncingId === s.id}
                                className="text-xs bg-white/15 hover:bg-white/25 text-white px-2.5 py-1.5 rounded-lg interactive disabled:opacity-50">
                                {syncingId === s.id ? "מסנכרן..." : "סנכרן עכשיו"}
                              </button>
                              <button onClick={() => { setSheetEditId(s.id); setSheetEditVal(s.responseSheetUrl ?? "") }}
                                className="text-xs text-white/40 hover:text-white interactive px-2 py-1.5">
                                ערוך
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setSheetEditId(s.id); setSheetEditVal("") }}
                            className="text-xs text-white/50 hover:text-white interactive">
                            + חבר גיליון תשובות (לאימות אמיתי של מי ענה)
                          </button>
                        )}

                        {sr && (
                          typeof sr === "string" ? (
                            <p className="text-red-300/80 text-[11px]">{sr}</p>
                          ) : (
                            <p className="text-white/40 text-[11px]">
                              ✓ הותאמו {sr.matched} מתוך {sr.totalRows} תשובות בגיליון
                              {sr.unmatched.length > 0 && ` · לא זוהו: ${sr.unmatched.join(", ")}`}
                            </p>
                          )
                        )}
                      </div>

                      {statusLoading === s.id ? (
                        <p className="text-white/30 text-xs text-center py-3">טוען...</p>
                      ) : !st ? null : (
                        <div className="space-y-3">
                          <div>
                            <p className="text-white/40 text-[11px] font-semibold mb-1.5">
                              עדיין לא ענו ({st.pending.length})
                            </p>
                            {st.pending.length === 0 ? (
                              <p className="text-white/25 text-xs">כולם ענו 🎉</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {st.pending.map(p => (
                                  <span key={p.id} className="bg-red-500/10 text-red-300/80 text-[11px] px-2 py-1 rounded-lg">{p.name}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          {st.completed.length > 0 && (
                            <div>
                              <p className="text-white/40 text-[11px] font-semibold mb-1.5">ענו ({st.completed.length})</p>
                              <div className="flex flex-wrap gap-1.5">
                                {st.completed.map(c => (
                                  <span key={c.id} className="bg-green-500/10 text-green-300/70 text-[11px] px-2 py-1 rounded-lg">
                                    {c.verified ? "✓ " : ""}{c.name}
                                  </span>
                                ))}
                              </div>
                              {st.completed.some(c => !c.verified) && (
                                <p className="text-white/20 text-[10px] mt-1.5">בלי ✓ = דיווח עצמי של התלמיד, לא מאומת מול הגיליון</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className="text-white/15 text-[10px] text-center pt-2">
          ללא גיליון תשובות מחובר, המילוי מבוסס על דיווח עצמי של התלמיד בלבד.
        </p>
      </div>
    </div>
  )
}
