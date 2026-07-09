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
    id: uid(), color: "#93c5fd", open: true,
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
    id: uid(), color: "#fcd34d", open: true,
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
    id: uid(), color: "#67e8f9", open: true,
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
    id: uid(), color: "#d8b4fe", open: true,
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
    const m: Metric = { id: uid(), text: "יעד חדש", target: "", q1: "", q2: "", q3: "", q4: "", s: "none" }
    setGoals(prev => prev.map((g, i) => i === gi ? { ...g, metrics: [...g.metrics, m] } : g))
  }

  function delRow(gi: number, mi: number) {
    if (goals[gi].metrics.length <= 1) return
    setGoals(prev => prev.map((g, i) => i === gi
      ? { ...g, metrics: g.metrics.filter((_, j) => j !== mi) }
      : g
    ))
  }

  function addGoal() {
    const g: Goal = {
      id: uid(), color: "#6366f1", open: true,
      name: "מטרת על חדשה", desc: "תיאור המטרה",
      subgoals: ["יעד 1", "יעד 2"],
      metrics: [{ id: uid(), text: "מדד ראשון", target: "", q1: "", q2: "", q3: "", q4: "", s: "none" }],
    }
    setGoals(prev => [...prev, g])
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 80)
  }

  function delGoal(gi: number) {
    if (goals.length <= 1) return
    setGoals(prev => prev.filter((_, i) => i !== gi))
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
              onClick={() => setGoals(prev => prev.map(g => ({
                ...g, metrics: g.metrics.map(m => ({ ...m, q1: "", q2: "", q3: "", q4: "", s: "none" }))
              })))}
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
            onMetricChange={(mi, f, v) => updateMetric(gi, mi, { [f]: v })}
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
  onMetricChange: (mi: number, field: string, v: string) => void
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
        <div className="w-1 flex-shrink-0" style={{ background: g.color }} />
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
                style={{ color: g.color, borderColor: `${g.color}40`, background: `${g.color}15` }}
              >
                {s}
              </span>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto border-t border-white/8">
            <table className="w-full border-collapse" style={{ tableLayout: "fixed", minWidth: 640 }}>
              <colgroup>
                <col style={{ width: "42%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-right text-white/40 text-[11px] font-semibold px-4 py-2 uppercase tracking-wide">יעד</th>
                  <th className="text-center text-white/40 text-[11px] font-semibold px-2 py-2 uppercase tracking-wide">מדד הצלחה</th>
                  <th className="text-center text-white/40 text-[11px] font-semibold px-1 py-2">ר׳א</th>
                  <th className="text-center text-white/40 text-[11px] font-semibold px-1 py-2">ר׳ב</th>
                  <th className="text-center text-white/40 text-[11px] font-semibold px-1 py-2">ר׳ג</th>
                  <th className="text-center text-white/40 text-[11px] font-semibold px-1 py-2">ר׳ד</th>
                  <th className="text-center text-white/40 text-[11px] font-semibold px-2 py-2">עמידה</th>
                </tr>
              </thead>
              <tbody>
                {g.metrics.map((m, mi) => (
                  <tr key={m.id} className="border-b border-white/5 last:border-0 hover:bg-white/4 transition-colors">
                    {/* Goal pill — wide, wraps to 2 lines */}
                    <td className="px-3 py-2 align-top">
                      <div className="flex items-start gap-2">
                        <div
                          className="flex-1 rounded-xl px-3 py-1.5 flex items-start min-w-0"
                          style={{ background: `${g.color}20`, border: `1px solid ${g.color}35` }}
                        >
                          <input
                            className="bg-transparent border-none outline-none text-xs w-full font-semibold placeholder-white/25 leading-relaxed"
                            style={{ color: g.color }}
                            value={m.text}
                            onChange={e => onMetricChange(mi, "text", e.target.value)}
                            placeholder="שם היעד"
                          />
                        </div>
                        {g.metrics.length > 1 && (
                          <button
                            onClick={() => onDelRow(mi)}
                            className="w-4 h-4 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 transition-colors text-[10px] flex-shrink-0 mt-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                    {/* Target — wraps */}
                    <td className="px-2 py-2 align-top">
                      <textarea
                        className="w-full text-center text-xs text-white/70 bg-transparent border-none outline-none rounded-md focus:bg-white/8 focus:text-white px-1 py-0.5 tabular-nums transition-colors placeholder-white/20 resize-none leading-relaxed"
                        value={m.target}
                        onChange={e => onMetricChange(mi, "target", e.target.value)}
                        placeholder="—"
                        rows={2}
                      />
                    </td>
                    <SmallCell value={m.q1} onChange={v => onMetricChange(mi, "q1", v)} />
                    <SmallCell value={m.q2} onChange={v => onMetricChange(mi, "q2", v)} />
                    <SmallCell value={m.q3} onChange={v => onMetricChange(mi, "q3", v)} />
                    <SmallCell value={m.q4} onChange={v => onMetricChange(mi, "q4", v)} />
                    <td className="text-center py-2 px-2 align-middle">
                      <button
                        onClick={() => onCycle(mi)}
                        title={STATUS_LABEL[m.s]}
                        className={`w-4 h-4 rounded-full inline-block transition-transform hover:scale-125 ${STATUS_DOT[m.s]}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

function SmallCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <td className="text-center py-2 px-1 align-middle">
      <input
        className="w-full text-center text-xs text-white/70 bg-transparent border-none outline-none rounded-md focus:bg-white/8 focus:text-white px-1 py-0.5 tabular-nums transition-colors placeholder-white/20"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="—"
      />
    </td>
  )
}
