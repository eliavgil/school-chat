"use client"
import { useEffect, useState, useMemo } from "react"

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
  sessions: { sessionId: string; lessonTitle: string; score: number | null; correct: number; total: number }[]
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

function cellBg(answer: string | undefined, q: Question): string {
  if (answer === undefined) return "transparent"
  if (q.correctIndex === null) return "#dbeafe" // poll — blue
  const correct = answer === String(q.correctIndex)
  return correct ? "#dcfce7" : "#fee2e2"
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })
}

/* ── Main page ──────────────────────────────────────────── */
export default function ResultsPage() {
  const [data, setData] = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<string | "all">("all")
  const [view, setView] = useState<"session" | "averages">("session")
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  useEffect(() => {
    const url = selectedClass === "all" ? "/api/results" : `/api/results?class_id=${selectedClass}`
    setLoading(true)
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setData(d)
        if (!selectedSession && d.sessions.length > 0) setSelectedSession(d.sessions[0].id)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedClass]) // eslint-disable-line react-hooks/exhaustive-deps

  const session = useMemo(
    () => data?.sessions.find(s => s.id === selectedSession) ?? null,
    [data, selectedSession]
  )

  const allQuestions = useMemo(
    () => session?.slidesWithQuestions.flatMap(sg => sg.questions.map(q => ({ ...q, slideId: sg.slideId, slideTitle: sg.slideTitle, slideType: sg.slideType }))) ?? [],
    [session]
  )

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif", padding: "0" }}>
      {/* Header */}
      <div style={{ background: "#1e293b", color: "#fff", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <a href="/lessons" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 14 }}>← שיעורים</a>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>תוצאות תלמידים</h1>
      </div>

      <div style={{ padding: "20px 24px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Class filter */}
        {data && data.classes.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => setSelectedClass("all")} style={chipStyle(selectedClass === "all")}>כל הכיתות</button>
            {data.classes.map(c => (
              <button key={c.id} onClick={() => setSelectedClass(c.id)} style={chipStyle(selectedClass === c.id)}>{c.name}</button>
            ))}
          </div>
        )}

        {/* View tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #e2e8f0" }}>
          {(["session", "averages"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "10px 20px", background: "none", border: "none", cursor: "pointer",
              fontWeight: view === v ? 700 : 400, color: view === v ? "#3b82f6" : "#64748b",
              borderBottom: view === v ? "2px solid #3b82f6" : "2px solid transparent",
              marginBottom: -2, fontSize: 15, fontFamily: "inherit",
            }}>
              {v === "session" ? "לפי שיעור" : "ממוצעי תלמידים"}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: "#64748b" }}>טוען נתונים...</p>}
        {error && <p style={{ color: "#dc2626" }}>שגיאה: {error}</p>}

        {data && !loading && view === "session" && <SessionView data={data} session={session} selectedSession={selectedSession} setSelectedSession={setSelectedSession} allQuestions={allQuestions} />}
        {data && !loading && view === "averages" && <AveragesView data={data} />}
      </div>
    </div>
  )
}

/* ── Session view ───────────────────────────────────────── */
function SessionView({ data, session, selectedSession, setSelectedSession, allQuestions }: {
  data: ApiData
  session: Session | null
  selectedSession: string | null
  setSelectedSession: (id: string) => void
  allQuestions: (Question & { slideId: string; slideTitle: string; slideType: string })[]
}) {
  if (data.sessions.length === 0) {
    return <p style={{ color: "#64748b" }}>לא נמצאו שיעורים עם תוצאות.</p>
  }

  const quizQs = allQuestions.filter(q => q.correctIndex !== null)
  const pollQs = allQuestions.filter(q => q.correctIndex === null)

  return (
    <div>
      {/* Session selector */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: "#64748b", display: "block", marginBottom: 6 }}>בחר שיעור:</label>
        <select
          value={selectedSession ?? ""}
          onChange={e => setSelectedSession(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 15, fontFamily: "inherit", background: "#fff", cursor: "pointer" }}
        >
          {data.sessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.lessonTitle} — {formatDate(s.createdAt)} ({s.roomCode})
            </option>
          ))}
        </select>
      </div>

      {!session && <p style={{ color: "#64748b" }}>בחר שיעור לצפייה בתוצאות.</p>}

      {session && (
        <>
          {/* Session summary cards */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <StatCard label="תלמידים שהשתתפו" value={String(session.studentResults.length)} />
            <StatCard label="שאלות בוחן" value={String(quizQs.length)} />
            <StatCard label="שאלות עירנות (סקרים)" value={String(pollQs.length)} />
            {quizQs.length > 0 && session.studentResults.length > 0 && (
              <StatCard
                label="ממוצע כיתה"
                value={pct(session.studentResults.filter(r => r.quizTotal > 0).reduce((s, r) => s + (r.quizScore ?? 0), 0) / Math.max(1, session.studentResults.filter(r => r.quizTotal > 0).length))}
                color={scoreColor(session.studentResults.filter(r => r.quizTotal > 0).reduce((s, r) => s + (r.quizScore ?? 0), 0) / Math.max(1, session.studentResults.filter(r => r.quizTotal > 0).length))}
              />
            )}
          </div>

          {/* Quiz results table */}
          {quizQs.length > 0 && (
            <Section title="תוצאות בוחן">
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, minWidth: 140, textAlign: "right" }}>תלמיד/ה</th>
                      {quizQs.map((q, i) => (
                        <th key={q.id} style={{ ...thStyle, minWidth: 60, maxWidth: 80, fontSize: 12 }} title={q.text}>
                          ש{i + 1}
                          <div style={{ fontSize: 10, fontWeight: 400, color: "#94a3b8", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 70 }}>{q.slideTitle}</div>
                        </th>
                      ))}
                      <th style={{ ...thStyle, minWidth: 80 }}>ציון</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.studentResults
                      .filter(r => r.quizTotal > 0)
                      .sort((a, b) => (b.quizScore ?? 0) - (a.quizScore ?? 0))
                      .map(r => (
                        <tr key={r.studentId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{r.studentName}</td>
                          {quizQs.map(q => {
                            const key = `${q.slideId}__${q.id}`
                            const ans = r.answers[key]
                            const bg = cellBg(ans, q)
                            const isCorrect = ans !== undefined && ans === String(q.correctIndex)
                            return (
                              <td key={q.id} style={{ ...tdStyle, background: bg, textAlign: "center", fontSize: 16 }} title={ans !== undefined ? q.options[parseInt(ans)] ?? ans : "לא ענה"}>
                                {ans === undefined ? <span style={{ color: "#cbd5e1" }}>—</span> : isCorrect ? "✓" : "✗"}
                              </td>
                            )
                          })}
                          <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: scoreColor(r.quizScore) }}>
                            {r.quizTotal > 0 ? `${r.quizCorrect}/${r.quizTotal}` : "—"}
                          </td>
                        </tr>
                      ))}
                    {/* Column totals */}
                    {session.studentResults.filter(r => r.quizTotal > 0).length > 0 && (
                      <tr style={{ background: "#f8fafc", fontWeight: 600, borderTop: "2px solid #e2e8f0" }}>
                        <td style={{ ...tdStyle, color: "#64748b", fontSize: 13 }}>% הצליחו</td>
                        {quizQs.map(q => {
                          const key = `${q.slideId}__${q.id}`
                          const answered = session.studentResults.filter(r => r.answers[key] !== undefined)
                          const correct = answered.filter(r => r.answers[key] === String(q.correctIndex))
                          const rate = answered.length > 0 ? correct.length / answered.length : null
                          return (
                            <td key={q.id} style={{ ...tdStyle, textAlign: "center", color: scoreColor(rate), fontSize: 13 }}>
                              {rate !== null ? pct(rate) : "—"}
                            </td>
                          )
                        })}
                        <td style={tdStyle} />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Question legend */}
              <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
                {quizQs.map((q, i) => (
                  <div key={q.id} style={{ fontSize: 12, color: "#64748b" }}>
                    <strong>ש{i + 1}:</strong> {q.text}
                    <div style={{ color: "#16a34a", marginTop: 2 }}>✓ {q.options[q.correctIndex!]}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Poll results table */}
          {pollQs.length > 0 && (
            <Section title="שאלות עירנות / סקרים">
              {pollQs.map(q => {
                const key = `${q.slideId}__${q.id}`
                const counts: Record<string, number> = {}
                for (const r of session.studentResults) {
                  const a = r.answers[key]
                  if (a !== undefined) counts[a] = (counts[a] ?? 0) + 1
                }
                const total = Object.values(counts).reduce((s, v) => s + v, 0)
                return (
                  <div key={q.id} style={{ marginBottom: 20, background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "16px 20px" }}>
                    <div style={{ fontWeight: 600, marginBottom: 12, color: "#1e293b" }}>{q.text}</div>
                    <div style={{ color: "#64748b", fontSize: 12, marginBottom: 10 }}>{q.slideTitle}</div>
                    {q.options.map((opt, idx) => {
                      const count = counts[String(idx)] ?? 0
                      const rate = total > 0 ? count / total : 0
                      return (
                        <div key={idx} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                            <span>{opt}</span>
                            <span style={{ color: "#64748b" }}>{count} ({pct(rate)})</span>
                          </div>
                          <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${rate * 100}%`, background: "#3b82f6", borderRadius: 4, transition: "width .3s" }} />
                          </div>
                        </div>
                      )
                    })}
                    {total === 0 && <div style={{ color: "#94a3b8", fontSize: 13 }}>אין תשובות עדיין</div>}
                  </div>
                )
              })}
            </Section>
          )}
        </>
      )}
    </div>
  )
}

/* ── Averages view ──────────────────────────────────────── */
function AveragesView({ data }: { data: ApiData }) {
  const scoredSessions = data.sessions.filter(s => s.slidesWithQuestions.some(sg => sg.questions.some(q => q.correctIndex !== null)))

  if (data.studentAverages.length === 0) {
    return <p style={{ color: "#64748b" }}>אין נתוני תלמידים להצגה.</p>
  }

  const sorted = [...data.studentAverages].sort((a, b) => (b.averageScore ?? -1) - (a.averageScore ?? -1))

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, minWidth: 140, textAlign: "right" }}>תלמיד/ה</th>
              <th style={{ ...thStyle, minWidth: 100 }}>כיתה</th>
              {scoredSessions.map(s => (
                <th key={s.id} style={{ ...thStyle, minWidth: 90, fontSize: 12 }}>
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }} title={s.lessonTitle}>
                    {s.lessonTitle.replace(/^שיעור \d+: /, "")}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 400, color: "#94a3b8", marginTop: 2 }}>{formatDate(s.createdAt)}</div>
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
                {scoredSessions.map(s => {
                  const ss = student.sessions.find(x => x.sessionId === s.id)
                  return (
                    <td key={s.id} style={{ ...tdStyle, textAlign: "center" }}>
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
                  {student.sessionsParticipated}/{data.sessions.length}
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
