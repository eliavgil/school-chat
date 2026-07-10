"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

type Status = "none" | "ok" | "warn" | "bad"
type TrackType = "checks" | "students"

// Hardcoded class list — replace with API when available
const CLASS_STUDENTS = [
  "אדם כהן", "אביגיל לוי", "אורי מזרחי", "איתמר פרץ", "אלה שפירא",
  "אמיר גולדברג", "בר חדד", "גל ביטון", "דנה אברמוב", "דניאל נחמני",
  "הילה כץ", "טל שמש", "יובל פישר", "יעל וקנין", "ינאי רוזן",
  "כרמל אלון", "לי בן-דוד", "לירון שלום", "מיכל אוחנה", "נועה גבאי",
  "נועם אסולין", "סהר חיים", "עדי מנחם", "עומר ברק", "עידן קפלן",
  "פלג זוהר", "רון שגיא", "רות ספיר", "שיר ג'בארי", "תמר לוינסון",
]

const CHECK_LABELS = ["ספט׳", "אוק׳", "נוב׳", "דצמ׳", "ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני"]

interface Metric {
  id: string
  text: string
  target: string
  trackType: TrackType
  checks: boolean[]   // length 10 for months
  students: string[]  // selected student names
  s: Status
}

interface Goal {
  id: string
  name: string
  desc: string
  subgoals: string[]
  metrics: Metric[]
  open: boolean
}

const uid = () => Math.random().toString(36).slice(2, 9)
const ACCENT = "#fcd34d"

function defaultMetric(text: string, target: string, trackType: TrackType = "checks"): Metric {
  return { id: uid(), text, target, trackType, checks: Array(10).fill(false), students: [], s: "none" }
}

const DEFAULTS: Goal[] = [
  {
    id: uid(), open: true,
    name: "תעודת בגרות איכותית",
    desc: "הובלת התלמיד למיצוי מלא של יכולותיו הלימודיות וזכאות לתעודת בגרות מיטבית",
    subgoals: ["מיקסום יכולות לימודיות", "ציונים גבוהים ביחס לשנים קודמות", "אקלים לימודי חיובי בכיתה"],
    metrics: [
      defaultMetric("מעבר להקבצות גבוהות גדול ממעבר לנמוכות", ""),
      defaultMetric("מגמת ירידה בנתוני איחורים והפרעות בשיעורים", ""),
      defaultMetric("ממוצע ציונים גבוה משנה קודמת מרבעון לרבעון", ""),
      defaultMetric("מינימום נכשלים", ""),
      defaultMetric("מקסימום מצטיינים", ""),
      defaultMetric("עמידה בכל התנאים לקבלת תעודת בגרות", "כן"),
      defaultMetric("מקסימום ניצול שעות פרטניות וקבוצות תגבור", ""),
    ],
  },
  {
    id: uid(), open: true,
    name: "זהות וערכים",
    desc: "ליווי התלמיד בבירור זהותו האישית והלאומית, תוך עידוד וחיזוק ערכים משמעותיים",
    subgoals: ["כבוד לזולת / אמפטיה", "אחריות אישית", "מעורבות חברתית", "מצוינות / עומק", "חריצות / התמדה", "פיתוח זהות אישית, קבוצתית, לאומית"],
    metrics: [
      { ...defaultMetric("אחת לחודש תלמידים ממלאים שאלון אישי", "חודשי", "students"), checks: Array(10).fill(false) },
      defaultMetric("10 שיעורי חינוך עסקו בנושאי זהות, אחריות, מצוינות, התמדה", "10"),
      defaultMetric("ניתנו 2 משימות הערכה במסגרת שיעור חינוך", "2"),
      { ...defaultMetric("100% משלימים חובת מעורבות חברתית", "100%", "students"), checks: Array(10).fill(false) },
      defaultMetric("80% מהתלמידים מדווחים על שביעות רצון גבוהה מהמעורבות", "80%"),
    ],
  },
  {
    id: uid(), open: true,
    name: "מיומנויות",
    desc: "הקניית ארגז כלים ישומי ורלוונטי המכין את התלמיד לאתגרי התיכון ולעולם המחר",
    subgoals: ["למידה עצמאית", "שמיעת עצמי", "חשיבה ביקורתית", "יצירתיות", "אוריינות דיגיטלית"],
    metrics: [
      { ...defaultMetric("90% תלמידים עברו בחינת אוריינות דיגיטלית", "90%", "students"), checks: Array(10).fill(false) },
      { ...defaultMetric("90% תלמידים הגישו ≥3 משימות המשלבות חשיבה ביקורתית/יצירתיות", "90%", "students"), checks: Array(10).fill(false) },
      { ...defaultMetric("100% תלמידים הוכנסו ללמידה באמצעות בוט AI", "100%", "students"), checks: Array(10).fill(false) },
      { ...defaultMetric("90% תלמידים הגישו ≥3 משימות המחייבות חקירה עצמאית", "90%", "students"), checks: Array(10).fill(false) },
      defaultMetric("75% מורים דיווחו כיצד שילבו מיומנות נדרשת בהוראת המקצוע", "75%"),
    ],
  },
  {
    id: uid(), open: true,
    name: "רגשי חברתי",
    desc: "יצירת מרחב בטוח ותומך המספק מענה רגשי רחב ומתמקד בפיתוח ביטחון עצמי וקשרים חברתיים",
    subgoals: ["מרחב בטוח", "כישורים חברתיים", "ביטחון עצמי", "שיח רגשי", "חוסן"],
    metrics: [
      { ...defaultMetric("אחת לחודש תלמידים ממלאים שאלון אישי", "חודשי", "students"), checks: Array(10).fill(false) },
      defaultMetric("שיחה אישית אחת לרבעון עם כל תלמיד עם שאלון וסיכום יעדים", "4/שנה"),
      defaultMetric("3 מפגשים כיתתיים מחוץ לבית הספר", "3"),
      defaultMetric("10 שיעורי חינוך עסקו בנושאים רגשיים-חברתיים", "10"),
      defaultMetric("ניתנו 2 משימות הערכה במסגרת שיעור חינוך", "2"),
      defaultMetric("מגמת ירידה במקרי אלימות מנובמבר ועד סוף השנה", "↓"),
      { ...defaultMetric("33% מהתלמידים ישתתפו בלפחות 3 מפגשים טיפוליים חוץ-כיתתיים", "33%", "students"), checks: Array(10).fill(false) },
      { ...defaultMetric("80% מהתלמידים ישתתפו בלפחות מפגש טיפולי אחד חוץ-כיתתי", "80%", "students"), checks: Array(10).fill(false) },
      defaultMetric("הפחתת שימוש בטלפון בהפסקות ופעילויות חוץ", "↓"),
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

export default function KpiPage() {
  const [goals, setGoals] = useState<Goal[]>(DEFAULTS)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kpi-v3")
      if (saved) setGoals(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem("kpi-v3", JSON.stringify(goals)) } catch {}
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
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length]
    updateMetric(gi, mi, { s: next })
  }

  function addRow(gi: number) {
    const m = defaultMetric("יעד חדש", "")
    setGoals(prev => prev.map((g, i) => i === gi ? { ...g, metrics: [...g.metrics, m] } : g))
  }

  function delRow(gi: number, mi: number) {
    if (goals[gi].metrics.length <= 1) return
    setGoals(prev => prev.map((g, i) =>
      i === gi ? { ...g, metrics: g.metrics.filter((_, j) => j !== mi) } : g
    ))
  }

  function addGoal() {
    const g: Goal = {
      id: uid(), open: true,
      name: "מטרת על חדשה", desc: "תיאור המטרה",
      subgoals: ["יעד 1", "יעד 2"],
      metrics: [defaultMetric("מדד ראשון", "")],
    }
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
      metrics: g.metrics.map(m => ({ ...m, checks: Array(10).fill(false), students: [], s: "none" }))
    })))
  }

  return (
    <div
      className="min-h-screen"
      dir="rtl"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}
    >
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10 px-4 header-pt pb-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <Link
            href="/home"
            className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/70 hover:text-white interactive btn-press transition-colors"
          >
            🏠
          </Link>
          <div className="flex-1">
            <div className="font-semibold text-white text-sm">לוח KPI</div>
            <div className="text-white/40 text-xs">מדדי הצלחה לאורך השנה</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetAll}
              className="text-xs text-white/40 hover:text-white/70 glass rounded-lg px-3 py-1.5 transition-colors"
            >
              איפוס
            </button>
            <button
              onClick={addGoal}
              className="text-xs text-white bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5 transition-colors font-medium"
            >
              + מטרה
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="max-w-5xl mx-auto px-4 pt-3 pb-1 flex gap-4 flex-wrap">
        {(Object.entries(STATUS_LABEL) as [Status, string][]).map(([s, label]) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full inline-block ${STATUS_DOT[s]}`} />
            <span className="text-xs text-white/35">{label}</span>
          </div>
        ))}
      </div>

      {/* Cards */}
      <main className="max-w-5xl mx-auto px-4 py-3 space-y-4 pb-16">
        {goals.map((g, gi) => (
          <GoalCard
            key={g.id}
            g={g}
            onToggle={() => updateGoal(gi, { open: !g.open })}
            onNameChange={v => updateGoal(gi, { name: v })}
            onDescChange={v => updateGoal(gi, { desc: v })}
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

function GoalCard({
  g, onToggle, onNameChange, onDescChange,
  onMetricChange, onCycle, onAddRow, onDelRow, onDelGoal, canDelete,
}: {
  g: Goal
  onToggle: () => void
  onNameChange: (v: string) => void
  onDescChange: (v: string) => void
  onMetricChange: (mi: number, patch: Partial<Metric>) => void
  onCycle: (mi: number) => void
  onAddRow: () => void
  onDelRow: (mi: number) => void
  onDelGoal: () => void
  canDelete: boolean
}) {
  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      {/* Goal header */}
      <div
        className="flex items-stretch cursor-pointer select-none hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <div className="w-1 flex-shrink-0" style={{ background: ACCENT }} />
        <div className="flex-1 px-4 py-3 min-w-0">
          <input
            className="font-bold text-sm text-white bg-transparent border-none outline-none w-full cursor-pointer focus:cursor-text"
            value={g.name}
            onClick={e => e.stopPropagation()}
            onChange={e => onNameChange(e.target.value)}
          />
          <input
            className="text-xs text-white/45 bg-transparent border-none outline-none w-full mt-0.5 cursor-pointer focus:cursor-text"
            value={g.desc}
            onClick={e => e.stopPropagation()}
            onChange={e => onDescChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-3" onClick={e => e.stopPropagation()}>
          {canDelete && (
            <button
              onClick={onDelGoal}
              className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-400/10"
            >
              מחק
            </button>
          )}
          <span className={`text-white/30 text-base transition-transform duration-200 ${g.open ? "rotate-180" : ""}`}>▾</span>
        </div>
      </div>

      {g.open && (
        <>
          {/* Sub-goal chips */}
          <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-white/8">
            {g.subgoals.map((s, i) => (
              <span
                key={i}
                className="text-[11px] px-2.5 py-0.5 rounded-full border font-medium"
                style={{ color: ACCENT, borderColor: `${ACCENT}50`, background: `${ACCENT}15` }}
              >
                {s}
              </span>
            ))}
          </div>

          {/* Metrics list */}
          <div className="border-t border-white/8 divide-y divide-white/5">
            {g.metrics.map((m, mi) => (
              <MetricRow
                key={m.id}
                m={m}
                canDelete={g.metrics.length > 1}
                onTextChange={v => onMetricChange(mi, { text: v })}
                onTargetChange={v => onMetricChange(mi, { target: v })}
                onCheckToggle={idx => {
                  const next = [...m.checks]
                  next[idx] = !next[idx]
                  onMetricChange(mi, { checks: next })
                }}
                onStudentsChange={s => onMetricChange(mi, { students: s })}
                onTypeToggle={() => onMetricChange(mi, { trackType: m.trackType === "checks" ? "students" : "checks" })}
                onCycle={() => onCycle(mi)}
                onDelete={() => onDelRow(mi)}
              />
            ))}
          </div>

          <button
            onClick={onAddRow}
            className="flex items-center gap-2 mx-4 my-2.5 px-3 py-1.5 rounded-lg border border-dashed border-white/15 text-white/30 hover:text-white/60 hover:border-white/30 text-xs transition-colors"
          >
            <span>＋</span> הוסף יעד
          </button>
        </>
      )}
    </div>
  )
}

function MetricRow({
  m, canDelete,
  onTextChange, onTargetChange, onCheckToggle, onStudentsChange, onTypeToggle, onCycle, onDelete,
}: {
  m: Metric
  canDelete: boolean
  onTextChange: (v: string) => void
  onTargetChange: (v: string) => void
  onCheckToggle: (idx: number) => void
  onStudentsChange: (s: string[]) => void
  onTypeToggle: () => void
  onCycle: () => void
  onDelete: () => void
}) {
  const doneCount = m.trackType === "checks"
    ? m.checks.filter(Boolean).length
    : m.students.length

  return (
    <div className="px-3 py-2.5 hover:bg-white/3 transition-colors">
      <div className="flex items-start gap-2">
        {/* Goal text pill */}
        <div
          className="flex-1 rounded-xl px-3 py-1.5 min-w-0"
          style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}40` }}
        >
          <textarea
            className="bg-transparent border-none outline-none text-xs w-full font-semibold placeholder-white/25 leading-relaxed resize-none"
            style={{ color: ACCENT }}
            value={m.text}
            onChange={e => onTextChange(e.target.value)}
            placeholder="שם היעד"
            rows={2}
          />
        </div>

        {/* Target */}
        <div className="w-14 flex-shrink-0">
          <textarea
            className="w-full text-center text-xs text-white/70 bg-transparent border-none outline-none rounded-md focus:bg-white/8 focus:text-white px-1 py-0.5 tabular-nums transition-colors placeholder-white/20 resize-none leading-relaxed"
            value={m.target}
            onChange={e => onTargetChange(e.target.value)}
            placeholder="יעד"
            rows={2}
          />
        </div>

        {/* Status dot */}
        <button
          onClick={onCycle}
          title={STATUS_LABEL[m.s]}
          className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 transition-transform hover:scale-125 ${STATUS_DOT[m.s]}`}
        />

        {/* Delete */}
        {canDelete && (
          <button
            onClick={onDelete}
            className="w-4 h-4 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 transition-colors text-[10px] flex-shrink-0 mt-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tracking area */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {/* Toggle type button */}
        <button
          onClick={onTypeToggle}
          className="text-[10px] px-2 py-0.5 rounded-full border transition-colors flex-shrink-0"
          style={
            m.trackType === "students"
              ? { color: ACCENT, borderColor: `${ACCENT}50`, background: `${ACCENT}15` }
              : { color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.12)", background: "transparent" }
          }
        >
          {m.trackType === "students" ? "👤 תלמידים" : "☑ חודשי"}
        </button>

        {m.trackType === "checks" ? (
          <ChecksTrack checks={m.checks} onToggle={onCheckToggle} doneCount={doneCount} />
        ) : (
          <StudentsTrack selected={m.students} onChange={onStudentsChange} />
        )}
      </div>
    </div>
  )
}

function ChecksTrack({ checks, onToggle, doneCount }: {
  checks: boolean[]
  onToggle: (i: number) => void
  doneCount: number
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap flex-1">
      {checks.map((c, i) => (
        <button
          key={i}
          onClick={() => onToggle(i)}
          title={CHECK_LABELS[i]}
          className="flex flex-col items-center gap-0.5 group"
        >
          <span
            className="w-5 h-5 rounded flex items-center justify-center text-[10px] transition-all border"
            style={
              c
                ? { background: `${ACCENT}30`, borderColor: `${ACCENT}80`, color: ACCENT }
                : { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)", color: "transparent" }
            }
          >
            ✓
          </span>
          <span className="text-[8px] text-white/25 group-hover:text-white/45 leading-none">{CHECK_LABELS[i]}</span>
        </button>
      ))}
      <span className="text-[10px] text-white/30 mr-1 tabular-nums">{doneCount}/{checks.length}</span>
    </div>
  )
}

function StudentsTrack({ selected, onChange }: {
  selected: string[]
  onChange: (s: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const total = CLASS_STUDENTS.length
  const done = selected.length
  const pct = Math.round((done / total) * 100)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  function toggle(name: string) {
    onChange(selected.includes(name) ? selected.filter(s => s !== name) : [...selected, name])
  }

  return (
    <div className="relative flex items-center gap-2" ref={ref}>
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
          {/* Progress bar */}
          <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: ACCENT }}
            />
          </div>
          <span className="text-[10px] text-white/40 tabular-nums">{pct}%</span>
        </div>
      )}

      {open && (
        <div
          className="absolute top-full mt-1 right-0 z-50 rounded-xl border border-white/15 shadow-2xl overflow-hidden"
          style={{ background: "#1e293b", minWidth: 200, maxHeight: 280 }}
        >
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-white/50">{done}/{total} נבחרו</span>
            <div className="flex gap-2">
              <button
                onClick={() => onChange([...CLASS_STUDENTS])}
                className="text-[10px] text-white/40 hover:text-white transition-colors"
              >
                הכל
              </button>
              <button
                onClick={() => onChange([])}
                className="text-[10px] text-white/40 hover:text-white transition-colors"
              >
                נקה
              </button>
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 230 }}>
            {CLASS_STUDENTS.map(name => {
              const checked = selected.includes(name)
              return (
                <button
                  key={name}
                  onClick={() => toggle(name)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/8 transition-colors text-right"
                >
                  <span
                    className="w-4 h-4 rounded border flex items-center justify-center text-[9px] flex-shrink-0 transition-all"
                    style={
                      checked
                        ? { background: `${ACCENT}30`, borderColor: `${ACCENT}80`, color: ACCENT }
                        : { background: "transparent", borderColor: "rgba(255,255,255,0.2)", color: "transparent" }
                    }
                  >
                    ✓
                  </span>
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
