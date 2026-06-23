"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// ── Types ──────────────────────────────────────────────────
interface TeacherRecord {
  id: string
  createdAt: string
  classLabel: string
  classId: string
  studentName: string
  category: string
  note: string | null
  source: string
}

interface ExtractedRow {
  student_name: string
  category: string
  note: string | null
}

interface ClassOption { id: string; label: string }

const CATEGORIES = ["חיסור", "איחור", "הפרעה", "אירוע חיובי", "אחר"]

const CATEGORY_COLOR: Record<string, string> = {
  "חיסור":        "bg-red-100 text-red-700",
  "איחור":        "bg-amber-100 text-amber-700",
  "הפרעה":        "bg-orange-100 text-orange-700",
  "אירוע חיובי":  "bg-green-100 text-green-700",
  "אחר":          "bg-stone-100 text-stone-600",
}

// ── Voice Recorder hook ────────────────────────────────────
function useVoiceRecorder() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [supported, setSupported] = useState(true)
  const recRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionCtor) { setSupported(false); return }

    const rec = new SpeechRecognitionCtor() as any
    rec.lang = "he-IL"
    rec.continuous = true
    rec.interimResults = true

    rec.onresult = (e: any) => {
      let final = ""
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " "
      }
      setTranscript(t => {
        const base = (t.match(/^([\s\S]*?)\s*\[בהכתבה\]/) || [null, t])[1].trimEnd()
        return (base + " " + final).trim()
      })
    }

    rec.onend = () => setListening(false)
    recRef.current = rec
  }, [])

  const start = useCallback(() => {
    if (!recRef.current || listening) return
    recRef.current.start()
    setListening(true)
  }, [listening])

  const stop = useCallback(() => {
    if (!recRef.current || !listening) return
    recRef.current.stop()
    setListening(false)
  }, [listening])

  return { listening, transcript, setTranscript, supported, start, stop }
}

// ── Sub-components ─────────────────────────────────────────
function CategoryBadge({ cat }: { cat: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[cat] ?? "bg-stone-100 text-stone-600"}`}>
      {cat}
    </span>
  )
}

function EditRowModal({
  row, onSave, onClose,
}: {
  row: TeacherRecord
  onSave: (id: string, studentName: string, category: string, note: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(row.studentName)
  const [cat, setCat]   = useState(row.category)
  const [note, setNote] = useState(row.note ?? "")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <h3 className="text-base font-semibold text-stone-800 mb-4">עריכת רשומה</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-stone-500 mb-1 block">שם תלמיד/ה</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300" />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">קטגוריה</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCat(c)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${cat === c ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-600 hover:border-stone-400"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">הערה</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={() => onSave(row.id, name, cat, note)}
            className="flex-1 bg-stone-900 text-white text-sm py-2 rounded-xl hover:bg-stone-800 btn-press interactive">שמור</button>
          <button onClick={onClose}
            className="flex-1 border border-stone-200 text-stone-600 text-sm py-2 rounded-xl hover:bg-stone-50 interactive">ביטול</button>
        </div>
      </div>
    </div>
  )
}

// ── Voice Recording Modal ──────────────────────────────────
function VoiceModal({
  classes,
  onClose,
  onSaved,
}: {
  classes: ClassOption[]
  onClose: () => void
  onSaved: () => void
}) {
  const [step, setStep] = useState<"class" | "record" | "review" | "saving">(
    classes.length === 1 ? "record" : "class"
  )
  const [selectedClass, setSelectedClass] = useState<ClassOption | null>(
    classes.length === 1 ? classes[0] : null
  )
  const { listening, transcript, setTranscript, supported, start, stop } = useVoiceRecorder()
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [rows, setRows] = useState<ExtractedRow[]>([])

  async function handleExtract() {
    if (!transcript.trim()) return
    setExtracting(true)
    setExtractError("")
    try {
      const res = await fetch("/api/records/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRows(data.records ?? [])
      setStep("review")
    } catch (e: any) {
      setExtractError(e.message ?? "שגיאה בעיבוד")
    } finally {
      setExtracting(false)
    }
  }

  async function handleSave() {
    if (!selectedClass || rows.length === 0) return
    setSaveError("")
    setStep("saving")
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: rows.map(r => ({
            classId:     selectedClass.id,
            classLabel:  selectedClass.label,
            studentName: r.student_name,
            category:    r.category,
            note:        r.note ?? undefined,
            source:      "הכתבה קולית",
          })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `שגיאת שרת ${res.status}`)
      }
      onSaved()
    } catch (e: any) {
      setSaveError(e.message ?? "שגיאה בשמירה")
      setStep("review")
    }
  }

  function addManualRow() {
    setRows(prev => [...prev, { student_name: "", category: "אחר", note: null }])
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-5 header-pt pb-4 border-b border-white/10">
        <h2 className="text-white font-semibold text-lg">נתונים להמשך</h2>
        <button onClick={onClose} className="text-white/60 hover:text-white text-xl interactive">✕</button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5">

        {/* ── Step 1: Class selection ── */}
        {step === "class" && (
          <div>
            <p className="text-white/60 text-sm mb-5">בחר/י כיתה לרישום</p>
            <div className="space-y-2">
              {classes.map(c => (
                <button key={c.id} onClick={() => { setSelectedClass(c); setStep("record") }}
                  className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-right interactive transition-colors">
                  <span className="text-2xl">🏫</span>
                  <span className="text-white font-medium">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Record ── */}
        {step === "record" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-sm">כיתה:</span>
              <span className="text-white text-sm font-medium">{selectedClass?.label}</span>
              {classes.length > 1 && (
                <button onClick={() => setStep("class")} className="text-white/40 text-xs underline">שנה</button>
              )}
            </div>

            {!supported && (
              <div className="bg-amber-900/40 border border-amber-600/30 rounded-xl px-4 py-3 text-amber-300 text-sm">
                דפדפן זה אינו תומך בזיהוי קולי. השתמש/י ב-Chrome או Safari.
              </div>
            )}

            {/* Mic button */}
            <div className="flex flex-col items-center gap-4 py-4">
              <button
                onClick={listening ? stop : start}
                disabled={!supported}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all interactive btn-press shadow-lg ${
                  listening
                    ? "bg-red-500 shadow-red-500/40 scale-110 animate-pulse"
                    : "bg-white/10 hover:bg-white/20 border border-white/20"
                }`}>
                {listening ? "⏹" : "🎙️"}
              </button>
              <p className="text-white/50 text-sm text-center">
                {listening ? "מקליט... לחץ/י שוב לעצירה" : "לחץ/י להתחיל הכתבה"}
              </p>
            </div>

            {/* Transcript text area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/60 text-xs font-medium">טקסט (ניתן לתיקון ידני)</label>
                {transcript && (
                  <button onClick={() => setTranscript("")} className="text-white/35 text-xs hover:text-white/60 interactive">נקה</button>
                )}
              </div>
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                rows={6}
                placeholder="הקלד/י ישירות או השתמש/י בהכתבה קולית..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
              />
            </div>

            {extractError && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">{extractError}</div>
            )}

            <button
              onClick={handleExtract}
              disabled={!transcript.trim() || extracting}
              className="w-full bg-white text-stone-900 font-semibold py-3.5 rounded-2xl hover:bg-white/90 disabled:opacity-40 interactive btn-press transition-colors flex items-center justify-center gap-2">
              {extracting ? (
                <>
                  <span className="w-4 h-4 border-2 border-stone-400 border-t-stone-900 rounded-full animate-spin" />
                  מחלץ נתונים...
                </>
              ) : "עבד עם AI ←"}
            </button>
          </div>
        )}

        {/* ── Step 3: Review extracted rows ── */}
        {step === "review" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-white/70 text-sm">אמת/י את הנתונים לפני שמירה</p>
              <button onClick={() => setStep("record")} className="text-white/40 text-xs underline interactive">חזור</button>
            </div>

            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={row.student_name}
                      onChange={e => setRows(prev => prev.map((r, j) => j === i ? { ...r, student_name: e.target.value } : r))}
                      placeholder="שם תלמיד/ה"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/30"
                    />
                    <button onClick={() => setRows(prev => prev.filter((_, j) => j !== i))}
                      className="text-red-400/70 hover:text-red-400 text-sm interactive px-2">✕</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => setRows(prev => prev.map((r, j) => j === i ? { ...r, category: c } : r))}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${row.category === c ? "bg-white text-stone-900 border-white" : "border-white/20 text-white/60 hover:border-white/40"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                  <input
                    value={row.note ?? ""}
                    onChange={e => setRows(prev => prev.map((r, j) => j === i ? { ...r, note: e.target.value || null } : r))}
                    placeholder="הערה (אופציונלי)"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/70 text-xs focus:outline-none focus:ring-1 focus:ring-white/30"
                  />
                </div>
              ))}
            </div>

            <button onClick={addManualRow}
              className="w-full border border-dashed border-white/20 rounded-xl py-3 text-white/50 text-sm hover:border-white/40 hover:text-white/70 interactive transition-colors">
              + הוסף שורה ידנית
            </button>

            {saveError && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">{saveError}</div>
            )}

            <button
              onClick={handleSave}
              disabled={rows.length === 0 || rows.some(r => !r.student_name.trim())}
              className="w-full bg-white text-stone-900 font-semibold py-3.5 rounded-2xl hover:bg-white/90 disabled:opacity-40 interactive btn-press transition-colors">
              שמור {rows.length} רשומות
            </button>
          </div>
        )}

        {step === "saving" && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white/60">שומר...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function RecordsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState<TeacherRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showVoice, setShowVoice] = useState(false)
  const [editingRow, setEditingRow] = useState<TeacherRecord | null>(null)
  const [filterClass, setFilterClass] = useState("הכל")
  const [filterCat, setFilterCat] = useState("הכל")
  const [filterQ, setFilterQ] = useState("")
  const [classOptions, setClassOptions] = useState<ClassOption[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    // Load records; class info comes from localStorage cache of /api/home (set by home page)
    const recRes = await fetch("/api/records")
    if (recRes.ok) setRecords(await recRes.json())

    // Pull class info from the home cache that home page already populated
    try {
      const cached = localStorage.getItem("home-data-cache")
      if (cached) {
        const homeData = JSON.parse(cached)
        if (homeData.classId && homeData.classProfile?.displayName) {
          setClassOptions([{ id: homeData.classId, label: homeData.classProfile.displayName }])
        }
      }
    } catch {}

    setLoading(false)
  }, [])

  useEffect(() => { if (status === "authenticated") load() }, [load, status])
  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])

  // Derive unique classes from saved records (for filter chips, once records exist)
  const recordClasses = Array.from(new Set(records.map(r => r.classLabel))).map(l => ({
    id: records.find(r => r.classLabel === l)!.classId,
    label: l,
  }))
  const effectiveClassOptions = classOptions.length > 0 ? classOptions
    : recordClasses.length > 0 ? recordClasses
    : [{ id: "class-default", label: "כיתה" }]

  async function handleDelete(id: string) {
    if (!confirm("למחוק רשומה זו?")) return
    await fetch("/api/records", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  async function handleEdit(id: string, studentName: string, category: string, note: string) {
    await fetch("/api/records", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, studentName, category, note }) })
    setRecords(prev => prev.map(r => r.id === id ? { ...r, studentName, category, note: note || null } : r))
    setEditingRow(null)
  }

  function exportCSV() {
    const header = "תאריך,שעה,כיתה,שם תלמיד/ה,קטגוריה,הערה,מקור"
    const rows = filtered.map(r => {
      const d = new Date(r.createdAt)
      const date = d.toLocaleDateString("he-IL")
      const time = d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
      return [date, time, r.classLabel, r.studentName, r.category, r.note ?? "", r.source]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    })
    const csv = "﻿" + [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `נתונים_להמשך_${new Date().toLocaleDateString("he-IL").replace(/\//g, "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = records.filter(r => {
    if (filterClass !== "הכל" && r.classLabel !== filterClass) return false
    if (filterCat !== "הכל" && r.category !== filterCat) return false
    if (filterQ && !r.studentName.includes(filterQ) && !(r.note ?? "").includes(filterQ)) return false
    return true
  })

  if (status === "loading") return null

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">

      {showVoice && (
        <VoiceModal
          classes={effectiveClassOptions}
          onClose={() => setShowVoice(false)}
          onSaved={() => { setShowVoice(false); load() }}
        />
      )}

      {editingRow && (
        <EditRowModal
          row={editingRow}
          onSave={handleEdit}
          onClose={() => setEditingRow(null)}
        />
      )}

      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 text-white px-5 header-pt pb-4 flex items-center gap-4">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <div className="flex-1">
          <h1 className="font-semibold text-lg">נתונים להמשך</h1>
          <p className="text-white/50 text-xs">{records.length} רשומות</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} disabled={filtered.length === 0}
            className="glass rounded-xl px-3 py-2 text-white/70 text-xs hover:text-white interactive disabled:opacity-40 transition-colors">
            ייצוא CSV
          </button>
          <button onClick={() => setShowVoice(true)}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-stone-900 text-xl interactive btn-press shadow-lg">
            🎙️
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10 px-4 py-3 space-y-2 sticky top-0 z-10">
        <input
          value={filterQ}
          onChange={e => setFilterQ(e.target.value)}
          placeholder="חיפוש לפי שם תלמיד או הערה..."
          className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-2 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-white/25"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {["הכל", ...Array.from(new Set(records.map(r => r.classLabel)))].map(c => (
            <button key={c} onClick={() => setFilterClass(c)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${filterClass === c ? "bg-white text-stone-900 border-white" : "border-white/20 text-white/60 hover:border-white/40"}`}>
              {c}
            </button>
          ))}
          <div className="w-px bg-white/15 flex-shrink-0 mx-1" />
          {["הכל", ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${filterCat === c ? "bg-white text-stone-900 border-white" : "border-white/20 text-white/50 hover:border-white/40"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white/10 rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-white/10 rounded-full w-32 mb-2" />
                <div className="h-3 bg-white/10 rounded-full w-48" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-white/40">
            <span className="text-5xl">🎙️</span>
            <p className="text-sm font-medium">אין רשומות עדיין</p>
            <button onClick={() => setShowVoice(true)}
              className="mt-2 bg-white/20 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-white/30 interactive btn-press">
              התחל הכתבה
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(r => {
              const d = new Date(r.createdAt)
              const dateStr = d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "2-digit" })
              const timeStr = d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
              return (
                <div key={r.id} className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3.5 group">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-white text-sm">{r.studentName}</span>
                        <CategoryBadge cat={r.category} />
                        <span className="text-white/30 text-xs">{r.classLabel}</span>
                      </div>
                      {r.note && <p className="text-white/55 text-xs leading-relaxed">{r.note}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-white/30 text-[11px]">{dateStr} · {timeStr}</span>
                        {r.source === "ידני" && <span className="text-white/30 text-[11px]">· ידני</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => setEditingRow(r)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/40 hover:text-white interactive transition-colors">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(r.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 interactive transition-colors">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      {records.length > 0 && (
        <button onClick={() => setShowVoice(true)}
          className="fixed bottom-8 left-5 w-14 h-14 bg-stone-900 rounded-2xl shadow-xl flex items-center justify-center text-2xl interactive btn-press z-20">
          🎙️
        </button>
      )}
    </div>
  )
}
