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
  .slide-card.has-bg{background-size:cover;background-position:center;}
  .slide-card.has-bg::before{content:'';position:absolute;inset:0;border-radius:20px;background:rgba(245,241,230,0.88);}
  .slide-card.has-bg>*{position:relative;z-index:1;}
  .eyebrow{font-size:11px;letter-spacing:2.5px;color:var(--seal);font-weight:700;margin-bottom:5px;text-transform:uppercase;}
  h1.stitle{font-family:'Frank Ruhl Libre',serif;font-weight:900;font-size:22px;color:var(--ink);margin:0 0 14px;line-height:1.25;border-bottom:2px solid var(--line);padding-bottom:12px;}
  .body-text{font-size:14px;line-height:1.75;color:var(--ink);}
  .seal-stamp{position:absolute;left:16px;bottom:16px;width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#7E2E24,var(--seal) 70%);color:var(--paper);display:flex;align-items:center;justify-content:center;font-family:'Frank Ruhl Libre',serif;font-weight:900;font-size:18px;box-shadow:0 3px 10px rgba(0,0,0,0.25);}
  .poll-opt{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border:1.5px solid var(--ink);border-radius:10px;cursor:pointer;background:#fff;font-weight:600;font-size:14px;margin-bottom:10px;transition:.15s;}
  .poll-opt:hover{background:var(--paper2);}
  .poll-opt.selected{background:var(--ink);color:var(--paper);border-color:var(--ink);}
  .poll-opt.correct{background:rgba(63,107,79,.15);border-color:var(--ok);color:var(--ok);}
  .poll-opt.wrong{background:rgba(162,59,46,.12);border-color:var(--seal);color:var(--seal);}
  .poll-opt.done{cursor:default;}
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
  .enrich-card{background:#fff;border:1px solid var(--line);border-radius:10px;padding:14px;margin-bottom:10px;}
  .rtag{display:inline-block;font-size:10px;font-weight:700;color:#fff;background:var(--seal);border-radius:4px;padding:2px 6px;margin-bottom:5px;}
  .bar-row{margin-bottom:8px;}
  .bar-label{display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:var(--ink);margin-bottom:3px;}
  .bar-bg{height:8px;background:var(--paper2);border-radius:4px;overflow:hidden;}
  .bar-fill{height:100%;border-radius:4px;transition:width .5s ease;}
  .yt-wrap{position:relative;padding-top:56.25%;border-radius:12px;overflow:hidden;margin-bottom:14px;background:#000;}
  .yt-wrap iframe{position:absolute;inset:0;width:100%;height:100%;border:none;}
  .slide-img{width:100%;border-radius:10px;object-fit:cover;margin-bottom:14px;display:block;}
  .ext-link{display:inline-flex;align-items:center;gap:6px;color:var(--seal);font-weight:700;font-size:13px;text-decoration:none;border:1.5px solid var(--seal);border-radius:8px;padding:7px 14px;margin-bottom:14px;}
  .live-agg{margin-top:14px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px 14px;}
  .live-agg-title{font-size:11px;font-weight:700;color:var(--ink);opacity:0.5;letter-spacing:.5px;margin-bottom:8px;}
`

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function imageSizeStyle(size?: string | null): React.CSSProperties {
  const map: Record<string, string> = { small: "50%", medium: "75%", large: "90%", full: "100%" }
  return { width: map[size ?? "full"] ?? "100%" }
}

// Join form
function JoinForm({ code, onJoin }: { code: string; onJoin: (studentId: string) => void }) {
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [joining, setJoining] = useState(false)

  async function join() {
    if (!name.trim()) { setError("נא להזין שם"); return }
    setJoining(true)
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

        <input value={name} onChange={e => setName(e.target.value)} placeholder="שם מלא" dir="rtl"
          style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--line)", fontFamily: "'Heebo'", fontSize: 15, marginBottom: 10, outline: "none" }} />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="מספר טלפון (אופציונלי)" dir="ltr" type="tel"
          style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid var(--line)", fontFamily: "'Heebo'", fontSize: 15, marginBottom: 16, outline: "none" }} />

        {error && <div style={{ color: "var(--seal)", fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <button onClick={join} disabled={joining}
          style={{ width: "100%", background: "var(--seal)", color: "var(--paper)", border: "none", borderRadius: 10, padding: "13px 0", fontFamily: "'Heebo'", fontWeight: 700, fontSize: 15, cursor: joining ? "default" : "pointer" }}>
          {joining ? "מצטרף..." : "כניסה לשיעור"}
        </button>
      </div>
    </div>
  )
}

// Live aggregate bar after student answers
function LiveAgg({ question, sessionId, slideId }: {
  question: SlideQuestion
  sessionId: string
  slideId: string
}) {
  const [agg, setAgg] = useState<Record<string, number>>({})

  async function load() {
    try {
      const r = await fetch(`/api/responses?session_id=${sessionId}&slide_id=${slideId}`)
      if (!r.ok) return
      const rows: { question_id: string; answer: string }[] = await r.json()
      const result: Record<string, number> = {}
      for (const row of rows) {
        if (row.question_id === question.id) {
          result[row.answer] = (result[row.answer] ?? 0) + 1
        }
      }
      setAgg(result)
    } catch {}
  }

  useEffect(() => {
    load()
    let sub: ReturnType<ReturnType<typeof browserClient>["channel"]> | undefined
    try {
      const sb = browserClient()
      sub = sb.channel(`live-agg:${sessionId}:${slideId}:${question.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "responses", filter: `session_id=eq.${sessionId}` }, load)
        .subscribe()
    } catch {}
    return () => { sub?.unsubscribe() }
  }, [])

  const total = Object.values(agg).reduce((s, v) => s + v, 0)

  return (
    <div className="live-agg">
      <div className="live-agg-title">תוצאות חיות</div>
      {question.options.map((opt, oi) => {
        const cnt = agg[String(oi)] ?? 0
        const pct = total ? Math.round((cnt / total) * 100) : 0
        const isCorrect = question.correct_index !== null && oi === question.correct_index
        return (
          <div key={oi} className="bar-row">
            <div className="bar-label">
              <span style={{ color: isCorrect ? "var(--ok)" : "var(--ink)" }}>{opt}{isCorrect ? " ✓" : ""}</span>
              <span style={{ color: "rgba(27,42,74,0.5)" }}>{pct}%</span>
            </div>
            <div className="bar-bg">
              <div className="bar-fill" style={{
                width: `${pct}%`,
                background: isCorrect ? "var(--ok)" : "linear-gradient(90deg,var(--gold),var(--seal))"
              }} />
            </div>
          </div>
        )
      })}
      {total > 0 && <div style={{ fontSize: 11, color: "rgba(27,42,74,0.4)", marginTop: 6 }}>{total} תגובות</div>}
    </div>
  )
}

// Interactive question
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
  const showLiveAgg = done && (type === "poll" || type === "quiz" || type === "feedback")

  async function submit(optIdx: number) {
    if (done || submitting) return
    setSubmitting(true)
    setAnswered(optIdx)
    await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, student_id: studentId, slide_id: slideId, question_id: question.id, answer: String(optIdx) }),
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
        {showLiveAgg && <LiveAgg question={question} sessionId={sessionId} slideId={slideId} />}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {question.text && <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 10, fontSize: 14 }}>{question.text}</div>}
      {question.options.map((opt, oi) => {
        let cls = "poll-opt"
        if (done) {
          cls += " done"
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
      {done && !question.feedback && !showLiveAgg && <div className="feedback-text">תשובתך נרשמה.</div>}
      {showLiveAgg && <LiveAgg question={question} sessionId={sessionId} slideId={slideId} />}
    </div>
  )
}

// Media block (image / youtube / link)
function MediaBlock({ slide }: { slide: Slide }) {
  const ytId = slide.youtube_url
    ? extractYouTubeId(slide.youtube_url)
    : (slide.link_url ? extractYouTubeId(slide.link_url) : null)

  const isTopOrDefault = !slide.image_position || slide.image_position === "top"
  const isBackground = slide.image_position === "background"

  return (
    <>
      {/* Image — top/right/left show inline (background handled by parent) */}
      {slide.image_url && !isBackground && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={slide.image_url} alt="" className="slide-img" style={imageSizeStyle(slide.image_size)} />
      )}

      {/* YouTube embed */}
      {ytId && (
        <div className="yt-wrap">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* External link (only if not a YouTube URL) */}
      {slide.link_url && !ytId && (
        <a href={slide.link_url} target="_blank" rel="noopener noreferrer" className="ext-link">
          🔗 פתח קישור
        </a>
      )}
    </>
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
  const isBackground = slide.image_position === "background"
  const showQuestions = (type === "poll" || type === "quiz" || type === "feedback") && questions?.length
  const imageAtTop = !slide.image_position || slide.image_position === "top"

  const cardStyle: React.CSSProperties = {
    ...(isBackground && slide.image_url ? {
      backgroundImage: `url(${slide.image_url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    } : {})
  }

  return (
    <div
      className={`slide-card${isBackground && slide.image_url ? " has-bg" : ""}`}
      style={cardStyle}
    >
      {/* Image at top (default) */}
      {imageAtTop && <MediaBlock slide={{ ...slide, link_url: null, youtube_url: null }} />}

      <div className="eyebrow">{eyebrow || type}</div>
      <h1 className="stitle">{title}</h1>
      {body && <p className="body-text">{body}</p>}

      {/* YouTube + link (always after title/body) */}
      <MediaBlock slide={{ ...slide, image_url: null }} />

      {/* Image at non-top positions */}
      {!imageAtTop && slide.image_url && !isBackground && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={slide.image_url} alt="" className="slide-img" style={imageSizeStyle(slide.image_size)} />
      )}

      {/* Poll / Quiz / Feedback — interactive + live results */}
      {showQuestions && questions!.map(q => (
        <QuestionBlock key={q.id} question={q} sessionId={sessionId} slideId={slide.id} studentId={studentId} type={type} />
      ))}

      {/* Definitions — flip cards */}
      {type === "definitions" && questions?.map((q, i) => (
        <div key={q.id} className={`flip-card ${flipped.has(i) ? "flipped" : ""}`} onClick={() => toggleFlip(i)}>
          <div className="flip-inner">
            <div className="flip-face flip-front">{q.text}</div>
            <div className="flip-face flip-back">{q.feedback ?? q.options[0]}</div>
          </div>
        </div>
      ))}

      {/* Homework */}
      {type === "homework" && questions?.map((q, i) => (
        <div key={q.id} className="task-item">
          <div className="task-num">{i + 1}</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink)" }}>{q.text}</div>
        </div>
      ))}

      {/* Enrichment */}
      {type === "enrichment" && questions?.map(q => (
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

  const [phase, setPhase] = useState<"joining" | "live" | "not-found">("joining")
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

  function subscribeRealtime(rc: string) {
    try {
      const sb = browserClient()
      sb.channel(`session:${rc}`)
        .on("broadcast", { event: "slide_change" }, ({ payload }) => {
          if (typeof payload?.index === "number") setCurrentIdx(payload.index)
        })
        .subscribe()
    } catch {}
  }

  if (phase === "joining") return <JoinForm code={code} onJoin={onJoin} />

  if (phase === "not-found") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--ink)", direction: "rtl" }}>
      <style>{FONT + CSS}</style>
      <div style={{ background: "var(--paper)", borderRadius: 20, padding: "32px 28px", textAlign: "center", maxWidth: 320 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <h2 style={{ fontFamily: "'Frank Ruhl Libre',serif", color: "var(--ink)", marginBottom: 8 }}>Session לא נמצא</h2>
        <p style={{ color: "rgba(27,42,74,0.6)", fontSize: 14 }}>בדקו שהקוד {code} נכון, או שהמורה טרם פתח/ה את השיעור.</p>
      </div>
    </div>
  )

  if (!sessionData || !slide) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--ink)" }}>
      <style>{FONT + CSS}</style>
      <div style={{ color: "rgba(245,241,230,0.5)", fontFamily: "'Heebo',sans-serif", fontSize: 16 }}>ממתין לשיעור להתחיל...</div>
    </div>
  )

  return (
    <div className="app" dir="rtl">
      <style>{FONT + CSS}</style>

      <div className="topbar">
        <div style={{ color: "var(--paper)", fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 700, fontSize: 14, opacity: 0.85 }}>
          {sessionData.lesson.title}
        </div>
        <div className="code-badge">🔴 {code}</div>
      </div>

      <StudentSlide slide={slide} sessionId={sessionData.session.id} studentId={studentId} />

      {/* Progress dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 5, padding: "10px 0 16px", flexShrink: 0 }}>
        {sessionData.lesson.slides.map((_, i) => (
          <div key={i} style={{
            width: i === currentIdx ? 20 : 6, height: 6, borderRadius: 3,
            background: i === currentIdx ? "var(--gold)" : i < currentIdx ? "rgba(245,241,230,0.35)" : "rgba(245,241,230,0.15)",
            transition: "all .3s ease"
          }} />
        ))}
      </div>
    </div>
  )
}
