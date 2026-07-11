"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

type Status = "none" | "ok" | "warn" | "bad"
type TrackType = "checks" | "students" | "numbers" | "percent" | "text" | "compare"

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
  compare:  { icon: "⇄", label: "חיובי/שלילי" },
}

interface NumberCell { label: string; value: string }

interface Metric {
  id: string
  text: string
  target: string
  trackType: TrackType
  checkLabels: string[]
  checks: boolean[]
  students: string[]
  numberCells: NumberCell[]
  percentValue: number
  percentMax: number
  textValue: string
  compareValue: string
  gaugeTarget: number | null
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
const CHIPS_COLOR = "#7dd3fc"

function mkCells(count = 5): NumberCell[] {
  return Array.from({ length: count }, (_, i) => ({ label: `${i + 1}`, value: "" }))
}

function mkMetric(text: string, target: string, trackType: TrackType = "checks", checkLabels: string[] = []): Metric {
  const checkCount = checkLabels.length || 10
  return { id: uid(), text, target, trackType, checkLabels, checks: Array(checkCount).fill(false), students: [], numberCells: mkCells(), percentValue: 0, percentMax: 100, textValue: "", compareValue: "", gaugeTarget: null, s: "none" }
}

const DEFAULTS: Goal[] = [
  {
    id: uid(), open: true,
    domain: "הישגים לימודיים",
    name: "הישגים לימודיים",
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
    name: "כישורים ומיומנויות",
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
    name: "רגשי-חברתי",
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

function defaultGaugeTarget(m: Metric): number {
  switch (m.trackType) {
    case "checks":   return m.checks.length
    case "students": return CLASS_STUDENTS.length
    case "numbers":  return m.numberCells.length
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
    case "compare": {
      if (!m.compareValue.trim()) return 0
      const val = parseFloat(m.compareValue)
      if (isNaN(val)) return 0
      return m.gaugeTarget != null ? (val >= m.gaugeTarget ? 1 : 0) : 0
    }
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

function SemiGauge({ progress }: { progress: number }) {
  const p = Math.max(0, Math.min(1, progress))
  const r = 16
  const C = Math.PI * r
  const color = progressColor(p)
  return (
    <svg viewBox="0 0 40 22" width="62" height="34" style={{ flexShrink: 0 }}>
      <path d="M 4 20 A 16 16 0 0 0 36 20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" strokeLinecap="round" />
      <path
        d="M 4 20 A 16 16 0 0 0 36 20"
        fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"
        strokeDasharray={`${C}`} strokeDashoffset={`${C * (1 - p)}`}
        style={{ transition: "stroke-dashoffset 0.45s ease, stroke 0.45s ease" }}
      />
      <text x="20" y="19" textAnchor="middle" fontSize="7.5" fontWeight="700"
        fill={p > 0 ? color : "rgba(255,255,255,0.2)"}
        style={{ fontVariantNumeric: "tabular-nums" }}>
        {Math.round(p * 100)}%
      </text>
    </svg>
  )
}

// ── Tracking persistence ─────────────────────────────────────────────────────

type TrackState = Pick<Metric, "checks"|"students"|"numberCells"|"percentValue"|"percentMax"|"textValue"|"compareValue"|"s">
const TRACKING_KEY = "kpi-tracking"
const ORDER_KEY = "kpi-order"

function saveTracking(goals: Goal[]) {
  const map: Record<string, TrackState> = {}
  for (const g of goals)
    for (const m of g.metrics)
      map[m.text] = { checks: m.checks, students: m.students, numberCells: m.numberCells, percentValue: m.percentValue, percentMax: m.percentMax, textValue: m.textValue, compareValue: m.compareValue, s: m.s }
  try { localStorage.setItem(TRACKING_KEY, JSON.stringify(map)) } catch {}
}

function saveOrder(goals: Goal[]) {
  const map: Record<string, string[]> = {}
  for (const g of goals) map[`${g.domain}:${g.name}`] = g.metrics.map(m => m.text)
  try { localStorage.setItem(ORDER_KEY, JSON.stringify(map)) } catch {}
}

function mergeTracking(goals: Goal[]): Goal[] {
  let saved: Record<string, Partial<TrackState>> = {}
  try { const raw = localStorage.getItem(TRACKING_KEY); if (raw) saved = JSON.parse(raw) } catch {}
  return goals.map(g => ({
    ...g,
    metrics: g.metrics.map(m => {
      const st = saved[m.text] ?? {}
      const merged = { ...m, ...st }
      const expectedLen = m.checkLabels.length || 10
      if (merged.checks.length !== expectedLen) {
        const old = merged.checks
        merged.checks = Array.from({ length: expectedLen }, (_, i) => old[i] ?? false)
      }
      return merged
    }),
  }))
}

function applyOrder(goals: Goal[]): Goal[] {
  let saved: Record<string, string[]> = {}
  try { const raw = localStorage.getItem(ORDER_KEY); if (raw) saved = JSON.parse(raw) } catch {}
  return goals.map(g => {
    const order = saved[`${g.domain}:${g.name}`]
    if (!order?.length) return g
    const byText = new Map(g.metrics.map(m => [m.text, m]))
    const reordered = order.flatMap(t => byText.has(t) ? [byText.get(t)!] : [])
    const seen = new Set(order)
    const newOnes = g.metrics.filter(m => !seen.has(m.text))
    return { ...g, metrics: [...reordered, ...newOnes] }
  })
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function KpiPage() {
  const [goals, setGoals] = useState<Goal[]>(DEFAULTS)
  const [fromSheet, setFromSheet] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/kpi-sheet")
        if (res.ok) {
          const raw = await res.json()
          if (Array.isArray(raw) && raw.length > 0) {
            const built: Goal[] = raw.map((rg: { domain: string; desc: string; subgoals: string[]; metrics: { text: string; target: string; trackType: string; gaugeTarget: number | null; checkLabels: string[] }[] }) => ({
              id: uid(), domain: rg.domain, name: rg.domain, desc: rg.desc,
              subgoals: rg.subgoals, open: true,
              metrics: rg.metrics.map(rm => ({
                ...mkMetric(rm.text, rm.target, rm.trackType as TrackType, rm.checkLabels ?? []),
                gaugeTarget: rm.gaugeTarget,
              })),
            }))
            setGoals(applyOrder(mergeTracking(built)))
            setFromSheet(true)
            return
          }
        }
      } catch {}
      try {
        const saved = localStorage.getItem("kpi-v5")
        if (saved) { setGoals(JSON.parse(saved)); return }
      } catch {}
      setGoals(applyOrder(mergeTracking(DEFAULTS)))
    }
    load()
  }, [])

  useEffect(() => {
    saveTracking(goals)
    saveOrder(goals)
    if (!fromSheet) {
      try { localStorage.setItem("kpi-v5", JSON.stringify(goals)) } catch {}
    }
  }, [goals, fromSheet])

  const safeTab = goals.length > 0 ? Math.min(activeTab, goals.length - 1) : 0

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
    setGoals(prev => {
      setActiveTab(prev.length)
      return [...prev, { id: uid(), open: true, domain: "תחום חדש", name: "תחום חדש", desc: "", subgoals: ["יעד 1", "יעד 2"], metrics: [mkMetric("מדד ראשון", "")] }]
    })
  }
  function delGoal(gi: number) {
    if (goals.length <= 1) return
    setGoals(prev => prev.filter((_, i) => i !== gi))
    setActiveTab(t => Math.min(t, goals.length - 2))
  }
  function reorderMetrics(gi: number, metrics: Metric[]) {
    setGoals(prev => prev.map((g, i) => i === gi ? { ...g, metrics } : g))
  }
  function resetAll() {
    setGoals(prev => prev.map(g => ({
      ...g,
      metrics: g.metrics.map(m => ({ ...m, checks: Array(m.checks.length).fill(false), students: [], numberCells: m.numberCells.map(c => ({ ...c, value: "" })), percentValue: 0, textValue: "", compareValue: "", s: "none" })),
    })))
  }

  const g = goals[safeTab]

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}>

      {/* ── Sticky header + tabs ─────────────────────────────────── */}
      <div className="sticky top-0 z-20">
        {/* Top nav */}
        <div className="bg-black/40 backdrop-blur-md border-b border-white/10 px-4 header-pt pb-3">
          <div className="flex items-center gap-3 max-w-5xl mx-auto">
            <Link href="/home" className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/70 hover:text-white interactive btn-press transition-colors">🏠</Link>
            <div className="flex-1">
              <div className="font-semibold text-white text-sm">לוח KPI</div>
              <div className="text-white/40 text-xs">מדדי הצלחה לאורך השנה</div>
            </div>
            <div className="flex gap-2">
              <button onClick={resetAll} className="text-xs text-white/40 hover:text-white/70 glass rounded-lg px-3 py-1.5 transition-colors">איפוס</button>
              <button onClick={addGoal} className="text-xs text-white bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5 transition-colors font-medium">+ תחום</button>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="border-b border-white/10" style={{ background: "rgba(10,18,35,0.96)", backdropFilter: "blur(16px)" }}>
          <div className="max-w-5xl mx-auto px-4 flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {goals.map((goal, i) => (
              <button
                key={goal.id}
                onClick={() => setActiveTab(i)}
                className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                  i === safeTab
                    ? "border-amber-300 text-amber-300"
                    : "border-transparent text-white/40 hover:text-white/65"
                }`}
              >
                {goal.domain}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Status legend ────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 pt-4 pb-1 flex gap-5 flex-wrap">
        {(Object.entries(STATUS_LABEL) as [Status, string][]).map(([s, label]) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 ${STATUS_DOT[s]}`} />
            <span className="text-sm text-white/40">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Domain content ───────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 pt-5 pb-20">
        {g && (
          <GoalCard
            key={g.id}
            g={g}
            onDomainChange={v => updateGoal(safeTab, { domain: v })}
            onDescChange={v => updateGoal(safeTab, { desc: v })}
            onSubgoalsChange={v => updateGoal(safeTab, { subgoals: v })}
            onMetricChange={(mi, patch) => updateMetric(safeTab, mi, patch)}
            onCycle={mi => cycleStatus(safeTab, mi)}
            onAddRow={() => addRow(safeTab)}
            onDelRow={mi => delRow(safeTab, mi)}
            onDelGoal={() => delGoal(safeTab)}
            onReorderMetrics={metrics => reorderMetrics(safeTab, metrics)}
            canDelete={goals.length > 1}
          />
        )}
      </main>
    </div>
  )
}

// ── GoalCard ─────────────────────────────────────────────────────────────────

function GoalCard({ g, onDomainChange, onDescChange, onSubgoalsChange, onMetricChange, onCycle, onAddRow, onDelRow, onDelGoal, onReorderMetrics, canDelete }: {
  g: Goal
  onDomainChange: (v: string) => void
  onDescChange: (v: string) => void
  onSubgoalsChange: (v: string[]) => void
  onMetricChange: (mi: number, patch: Partial<Metric>) => void
  onCycle: (mi: number) => void
  onAddRow: () => void
  onDelRow: (mi: number) => void
  onDelGoal: () => void
  onReorderMetrics: (metrics: Metric[]) => void
  canDelete: boolean
}) {
  const [editingSubgoal, setEditingSubgoal] = useState<number | null>(null)
  const [newSubgoal, setNewSubgoal] = useState("")
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  function handleReorder(from: number, to: number) {
    const arr = [...g.metrics]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    onReorderMetrics(arr)
  }
  function removeSubgoal(i: number) { onSubgoalsChange(g.subgoals.filter((_, idx) => idx !== i)) }
  function updateSubgoal(i: number, v: string) { onSubgoalsChange(g.subgoals.map((s, idx) => idx === i ? v : s)) }
  function addSubgoal() {
    if (!newSubgoal.trim()) return
    onSubgoalsChange([...g.subgoals, newSubgoal.trim()])
    setNewSubgoal("")
  }

  return (
    <div>
      {/* ── Domain heading ── */}
      <div className="mb-7">
        <div className="flex items-start gap-3">
          <input
            className="text-4xl font-bold text-white bg-transparent border-none outline-none flex-1 leading-tight min-w-0"
            value={g.domain}
            onChange={e => onDomainChange(e.target.value)}
            style={{ letterSpacing: "-0.5px" }}
          />
          {canDelete && (
            <button onClick={onDelGoal} className="text-xs text-red-400/50 hover:text-red-400 transition-colors flex-shrink-0 mt-3 px-2 py-1 rounded-lg hover:bg-red-400/10">מחק</button>
          )}
        </div>
        <textarea
          className="text-lg text-white/55 bg-transparent border-none outline-none w-full mt-3 resize-none leading-relaxed placeholder-white/20 font-light"
          value={g.desc}
          onChange={e => onDescChange(e.target.value)}
          placeholder="תיאור התחום..."
          rows={2}
        />
      </div>

      {/* ── דגשים ── */}
      <div className="mb-7 px-6 py-5 rounded-2xl border border-white/10" style={{ background: "rgba(125,211,252,0.04)" }}>
        <div className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: CHIPS_COLOR, opacity: 0.55, letterSpacing: "0.15em" }}>
          דגשים
        </div>
        <div className="flex flex-wrap gap-2.5 items-center">
          {g.subgoals.map((s, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold group"
              style={{ color: CHIPS_COLOR, borderColor: `${CHIPS_COLOR}45`, background: `${CHIPS_COLOR}12` }}
            >
              {editingSubgoal === i ? (
                <input
                  autoFocus
                  className="bg-transparent border-none outline-none text-sm font-semibold"
                  style={{ color: CHIPS_COLOR, width: `${Math.max(4, s.length + 1)}ch` }}
                  value={s}
                  onChange={e => updateSubgoal(i, e.target.value)}
                  onBlur={() => setEditingSubgoal(null)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setEditingSubgoal(null) }}
                />
              ) : (
                <span onDoubleClick={() => setEditingSubgoal(i)}>{s}</span>
              )}
              <button onClick={() => removeSubgoal(i)} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 text-[11px] transition-opacity leading-none">✕</button>
            </span>
          ))}
          <input
            className="text-sm bg-transparent border-b border-white/15 outline-none placeholder-white/20 text-white/30 focus:text-white/60 focus:border-white/35 px-1 py-1"
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
      <div className="space-y-3">
        {g.metrics.map((m, mi) => (
          <div
            key={m.id}
            draggable
            onDragStart={e => {
              if ((e.target as Element).closest?.("input,textarea,button,select")) { e.preventDefault(); return }
              e.dataTransfer.effectAllowed = "move"
              setDragFrom(mi)
            }}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOver(mi) }}
            onDrop={e => {
              e.preventDefault()
              if (dragFrom !== null && dragFrom !== mi) handleReorder(dragFrom, mi)
              setDragFrom(null); setDragOver(null)
            }}
            onDragEnd={() => { setDragFrom(null); setDragOver(null) }}
            style={{
              opacity: dragFrom === mi ? 0.35 : 1,
              borderTop: dragOver === mi && dragFrom !== null && dragFrom !== mi ? `2px solid ${ACCENT}80` : undefined,
              transition: "opacity 0.15s",
            }}
          >
            <MetricRow
              m={m}
              canDelete={g.metrics.length > 1}
              onChange={patch => onMetricChange(mi, patch)}
              onCycle={() => onCycle(mi)}
              onDelete={() => onDelRow(mi)}
            />
          </div>
        ))}
      </div>

      <button onClick={onAddRow} className="flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl border border-dashed border-white/15 text-white/35 hover:text-white/60 hover:border-white/30 text-sm transition-colors">
        <span>＋</span> הוסף יעד
      </button>
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
    <div className="glass rounded-2xl border border-white/10 px-5 py-4 hover:bg-white/[0.02] transition-colors">
      {/* Top row: drag handle + metric text + target + status + gauge + delete */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="flex-shrink-0 pt-1 cursor-grab active:cursor-grabbing select-none text-white/25 hover:text-white/55 transition-colors"
          title="גרור לשינוי סדר"
          style={{ fontSize: 16, letterSpacing: "-1px", lineHeight: 1 }}
        >⠿</div>

        <div className="flex-1 min-w-0">
          <input
            className="bg-transparent border-none outline-none text-base font-bold w-full placeholder-white/25 leading-snug"
            style={{ color: ACCENT }}
            value={m.text}
            onChange={e => onChange({ text: e.target.value })}
            placeholder="שם היעד"
          />
          <div className="flex items-center gap-1.5 mt-1.5">
            {m.target && <span className="text-xs text-white/30 flex-shrink-0">יעד:</span>}
            <input
              className="text-sm text-white/50 bg-transparent border-none outline-none flex-1 placeholder-white/20 min-w-0"
              value={m.target}
              onChange={e => onChange({ target: e.target.value })}
              placeholder="יעד..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button onClick={onCycle} title={STATUS_LABEL[m.s]} className={`w-5 h-5 rounded-full flex-shrink-0 transition-transform hover:scale-125 ${STATUS_DOT[m.s]}`} />
          <SemiGauge progress={progress} />
          {canDelete && (
            <button onClick={onDelete} className="w-5 h-5 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors text-xs flex-shrink-0">✕</button>
          )}
        </div>
      </div>

      {/* Bottom row: type selector + track controls + gauge target */}
      <div className="flex items-start gap-3 flex-wrap">
        <TrackTypeDropdown current={m.trackType} onChange={t => onChange({ trackType: t })} />

        <div className="flex-1 min-w-0">
          {m.trackType === "checks" && (
            <ChecksTrack checks={m.checks} checkLabels={m.checkLabels} onToggle={i => { const c = [...m.checks]; c[i] = !c[i]; onChange({ checks: c }) }} />
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
          {m.trackType === "compare" && (
            <CompareTrack value={m.compareValue} threshold={m.gaugeTarget} onChange={v => onChange({ compareValue: v })} />
          )}
        </div>

        {(m.trackType === "checks" || m.trackType === "students" || m.trackType === "numbers") && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs text-white/25">מתוך</span>
            <input
              type="number" min={1}
              className="w-11 text-center text-xs text-white/50 bg-transparent border-b border-white/15 outline-none focus:border-white/40 focus:text-white/70 tabular-nums"
              value={m.gaugeTarget ?? defaultGaugeTarget(m)}
              onChange={e => onChange({ gaugeTarget: Number(e.target.value) || null })}
            />
            <span className="text-xs text-white/25">{gaugeUnit(m.trackType)}</span>
          </div>
        )}
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
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
        style={{ borderColor: `${ACCENT}50`, color: ACCENT, background: `${ACCENT}15` }}
      >
        <span>{meta.icon}</span>
        <span>{meta.label}</span>
        <span className="text-[8px] opacity-60">▾</span>
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 rounded-xl border border-white/15 shadow-2xl overflow-hidden" style={{ background: "#1e293b", minWidth: 140 }}>
          {(Object.entries(TRACK_META) as [TrackType, { icon: string; label: string }][]).map(([type, m]) => (
            <button key={type} onClick={() => { onChange(type); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/8 transition-colors text-right"
              style={current === type ? { color: ACCENT } : { color: "rgba(255,255,255,0.65)" }}>
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

function ChecksTrack({ checks, checkLabels, onToggle }: { checks: boolean[]; checkLabels: string[]; onToggle: (i: number) => void }) {
  const labels = checkLabels.length ? checkLabels : CHECK_LABELS
  const done = checks.filter(Boolean).length
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {checks.map((c, i) => (
        <button key={i} onClick={() => onToggle(i)} title={labels[i] ?? String(i + 1)} className="flex flex-col items-center gap-0.5 group">
          <span className="w-6 h-6 rounded flex items-center justify-center text-xs transition-all border"
            style={c
              ? { background: `${ACCENT}30`, borderColor: `${ACCENT}80`, color: ACCENT }
              : { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)", color: "transparent" }
            }>✓</span>
          <span className="text-[9px] text-white/25 group-hover:text-white/45 leading-none">{labels[i] ?? i + 1}</span>
        </button>
      ))}
      <span className="text-xs text-white/30 mr-1 tabular-nums">{done}/{checks.length}</span>
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
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
        style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.05)" }}>
        <span>{done > 0 ? `${done} תלמידים` : "בחר תלמידים"}</span>
        <span className="text-[9px]">▾</span>
      </button>
      {done > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: ACCENT }} />
          </div>
          <span className="text-xs text-white/40 tabular-nums">{pct}%</span>
        </div>
      )}
      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 rounded-xl border border-white/15 shadow-2xl overflow-hidden" style={{ background: "#1e293b", minWidth: 200, maxHeight: 280 }}>
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs text-white/50">{done}/{CLASS_STUDENTS.length} נבחרו</span>
            <div className="flex gap-2">
              <button onClick={() => onChange([...CLASS_STUDENTS])} className="text-[11px] text-white/40 hover:text-white transition-colors">הכל</button>
              <button onClick={() => onChange([])} className="text-[11px] text-white/40 hover:text-white transition-colors">נקה</button>
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 230 }}>
            {CLASS_STUDENTS.map(name => {
              const checked = selected.includes(name)
              return (
                <button key={name} onClick={() => toggle(name)} className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/8 transition-colors text-right">
                  <span className="w-4 h-4 rounded border flex items-center justify-center text-[9px] flex-shrink-0 transition-all"
                    style={checked ? { background: `${ACCENT}30`, borderColor: `${ACCENT}80`, color: ACCENT } : { background: "transparent", borderColor: "rgba(255,255,255,0.2)", color: "transparent" }}>✓</span>
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
  function addCell() { onChange([...cells, { label: `${cells.length + 1}`, value: "" }]) }
  function removeCell(i: number) { if (cells.length <= 1) return; onChange(cells.filter((_, idx) => idx !== i)) }
  const filled = cells.filter(c => c.value.trim() !== "").length

  return (
    <div className="flex items-end gap-1.5 flex-wrap">
      {cells.map((cell, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 group relative">
          <input
            className="text-[9px] text-white/35 bg-transparent border-none outline-none text-center w-11 focus:text-white/60 placeholder-white/20"
            value={cell.label} onChange={e => updateCell(i, "label", e.target.value)} placeholder={`${i + 1}`}
          />
          <input
            className="w-11 h-8 text-center text-sm text-white/85 bg-white/8 border border-white/15 rounded-lg focus:border-white/35 focus:text-white outline-none tabular-nums transition-colors placeholder-white/25"
            value={cell.value} onChange={e => updateCell(i, "value", e.target.value)} placeholder="—"
          />
          <button onClick={() => removeCell(i)} className="absolute -top-0.5 -right-1 w-3.5 h-3.5 rounded-full bg-red-500/70 text-white text-[8px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">✕</button>
        </div>
      ))}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] text-transparent">+</span>
        <button onClick={addCell} className="w-8 h-8 rounded-lg border border-dashed border-white/20 text-white/30 hover:text-white/60 hover:border-white/40 text-sm transition-colors flex items-center justify-center">+</button>
      </div>
      <div className="flex flex-col justify-end pb-1">
        <span className="text-xs text-white/30 tabular-nums">{filled}/{cells.length}</span>
      </div>
    </div>
  )
}

function PercentTrack({ value, max, onValueChange, onMaxChange }: { value: number; max: number; onValueChange: (v: number) => void; onMaxChange: (v: number) => void }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const color = progressColor(pct / 100)
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1 bg-white/8 rounded-xl px-3 py-1.5 border border-white/15">
        <input type="number" className="w-14 text-center text-sm font-bold bg-transparent border-none outline-none tabular-nums"
          style={{ color }} value={value} min={0} onChange={e => onValueChange(Number(e.target.value))} />
        <span className="text-white/25 text-sm">/</span>
        <input type="number" className="w-12 text-center text-xs text-white/50 bg-transparent border-none outline-none tabular-nums"
          value={max} min={1} onChange={e => onMaxChange(Number(e.target.value))} />
      </div>
      <div className="flex-1 flex flex-col gap-0.5 min-w-[100px]">
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-400" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span className="text-xs tabular-nums" style={{ color }}>{pct}%</span>
      </div>
    </div>
  )
}

function TextTrack({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      className="w-full text-sm text-white/70 bg-white/5 border border-white/12 rounded-xl px-3 py-2 outline-none focus:border-white/30 focus:text-white resize-none transition-colors placeholder-white/20 leading-relaxed"
      value={value} onChange={e => onChange(e.target.value)} placeholder="הוסף הערה מילולית..." rows={2}
    />
  )
}

function CompareTrack({ value, threshold, onChange }: { value: string; threshold: number | null; onChange: (v: string) => void }) {
  const num = parseFloat(value)
  const hasValue = value.trim() !== "" && !isNaN(num)
  const success = hasValue && threshold != null && num >= threshold
  const fail    = hasValue && threshold != null && num < threshold

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-white/30">ערך נוכחי</span>
        <input
          type="number"
          className="w-24 text-base font-semibold tabular-nums text-center bg-white/5 border border-white/15 rounded-lg px-2 py-1.5 outline-none focus:border-white/35 focus:bg-white/8 text-white transition-colors"
          value={value} onChange={e => onChange(e.target.value)} placeholder="הזן"
        />
      </div>
      {threshold != null && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs text-white/30">סף השוואה</span>
          <span className="text-base font-semibold tabular-nums text-white/40">{threshold}</span>
        </div>
      )}
      {hasValue && threshold != null && (
        <div className={`flex items-center justify-center w-11 h-11 rounded-full text-xl font-bold transition-all ${
          success ? "bg-green-500/20 text-green-400 border border-green-500/40" : "bg-red-500/20 text-red-400 border border-red-500/40"
        }`}>
          {success ? "✓" : "✗"}
        </div>
      )}
      {hasValue && threshold == null && (
        <span className="text-xs text-white/30">הגדר יעד גרף כסף השוואה</span>
      )}
      {!hasValue && (
        <span className="text-xs text-white/20">הזן ערך להשוואה</span>
      )}
    </div>
  )
}
