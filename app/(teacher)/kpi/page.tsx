"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

type Status = "none" | "ok" | "warn" | "bad"

interface Metric {
  id: string
  text: string
  target: string
  q1: string; q2: string; q3: string; q4: string
  s: Status
}

interface Goal {
  id: string
  color: string
  name: string
  desc: string
  subgoals: string[]
  metrics: Metric[]
  open: boolean
}

const uid = () => Math.random().toString(36).slice(2, 9)

const DEFAULTS: Goal[] = [
  {
    id: uid(), color: "#1a52c4", open: true,
    name: "תעודת בגרות איכותית",
    desc: "הובלת התלמיד למיצוי מלא של יכולותיו הלימודיות וזכאות לתעודת בגרות מיטבית",
    subgoals: ["מיקסום יכולות לימודיות", "ציונים גבוהים ביחס לשנים קודמות", "אקלים לימודי חיובי בכיתה"],
    metrics: [
      { id: uid(), text: "מעבר להקבצות גבוהות גדול ממעבר לנמוכות",     target: "",     q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "מגמת ירידה בנתוני איחורים והפרעות בשיעורים",  target: "",     q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "ממוצע ציונים גבוה משנה קודמת מרבעון לרבעון", target: "",     q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "מינימום נכשלים",                               target: "",     q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "מקסימום מצטיינים",                             target: "",     q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "עמידה בכל התנאים לקבלת תעודת בגרות",          target: "כן",   q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "מקסימום ניצול שעות פרטניות וקבוצות תגבור",   target: "",     q1: "", q2: "", q3: "", q4: "", s: "none" },
    ],
  },
  {
    id: uid(), color: "#b45508", open: true,
    name: "זהות וערכים",
    desc: "ליווי התלמיד בבירור זהותו האישית והלאומית, תוך עידוד וחיזוק ערכים משמעותיים",
    subgoals: ["כבוד לזולת / אמפטיה", "אחריות אישית", "מעורבות חברתית", "מצוינות / עומק", "חריצות / התמדה", "פיתוח זהות אישית, קבוצתית, לאומית"],
    metrics: [
      { id: uid(), text: "אחת לחודש תלמידים ממלאים שאלון אישי",                           target: "חודשי", q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "10 שיעורי חינוך עסקו בנושאי זהות, אחריות, מצוינות, התמדה",      target: "10",    q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "ניתנו 2 משימות הערכה במסגרת שיעור חינוך",                       target: "2",     q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "100% משלימים חובת מעורבות חברתית",                               target: "100%",  q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "80% מהתלמידים מדווחים על שביעות רצון גבוהה מהמעורבות",          target: "80%",   q1: "", q2: "", q3: "", q4: "", s: "none" },
    ],
  },
  {
    id: uid(), color: "#0b7c8c", open: true,
    name: "מיומנויות",
    desc: "הקניית ארגז כלים ישומי ורלוונטי המכין את התלמיד לאתגרי התיכון ולעולם המחר",
    subgoals: ["למידה עצמאית", "שמיעת עצמי", "חשיבה ביקורתית", "יצירתיות", "אוריינות דיגיטלית"],
    metrics: [
      { id: uid(), text: "90% תלמידים עברו בחינת אוריינות דיגיטלית",                         target: "90%",  q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "90% תלמידים הגישו ≥3 משימות המשלבות חשיבה ביקורתית/יצירתיות",     target: "90%",  q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "100% תלמידים הוכנסו ללמידה באמצעות בוט AI",                        target: "100%", q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "90% תלמידים הגישו ≥3 משימות המחייבות חקירה עצמאית",               target: "90%",  q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "75% מורים דיווחו כיצד שילבו מיומנות נדרשת בהוראת המקצוע",         target: "75%",  q1: "", q2: "", q3: "", q4: "", s: "none" },
    ],
  },
  {
    id: uid(), color: "#6520c4", open: true,
    name: "רגשי חברתי",
    desc: "יצירת מרחב בטוח ותומך המספק מענה רגשי רחב ומתמקד בפיתוח ביטחון עצמי וקשרים חברתיים",
    subgoals: ["מרחב בטוח", "כישורים חברתיים", "ביטחון עצמי", "שיח רגשי", "חוסן"],
    metrics: [
      { id: uid(), text: "אחת לחודש תלמידים ממלאים שאלון אישי",                              target: "חודשי", q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "שיחה אישית אחת לרבעון עם כל תלמיד עם שאלון וסיכום יעדים",          target: "4/שנה", q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "3 מפגשים כיתתיים מחוץ לבית הספר",                                  target: "3",     q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "10 שיעורי חינוך עסקו בנושאים רגשיים-חברתיים",                      target: "10",    q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "ניתנו 2 משימות הערכה במסגרת שיעור חינוך",                          target: "2",     q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "מגמת ירידה במקרי אלימות מנובמבר ועד סוף השנה",                     target: "↓",     q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "33% מהתלמידים ישתתפו בלפחות 3 מפגשים טיפוליים חוץ-כיתתיים",       target: "33%",   q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "80% מהתלמידים ישתתפו בלפחות מפגש טיפולי אחד חוץ-כיתתי",          target: "80%",   q1: "", q2: "", q3: "", q4: "", s: "none" },
      { id: uid(), text: "הפחתת שימוש בטלפון בהפסקות ופעילויות חוץ",                         target: "↓",     q1: "", q2: "", q3: "", q4: "", s: "none" },
    ],
  },
]

const STATUS_CYCLE: Status[] = ["none", "ok", "warn", "bad"]
const STATUS_COLORS: Record<Status, string> = {
  none: "bg-slate-200",
  ok:   "bg-green-500 shadow-green-400/50 shadow-md",
  warn: "bg-amber-500 shadow-amber-400/50 shadow-md",
  bad:  "bg-red-500  shadow-red-400/50  shadow-md",
}
const STATUS_LABELS: Record<Status, string> = {
  none: "טרם הוערך", ok: "עומד ביעד", warn: "בתהליך", bad: "מאחור",
}

export default function KpiPage() {
  const [goals, setGoals] = useState<Goal[]>(DEFAULTS)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kpi-v2")
      if (saved) setGoals(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem("kpi-v2", JSON.stringify(goals)) } catch {}
  }, [goals])

  function updateGoal(gi: number, patch: Partial<Goal>) {
    setGoals(prev => prev.map((g, i) => i === gi ? { ...g, ...patch } : g))
  }

  function updateMetric(gi: number, mi: number, patch: Partial<Metric>) {
    setGoals(prev => prev.map((g, gi2) => {
      if (gi2 !== gi) return g
      return { ...g, metrics: g.metrics.map((m, mi2) => mi2 === mi ? { ...m, ...patch } : m) }
    }))
  }

  function cycleStatus(gi: number, mi: number) {
    const cur = goals[gi].metrics[mi].s
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length]
    updateMetric(gi, mi, { s: next })
  }

  function addRow(gi: number) {
    const newMetric: Metric = { id: uid(), text: "מדד חדש", target: "", q1: "", q2: "", q3: "", q4: "", s: "none" }
    setGoals(prev => prev.map((g, i) => i === gi ? { ...g, metrics: [...g.metrics, newMetric] } : g))
  }

  function delRow(gi: number, mi: number) {
    if (goals[gi].metrics.length <= 1) return
    setGoals(prev => prev.map((g, i) => i === gi
      ? { ...g, metrics: g.metrics.filter((_, j) => j !== mi) }
      : g
    ))
  }

  function addGoal() {
    const newGoal: Goal = {
      id: uid(), color: "#6366f1", open: true,
      name: "מטרת על חדשה", desc: "תיאור המטרה",
      subgoals: ["יעד 1", "יעד 2"],
      metrics: [{ id: uid(), text: "מדד ראשון", target: "", q1: "", q2: "", q3: "", q4: "", s: "none" }],
    }
    setGoals(prev => [...prev, newGoal])
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 80)
  }

  function delGoal(gi: number) {
    if (goals.length <= 1) return
    setGoals(prev => prev.filter((_, i) => i !== gi))
  }

  function resetValues() {
    setGoals(prev => prev.map(g => ({
      ...g,
      metrics: g.metrics.map(m => ({ ...m, q1: "", q2: "", q3: "", q4: "", s: "none" })),
    })))
  }

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Link href="/home" className="text-slate-400 hover:text-slate-700 text-xl interactive">←</Link>
        <div className="flex-1">
          <h1 className="font-bold text-lg text-slate-800">לוח KPI</h1>
          <p className="text-slate-400 text-xs">מדדי הצלחה לאורך השנה</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetValues}
            className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 transition-colors"
          >
            איפוס ערכים
          </button>
          <button
            onClick={addGoal}
            className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-1.5 transition-colors font-medium"
          >
            + מטרת על
          </button>
        </div>
      </header>

      {/* Legend */}
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-1 flex gap-4 flex-wrap">
        {(Object.entries(STATUS_LABELS) as [Status, string][]).map(([s, label]) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${STATUS_COLORS[s]}`} />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Goal cards */}
      <main className="max-w-5xl mx-auto px-4 py-4 space-y-5 pb-12">
        {goals.map((g, gi) => (
          <GoalCard
            key={g.id}
            g={g} gi={gi}
            onToggle={() => updateGoal(gi, { open: !g.open })}
            onGoalChange={(field, val) => updateGoal(gi, { [field]: val })}
            onMetricChange={(mi, field, val) => updateMetric(gi, mi, { [field]: val })}
            onCycleStatus={(mi) => cycleStatus(gi, mi)}
            onAddRow={() => addRow(gi)}
            onDelRow={(mi) => delRow(gi, mi)}
            onDelGoal={() => delGoal(gi)}
            canDelete={goals.length > 1}
          />
        ))}
      </main>
    </div>
  )
}

/* ── GoalCard ─────────────────────────────────────────────── */
function GoalCard({
  g, gi,
  onToggle, onGoalChange, onMetricChange,
  onCycleStatus, onAddRow, onDelRow, onDelGoal, canDelete,
}: {
  g: Goal; gi: number
  onToggle: () => void
  onGoalChange: (field: string, val: string) => void
  onMetricChange: (mi: number, field: string, val: string) => void
  onCycleStatus: (mi: number) => void
  onAddRow: () => void
  onDelRow: (mi: number) => void
  onDelGoal: () => void
  canDelete: boolean
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
      {/* Goal header */}
      <div
        className="flex items-stretch cursor-pointer select-none border-b border-slate-100 hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        <div className="w-1.5 flex-shrink-0" style={{ background: g.color }} />
        <div className="flex-1 px-5 py-3.5 min-w-0">
          <input
            className="font-bold text-base text-slate-800 bg-transparent border-none outline-none w-full cursor-pointer focus:cursor-text"
            value={g.name}
            onClick={e => e.stopPropagation()}
            onChange={e => onGoalChange("name", e.target.value)}
          />
          <input
            className="text-sm text-slate-500 bg-transparent border-none outline-none w-full mt-0.5 cursor-pointer focus:cursor-text"
            value={g.desc}
            onClick={e => e.stopPropagation()}
            onChange={e => onGoalChange("desc", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-4" onClick={e => e.stopPropagation()}>
          {canDelete && (
            <button
              onClick={onDelGoal}
              className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 rounded-lg px-2.5 py-1 transition-colors"
            >
              מחק
            </button>
          )}
          <span className={`text-slate-400 text-lg transition-transform duration-200 ${g.open ? "rotate-180" : ""}`}>▾</span>
        </div>
      </div>

      {g.open && (
        <>
          {/* Sub-goal chips */}
          <div className="px-5 py-2.5 flex flex-wrap gap-1.5 border-b border-slate-100">
            {g.subgoals.map((s, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-full border font-medium"
                style={{ color: g.color, borderColor: `${g.color}44`, background: `${g.color}10` }}
              >
                {s}
              </span>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr style={{ background: "#1e2d50" }}>
                  <th className="text-right text-white text-xs font-semibold px-5 py-2.5 min-w-[280px]">יעד</th>
                  <th className="text-center text-white text-xs font-semibold px-3 py-2.5 whitespace-nowrap">מדד הצלחה</th>
                  <th className="text-center text-white text-xs font-semibold px-3 py-2.5 whitespace-nowrap">רבעון א׳</th>
                  <th className="text-center text-white text-xs font-semibold px-3 py-2.5 whitespace-nowrap">רבעון ב׳</th>
                  <th className="text-center text-white text-xs font-semibold px-3 py-2.5 whitespace-nowrap">רבעון ג׳</th>
                  <th className="text-center text-white text-xs font-semibold px-3 py-2.5 whitespace-nowrap">רבעון ד׳</th>
                  <th className="text-center text-white text-xs font-semibold px-3 py-2.5 whitespace-nowrap min-w-[90px]">עמידה ביעד</th>
                </tr>
              </thead>
              <tbody>
                {g.metrics.map((m, mi) => (
                  <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    {/* Pill + delete */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-full px-3 py-1.5 flex items-center min-w-0" style={{ background: g.color }}>
                          <input
                            className="bg-transparent border-none outline-none text-white font-bold text-xs w-full placeholder-white/50"
                            value={m.text}
                            onChange={e => onMetricChange(mi, "text", e.target.value)}
                            placeholder="שם היעד"
                          />
                        </div>
                        {g.metrics.length > 1 && (
                          <button
                            onClick={() => onDelRow(mi)}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors text-xs flex-shrink-0"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                    {/* Target */}
                    <DataCell value={m.target} onChange={v => onMetricChange(mi, "target", v)} />
                    {/* Quarterly */}
                    <DataCell value={m.q1} onChange={v => onMetricChange(mi, "q1", v)} />
                    <DataCell value={m.q2} onChange={v => onMetricChange(mi, "q2", v)} />
                    <DataCell value={m.q3} onChange={v => onMetricChange(mi, "q3", v)} />
                    <DataCell value={m.q4} onChange={v => onMetricChange(mi, "q4", v)} />
                    {/* Status */}
                    <td className="text-center py-2 px-3">
                      <button
                        onClick={() => onCycleStatus(mi)}
                        title={STATUS_LABELS[m.s]}
                        className={`w-5 h-5 rounded-full inline-block transition-transform hover:scale-110 ${STATUS_COLORS[m.s]}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add row */}
          <button
            onClick={onAddRow}
            className="flex items-center gap-2 mx-5 my-3 px-3 py-2 rounded-lg border border-dashed border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50 text-sm transition-colors w-fit"
          >
            <span className="text-base leading-none">＋</span>
            הוסף יעד
          </button>
        </>
      )}
    </div>
  )
}

function DataCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <td className="text-center py-2 px-2">
      <input
        className="w-16 text-center text-sm text-slate-700 bg-transparent border-none outline-none rounded-md focus:bg-slate-100 focus:ring-1 focus:ring-indigo-200 px-1 py-0.5 tabular-nums transition-colors placeholder-slate-300"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="—"
      />
    </td>
  )
}
