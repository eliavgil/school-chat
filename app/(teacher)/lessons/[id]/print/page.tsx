"use client"
import React, { useEffect, useState, use } from "react"
import type { Lesson, Slide } from "@/lib/lessons/types"

interface Props { params: Promise<{ id: string }> }

const PRINT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700;900&family=Heebo:wght@300;400;500;700&display=swap');
  :root{--ink:#1B2A4A;--paper:#F5F1E6;--paper2:#ECE5D3;--seal:#A23B2E;--gold:#B08D3F;--ok:#3F6B4F;--line:rgba(27,42,74,0.14);}
  *{box-sizing:border-box;}
  body{margin:0;background:#fff;font-family:'Heebo',sans-serif;direction:rtl;color:var(--ink);}
  .no-print{background:var(--ink);padding:14px 28px;display:flex;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:0;z-index:10;}
  .slide-page{background:var(--paper);min-height:100vh;padding:48px 64px 64px;position:relative;border-bottom:3px solid var(--gold);}
  .slide-num{position:absolute;top:20px;left:24px;width:36px;height:36px;border-radius:50%;background:var(--seal);color:var(--paper);display:flex;align-items:center;justify-content:center;font-family:'Frank Ruhl Libre',serif;font-weight:900;font-size:16px;}
  .eyebrow{font-size:11px;letter-spacing:2.5px;color:var(--seal);font-weight:700;margin-bottom:6px;text-transform:uppercase;}
  h2.stitle{font-family:'Frank Ruhl Libre',serif;font-weight:900;font-size:28px;color:var(--ink);margin:0 0 18px;line-height:1.2;border-bottom:2px solid var(--line);padding-bottom:14px;}
  .lead{font-size:15px;line-height:1.85;color:var(--ink);margin:0 0 10px;}
  table{width:100%;border-collapse:collapse;font-size:14px;}
  th{text-align:right;padding:7px 10px;background:var(--ink);color:var(--paper);font-weight:700;border-bottom:2px solid var(--gold);}
  td{padding:7px 10px;border-bottom:1px solid var(--line);}
  tr:nth-child(even) td{background:var(--paper2);}
  blockquote{border-right:3px solid var(--seal);padding-right:14px;margin:10px 0;color:var(--seal);font-weight:600;font-size:14px;}
  hr.divider{border:none;border-top:1px solid var(--line);margin:12px 0;}
  .type-tag{display:inline-block;font-size:10px;font-weight:700;color:#fff;background:var(--seal);border-radius:5px;padding:2px 7px;margin-bottom:8px;}
  .options-list{display:flex;flex-direction:column;gap:8px;margin-top:12px;}
  .option{padding:9px 14px;border:1.5px solid var(--line);border-radius:8px;font-size:14px;background:#fff;}
  .option.correct{background:rgba(63,107,79,.12);border-color:var(--ok);color:var(--ok);font-weight:700;}
  .def-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;}
  .def-card{border:1.5px solid var(--line);border-radius:10px;overflow:hidden;}
  .def-term{background:var(--ink);color:var(--paper);padding:10px 14px;font-family:'Frank Ruhl Libre',serif;font-weight:700;font-size:14px;}
  .def-body{padding:10px 14px;font-size:13px;line-height:1.55;background:var(--paper2);}
  .task-item{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:1px solid var(--line);}
  .task-num{width:24px;height:24px;border-radius:50%;background:var(--seal);color:var(--paper);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:2px;}
  .reveal-box{background:var(--paper2);border-radius:10px;padding:16px 18px;margin-top:12px;border-right:3px solid var(--gold);}
  @media print{
    .no-print{display:none!important;}
    .slide-page{min-height:0;height:100vh;page-break-after:always;break-after:page;border-bottom:none;}
    .slide-page:last-child{page-break-after:auto;break-after:auto;}
    body{background:#fff;}
    @page{margin:0;size:A4 landscape;}
  }
`

const TYPE_LABELS: Record<string, string> = {
  intro: "פתיחה", poll: "סקר", quiz: "חידון", definitions: "הגדרות",
  matching: "התאמה", reveal: "גילוי", enrichment: "העשרה", homework: "שיעורי בית", feedback: "משוב",
}

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  )
}

function renderTable(lines: string[], key: number) {
  const rows = lines
    .filter(l => l.trim().startsWith("|") && !/^\|[\s\-|]+\|$/.test(l.trim()))
    .map(l => l.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim()))
  if (rows.length < 1) return null
  const [header, ...body] = rows
  return (
    <div key={key} style={{ overflowX: "auto", marginBottom: 12 }}>
      <table>
        <thead>
          <tr>{header.map((h, i) => <th key={i}>{renderInline(h)}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => <td key={ci}>{renderInline(cell)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderBody(text: string) {
  return text.split(/\n\n+/).map((para, pi) => {
    const trimmed = para.trim()
    if (trimmed === "---") return <hr key={pi} className="divider" />
    if (trimmed.startsWith("> ")) {
      return <blockquote key={pi}>{renderInline(trimmed.slice(2))}</blockquote>
    }
    const lines = para.split("\n")
    const isTable = lines.filter(l => l.trim().startsWith("|")).length >= 2
    if (isTable) return renderTable(lines, pi)
    return (
      <p key={pi} className="lead">
        {lines.map((line, li) => (
          <span key={li}>{renderInline(line)}{li < lines.length - 1 && <br />}</span>
        ))}
      </p>
    )
  })
}

function PrintSlide({ slide, num }: { slide: Slide; num: number }) {
  const { type, eyebrow, title, body, questions } = slide

  return (
    <div className="slide-page">
      <div className="slide-num">{num}</div>
      <span className="type-tag">{TYPE_LABELS[type] ?? type}</span>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="stitle">{title}</h2>

      {body && <div>{renderBody(body)}</div>}

      {/* Poll / Quiz — show options, mark correct */}
      {(type === "poll" || type === "quiz") && questions && questions.map(q => (
        <div key={q.id} style={{ marginBottom: 18 }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{q.text}</p>
          <div className="options-list">
            {q.options.map((opt, oi) => (
              <div key={oi} className={`option${q.correct_index === oi ? " correct" : ""}`}>
                {opt}{q.correct_index === oi ? " ✓" : ""}
              </div>
            ))}
          </div>
          {q.feedback && type === "quiz" && (
            <p style={{ fontSize: 13, color: "var(--ok)", marginTop: 8, fontWeight: 600 }}>💡 {q.feedback}</p>
          )}
        </div>
      ))}

      {/* Definitions — term/definition pairs */}
      {type === "definitions" && questions && (
        <div className="def-grid">
          {questions.map(q => (
            <div key={q.id} className="def-card">
              <div className="def-term">{q.text}</div>
              <div className="def-body">{q.feedback ?? q.options[0]}</div>
            </div>
          ))}
        </div>
      )}

      {/* Reveal — show answer open */}
      {type === "reveal" && questions && questions[0] && (
        <div className="reveal-box">
          {questions[0].feedback && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}><strong>תשובת מודל:</strong> {questions[0].feedback}</p>}
          {questions[0].text && <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.7 }}>{questions[0].text}</p>}
        </div>
      )}

      {/* Homework — numbered tasks */}
      {type === "homework" && questions && (
        <div style={{ marginTop: 16 }}>
          {questions.map((q, i) => (
            <div key={q.id} className="task-item">
              <div className="task-num">{i + 1}</div>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>{q.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* Matching */}
      {type === "matching" && questions && (
        <div className="def-grid">
          {questions.map(q => (
            <div key={q.id} className="def-card">
              <div className="def-term">{q.text}</div>
              <div className="def-body" style={{ color: "var(--ok)", fontWeight: 600 }}>{q.options[q.correct_index ?? 0]}</div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback — show questions */}
      {type === "feedback" && questions && questions.map(q => (
        <div key={q.id} style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 15, background: "var(--ink)", color: "var(--paper)", borderRadius: 10, padding: "12px 16px", margin: "0 0 8px" }}>{q.text}</p>
          <div className="options-list">
            {q.options.map((opt, oi) => <div key={oi} className="option">{opt}</div>)}
          </div>
        </div>
      ))}

      {/* Enrichment */}
      {type === "enrichment" && questions && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 14 }}>
          {questions.map(q => (
            <div key={q.id} style={{ border: "1.5px solid var(--line)", borderRadius: 10, padding: "12px 14px", background: "#fff" }}>
              <span className="type-tag">{q.feedback ?? "העשרה"}</span>
              <p style={{ fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 700, fontSize: 14, margin: "6px 0 4px", color: "var(--ink)" }}>{q.text}</p>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#4a4a45" }}>{q.options[0] ?? ""}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PrintPage({ params }: Props) {
  const { id } = use(params)
  const [lesson, setLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    fetch(`/api/lessons/${id}`).then(r => r.json()).then(d => {
      if (!d.error) setLesson(d)
    })
  }, [id])

  if (!lesson) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Heebo',sans-serif", color: "#1B2A4A", opacity: 0.5 }}>
      טוען שיעור...
    </div>
  )

  return (
    <div>
      <style>{PRINT_CSS}</style>

      {/* Toolbar — hidden during print */}
      <div className="no-print">
        <div style={{ color: "var(--paper)", fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 700, fontSize: 15 }}>
          {lesson.title} — {lesson.slides.length} שקפים
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href={`/lessons/${id}/present`}
            style={{ padding: "8px 16px", borderRadius: 7, border: "1.5px solid rgba(245,241,230,0.3)", color: "rgba(245,241,230,0.75)", fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: "'Heebo',sans-serif" }}>
            ← חזרה למצגת
          </a>
          <button
            onClick={() => window.print()}
            style={{ background: "var(--seal)", color: "var(--paper)", border: "none", borderRadius: 7, padding: "8px 20px", fontFamily: "'Heebo',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            🖨️ הדפס / שמור כ-PDF
          </button>
        </div>
      </div>

      {/* All slides */}
      {lesson.slides.map((slide, i) => (
        <PrintSlide key={slide.id} slide={slide} num={i + 1} />
      ))}
    </div>
  )
}
