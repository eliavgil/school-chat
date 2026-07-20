"use client"
import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import type { Lesson, Slide, SlideType, SlideQuestion } from "@/lib/lessons/types"

interface Props { params: Promise<{ id: string }> }

const SLIDE_TYPES: { value: SlideType; label: string }[] = [
  { value: "intro",      label: "פתיחה" },
  { value: "poll",       label: "סקר" },
  { value: "quiz",       label: "חידון" },
  { value: "definitions",label: "הגדרות" },
  { value: "matching",   label: "התאמה" },
  { value: "reveal",     label: "גילוי" },
  { value: "enrichment", label: "העשרה" },
  { value: "homework",   label: "שיעורי בית" },
  { value: "feedback",   label: "משוב" },
]

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700;900&family=Heebo:wght@300;400;500;700&display=swap');`

const CSS = `
  :root{--ink:#1B2A4A;--paper:#F5F1E6;--paper2:#ECE5D3;--seal:#A23B2E;--gold:#B08D3F;--ok:#3F6B4F;--line:rgba(27,42,74,0.14);}
  body{margin:0;background:var(--paper2);}
  input,textarea,select{font-family:'Heebo',sans-serif;font-size:14px;border:1.5px solid var(--line);border-radius:8px;padding:9px 12px;width:100%;outline:none;background:#fff;color:var(--ink);}
  input:focus,textarea:focus,select:focus{border-color:var(--ink);}
  label{font-size:12px;font-weight:700;color:var(--ink);opacity:0.6;display:block;margin-bottom:4px;letter-spacing:.5px;}
  textarea{resize:vertical;min-height:72px;}
  .field{margin-bottom:14px;}
  .slide-pill{padding:6px 12px;border-radius:20px;border:1.5px solid var(--line);background:#fff;cursor:pointer;font-size:12px;font-weight:600;color:var(--ink);white-space:nowrap;transition:.15s;}
  .slide-pill.active{background:var(--ink);color:var(--paper);border-color:var(--ink);}
  .q-card{background:#fff;border:1px solid var(--line);border-radius:10px;padding:14px;margin-bottom:10px;}
  .opt-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
  .opt-input{flex:1;}
  .correct-btn{width:28px;height:28px;border-radius:50%;border:1.5px solid var(--line);background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;transition:.15s;}
  .correct-btn.active{background:var(--ok);border-color:var(--ok);}
  .del-btn{width:26px;height:26px;border-radius:50%;border:none;background:rgba(162,59,46,.1);color:var(--seal);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .add-btn{background:transparent;border:1.5px dashed var(--ink);border-radius:8px;padding:8px;color:var(--ink);cursor:pointer;width:100%;font-family:'Heebo';font-size:13px;font-weight:600;opacity:.6;}
  .add-btn:hover{opacity:1;}
  .save-bar{position:sticky;bottom:0;background:var(--ink);padding:14px 20px;display:flex;gap:10px;align-items:center;}
  .save-btn{background:var(--seal);color:var(--paper);border:none;border-radius:8px;padding:10px 24px;font-family:'Heebo';font-weight:700;font-size:14px;cursor:pointer;}
  .ghost-btn{background:transparent;color:rgba(245,241,230,0.65);border:1px solid rgba(245,241,230,0.3);border-radius:8px;padding:10px 16px;font-family:'Heebo';font-weight:600;font-size:13px;cursor:pointer;}
`

function newQuestion(): SlideQuestion {
  return { id: `q${Date.now()}`, text: "", options: ["", ""], correct_index: null }
}

function QuestionEditor({ q, onChange, onDelete, type }: {
  q: SlideQuestion
  onChange: (q: SlideQuestion) => void
  onDelete: () => void
  type: SlideType
}) {
  const showCorrect = type === "quiz" || type === "matching"

  function setOpt(i: number, val: string) {
    const opts = [...q.options]; opts[i] = val
    onChange({ ...q, options: opts })
  }

  function addOpt() {
    onChange({ ...q, options: [...q.options, ""] })
  }

  function delOpt(i: number) {
    const opts = q.options.filter((_, idx) => idx !== i)
    onChange({ ...q, options: opts, correct_index: q.correct_index === i ? null : (q.correct_index !== null && q.correct_index > i ? q.correct_index - 1 : q.correct_index) })
  }

  return (
    <div className="q-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>שאלה</div>
        <button className="del-btn" onClick={onDelete}>×</button>
      </div>
      <div className="field">
        <label>טקסט השאלה</label>
        <input value={q.text} onChange={e => onChange({ ...q, text: e.target.value })} placeholder="כתבו כאן את השאלה..." />
      </div>
      <div className="field">
        <label>אפשרויות {showCorrect && "(לחצו ✓ לסמן כנכון)"}</label>
        {q.options.map((opt, oi) => (
          <div key={oi} className="opt-row">
            <input className="opt-input" value={opt} onChange={e => setOpt(oi, e.target.value)} placeholder={`אפשרות ${oi + 1}`} />
            {showCorrect && (
              <button className={`correct-btn${q.correct_index === oi ? " active" : ""}`} onClick={() => onChange({ ...q, correct_index: q.correct_index === oi ? null : oi })}>✓</button>
            )}
            {q.options.length > 1 && <button className="del-btn" onClick={() => delOpt(oi)}>×</button>}
          </div>
        ))}
        <button className="add-btn" onClick={addOpt}>+ אפשרות</button>
      </div>
      <div className="field">
        <label>הסבר / תגובה (אופציונלי)</label>
        <input value={q.feedback ?? ""} onChange={e => onChange({ ...q, feedback: e.target.value })} placeholder="טקסט שיופיע לאחר המענה..." />
      </div>
    </div>
  )
}

function SlideEditor({ slide, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: {
  slide: Slide
  onChange: (s: Slide) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const [open, setOpen] = useState(false)

  function setQ(i: number, q: SlideQuestion) {
    const qs = [...(slide.questions ?? [])]; qs[i] = q
    onChange({ ...slide, questions: qs })
  }
  function delQ(i: number) {
    const qs = (slide.questions ?? []).filter((_, idx) => idx !== i)
    onChange({ ...slide, questions: qs })
  }
  function addQ() {
    onChange({ ...slide, questions: [...(slide.questions ?? []), newQuestion()] })
  }

  const typeLabel = SLIDE_TYPES.find(t => t.value === slide.type)?.label ?? slide.type
  const hasQuestions = ["poll", "quiz", "definitions", "matching", "reveal", "homework", "enrichment", "feedback", "intro"].includes(slide.type)

  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
      {/* Slide header */}
      <div onClick={() => setOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", cursor: "pointer", background: open ? "var(--paper2)" : "#fff" }}>
        <span style={{ background: "var(--seal)", color: "var(--paper)", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{slide.order}</span>
        <span style={{ flex: 1, fontWeight: 600, color: "var(--ink)", fontSize: 14 }}>{slide.title || "(ללא כותרת)"}</span>
        <span style={{ fontSize: 11, background: "var(--paper2)", borderRadius: 6, padding: "2px 8px", color: "var(--ink)", opacity: 0.7 }}>{typeLabel}</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={e => { e.stopPropagation(); onMoveUp() }} disabled={isFirst} style={{ background: "none", border: "none", cursor: isFirst ? "default" : "pointer", opacity: isFirst ? 0.2 : 0.6, fontSize: 14 }}>↑</button>
          <button onClick={e => { e.stopPropagation(); onMoveDown() }} disabled={isLast} style={{ background: "none", border: "none", cursor: isLast ? "default" : "pointer", opacity: isLast ? 0.2 : 0.6, fontSize: 14 }}>↓</button>
          <button onClick={e => { e.stopPropagation(); onDelete() }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--seal)", fontSize: 16 }}>×</button>
        </div>
        <span style={{ fontSize: 14, color: "var(--ink)", opacity: 0.4 }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ padding: "16px", borderTop: "1px solid var(--line)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div className="field">
              <label>סוג שקף</label>
              <select value={slide.type} onChange={e => onChange({ ...slide, type: e.target.value as SlideType })}>
                {SLIDE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>עיניים (eyebrow)</label>
              <input value={slide.eyebrow} onChange={e => onChange({ ...slide, eyebrow: e.target.value })} placeholder="פתיחה אקטואלית" />
            </div>
          </div>

          <div className="field">
            <label>כותרת</label>
            <input value={slide.title} onChange={e => onChange({ ...slide, title: e.target.value })} placeholder="כותרת השקף" />
          </div>

          <div className="field">
            <label>גוף (אופציונלי)</label>
            <textarea value={slide.body ?? ""} onChange={e => onChange({ ...slide, body: e.target.value })} placeholder="תוכן חופשי..." />
          </div>

          {hasQuestions && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)", marginBottom: 8 }}>שאלות</div>
              {(slide.questions ?? []).map((q, i) => (
                <QuestionEditor key={q.id} q={q} type={slide.type} onChange={q => setQ(i, q)} onDelete={() => delQ(i)} />
              ))}
              <button className="add-btn" onClick={addQ}>+ הוספת שאלה</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function EditLessonPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [title, setTitle] = useState("")
  const [slides, setSlides] = useState<Slide[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/lessons/${id}`).then(r => r.json()).then(d => {
      if (d.error) return
      setLesson(d)
      setTitle(d.title)
      setSlides(d.slides ?? [])
    })
  }, [id])

  function setSlide(i: number, s: Slide) {
    const next = [...slides]; next[i] = s; setSlides(next)
  }
  function delSlide(i: number) {
    const next = slides.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 }))
    setSlides(next)
  }
  function moveSlide(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= slides.length) return
    const next = [...slides]
    ;[next[i], next[j]] = [next[j], next[i]]
    setSlides(next.map((s, idx) => ({ ...s, order: idx + 1 })))
  }
  function addSlide() {
    const newSlide: Slide = {
      id: `s${Date.now()}`, order: slides.length + 1,
      type: "poll", eyebrow: "סקר", title: "שאלה חדשה",
      questions: [newQuestion()],
    }
    setSlides([...slides, newSlide])
  }

  async function save() {
    setSaving(true)
    await fetch(`/api/lessons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slides }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!lesson) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Heebo',sans-serif", color: "#1B2A4A", opacity: 0.5 }}>
        טוען...
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper2)", fontFamily: "'Heebo',sans-serif", direction: "rtl" }}>
      <style>{FONT + CSS}</style>

      {/* Header */}
      <header style={{ background: "var(--ink)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "rgba(245,241,230,0.6)", cursor: "pointer", fontSize: 18 }}>←</button>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ flex: 1, background: "transparent", border: "none", color: "var(--paper)", fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 700, fontSize: 17, outline: "none" }}
          placeholder="שם השיעור"
        />
        <button
          onClick={() => router.push(`/lessons/${id}/present`)}
          style={{ background: "var(--gold)", color: "var(--ink)", border: "none", borderRadius: 8, padding: "7px 14px", fontFamily: "'Heebo'", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          ▶ הצג
        </button>
      </header>

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 120px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontWeight: 700, color: "var(--ink)", fontSize: 15 }}>{slides.length} שקפים</span>
          <button
            onClick={addSlide}
            style={{ background: "var(--seal)", color: "var(--paper)", border: "none", borderRadius: 8, padding: "8px 16px", fontFamily: "'Heebo'", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            + שקף חדש
          </button>
        </div>

        {slides.map((slide, i) => (
          <SlideEditor
            key={slide.id}
            slide={slide}
            onChange={s => setSlide(i, s)}
            onDelete={() => delSlide(i)}
            onMoveUp={() => moveSlide(i, -1)}
            onMoveDown={() => moveSlide(i, 1)}
            isFirst={i === 0}
            isLast={i === slides.length - 1}
          />
        ))}

        {slides.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(27,42,74,0.4)" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📑</div>
            <p>אין שקפים עדיין. הוסיפו שקף ראשון!</p>
          </div>
        )}
      </main>

      <div className="save-bar">
        <button className="ghost-btn" onClick={() => router.back()}>ביטול</button>
        <button className="save-btn" onClick={save} disabled={saving}>
          {saving ? "שומר..." : saved ? "✓ נשמר" : "שמירה"}
        </button>
        {saved && <span style={{ color: "var(--gold)", fontSize: 13, fontWeight: 600 }}>השיעור נשמר בהצלחה</span>}
      </div>
    </div>
  )
}
