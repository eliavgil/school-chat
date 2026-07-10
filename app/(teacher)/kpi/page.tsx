"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

type Status = "none" | "ok" | "warn" | "bad"
type TrackType = "checks" | "students" | "numbers" | "percent" | "text"

const CLASS_STUDENTS = [
  "אדם כהן", "אביגיל לוי", "אורי מזרחי", "איתמר פרץ", "אלה שפירא",
  "אמיר גולדברג", "בר חדד", "גל ביטון", "דנה אברמוב", "דניאל נחמני",
  "הילה כץ", "טל שמש", "יובל פישר", "יעל וקנין", "ינאי רוזן",
  "כרמל אלון", "לי בן-דוד", "לירון שלום", "מיכל אוחנה", "נועה גבאי",
  "נועם אסולין", "סהר חיים", "עדי מנחם", "עומר ברק", "עידן קפלן",
  "פלג זוהר", "רון שגיא", "רות ספיר", "שיר ג׳בארי", "תמר לוינסון",
]

const CHECK_LABELS = ["ספט׳", "אוק׳", "נוב׳", "דצמ׳", "ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני"]

const TRACK_META: Record<TrackType, { icon: string; label: string }> = {
  checks:   { icon: "☑", label: "חודשי" },
  students: { icon: "👤", label: "תלמידים" },
  numbers:  { icon: "#", label: "מספרים" },
  percent:  { icon: "%", label: "אחוזים" },
  text:     { icon: "✍", label: "מילולי" },
}

interface NumberCell { label: string; value: string }

interface Metric {
  id: string
  text: string
  target: string
  trackType: TrackType
  checks: boolean[]
  students: string[]
  numberCells: NumberCell[]
  percentValue: number
  percentMax: number
  textValue: string
  gaugeTarget: number | null  // null = use default for the type
  s: Status
}

interface Goal {
  id: string
  domain: string
  name: string
  desc: string
  subgoals: string[]
  metrics: Metric[]
  open: boolean
}

const uid = () => Math.random().toString(36).slice(2, 9)
const ACCENT = "#fcd34d"
const CHIPS_COLOR = "#7dd3fc"  // sky-300 — readable on dark, clearly distinct from amber

function mkCells(count = 5): NumberCell[] {
  return Array.from({ length: count }, (_, i) => ({ label: `${i + 1}`, value: "" }))
}

function mkMetric(text: string, target: string, trackType: TrackType = "checks"): Metric {
  return { id: uid(), text, target, trackType, checks: Array(10).fill(false), students: [], numberCells: mkCells(), percentValue: 0, percentMax: 100, textValue: "", gaugeTarget: null, s: "none" }
}

const DEFAULTS: Goal[] = [
  {
    id: uid(), open: true,
    domain: "הישגים לימודיים",
    name: "תעודת בגרות איכותית",
    desc: "הובלת התלמיד למיצוי מלא של יכולותיו הלימודיות וזכאות לתעודת בגרות מיטבית",
    subgoals: ["מיקסום יכולות לימודיות", "ציונים גבוהים ביחס לשנים קודמות", "אקלים לימודי חיובי בכיתה"],
    metrics: [
      mkMetric("מעבר להקבצות גבוהות גדול ממעבר לנמוכות", ""),
      mkMetric("מגמת ירידה בנתוני איחורים והפרעות בשיעורים", ""),
      mkMetric("ממוצע ציונים גבוה משנה קודמת מרבעון לרבעון", ""),
      mkMetric("מינימום נכשלים", ""),
      mkMetric("מקסימום מצטיינים", ""),
      mkMetric("עמידה בכל התנאים לקבלת תעודת בגרות", "כן"),
      mkMetric("מקסימום ניצול שעות פרטניות וקבוצות תגבור", ""),
    ],
  },
  {
    id: uid(), open: true,
    domain: "זהות וערכים",
    name: "זהות וערכים",
    desc: "ליווי התלמיד בבירור זהותו האישית והלאומית, תוך עידוד וחיזוק ערכים משמעותיים",
    subgoals: ["כבוד לזולת / אמפטיה", "אחריות אישית", "מעורבות חברתית", "מצוינות / עומק", "חריצות / התמדה", "פיתוח זהות אישית, קבוצתית, לאומית"],
    metrics: [
      mkMetric("אחת לחודש תלמידים ממלאים שאלון אישי", "חודשי", "students"),
      mkMetric("10 שיעורי חינוך עסקו בנושאי זהות, אחריות, מצוינות, התמדה", "10"),
      mkMetric("ניתנו 2 משימות הערכה במסגרת שיעור חינוך", "2"),
      mkMetric("100% משלימים חובת מעורבות חברתית", "100%", "students"),
      mkMetric("80% מהתלמידים מדווחים על שביעות רצון גבוהה מהמעורבות", "80%"),
    ],
  },
  {
    id: uid(), open: true,
    domain: "כישורים ומיומנויות",
    name: "מיומנויות",
    desc: "הקניית ארגז כלים ישומי ורלוונטי המכין את התלמיד לאתגרי התיכון ולעולם המחר",
    subgoals: ["למידה עצמאית", "שמיעת עצמי", "חשיבה ביקורתית", "יצירתיות", "אוריינות דיגיטלית"],
    metrics: [
      mkMetric("90% תלמידים עברו בחינת אוריינות דיגיטלית", "90%", "students"),
      mkMetric("90% תלמידים הגישו ≥3 משימות המשלבות חשיבה ביקורתית/יצירתיות", "90%", "students"),
      mkMetric("100% תלמידים הוכנסו ללמידה באמצעות בוט AI", "100%", "students"),
      mkMetric("90% תלמידים הגישו ≥3 משימות המחייבות חקירה עצמאית", "90%", "students"),
      mkMetric("75% מורים דיווחו כיצד שילבו מיומנות נדרשת בהוראת המקצוע", "75%"),
    ],
  },
  {
    id: uid(), open: true,
    domain: "רגשי-חברתי",
    name: "רגשי חברתי",
    desc: "יצירת מרחב בטוח ותומך המספק מענה רגשי רחב ומתמקד בפיתוח ביטחון עצמי וקשרים חברתיים",
    subgoals: ["מרחב בטוח", "כישורים חברתיים", "ביטחון עצמי", "שיח רגשי", "חוסן"],
    metrics: [
      mkMetric("אחת לחודש תלמידים ממלאים שאלון אישי", "חודשי", "students"),
      mkMetric("שיחה אישית אחת לרבעון עם כל תלמיד עם שאלון וסיכום יעדים", "4/שנה"),
      mkMetric("3 מפגשים כיתתיים מחוץ לבית הספר", "3"),
      mkMetric("10 שיעורי חינוך עסקו בנושאים רגשיים-חברתיים", "10"),
      mkMetric("ניתנו 2 משימות הערכה במסגרת שיעור חינוך", "2"),
      mkMetric("מגמת ירידה במקרי אלימות מנובמבר ועד סוף השנה", "↓"),
      mkMetric("33% מהתלמידים ישתתפו בלפחות 3 מפגשים טיפוליים חוץ-כיתתיים", "33%", "students"),
      mkMetric("80% מהתלמידים ישתתפו בלפחות מפגש טיפולי אחד חוץ-כיתתי", "80%", "students"),
      mkMetric("הפחתת שימוש בטלפון בהפסקות ופעילויות חוץ", "↓"),
    ],
  },
]

const STATUS_CYCLE: Status[] = ["none", "ok", "warn", "bad"]
const STATUS_DOT: Record<Status, string> = {
  none: "bg-white/20",
  ok:   "bg-green-400 shadow-green-400/50 shadow-sm",
  warn: "bg-amber-400 shadow-amber-400/50 shadow-sm",
  bad:  "bg-red-400 shadow-red-400/50 shadow-sm",
}
const STATUS_LABEL: Record<Status, string> = {
  none: "טרם הוערך", ok: "עומד ביעד", warn: "בתהליך", bad: "מאחור",
}

// ── progress helpers ─────────────────────────────────────────────────────────

function defaultGaugeTarget(m: Metric): number {
  switch (m.trackType) {
    case "checks":   return m.checks.length
    case "students": return CLASS_STUDENTS.length
    case "numbers":  return m.numberCells.length  // filled/total by default
    default:         return 1
  }
}

function gaugeUnit(t: TrackType): string {
  if (t === "checks")   return "חודשים"
  if (t === "students") return "תלמידים"
  return ""
}

function getProgress(m: Metric): number {
  switch (m.trackType) {
    case "checks": {
      const tgt = m.gaugeTarget ?? m.checks.length
      return tgt > 0 ? Math.min(1, m.checks.filter(Boolean).length / tgt) : 0
    }
    case "students": {
      const tgt = m.gaugeTarget ?? CLASS_STUDENTS.length
      return tgt > 0 ? Math.min(1, m.students.length / tgt) : 0
    }
    case "numbers": {
      if (m.gaugeTarget != null && m.gaugeTarget > 0) {
        const sum = m.numberCells.reduce((a, c) => a + (parseFloat(c.value) || 0), 0)
        return Math.min(1, sum / m.gaugeTarget)
      }
      return m.numberCells.length ? m.numberCells.filter(c => c.value.trim() !== "").length / m.numberCells.length : 0
    }
    case "percent":  return m.percentMax > 0 ? Math.min(1, m.percentValue / m.percentMax) : 0
    case "text":     return m.textValue.trim().length > 0 ? 1 : 0
  }
}

function progressColor(p: number): string {
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v)))
  if (p <= 0.5) {
    const t = p * 2
    return `rgb(${c(239+(252-239)*t)},${c(68+(211-68)*t)},${c(68+(77-68)*t)})`
  }
  const t = (p - 0.5) * 2
  return `rgb(${c(252+(74-252)*t)},${c(211+(222-211)*t)},${c(77+(128-77)*t)})`
}

// ── Semi-circle gauge ────────────────────────────────────────────────────────

function SemiGauge({ progress }: { progress: number }) {
  const p = Math.max(0, Math.min(1, progress))
  const r = 16
  const C = Math.PI * r
  const color = progressColor(p)

  return (
    <svg viewBox="0 0 40 22" width="52" height="28" style={{ flexShrink: 0 }}>
      <path d="M 4 20 A 16 16 0 0 0 36 20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" strokeLinecap="round" />
      <path
        d="M 4 20 A 16 16 0 0 0 36 20"
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={`${C}`}
        strokeDashoffset={`${C * (1 - p)}`}
        style={{ transition: "stroke-dashoffset 0.45s ease, stroke 0.45s ease" }}
      />
      <text
        x="20" y="19"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="700"
        fill={p > 0 ? color : "rgba(255,255,255,0.2)"}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {Math.round(p * 100)}%
      </text>
    </svg>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function KpiPage() {
  const [goals, setGoals] = useState<Goal[]>(DEFAULTS)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kpi-v5")
      if (saved) setGoals(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem("kpi-v5", JSON.stringify(goals)) } catch {}
  }, [goals])

  function updateGoal(gi: number, patch: Partial<Goal>) {
    setGoals(prev => prev.map((g, i) => i === gi ? { ...g, ...patch } : g))
  }

  function updateMetric(gi: number, mi: number, patch: Partial<Metric>) {
    setGoals(prev => prev.map((g, i) => {
      if (i !== gi) return g
      return { ...g, metrics: g.metrics.map((m, j) => j === mi ? { ...m, ...patch } : m) }
    }))
  }

  function cycleStatus(gi: number, mi: number) {
    const cur = goals[gi].metrics[mi].s
    updateMetric(gi, mi, { s: STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length] })
  }

  function addRow(gi: number) {
    setGoals(prev => prev.map((g, i) => i === gi ? { ...g, metrics: [...g.metrics, mkMetric("יעד חדש", "")] } : g))
  }

  function delRow(gi: number, mi: number) {
    if (goals[gi].metrics.length <= 1) return
    setGoals(prev => prev.map((g, i) =>
      i === gi ? { ...g, metrics: g.metrics.filter((_, j) => j !== mi) } : g
    ))
  }

  function addGoal() {
    const g: Goal = { id: uid(), open: true, domain: "תחום חדש", name: "מטרת על חדשה", desc: "", subgoals: ["יעד 1", "יעד 2"], metrics: [mkMetric("מדד ראשון", "")] }
    setGoals(prev => [...prev, g])
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 80)
  }

  function delGoal(gi: number) {
    if (goals.length <= 1) return
    setGoals(prev => prev.filter((_, i) => i !== gi))
  }

  function resetAll() {
    setGoals(prev => prev.map(g => ({
      ...g,
      metrics: g.metrics.map(m => ({ ...m, checks: Array(10).fill(false), students: [], numberCells: m.numberCells.map(c => ({ ...c, value: "" })), percentValue: 0, textValue: "", s: "none" })),  // gaugeTarget intentionally preserved
    })))
  }

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}>
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10 px-4 header-pt pb-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <Link href="/home" className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/70 hover:text-white interactive btn-press transition-colors">🏠</Link>
          <div className="flex-1">
            <div className="font-semibold text-white text-sm">לוח KPI</div>
            <div className="text-white/40 text-xs">מדדי הצלחה לאורך השנה</div>
          </div>
          <div className="flex gap-2">
            <button onClick={resetAll} className="text-xs text-white/40 hover:text-white/70 glass rounded-lg px-3 py-1.5 transition-colors">איפוס</button>
            <button onClick={addGoal} className="text-xs text-white bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5 transition-colors font-medium">+ מטרה</button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-3 pb-1 flex gap-4 flex-wrap">
        {(Object.entries(STATUS_LABEL) as [Status, string][]).map(([s, label]) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full inline-block ${STATUS_DOT[s]}`} />
            <span className="text-xs text-white/35">{label}</span>
          </div>
        ))}
      </div>

      <main className="max-w-5xl mx-auto px-4 py-3 space-y-4 pb-16">
        {goals.map((g, gi) => (
          <GoalCard
            key={g.id} g={g}
            onToggle={() => updateGoal(gi, { open: !g.open })}
            onDomainChange={v => updateGoal(gi, { domain: v })}
            onNameChange={v => updateGoal(gi, { name: v })}
            onDescChange={v => updateGoal(gi, { desc: v })}
            onSubgoalsChange={v => updateGoal(gi, { subgoals: v })}
            onMetricChange={(mi, patch) => updateMetric(gi, mi, patch)}
            onCycle={mi => cycleStatus(gi, mi)}
            onAddRow={() => addRow(gi)}
            onDelRow={mi => delRow(gi, mi)}
            onDelGoal={() => delGoal(gi)}
            canDelete={goals.length > 1}
          />
        ))}
      </main>
    </div>
  )
}

// ── GoalCard ─────────────────────────────────────────────────────────────────

function GoalCard({ g, onToggle, onDomainChange, onNameChange, onDescChange, onSubgoalsChange, onMetricChange, onCycle, onAddRow, onDelRow, onDelGoal, canDelete }: {
  g: Goal
  onToggle: () => void
  onDomainChange: (v: string) => void
  onNameChange: (v: string) => void
  onDescChange: (v: string) => void
  onSubgoalsChange: (v: string[]) => void
  onMetricChange: (mi: number, patch: Partial<Metric>) => void
  onCycle: (mi: number) => void
  onAddRow: () => void
  onDelRow: (mi: number) => void
  onDelGoal: () => void
  canDelete: boolean
}) {
  const [editingSubgoal, setEditingSubgoal] = useState<number | null>(null)
  const [newSubgoal, setNewSubgoal] = useState("")

  function removeSubgoal(i: number) { onSubgoalsChange(g.subgoals.filter((_, idx) => idx !== i)) }
  function updateSubgoal(i: number, v: string) { onSubgoalsChange(g.subgoals.map((s, idx) => idx === i ? v : s)) }
  function addSubgoal() {
    if (!newSubgoal.trim()) return
    onSubgoalsChange([...g.subgoals, newSubgoal.trim()])
    setNewSubgoal("")
  }

  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">

      {/* ── Upper box: domain name + description ── */}
      <div className="flex items-stretch cursor-pointer select-none hover:bg-white/5 transition-colors" onClick={onToggle}>
        <div className="w-1 flex-shrink-0" style={{ background: ACCENT }} />
        <div className="flex-1 px-4 py-3 min-w-0" onClick={e => e.stopPropagation()}>
          {/* "תחום — X" on one line */}
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-xs font-semibold text-white/40 flex-shrink-0 select-none">תחום —</span>
            <input
              className="font-bold text-base text-white bg-transparent border-none outline-none min-w-0 flex-1"
              value={g.domain}
              onChange={e => onDomainChange(e.target.value)}
            />
          </div>
          {/* Description */}
          <input
            className="text-xs text-white/45 bg-transparent border-none outline-none w-full mt-1 leading-relaxed placeholder-white/20"
            value={g.desc}
            onChange={e => onDescChange(e.target.value)}
            placeholder="הסבר קצר על התחום..."
          />
        </div>
        <div className="flex items-center gap-2 px-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {canDelete && (
            <button onClick={onDelGoal} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-400/10">מחק</button>
          )}
          <span className={`text-white/30 text-base transition-transform duration-200 ${g.open ? "rotate-180" : ""}`}>▾</span>
        </div>
      </div>

      {g.open && (
        <>
          {/* ── Lower box: מטרות/דגשים ── */}
          <div className="border-t border-white/10 px-4 py-3" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: CHIPS_COLOR, opacity: 0.6 }}>
              מטרות / דגשים
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              {/* Goal name chip — white italic, slightly larger */}
              <span
                className="inline-flex items-center rounded-full border px-3 py-1"
                style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.08)" }}
              >
                <input
                  className="bg-transparent border-none outline-none text-[12px] font-bold italic text-white min-w-0"
                  style={{ width: `${Math.max(6, g.name.length + 1)}ch` }}
                  value={g.name}
                  onChange={e => onNameChange(e.target.value)}
                />
              </span>

              {/* Subgoal chips — sky-blue, semibold */}
              {g.subgoals.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-semibold group"
                  style={{ color: CHIPS_COLOR, borderColor: `${CHIPS_COLOR}50`, background: `${CHIPS_COLOR}15` }}
                >
                  {editingSubgoal === i ? (
                    <input
                      autoFocus
                      className="bg-transparent border-none outline-none text-[12px] font-semibold"
                      style={{ color: CHIPS_COLOR, width: `${Math.max(4, s.length + 1)}ch` }}
                      value={s}
                      onChange={e => updateSubgoal(i, e.target.value)}
                      onBlur={() => setEditingSubgoal(null)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setEditingSubgoal(null) }}
                    />
                  ) : (
                    <span onDoubleClick={() => setEditingSubgoal(i)}>{s}</span>
                  )}
                  <button
                    onClick={() => removeSubgoal(i)}
                    className="opacity-0 group-hover:opacity-50 hover:!opacity-100 text-[9px] transition-opacity leading-none"
                  >✕</button>
                </span>
              ))}

              {/* Add subgoal */}
              <input
                className="text-[11px] bg-transparent border-b border-white/15 outline-none placeholder-white/20 text-white/30 focus:text-white/60 focus:border-white/35 px-1"
                style={{ width: "7ch" }}
                placeholder="+ הוסף"
                value={newSubgoal}
                onChange={e => setNewSubgoal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addSubgoal() }}
                onBlur={addSubgoal}
              />
            </div>
          </div>

          {/* ── Metrics ── */}
          <div className="border-t border-white/10 divide-y divide-white/5">
            {g.metrics.map((m, mi) => (
              <MetricRow
                key={m.id} m={m} canDelete={g.metrics.length > 1}
                onChange={patch => onMetricChange(mi, patch)}
                onCycle={() => onCycle(mi)}
                onDelete={() => onDelRow(mi)}
              />
            ))}
          </div>

          <button onClick={onAddRow} className="flex items-center gap-2 mx-4 my-2.5 px-3 py-1.5 rounded-lg border border-dashed border-white/15 text-white/30 hover:text-white/60 hover:border-white/30 text-xs transition-colors">
            <span>＋</span> הוסף יעד
          </button>
        </>
      )}
    </div>
  )
}

// ── MetricRow ────────────────────────────────────────────────────────────────

function MetricRow({ m, canDelete, onChange, onCycle, onDelete }: {
  m: Metric
  canDelete: boolean
  onChange: (patch: Partial<Metric>) => void
  onCycle: () => void
  onDelete: () => void
}) {
  const progress = getProgress(m)

  return (
    <div className="px-3 py-2.5 hover:bg-white/3 transition-colors">
      {/* Top row: text, target, status, delete */}
      <div className="flex items-start gap-2">
        <div className="flex-1 rounded-xl px-3 py-1.5 min-w-0" style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}40` }}>
          <textarea
            className="bg-transparent border-none outline-none text-xs w-full font-semibold placeholder-white/25 leading-relaxed resize-none"
            style={{ color: ACCENT }}
            value={m.text}
            onChange={e => onChange({ text: e.target.value })}
            placeholder="שם היעד"
            rows={2}
          />
        </div>
        <div className="w-14 flex-shrink-0">
          <textarea
            className="w-full text-center text-xs text-white/70 bg-transparent border-none outline-none rounded-md focus:bg-white/8 focus:text-white px-1 py-0.5 tabular-nums transition-colors placeholder-white/20 resize-none leading-relaxed"
            value={m.target}
            onChange={e => onChange({ target: e.target.value })}
            placeholder="יעד"
            rows={2}
          />
        </div>
        <button onClick={onCycle} title={STATUS_LABEL[m.s]} className={`w-4 h-4 rounded-full flex-shrink-0 mt-1.5 transition-transform hover:scale-125 ${STATUS_DOT[m.s]}`} />
        {canDelete && (
          <button onClick={onDelete} className="w-4 h-4 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors text-[10px] flex-shrink-0 mt-1.5">✕</button>
        )}
      </div>

      {/* Bottom row: type dropdown + track controls + gauge */}
      <div className="mt-2 flex items-start gap-2 flex-wrap">
        <TrackTypeDropdown current={m.trackType} onChange={t => onChange({ trackType: t })} />

        {/* Track controls */}
        <div className="flex-1 min-w-0">
          {m.trackType === "checks" && (
            <ChecksTrack checks={m.checks} onToggle={i => { const c = [...m.checks]; c[i] = !c[i]; onChange({ checks: c }) }} />
          )}
          {m.trackType === "students" && (
            <StudentsTrack selected={m.students} onChange={s => onChange({ students: s })} />
          )}
          {m.trackType === "numbers" && (
            <NumbersTrack cells={m.numberCells} onChange={cells => onChange({ numberCells: cells })} />
          )}
          {m.trackType === "percent" && (
            <PercentTrack value={m.percentValue} max={m.percentMax} onValueChange={v => onChange({ percentValue: v })} onMaxChange={v => onChange({ percentMax: v })} />
          )}
          {m.trackType === "text" && (
            <TextTrack value={m.textValue} onChange={v => onChange({ textValue: v })} />
          )}
        </div>

        {/* Gauge + target config */}
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <SemiGauge progress={progress} />
          {(m.trackType === "checks" || m.trackType === "students" || m.trackType === "numbers") && (
            <div className="flex items-center gap-0.5">
              <span className="text-[9px] text-white/25">מתוך</span>
              <input
                type="number"
                min={1}
                className="w-9 text-center text-[9px] text-white/45 bg-transparent border-b border-white/15 outline-none focus:border-white/40 focus:text-white/70 tabular-nums"
                value={m.gaugeTarget ?? defaultGaugeTarget(m)}
                onChange={e => onChange({ gaugeTarget: Number(e.target.value) || null })}
              />
              <span className="text-[9px] text-white/25">{gaugeUnit(m.trackType)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Track type dropdown ──────────────────────────────────────────────────────

function TrackTypeDropdown({ current, onChange }: { current: TrackType; onChange: (t: TrackType) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const meta = TRACK_META[current]

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-colors"
        style={{ borderColor: `${ACCENT}50`, color: ACCENT, background: `${ACCENT}15` }}
      >
        <span>{meta.icon}</span>
        <span>{meta.label}</span>
        <span className="text-[8px] opacity-60">▾</span>
      </button>

      {open && (
        <div
          className="absolute top-full mt-1 right-0 z-50 rounded-xl border border-white/15 shadow-2xl overflow-hidden"
          style={{ background: "#1e293b", minWidth: 130 }}
        >
          {(Object.entries(TRACK_META) as [TrackType, { icon: string; label: string }][]).map(([type, m]) => (
            <button
              key={type}
              onClick={() => { onChange(type); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/8 transition-colors text-right"
              style={current === type ? { color: ACCENT } : { color: "rgba(255,255,255,0.65)" }}
            >
              <span className="text-sm">{m.icon}</span>
              <span className="text-xs flex-1">{m.label}</span>
              {current === type && <span className="text-[10px]" style={{ color: ACCENT }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Track type components ────────────────────────────────────────────────────

function ChecksTrack({ checks, onToggle }: { checks: boolean[]; onToggle: (i: number) => void }) {
  const done = checks.filter(Boolean).length
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {checks.map((c, i) => (
        <button key={i} onClick={() => onToggle(i)} title={CHECK_LABELS[i]} className="flex flex-col items-center gap-0.5 group">
          <span
            className="w-5 h-5 rounded flex items-center justify-center text-[10px] transition-all border"
            style={c
              ? { background: `${ACCENT}30`, borderColor: `${ACCENT}80`, color: ACCENT }
              : { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)", color: "transparent" }
            }
          >✓</span>
          <span className="text-[8px] text-white/25 group-hover:text-white/45 leading-none">{CHECK_LABELS[i]}</span>
        </button>
      ))}
      <span className="text-[10px] text-white/30 mr-1 tabular-nums">{done}/{checks.length}</span>
    </div>
  )
}

function StudentsTrack({ selected, onChange }: { selected: string[]; onChange: (s: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const done = selected.length
  const pct = Math.round((done / CLASS_STUDENTS.length) * 100)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  function toggle(name: string) {
    onChange(selected.includes(name) ? selected.filter(s => s !== name) : [...selected, name])
  }

  return (
    <div className="relative flex items-center gap-2 flex-wrap" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition-colors"
        style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.05)" }}
      >
        <span>{done > 0 ? `${done} תלמידים` : "בחר תלמידים"}</span>
        <span className="text-[9px]">▾</span>
      </button>

      {done > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: ACCENT }} />
          </div>
          <span className="text-[10px] text-white/40 tabular-nums">{pct}%</span>
        </div>
      )}

      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 rounded-xl border border-white/15 shadow-2xl overflow-hidden" style={{ background: "#1e293b", minWidth: 200, maxHeight: 280 }}>
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-white/50">{done}/{CLASS_STUDENTS.length} נבחרו</span>
            <div className="flex gap-2">
              <button onClick={() => onChange([...CLASS_STUDENTS])} className="text-[10px] text-white/40 hover:text-white transition-colors">הכל</button>
              <button onClick={() => onChange([])} className="text-[10px] text-white/40 hover:text-white transition-colors">נקה</button>
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 230 }}>
            {CLASS_STUDENTS.map(name => {
              const checked = selected.includes(name)
              return (
                <button key={name} onClick={() => toggle(name)} className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/8 transition-colors text-right">
                  <span className="w-4 h-4 rounded border flex items-center justify-center text-[9px] flex-shrink-0 transition-all" style={checked ? { background: `${ACCENT}30`, borderColor: `${ACCENT}80`, color: ACCENT } : { background: "transparent", borderColor: "rgba(255,255,255,0.2)", color: "transparent" }}>✓</span>
                  <span className="text-xs text-white/70 flex-1">{name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function NumbersTrack({ cells, onChange }: { cells: NumberCell[]; onChange: (c: NumberCell[]) => void }) {
  function updateCell(i: number, field: keyof NumberCell, val: string) {
    onChange(cells.map((c, idx) => idx === i ? { ...c, [field]: val } : c))
  }
  function addCell() {
    onChange([...cells, { label: `${cells.length + 1}`, value: "" }])
  }
  function removeCell(i: number) {
    if (cells.length <= 1) return
    onChange(cells.filter((_, idx) => idx !== i))
  }
  const filled = cells.filter(c => c.value.trim() !== "").length

  return (
    <div className="flex items-end gap-1.5 flex-wrap">
      {cells.map((cell, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 group relative">
          <input
            className="text-[9px] text-white/35 bg-transparent border-none outline-none text-center w-11 focus:text-white/60 placeholder-white/20"
            value={cell.label}
            onChange={e => updateCell(i, "label", e.target.value)}
            placeholder={`${i + 1}`}
          />
          <input
            className="w-11 h-7 text-center text-xs text-white/85 bg-white/8 border border-white/15 rounded-lg focus:border-white/35 focus:text-white outline-none tabular-nums transition-colors placeholder-white/25"
            value={cell.value}
            onChange={e => updateCell(i, "value", e.target.value)}
            placeholder="—"
          />
          <button
            onClick={() => removeCell(i)}
            className="absolute -top-0.5 -right-1 w-3.5 h-3.5 rounded-full bg-red-500/70 text-white text-[8px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
          >✕</button>
        </div>
      ))}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] text-transparent">+</span>
        <button
          onClick={addCell}
          className="w-7 h-7 rounded-lg border border-dashed border-white/20 text-white/30 hover:text-white/60 hover:border-white/40 text-sm transition-colors flex items-center justify-center"
        >+</button>
      </div>
      <div className="flex flex-col justify-end pb-1">
        <span className="text-[10px] text-white/30 tabular-nums">{filled}/{cells.length}</span>
      </div>
    </div>
  )
}

function PercentTrack({ value, max, onValueChange, onMaxChange }: { value: number; max: number; onValueChange: (v: number) => void; onMaxChange: (v: number) => void }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const color = progressColor(pct / 100)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 bg-white/8 rounded-xl px-3 py-1.5 border border-white/15">
        <input
          type="number"
          className="w-14 text-center text-sm font-bold bg-transparent border-none outline-none tabular-nums"
          style={{ color }}
          value={value}
          min={0}
          onChange={e => onValueChange(Number(e.target.value))}
        />
        <span className="text-white/25 text-sm">/</span>
        <input
          type="number"
          className="w-12 text-center text-xs text-white/50 bg-transparent border-none outline-none tabular-nums"
          value={max}
          min={1}
          onChange={e => onMaxChange(Number(e.target.value))}
        />
      </div>
      <div className="flex-1 flex flex-col gap-0.5 min-w-[80px]">
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-400"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <span className="text-[10px] tabular-nums" style={{ color }}>{pct}%</span>
      </div>
    </div>
  )
}

function TextTrack({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      className="w-full text-xs text-white/70 bg-white/5 border border-white/12 rounded-xl px-3 py-2 outline-none focus:border-white/30 focus:text-white resize-none transition-colors placeholder-white/20 leading-relaxed"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="הוסף הערה מילולית..."
      rows={2}
    />
  )
}
