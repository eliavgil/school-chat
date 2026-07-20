"use client"
import React, { useEffect, useState, useCallback, use } from "react"
import { browserClient } from "@/lib/lessons/supabase"
import type { Lesson, Slide, LiveSession } from "@/lib/lessons/types"

interface Props { params: Promise<{ id: string }> }

interface AggResult { [questionId: string]: { [answer: string]: number } }

const SLIDE_FONT = `@import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700;900&family=Heebo:wght@300;400;500;700;900&display=swap');`

const CSS = `
  :root{--ink:#1B2A4A;--paper:#F5F1E6;--paper2:#ECE5D3;--seal:#A23B2E;--gold:#B08D3F;--ok:#3F6B4F;--line:rgba(27,42,74,0.14);}
  body{margin:0;overflow:hidden;}
  .topbar{display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:var(--ink);border-bottom:1px solid rgba(176,141,63,0.3);flex-shrink:0;}
  .stage{flex:1;background:var(--paper);position:relative;overflow:hidden;border-radius:16px 16px 0 0;margin:0 8px;}
  .slide-inner{position:absolute;inset:0;padding:40px 64px 90px 64px;overflow-y:auto;}
  .eyebrow{font-size:12px;letter-spacing:2.5px;color:var(--seal);font-weight:700;margin-bottom:6px;text-transform:uppercase;}
  h1.stitle{font-family:'Frank Ruhl Libre',serif;font-weight:900;font-size:clamp(24px,3vw,38px);color:var(--ink);margin:0 0 18px;line-height:1.2;border-bottom:2px solid var(--line);padding-bottom:14px;}
  .lead{font-size:16px;line-height:1.85;color:var(--ink);}
  .seal-stamp{position:absolute;left:28px;bottom:28px;width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#7E2E24,var(--seal) 70%);color:var(--paper);display:flex;align-items:center;justify-content:center;font-family:'Frank Ruhl Libre',serif;font-weight:900;font-size:22px;box-shadow:0 4px 14px rgba(0,0,0,0.25),inset 0 0 0 2px rgba(245,241,230,0.35);z-index:5;}
  .navbtns{position:absolute;bottom:24px;right:28px;display:flex;gap:10px;z-index:6;}
  .navbtn{width:46px;height:46px;border-radius:50%;border:1.5px solid var(--ink);background:var(--paper);color:var(--ink);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;}
  .navbtn:hover{background:var(--ink);color:var(--paper);}
  .navbtn:disabled{opacity:0.2;cursor:default;}
  .navbtn:disabled:hover{background:var(--paper);color:var(--ink);}
  .doodle{width:48px;height:48px;border:2px dashed var(--seal);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:10px;background:#fff;}
  .doodle svg{width:24px;height:24px;stroke:var(--seal);fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:16px;}
  .card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 18px;}
  .card h3{font-family:'Frank Ruhl Libre',serif;color:var(--ink);margin:0 0 6px;font-size:16px;}
  .card p{margin:0;font-size:14px;line-height:1.6;color:#4a4a45;}
  .qbox{margin-top:20px;background:var(--ink);color:var(--paper);border-radius:12px;padding:18px 22px;font-family:'Frank Ruhl Libre',serif;font-size:17px;}
  .bar-row{margin-bottom:10px;}
  .bar-label{display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;color:var(--ink);font-weight:600;}
  .bar-bg{height:12px;background:var(--paper2);border-radius:6px;overflow:hidden;}
  .bar-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--seal));border-radius:6px;transition:width .5s ease;}
  .flip-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:16px;}
  .flip-card{height:110px;border-radius:10px;cursor:pointer;perspective:1000px;}
  .flip-inner{position:relative;width:100%;height:100%;transition:transform .5s;transform-style:preserve-3d;}
  .flip-card.flipped .flip-inner{transform:rotateY(180deg);}
  .flip-face{position:absolute;inset:0;backface-visibility:hidden;border-radius:10px;display:flex;align-items:center;justify-content:center;padding:12px;text-align:center;}
  .flip-front{background:var(--ink);color:var(--paper);font-family:'Frank Ruhl Libre',serif;font-weight:700;font-size:15px;}
  .flip-back{background:var(--gold);color:var(--ink);transform:rotateY(180deg);font-size:12px;line-height:1.5;font-weight:600;}
  .qz{margin-bottom:12px;padding:14px 16px;background:#fff;border:1px solid var(--line);border-radius:10px;}
  .qz .qtext{font-weight:700;color:var(--ink);margin-bottom:8px;font-size:14px;}
  .qz .opts{display:flex;flex-direction:column;gap:7px;}
  .qz .opt{padding:8px 12px;border:1.5px solid var(--line);border-radius:7px;font-size:13px;}
  .qz .opt.correct{background:rgba(63,107,79,.15);border-color:var(--ok);color:var(--ok);font-weight:700;}
  .task-item{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line);}
  .task-num{width:26px;height:26px;border-radius:50%;background:var(--seal);color:var(--paper);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;}
  .enrich-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:16px;}
  .rtag{display:inline-block;font-size:10px;font-weight:700;color:#fff;background:var(--seal);border-radius:5px;padding:2px 7px;margin-bottom:6px;}
  .reveal-box{margin-top:14px;background:var(--paper2);border-radius:10px;overflow:hidden;max-height:0;transition:max-height .4s ease;}
  .reveal-box.open{max-height:400px;}
  .reveal-inner{padding:16px 18px;}
  .conditions-strip{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;}
  .cond-chip{flex:1;min-width:140px;background:var(--paper2);border:1px solid var(--line);border-radius:10px;padding:12px 10px;text-align:center;}
  .cond-chip .n{font-family:'Frank Ruhl Libre',serif;font-weight:900;color:var(--seal);font-size:20px;display:block;margin-bottom:3px;}
  .cond-chip .t{font-size:13px;font-weight:700;color:var(--ink);}
`

function DoodleIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactElement> = {
    intro: <svg viewBox="0 0 24 24"><path d="M12 2l2.5 6.5L21 9l-5 4.5 1.5 7L12 17l-5.5 3.5 1.5-7L3 9l6.5-.5z"/></svg>,
    poll: <svg viewBox="0 0 24 24"><path d="M12 3v10M8 8l4-4 4 4"/><path d="M5 15c0 3 3 6 7 6s7-3 7-6"/></svg>,
    quiz: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>,
    definitions: <svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="16" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>,
    matching: <svg viewBox="0 0 24 24"><path d="M9 3h4v4h4v4h-4a2 2 0 100 4h4v4h-4v-4a2 2 0 10-4 0v4H5v-4h4a2 2 0 100-4H5V7h4z"/></svg>,
    reveal: <svg viewBox="0 0 24 24"><path d="M4 20l4-1 10-10-3-3L5 16z"/><path d="M14 7l3 3"/></svg>,
    enrichment: <svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3 11c1 .7 1 1.5 1 2h4c0-.5 0-1.3 1-2a6 6 0 00-3-11z"/></svg>,
    homework: <svg viewBox="0 0 24 24"><path d="M7 8V6a5 5 0 0110 0v2"/><rect x="4" y="8" width="16" height="12" rx="2"/></svg>,
    feedback: <svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/><path d="M9 10h6M9 13h4"/></svg>,
  }
  return <div className="doodle">{icons[type] ?? icons.intro}</div>
}

function SlideView({ slide, agg, revealOpen, setRevealOpen }: {
  slide: Slide
  agg: AggResult
  revealOpen: boolean
  setRevealOpen: (v: boolean) => void
}) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set())

  function toggleFlip(i: number) {
    setFlipped(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })
  }

  const { type, eyebrow, title, body, questions } = slide

  return (
    <div className="slide-inner">
      <DoodleIcon type={type} />
      <div className="eyebrow">{eyebrow || type}</div>
      <h1 className="stitle">{title}</h1>

      {body && <p className="lead">{body}</p>}

      {/* POLL / QUIZ — bar chart results */}
      {(type === "poll" || type === "quiz") && questions && questions.map(q => {
        const qAgg = agg[q.id] ?? {}
        const total = Object.values(qAgg).reduce((s, v) => s + v, 0)
        return (
          <div key={q.id} style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>{q.text}</div>
            <div style={{ maxWidth: 560 }}>
              {q.options.map((opt, oi) => {
                const cnt = qAgg[String(oi)] ?? 0
                const pct = total ? Math.round((cnt / total) * 100) : 0
                const isCorrect = q.correct_index !== null && oi === q.correct_index
                return (
                  <div key={oi} className="bar-row">
                    <div className="bar-label">
                      <span style={{ color: isCorrect ? "var(--ok)" : undefined }}>{opt}{isCorrect ? " ✓" : ""}</span>
                      <span>{cnt > 0 ? `${cnt} (${pct}%)` : "0"}</span>
                    </div>
                    <div className="bar-bg"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                )
              })}
              {total > 0 && <div style={{ fontSize: 12, color: "rgba(27,42,74,0.45)", marginTop: 4 }}>{total} תגובות</div>}
            </div>
          </div>
        )
      })}

      {/* DEFINITIONS — flip cards */}
      {type === "definitions" && questions && (
        <div className="flip-grid">
          {questions.map((q, i) => (
            <div key={q.id} className={`flip-card ${flipped.has(i) ? "flipped" : ""}`} onClick={() => toggleFlip(i)}>
              <div className="flip-inner">
                <div className="flip-face flip-front">{q.text}</div>
                <div className="flip-face flip-back">{q.feedback ?? q.options[0]}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MATCHING — static view for teacher */}
      {type === "matching" && questions && (
        <div className="grid2" style={{ marginTop: 16 }}>
          {questions.map(q => (
            <div key={q.id} className="card">
              <h3>{q.text}</h3>
              <p style={{ color: "var(--ok)", fontWeight: 600 }}>{q.options[q.correct_index ?? 0]}</p>
            </div>
          ))}
        </div>
      )}

      {/* REVEAL — hidden answer */}
      {type === "reveal" && questions && (
        <>
          <button
            onClick={() => setRevealOpen(!revealOpen)}
            style={{ background: "var(--ink)", color: "var(--paper)", border: "none", borderRadius: 8, padding: "10px 20px", fontFamily: "'Heebo'", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 12 }}>
            {revealOpen ? "הסתר תשובת מודל" : "הצג תשובת מודל"}
          </button>
          <div className={`reveal-box ${revealOpen ? "open" : ""}`}>
            <div className="reveal-inner">
              {questions[0]?.feedback && <p><strong>תשובה:</strong> {questions[0].feedback}</p>}
              {questions[0]?.text && <p>{questions[0].text}</p>}
            </div>
          </div>
        </>
      )}

      {/* HOMEWORK — task list */}
      {type === "homework" && questions && (
        <div style={{ marginTop: 16, maxWidth: 640 }}>
          {questions.map((q, i) => (
            <div key={q.id} className="task-item">
              <div className="task-num">{i + 1}</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink)" }}>{q.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* ENRICHMENT — 3-col grid */}
      {type === "enrichment" && questions && (
        <div className="enrich-grid">
          {questions.map(q => (
            <div key={q.id} className="card">
              <span className="rtag">{q.feedback ?? "העשרה"}</span>
              <h3 style={{ fontFamily: "'Frank Ruhl Libre',serif", color: "var(--ink)", margin: "0 0 6px", fontSize: 15 }}>{q.text}</h3>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#4a4a45" }}>{q.options[0] ?? ""}</p>
            </div>
          ))}
        </div>
      )}

      {/* INTRO — conditions strip if questions present */}
      {type === "intro" && questions && (
        <div className="conditions-strip">
          {questions.map((q, i) => (
            <div key={q.id} className="cond-chip">
              <span className="n">{i + 1}</span>
              <span className="t">{q.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* FEEDBACK — show question text */}
      {type === "feedback" && questions && questions.map(q => (
        <div key={q.id} style={{ marginBottom: 16 }}>
          <div className="qbox">{q.text}</div>
          {agg[q.id] && (
            <div style={{ marginTop: 8, maxWidth: 480 }}>
              {q.options.map((opt, oi) => {
                const cnt = (agg[q.id] ?? {})[String(oi)] ?? 0
                const total = Object.values(agg[q.id] ?? {}).reduce((s, v) => s + v, 0)
                const pct = total ? Math.round((cnt / total) * 100) : 0
                return (
                  <div key={oi} className="bar-row">
                    <div className="bar-label"><span>{opt}</span><span>{cnt}</span></div>
                    <div className="bar-bg"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function PresentPage({ params }: Props) {
  const { id } = use(params)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [idx, setIdx] = useState(0)
  const [session, setSession] = useState<LiveSession | null>(null)
  const [agg, setAgg] = useState<AggResult>({})
  const [revealOpen, setRevealOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/lessons/${id}`).then(r => r.json()).then(d => {
      if (d.error) { setError(d.error); return }
      setLesson(d)
    })
  }, [id])

  const slide = lesson?.slides[idx]

  // Fetch aggregated responses when slide changes
  useEffect(() => {
    if (!session || !slide) return
    setAgg({})
    setRevealOpen(false)
    fetchAgg(session.id, slide.id)
  }, [session?.id, slide?.id])

  // Supabase Realtime: listen for new responses
  useEffect(() => {
    if (!session || !slide) return
    let sub: any
    try {
      const sb = browserClient()
      sub = sb
        .channel(`responses:${session.id}:${slide.id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "responses",
          filter: `session_id=eq.${session.id}`,
        }, () => fetchAgg(session.id, slide.id))
        .subscribe()
    } catch {}
    return () => { sub?.unsubscribe() }
  }, [session?.id, slide?.id])

  async function fetchAgg(sessionId: string, slideId: string) {
    const r = await fetch(`/api/responses?session_id=${sessionId}&slide_id=${slideId}`)
    if (!r.ok) return
    const rows: { question_id: string; answer: string }[] = await r.json()
    const result: AggResult = {}
    for (const row of rows) {
      if (!result[row.question_id]) result[row.question_id] = {}
      result[row.question_id][row.answer] = (result[row.question_id][row.answer] ?? 0) + 1
    }
    setAgg(result)
  }

  async function startSession() {
    if (!lesson) return
    setStarting(true)
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_id: lesson.id, class_id: lesson.class_id }),
    })
    if (res.ok) setSession(await res.json())
    else setError("שגיאה ביצירת session")
    setStarting(false)
  }

  async function endSession() {
    if (!session) return
    await fetch(`/api/sessions/${session.room_code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: false }),
    })
    setSession(null)
  }

  const go = useCallback(async (newIdx: number) => {
    if (!lesson || newIdx < 0 || newIdx >= lesson.slides.length) return
    setIdx(newIdx)
    if (session) {
      await fetch(`/api/sessions/${session.room_code}/slide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: newIdx }),
      })
    }
  }, [lesson, session])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "PageDown" || e.key === " ") go(idx + 1)
      if (e.key === "ArrowRight" || e.key === "PageUp") go(idx - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go, idx])

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Heebo',sans-serif", color: "#A23B2E" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 18, marginBottom: 8 }}>{error}</p>
        <p style={{ fontSize: 13, opacity: 0.6 }}>ודאו שמשתני הסביבה NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY מוגדרים</p>
      </div>
    </div>
  )

  if (!lesson) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Heebo',sans-serif", color: "#1B2A4A", opacity: 0.5 }}>
      טוען שיעור...
    </div>
  )

  const total = lesson.slides.length

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--ink)", direction: "rtl" }}>
      <style>{SLIDE_FONT + CSS}</style>

      {/* Topbar */}
      <div className="topbar">
        <div style={{ color: "var(--paper)", fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 700, fontSize: 16 }}>
          {lesson.title}
        </div>

        {/* Progress */}
        <div style={{ flex: 1, maxWidth: 380, height: 3, background: "rgba(245,241,230,0.15)", margin: "0 20px", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((idx + 1) / total) * 100}%`, background: "linear-gradient(90deg,var(--gold),var(--seal))", transition: "width .3s ease" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "rgba(245,241,230,0.65)", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
            {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>

          {session ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "rgba(176,141,63,0.2)", border: "1px solid var(--gold)", color: "var(--gold)", borderRadius: 6, padding: "4px 10px", fontSize: 13, fontFamily: "'Heebo'", fontWeight: 700, letterSpacing: 2 }}>
                🔴 {session.room_code}
              </span>
              <button onClick={endSession}
                style={{ background: "var(--seal)", color: "var(--paper)", border: "none", borderRadius: 6, padding: "5px 10px", fontFamily: "'Heebo'", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                סיים
              </button>
            </div>
          ) : (
            <button onClick={startSession} disabled={starting}
              style={{ background: "var(--seal)", color: "var(--paper)", border: "none", borderRadius: 8, padding: "7px 16px", fontFamily: "'Heebo'", fontWeight: 700, fontSize: 13, cursor: starting ? "default" : "pointer", opacity: starting ? 0.7 : 1 }}>
              {starting ? "מתחיל..." : "▶ התחל שיעור"}
            </button>
          )}
        </div>
      </div>

      {/* Slide stage */}
      <div className="stage">
        {slide && (
          <SlideView
            slide={slide}
            agg={agg}
            revealOpen={revealOpen}
            setRevealOpen={setRevealOpen}
          />
        )}

        {/* Seal stamp */}
        <div className="seal-stamp">{idx + 1}</div>

        {/* Nav buttons */}
        <div className="navbtns">
          <button className="navbtn" disabled={idx === 0} onClick={() => go(idx - 1)}>›</button>
          <button className="navbtn" disabled={idx === total - 1} onClick={() => go(idx + 1)}>‹</button>
        </div>
      </div>
    </div>
  )
}
