"use client"
import { useEffect, useState, use } from "react"
import { browserClient } from "@/lib/lessons/supabase"
import type { Lesson, Slide, LiveSession, SlideQuestion } from "@/lib/lessons/types"

interface Props { params: Promise<{ roomCode: string }> }

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700;900&family=Heebo:wght@300;400;500;700;900&display=swap');`

const CSS = `
  :root{--ink:#1B2A4A;--paper:#F5F1E6;--paper2:#ECE5D3;--seal:#A23B2E;--gold:#B08D3F;--ok:#3F6B4F;--line:rgba(27,42,74,0.14);}
  *{box-sizing:border-box;}
  body{margin:0;background:var(--ink);}
  .app{min-height:100vh;display:flex;flex-direction:column;background:var(--ink);}
  .topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid rgba(176,141,63,0.25);flex-shrink:0;}
  .code-badge{color:var(--gold);font-family:'Frank Ruhl Libre',serif;font-weight:700;font-size:15px;letter-spacing:2px;}
  .slide-card{background:var(--paper);border-radius:20px;margin:12px;flex:1;padding:28px 24px 90px;overflow-y:auto;position:relative;}
  .eyebrow{font-size:11px;letter-spacing:2.5px;color:var(--seal);font-weight:700;margin-bottom:5px;text-transform:uppercase;}
  h1.stitle{font-family:'Frank Ruhl Libre',serif;font-weight:900;font-size:22px;color:var(--ink);margin:0 0 14px;line-height:1.25;border-bottom:2px solid var(--line);padding-bottom:12px;}
  .body-text{font-size:14px;line-height:1.75;color:var(--ink);}
  .seal-stamp{position:absolute;left:16px;bottom:16px;width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#7E2E24,var(--seal) 70%);color:var(--paper);display:flex;align-items:center;justify-content:center;font-family:'Frank Ruhl Libre',serif;font-weight:900;font-size:18px;box-shadow:0 3px 10px rgba(0,0,0,0.25);}
  .poll-opt{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border:1.5px solid var(--ink);border-radius:10px;cursor:pointer;background:#fff;font-weight:600;font-size:14px;margin-bottom:10px;transition:.15s;}
  .poll-opt:hover{background:var(--paper2);}
  .poll-opt.selected{background:var(--ink);color:var(--paper);border-color:var(--ink);}
  .poll-opt.correct{background:rgba(63,107,79,.15);border-color:var(--ok);color:var(--ok);}
  .poll-opt.wrong{background:rgba(162,59,46,.12);border-color:var(--seal);color:var(--seal);}
  .feedback-text{margin-top:8px;font-size:13px;color:#555;padding:8px 12px;background:rgba(63,107,79,.08);border-radius:7px;}
  .flip-card{height:100px;border-radius:10px;cursor:pointer;perspective:1000px;margin-bottom:10px;}
  .flip-inner{position:relative;width:100%;height:100%;transition:transform .4s;transform-style:preserve-3d;}
  .flip-card.flipped .flip-inner{transform:rotateY(180deg);}
  .flip-face{position:absolute;inset:0;backface-visibility:hidden;border-radius:10px;display:flex;align-items:center;justify-content:center;padding:12px;text-align:center;}
  .flip-front{background:var(--ink);color:var(--paper);font-family:'Frank Ruhl Libre',serif;font-weight:700;font-size:14px;}
  .flip-back{background:var(--gold);color:var(--ink);transform:rotateY(180deg);font-size:12px;line-height:1.5;font-weight:600;}
  .task-item{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line);}
  .task-num{width:24px;height:24px;border-radius:50%;background:var(--seal);color:var(--paper);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;}
  .star-row{display:flex;gap:8px;margin-top:8px;}
  .star-btn{width:38px;height:38px;border-radius:50%;border:1.5px solid var(--line);background:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s;}
  .star-btn.selected{background:var(--gold);border-color:var(--gold);}
  .submit-btn{position:absolute;bottom:72px;left:50%;transform:translateX(-50%);background:var(--seal);color:var(--paper);border:none;border-radius:10px;padding:12px 32px;font-family:'Heebo';font-weight:700;font-size:15px;cursor:pointer;box-shadow:0 4px 12px rgba(162,59,46,.3);}
  .enrich-card{background:#fff;border:1px solid var(--line);border-radius:10px;padding:14px;margin-bottom:10px;}
  .rtag{display:inline-block;font-size:10px;font-weight:700;color:#fff;background:var(--seal);border-radius:4px;padding:2px 6px;margin-bottom:5px;}
`

// Join form when no session found
function JoinForm({ code, onJoin }: { code: string; onJoin: (studentId: string) => void }) {
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [joining, setJoining] = useState(false)

  async function join() {
    if (!name.trim()) { setError("נא להזין שם"); return }
    setJoining(true)
    // Use phone+name as ad-hoc student identifier (no full auth for now)
    const studentId = phone.trim() || `anon:${name.trim()}`
    onJoin(studentId)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--ink)", padding: 24, direction: "rtl" }}>
      <style>{FONT + CSS}</style>
      <div style={{ background: "var(--paper)", borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 360, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
        <div style={{ fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 900, color: "var(--ink)", fontSize: 22, marginBottom: 6 }}>הצטרפות לשיעור</div>
        <div style={{ color: "var(--gold)", fontWeight: 700, fontSize: 18, letterSpacing: 2, marginBottom: 24 }}>{code.toUpperCase()}</div>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="שם מלא"
          dir="rtl"
          style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--line)", fontFamily: "'Heebo'", fontSize: 15, marginBottom: 10, outline: "none" }}
        />
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="מספר טלפון (אופציונלי)"
          dir="ltr"
          type="tel"
          style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--line)", fontFamily: "'Heebo'", fontSize: 15, marginBottom: 16, outline: "none" }}
        />

        {error && <div style={{ color: "var(--seal)", fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <button onClick={join} disabled={joining}
          style={{ width: "100%", background: "var(--seal)", color: "var(--paper)", border: "none", borderRadius: 10, padding: "13px 0", fontFamily: "'Heebo'", fontWeight: 700, fontSize: 15, cursor: joining ? "default" : "pointer" }}>
          {joining ? "מצטרף..." : "כניסה לשיעור"}
        </button>
      </div>
    </div>
  )
}

// Interactive question component
function QuestionBlock({ question, sessionId, slideId, studentId, type }: {
  question: SlideQuestion
  sessionId: string
  slideId: string
  studentId: string
  type: string
}) {
  const [answered, setAnswered] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [starPick, setStarPick] = useState<number | null>(null)

  const isFeedback = type === "feedback"
  const isQuiz = type === "quiz"

  async function submit(optIdx: number) {
    if (done || submitting) return
    setSubmitting(true)
    setAnswered(optIdx)
    await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        student_id: studentId,
        slide_id: slideId,
        question_id: question.id,
        answer: String(optIdx),
      }),
    })
    setDone(true)
    setSubmitting(false)
  }

  if (isFeedback) {
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>{question.text}</div>
        <div className="star-row">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} className={`star-btn${starPick === s ? " selected" : ""}`} onClick={() => { setStarPick(s); submit(s - 1) }}>
              {s <= (starPick ?? 0) ? "⭐" : "☆"}
            </button>
          ))}
        </div>
        {done && <div className="feedback-text">תודה! תשובתך נרשמה.</div>}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {question.text && <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 10, fontSize: 14 }}>{question.text}</div>}
      {question.options.map((opt, oi) => {
        let cls = "poll-opt"
        if (done) {
          if (isQuiz && oi === question.correct_index) cls += " correct"
          else if (oi === answered) cls += (isQuiz ? " wrong" : " selected")
        } else if (oi === answered) cls += " selected"
        return (
          <div key={oi} className={cls} onClick={() => !done && submit(oi)}>
            <span>{opt}</span>
            {done && isQuiz && oi === question.correct_index && <span>✓</span>}
          </div>
        )
      })}
      {done && question.feedback && <div className="feedback-text">{question.feedback}</div>}
      {done && !question.feedback && <div className="feedback-text">תשובתך נרשמה.</div>}
    </div>
  )
}

function StudentSlide({ slide, sessionId, studentId }: {
  slide: Slide
  sessionId: string
  studentId: string
}) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set())

  function toggleFlip(i: number) {
    setFlipped(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })
  }

  const { type, eyebrow, title, body, questions } = slide

  const showQuestions = (type === "poll" || type === "quiz" || type === "feedback") && questions?.length

  return (
    <div className="slide-card">
      <div className="eyebrow">{eyebrow || type}</div>
      <h1 className="stitle">{title}</h1>
      {body && <p className="body-text">{body}</p>}

      {/* Poll / Quiz / Feedback — interactive */}
      {showQuestions && questions!.map(q => (
        <QuestionBlock
          key={q.id}
          question={q}
          sessionId={sessionId}
          slideId={slide.id}
          studentId={studentId}
          type={type}
        />
      ))}

      {/* Definitions — flip cards */}
      {type === "definitions" && questions && questions.map((q, i) => (
        <div key={q.id} className={`flip-card ${flipped.has(i) ? "flipped" : ""}`} onClick={() => toggleFlip(i)}>
          <div className="flip-inner">
            <div className="flip-face flip-front">{q.text}</div>
            <div className="flip-face flip-back">{q.feedback ?? q.options[0]}</div>
          </div>
        </div>
      ))}

      {/* Homework */}
      {type === "homework" && questions && questions.map((q, i) => (
        <div key={q.id} className="task-item">
          <div className="task-num">{i + 1}</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink)" }}>{q.text}</div>
        </div>
      ))}

      {/* Enrichment */}
      {type === "enrichment" && questions && questions.map(q => (
        <div key={q.id} className="enrich-card">
          <span className="rtag">{q.feedback ?? "העשרה"}</span>
          <div style={{ fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 700, color: "var(--ink)", fontSize: 15, marginBottom: 4 }}>{q.text}</div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: "#4a4a45" }}>{q.options[0] ?? ""}</div>
        </div>
      ))}

      {/* Intro chips */}
      {type === "intro" && questions && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {questions.map((q, i) => (
            <div key={q.id} style={{ flex: "1 1 130px", background: "var(--paper2)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
              <span style={{ fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 900, color: "var(--seal)", fontSize: 18, display: "block" }}>{i + 1}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{q.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="seal-stamp">{slide.order ?? "•"}</div>
    </div>
  )
}

export default function LivePage({ params }: Props) {
  const { roomCode } = use(params)
  const code = roomCode.toUpperCase()

  const [phase, setPhase] = useState<"joining" | "waiting" | "live" | "ended" | "not-found">("joining")
  const [studentId, setStudentId] = useState("")
  const [sessionData, setSessionData] = useState<{ session: LiveSession; lesson: Lesson } | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)

  const slide = sessionData?.lesson.slides[currentIdx]

  async function fetchSession() {
    const r = await fetch(`/api/sessions/${code}`)
    if (!r.ok) { setPhase("not-found"); return null }
    const d = await r.json()
    return { session: d as LiveSession, lesson: d.lesson as Lesson }
  }

  async function onJoin(sid: string) {
    setStudentId(sid)
    const data = await fetchSession()
    if (!data) return
    setSessionData(data)
    setCurrentIdx(data.session.current_slide_index)
    setPhase("live")
    subscribeRealtime(data.session.room_code)
  }

  function subscribeRealtime(roomCode: string) {
    try {
      const sb = browserClient()
      sb.channel(`session:${roomCode}`)
        .on("broadcast", { event: "slide_change" }, ({ payload }) => {
          if (typeof payload?.index === "number") setCurrentIdx(payload.index)
        })
        .subscribe()
    } catch {}
  }

  if (phase === "joining") {
    return <JoinForm code={code} onJoin={onJoin} />
  }

  if (phase === "not-found") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--ink)", direction: "rtl" }}>
        <style>{FONT + CSS}</style>
        <div style={{ background: "var(--paper)", borderRadius: 20, padding: "32px 28px", textAlign: "center", maxWidth: 320 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <h2 style={{ fontFamily: "'Frank Ruhl Libre',serif", color: "var(--ink)", marginBottom: 8 }}>Session לא נמצא</h2>
          <p style={{ color: "rgba(27,42,74,0.6)", fontSize: 14 }}>בדקו שהקוד {code} נכון, או שהמורה טרם פתח/ה את השיעור.</p>
        </div>
      </div>
    )
  }

  if (!sessionData || !slide) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--ink)" }}>
        <style>{FONT + CSS}</style>
        <div style={{ color: "rgba(245,241,230,0.5)", fontFamily: "'Heebo',sans-serif", fontSize: 16 }}>ממתין לשיעור להתחיל...</div>
      </div>
    )
  }

  return (
    <div className="app" dir="rtl">
      <style>{FONT + CSS}</style>

      <div className="topbar">
        <div style={{ color: "var(--paper)", fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 700, fontSize: 14, opacity: 0.85 }}>
          {sessionData.lesson.title}
        </div>
        <div className="code-badge">🔴 {code}</div>
      </div>

      <StudentSlide
        slide={slide}
        sessionId={sessionData.session.id}
        studentId={studentId}
      />

      {/* Slide progress dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 5, padding: "10px 0 16px", flexShrink: 0 }}>
        {sessionData.lesson.slides.map((_, i) => (
          <div key={i} style={{
            width: i === currentIdx ? 20 : 6, height: 6,
            borderRadius: 3,
            background: i === currentIdx ? "var(--gold)" : i < currentIdx ? "rgba(245,241,230,0.35)" : "rgba(245,241,230,0.15)",
            transition: "all .3s ease"
          }} />
        ))}
      </div>
    </div>
  )
}
