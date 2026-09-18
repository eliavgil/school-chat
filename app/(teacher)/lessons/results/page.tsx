"use client"
import { useEffect, useState, useMemo } from "react"

/* ── Tracking types ─────────────────────────────────────── */
interface LessonStatus {
  lessonId: string
  lessonTitle: string
  status: "done" | "next" | "upcoming"
  manual: boolean
  sessionId: string | null
  sessionDate: string | null
  roomCode: string | null
}
interface ClassTracking {
  classId: string
  className: string
  completedCount: number
  totalLessons: number
  nextLesson: LessonStatus | null
  lessons: LessonStatus[]
}
interface TrackingData {
  lessons: { id: string; title: string; createdAt: string }[]
  classes: { id: string; name: string }[]
  classTracking: ClassTracking[]
  unassigned: { sessionId: string; lessonId: string; lessonTitle: string; date: string; roomCode: string }[]
}

/* ── Types ─────────────────────────────────────────────── */
interface Question {
  id: string
  text: string
  options: string[]
  correctIndex: number | null
}
interface SlideGroup {
  slideId: string
  slideTitle: string
  slideType: string
  questions: Question[]
}
interface StudentResult {
  studentId: string
  studentName: string
  classId: string | null
  unlinked: boolean
  answers: Record<string, string>
  quizCorrect: number
  quizTotal: number
  quizScore: number | null
}
interface Session {
  id: string
  lessonId: string
  lessonTitle: string
  roomCode: string
  createdAt: string
  slidesWithQuestions: SlideGroup[]
  studentResults: StudentResult[]
}
interface StudentAverage {
  studentId: string
  studentName: string
  classId: string
  className: string
  sessionsParticipated: number
  averageScore: number | null
  sessions: { sessionId: string; lessonId: string; lessonTitle: string; score: number | null; correct: number; total: number }[]
}
interface ApiData {
  classes: { id: string; name: string }[]
  sessions: Session[]
  studentAverages: StudentAverage[]
}

/* ── Helpers ────────────────────────────────────────────── */
function pct(n: number) {
  return Math.round(n * 100) + "%"
}

function scoreColor(score: number | null, dim = false): string {
  if (score === null) return dim ? "#e5e7eb" : "#d1d5db"
  if (score >= 0.8) return dim ? "#bbf7d0" : "#16a34a"
  if (score >= 0.6) return dim ? "#fef08a" : "#ca8a04"
  return dim ? "#fecaca" : "#dc2626"
}

function formatDate(iso: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })
}

/* ── Main page ──────────────────────────────────────────── */
export default function ResultsPage() {
  const [data, setData] = useState<ApiData | null>(null)
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<string | "all">("all")
  const [view, setView] = useState<"session" | "averages" | "tracking">("session")
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)

  // Always fetch every class's data — the lesson tab aggregates across all
  // classes on purpose, and the averages tab filters this same data client-side
  // by selectedClass instead of re-fetching, since the two tabs need different
  // scoping of the same underlying sessions.
  useEffect(() => {
    setLoading(true)
    fetch("/api/results")
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setData(d)
        if (!selectedLessonId && d.sessions.length > 0) setSelectedLessonId(d.sessions[0].lessonId)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function refreshTracking() {
    setTrackingLoading(true)
    return fetch("/api/tracking")
      .then(r => r.json())
      .then(d => { if (!d.error) setTrackingData(d) })
      .catch(() => {})
      .finally(() => setTrackingLoading(false))
  }

  useEffect(() => {
    if (view !== "tracking" || trackingData) return
    refreshTracking()
  }, [view]) // eslint-disable-line react-hooks/exhaustive-deps

  // All classes' sessions of the selected lesson, merged — "by lesson" means
  // aggregated across every class that ran it, not one class-session at a time.
  const lessonSessions = useMemo(
    () => data?.sessions.filter(s => s.lessonId === selectedLessonId) ?? [],
    [data, selectedLessonId]
  )

  const TABS = [
    { key: "session", label: "לפי שיעור" },
    { key: "averages", label: "ממוצעי תלמידים" },
    { key: "tracking", label: "📋 מעקב שיעורים" },
  ] as const

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif", padding: "0" }}>
      {/* Header */}
      <div style={{ background: "#1e293b", color: "#fff", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <a href="/lessons" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 14 }}>← שיעורים</a>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>דשבורד שיעורים</h1>
      </div>

      <div style={{ padding: "20px 24px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Class filter — hide for tracking (its own class view) and session
            (it aggregates across every class on purpose) */}
        {view === "averages" && data && data.classes.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => setSelectedClass("all")} style={chipStyle(selectedClass === "all")}>כל הכיתות</button>
            {data.classes.map(c => (
              <button key={c.id} onClick={() => setSelectedClass(c.id)} style={chipStyle(selectedClass === c.id)}>{c.name}</button>
            ))}
          </div>
        )}

        {/* View tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #e2e8f0" }}>
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setView(key)} style={{
              padding: "10px 20px", background: "none", border: "none", cursor: "pointer",
              fontWeight: view === key ? 700 : 400, color: view === key ? "#3b82f6" : "#64748b",
              borderBottom: view === key ? "2px solid #3b82f6" : "2px solid transparent",
              marginBottom: -2, fontSize: 15, fontFamily: "inherit",
            }}>
              {label}
            </button>
          ))}
        </div>

        {loading && view !== "tracking" && <p style={{ color: "#64748b" }}>טוען נתונים...</p>}
        {error && <p style={{ color: "#dc2626" }}>שגיאה: {error}</p>}

        {data && !loading && view === "session" && (
          <LessonView data={data} lessonSessions={lessonSessions} selectedLessonId={selectedLessonId} setSelectedLessonId={setSelectedLessonId} />
        )}
        {data && !loading && view === "averages" && <AveragesView data={data} selectedClass={selectedClass} />}
        {view === "tracking" && (trackingLoading ? <p style={{ color: "#64748b" }}>טוען...</p> : trackingData ? <TrackingView data={trackingData} onChanged={refreshTracking} /> : null)}
      </div>
    </div>
  )
}

/* ── Lesson view — aggregated across every class that ran it,
   per explicit request: success rate per question + feedback rating,
   nothing per-student or per-class ──────────────────────────────── */
function LessonView({ data, lessonSessions, selectedLessonId, setSelectedLessonId }: {
  data: ApiData
  lessonSessions: Session[]
  selectedLessonId: string | null
  setSelectedLessonId: (id: string) => void
}) {
  if (data.sessions.length === 0) {
    return <p style={{ color: "#64748b" }}>לא נמצאו שיעורים עם תוצאות.</p>
  }

  // One option per lesson, not per class-session (a lesson taught to
  // several classes has one live_sessions row — and room code — per class).
  const lessons = Array.from(new Map(data.sessions.map(s => [s.lessonId, s.lessonTitle])).entries())

  // Question structure is the same lesson content regardless of which class
  // ran it — take it from any one of this lesson's sessions — but answers
  // are merged from every class together.
  const anySession = lessonSessions[0] ?? null
  const allQuestions = anySession?.slidesWithQuestions.flatMap(sg =>
    sg.questions.map(q => ({ ...q, slideId: sg.slideId, slideType: sg.slideType }))
  ) ?? []
  const quizQs = allQuestions.filter(q => q.slideType !== "feedback" && q.correctIndex !== null)
  const feedbackQs = allQuestions.filter(q => q.slideType === "feedback")
  const allAnswers = lessonSessions.flatMap(s => s.studentResults)
  const totalParticipants = new Set(allAnswers.map(r => r.studentId)).size

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: "#64748b", display: "block", marginBottom: 6 }}>בחר שיעור:</label>
        <select
          value={selectedLessonId ?? ""}
          onChange={e => setSelectedLessonId(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 15, fontFamily: "inherit", background: "#fff", cursor: "pointer" }}
        >
          {lessons.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
        </select>
      </div>

      {!anySession && <p style={{ color: "#64748b" }}>אין עדיין תוצאות לשיעור הזה.</p>}

      {anySession && (
        <>
          <div style={{ marginBottom: 20 }}>
            <StatCard label="תלמידים שהשתתפו — כל הכיתות" value={String(totalParticipants)} />
          </div>

          {quizQs.length > 0 && (
            <Section title="ממוצע הצלחה לפי שאלה — כלל הכיתות">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {quizQs.map((q, i) => {
                  const key = `${q.slideId}__${q.id}`
                  const answered = allAnswers.filter(r => r.answers[key] !== undefined)
                  const correct = answered.filter(r => r.answers[key] === String(q.correctIndex))
                  const rate = answered.length > 0 ? correct.length / answered.length : null
                  return (
                    <div key={q.id} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>ש{i + 1}</div>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{q.text}</div>
                      </div>
                      <div style={{ textAlign: "center", flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 20, color: scoreColor(rate) }}>{rate !== null ? pct(rate) : "—"}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{answered.length} ענו</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {feedbackQs.length > 0 && (
            <Section title="משוב על השיעור — כלל הכיתות">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {feedbackQs.map(q => {
                  const key = `${q.slideId}__${q.id}`
                  const answered = allAnswers.filter(r => r.answers[key] !== undefined)
                  const avg = answered.length > 0
                    ? answered.reduce((sum, r) => sum + (parseInt(r.answers[key], 10) + 1), 0) / answered.length
                    : null
                  return (
                    <div key={q.id} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{q.text}</div>
                      <div style={{ textAlign: "center", flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 20, color: "#1e293b" }}>{avg !== null ? `${avg.toFixed(1)} ⭐` : "—"}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{answered.length} ענו</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {quizQs.length === 0 && feedbackQs.length === 0 && (
            <p style={{ color: "#94a3b8" }}>אין שאלות בוחן או משוב בשיעור הזה.</p>
          )}
        </>
      )}
    </div>
  )
}

/* ── Averages view ──────────────────────────────────────── */
function AveragesView({ data, selectedClass }: { data: ApiData; selectedClass: string | "all" }) {
  // The same lesson taught to several classes gets a separate live_sessions
  // row (and room code) per class, but it's still one lesson — one column,
  // not one per class. Any of that lesson's sessions works as the column's
  // display source (title, quiz question set); a student only ever has
  // data in the one that was actually their own class's.
  const scoredSessions = data.sessions.filter(s => s.slidesWithQuestions.some(sg => sg.questions.some(q => q.correctIndex !== null)))
  const lessonColumns = Array.from(new Map(scoredSessions.map(s => [s.lessonId, s])).values())
  const totalLessons = new Set(data.sessions.map(s => s.lessonId)).size
  const students = selectedClass === "all" ? data.studentAverages : data.studentAverages.filter(s => s.classId === selectedClass)

  if (students.length === 0) {
    return <p style={{ color: "#64748b" }}>אין נתוני תלמידים להצגה.</p>
  }

  const sorted = [...students].sort((a, b) => (b.averageScore ?? -1) - (a.averageScore ?? -1))

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, minWidth: 140, textAlign: "right" }}>תלמיד/ה</th>
              <th style={{ ...thStyle, minWidth: 100 }}>כיתה</th>
              {lessonColumns.map(s => (
                <th key={s.lessonId} style={{ ...thStyle, minWidth: 90, fontSize: 12 }}>
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }} title={s.lessonTitle}>
                    {s.lessonTitle.replace(/^שיעור \d+: /, "")}
                  </div>
                </th>
              ))}
              <th style={{ ...thStyle, minWidth: 80, background: "#f1f5f9" }}>ממוצע</th>
              <th style={{ ...thStyle, minWidth: 60 }}>השתתפות</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(student => (
              <tr key={student.studentId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{student.studentName}</td>
                <td style={{ ...tdStyle, color: "#64748b", fontSize: 13 }}>{student.className}</td>
                {lessonColumns.map(s => {
                  const ss = student.sessions.find(x => x.lessonId === s.lessonId)
                  return (
                    <td key={s.lessonId} style={{ ...tdStyle, textAlign: "center" }}>
                      {ss ? (
                        ss.score !== null ? (
                          <span style={{ fontWeight: 700, color: scoreColor(ss.score) }}>{pct(ss.score)}</span>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>השתתף</span>
                        )
                      ) : (
                        <span style={{ color: "#e2e8f0" }}>—</span>
                      )}
                    </td>
                  )
                })}
                <td style={{ ...tdStyle, textAlign: "center", background: "#f8fafc", fontWeight: 700, color: scoreColor(student.averageScore) }}>
                  {student.averageScore !== null ? pct(student.averageScore) : "—"}
                </td>
                <td style={{ ...tdStyle, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  {new Set(student.sessions.map(x => x.lessonId)).size}/{totalLessons}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#64748b" }}>
        {[["#16a34a", "80%+"], ["#ca8a04", "60–79%"], ["#dc2626", "מתחת ל-60%"]].map(([color, label]) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: color, display: "inline-block" }} />
            {label}
          </span>
        ))}
        <span style={{ color: "#94a3b8" }}>— = לא השתתף</span>
      </div>
    </div>
  )
}

/* ── Tracking view ──────────────────────────────────────── */
function TrackingView({ data, onChanged }: { data: TrackingData; onChanged: () => void }) {
  const { lessons, classTracking, unassigned } = data
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  if (classTracking.length === 0) {
    return <p style={{ color: "#64748b" }}>אין כיתות במערכת.</p>
  }

  // Clicking a lesson marks it done "by hand" — for when it was actually
  // taught but the slide deck wasn't finished (or the live-session flow
  // wasn't used that day), so no session row exists to infer it from.
  // Only ever toggles the manual override; a lesson that's done because a
  // real session exists for it stays done either way.
  async function toggleManual(ls: LessonStatus, classId: string) {
    const key = `${classId}:${ls.lessonId}`
    setTogglingKey(key)
    try {
      if (ls.status === "done" && ls.manual) {
        await fetch("/api/tracking/manual", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: ls.lessonId, classId }) })
      } else if (ls.status !== "done") {
        await fetch("/api/tracking/manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: ls.lessonId, classId }) })
      }
      onChanged()
    } finally {
      setTogglingKey(null)
    }
  }

  return (
    <div>
      {/* Summary cards per class */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
        {classTracking.map(cls => (
          <div key={cls.classId} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#1e293b" }}>{cls.className}</div>
              <div style={{ fontSize: 13, color: "#64748b", background: "#f1f5f9", borderRadius: 20, padding: "3px 10px" }}>
                {cls.completedCount}/{cls.totalLessons} שיעורים
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, marginBottom: 14, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: cls.totalLessons > 0 ? `${(cls.completedCount / cls.totalLessons) * 100}%` : "0%",
                background: "#3b82f6", borderRadius: 3, transition: "width .4s"
              }} />
            </div>

            {/* Next lesson */}
            {cls.nextLesson ? (
              <div style={{ background: "#eff6ff", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>השיעור הבא</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1e40af" }}>{cls.nextLesson.lessonTitle}</div>
              </div>
            ) : (
              <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "10px 14px", marginBottom: 12, color: "#16a34a", fontWeight: 600, fontSize: 14 }}>
                ✓ כל השיעורים הושלמו
              </div>
            )}

            {/* Last 3 taught */}
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>שיעורים אחרונים:</div>
            {cls.lessons.filter(l => l.status === "done").slice(-3).reverse().map(l => (
              <div key={l.lessonId} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#16a34a" }}>✓ {l.lessonTitle.replace(/^שיעור \d+:\s*/, "")}</span>
                <span style={{ color: "#94a3b8" }}>{l.sessionDate ? formatDate(l.sessionDate) : ""}</span>
              </div>
            ))}
            {cls.lessons.filter(l => l.status === "done").length === 0 && (
              <div style={{ fontSize: 12, color: "#94a3b8" }}>טרם בוצע שיעור</div>
            )}
          </div>
        ))}
      </div>

      {/* Full matrix table */}
      <Section title="טבלת מעקב — כל הכיתות">
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: "right", minWidth: 200 }}>שיעור</th>
                {classTracking.map(cls => (
                  <th key={cls.classId} style={{ ...thStyle, minWidth: 120 }}>{cls.className}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lessons.map(lesson => (
                <tr key={lesson.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ ...tdStyle, fontWeight: 500, color: "#1e293b" }}>{lesson.title}</td>
                  {classTracking.map(cls => {
                    const ls = cls.lessons.find(l => l.lessonId === lesson.id)
                    if (!ls) return <td key={cls.classId} style={{ ...tdStyle, textAlign: "center", color: "#cbd5e1" }}>—</td>

                    const key = `${cls.classId}:${ls.lessonId}`
                    const busy = togglingKey === key
                    const clickable = ls.status !== "done" || ls.manual

                    if (ls.status === "done") return (
                      <td key={cls.classId}
                        onClick={clickable ? () => toggleManual(ls, cls.classId) : undefined}
                        title={ls.manual ? "סומן ידנית — לחצו לביטול" : undefined}
                        style={{ ...tdStyle, textAlign: "center", background: "#f0fdf4", cursor: clickable ? "pointer" : "default", opacity: busy ? 0.5 : 1 }}>
                        <div style={{ color: "#16a34a", fontWeight: 700, fontSize: 16 }}>✓</div>
                        <div style={{ fontSize: 10, color: "#86efac" }}>
                          {ls.manual ? "ידני" : ls.sessionDate ? new Date(ls.sessionDate).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" }) : ""}
                        </div>
                      </td>
                    )
                    if (ls.status === "next") return (
                      <td key={cls.classId}
                        onClick={() => toggleManual(ls, cls.classId)}
                        title="לחצו לסימון כבוצע"
                        style={{ ...tdStyle, textAlign: "center", background: "#eff6ff", cursor: "pointer", opacity: busy ? 0.5 : 1 }}>
                        <div style={{ color: "#3b82f6", fontWeight: 700, fontSize: 16 }}>→</div>
                        <div style={{ fontSize: 10, color: "#93c5fd" }}>הבא</div>
                      </td>
                    )
                    return (
                      <td key={cls.classId}
                        onClick={() => toggleManual(ls, cls.classId)}
                        title="לחצו לסימון כבוצע"
                        style={{ ...tdStyle, textAlign: "center", cursor: "pointer", opacity: busy ? 0.5 : 1 }}>
                        <span style={{ color: "#e2e8f0", fontSize: 18 }}>·</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div style={{ marginTop: 12, display: "flex", gap: 20, fontSize: 12, color: "#64748b" }}>
          <span>✓ בוצע</span>
          <span style={{ color: "#3b82f6" }}>→ השיעור הבא</span>
          <span style={{ color: "#cbd5e1" }}>· טרם הגיע</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
          לחצו על תא כדי לסמן שיעור כבוצע ידנית (למשל אם לימדתם בלי לסיים את המצגת) — ולחצו שוב על "ידני" כדי לבטל.
        </div>
      </Section>

      {/* Unassigned sessions */}
      {unassigned.length > 0 && (
        <Section title="שיעורים ללא כיתה מזוהה">
          <div style={{ color: "#64748b", fontSize: 13, marginBottom: 12 }}>
            שיעורים אלו לא הכילו תשובות תלמידים, ולכן לא ניתן לזהות לאיזו כיתה הם שייכים.
          </div>
          {unassigned.map(s => (
            <div key={s.sessionId} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.lessonTitle}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>קוד: {s.roomCode} · {formatDate(s.date)}</div>
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}

/* ── Small components ───────────────────────────────────── */
function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 18px", minWidth: 120 }}>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color ?? "#1e293b" }}>{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1e293b", borderRight: "3px solid #3b82f6", paddingRight: 10 }}>{title}</h3>
      {children}
    </div>
  )
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 14px", borderRadius: 20, border: "1px solid",
    borderColor: active ? "#3b82f6" : "#e2e8f0",
    background: active ? "#eff6ff" : "#fff",
    color: active ? "#3b82f6" : "#475569",
    fontWeight: active ? 600 : 400,
    cursor: "pointer", fontSize: 14, fontFamily: "inherit",
  }
}

const tableStyle: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", background: "#fff",
  border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", fontSize: 14,
}

const thStyle: React.CSSProperties = {
  padding: "10px 12px", background: "#f8fafc", fontWeight: 600,
  color: "#475569", textAlign: "center", fontSize: 13,
  borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap",
}

const tdStyle: React.CSSProperties = {
  padding: "9px 12px", textAlign: "right",
}
