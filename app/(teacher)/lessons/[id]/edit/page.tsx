"use client"
import { useEffect, useState, useRef, use } from "react"
import { useRouter } from "next/navigation"
import type { Lesson, Slide, SlideType, SlideQuestion } from "@/lib/lessons/types"
import { ANIMATION_REGISTRY, ANIMATION_DELAYS, ANIMATION_POSITIONS } from "@/lib/lessons/animations"

interface Props { params: Promise<{ id: string }> }

const SLIDE_TYPES: { value: SlideType; label: string }[] = [
  { value: "intro",       label: "פתיחה" },
  { value: "poll",        label: "סקר" },
  { value: "quiz",        label: "חידון" },
  { value: "definitions", label: "הגדרות" },
  { value: "matching",    label: "התאמה" },
  { value: "reveal",      label: "גילוי" },
  { value: "enrichment",  label: "העשרה" },
  { value: "homework",    label: "שיעורי בית" },
  { value: "feedback",    label: "משוב" },
]

const IMG_POSITIONS = [
  { value: "top",        label: "למעלה" },
  { value: "right",      label: "ימין" },
  { value: "left",       label: "שמאל" },
  { value: "background", label: "רקע" },
]

const IMG_SIZES = [
  { value: "small",  label: "קטן" },
  { value: "medium", label: "בינוני" },
  { value: "large",  label: "גדול" },
  { value: "full",   label: "מלא" },
]

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700;900&family=Heebo:wght@300;400;500;700&display=swap');`

const CSS = `
  :root{--ink:#1B2A4A;--paper:#F5F1E6;--paper2:#ECE5D3;--seal:#A23B2E;--gold:#B08D3F;--ok:#3F6B4F;--line:rgba(27,42,74,0.14);}
  body{margin:0;background:var(--paper2);}
  *{box-sizing:border-box;}
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
  .chip-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;}
  .chip{padding:4px 12px;border-radius:20px;border:1.5px solid var(--line);background:#fff;cursor:pointer;font-size:12px;font-weight:600;color:var(--ink);transition:.15s;}
  .chip.active{background:var(--ink);color:var(--paper);border-color:var(--ink);}
  .yt-preview{position:relative;width:100%;padding-top:56.25%;border-radius:10px;overflow:hidden;margin-top:8px;background:#000;}
  .yt-preview iframe{position:absolute;inset:0;width:100%;height:100%;border:none;}
  .drag-handle{cursor:grab;color:var(--ink);opacity:0.3;font-size:18px;padding:0 4px;line-height:1;user-select:none;}
  .drag-handle:hover{opacity:0.7;}
  .slide-item{transition:opacity .15s;}
  .slide-item.dragging{opacity:0.35;}
  .slide-item.drag-over{border:2px dashed var(--seal) !important;}
  .section-label{font-size:11px;font-weight:700;color:var(--ink);opacity:0.5;letter-spacing:.7px;text-transform:uppercase;margin-bottom:6px;}
  .media-section{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:14px;margin-bottom:14px;}
`

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

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
  function addOpt() { onChange({ ...q, options: [...q.options, ""] }) }
  function delOpt(i: number) {
    const opts = q.options.filter((_, idx) => idx !== i)
    const ci = q.correct_index
    onChange({ ...q, options: opts, correct_index: ci === i ? null : (ci !== null && ci > i ? ci - 1 : ci) })
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

function SlideEditor({ slide, onChange, onDelete, dragHandleProps }: {
  slide: Slide
  onChange: (s: Slide) => void
  onDelete: () => void
  dragHandleProps: React.HTMLAttributes<HTMLSpanElement>
}) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ytId = slide.youtube_url ? extractYouTubeId(slide.youtube_url) : null

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.url) {
        onChange({ ...slide, image_url: data.url })
      } else {
        setUploadError(data.error ?? "שגיאה בהעלאה")
      }
    } catch {
      setUploadError("שגיאה בהעלאה")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  function setQ(i: number, q: SlideQuestion) {
    const qs = [...(slide.questions ?? [])]; qs[i] = q
    onChange({ ...slide, questions: qs })
  }
  function delQ(i: number) {
    onChange({ ...slide, questions: (slide.questions ?? []).filter((_, idx) => idx !== i) })
  }
  function addQ() {
    onChange({ ...slide, questions: [...(slide.questions ?? []), newQuestion()] })
  }

  const typeLabel = SLIDE_TYPES.find(t => t.value === slide.type)?.label ?? slide.type

  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 14px", background: open ? "var(--paper2)" : "#fff" }}>
        <span {...dragHandleProps} className="drag-handle" title="גרור לשינוי סדר">⠿</span>
        <span onClick={() => setOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, cursor: "pointer" }}>
          <span style={{ background: "var(--seal)", color: "var(--paper)", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{slide.order}</span>
          <span style={{ flex: 1, fontWeight: 600, color: "var(--ink)", fontSize: 14 }}>{slide.title || "(ללא כותרת)"}</span>
          <span style={{ fontSize: 11, background: "var(--paper2)", borderRadius: 6, padding: "2px 8px", color: "var(--ink)", opacity: 0.7 }}>{typeLabel}</span>
        </span>
        <button onClick={e => { e.stopPropagation(); onDelete() }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--seal)", fontSize: 18, lineHeight: 1, padding: "0 2px" }}>×</button>
        <span onClick={() => setOpen(v => !v)} style={{ fontSize: 13, color: "var(--ink)", opacity: 0.4, cursor: "pointer" }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ padding: "16px", borderTop: "1px solid var(--line)" }}>
          {/* Type + Eyebrow */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div className="field">
              <label>סוג שקף</label>
              <select value={slide.type} onChange={e => onChange({ ...slide, type: e.target.value as SlideType })}>
                {SLIDE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>כותרת עליונה (eyebrow)</label>
              <input value={slide.eyebrow} onChange={e => onChange({ ...slide, eyebrow: e.target.value })} placeholder="פתיחה אקטואלית" />
            </div>
          </div>

          <div className="field">
            <label>כותרת</label>
            <input value={slide.title} onChange={e => onChange({ ...slide, title: e.target.value })} placeholder="כותרת השקף" />
          </div>

          <div className="field">
            <label>טקסט חופשי (אופציונלי)</label>
            <textarea value={slide.body ?? ""} onChange={e => onChange({ ...slide, body: e.target.value })} placeholder="תוכן..." />
          </div>

          {/* ── Media section ── */}
          <div className="media-section">
            <div className="section-label">מדיה</div>

            {/* Image */}
            <div className="field">
              <label>תמונה</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  value={slide.image_url ?? ""}
                  onChange={e => onChange({ ...slide, image_url: e.target.value || null })}
                  placeholder="https://... (URL) או העלאת קובץ ←"
                  type="url"
                  style={{ flex: 1 }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{ whiteSpace: "nowrap", padding: "9px 14px", borderRadius: 8, border: "1.5px solid var(--ink)", background: uploading ? "var(--paper2)" : "#fff", color: "var(--ink)", fontSize: 13, fontWeight: 700, cursor: uploading ? "default" : "pointer", fontFamily: "'Heebo'", opacity: uploading ? 0.6 : 1, flexShrink: 0 }}>
                  {uploading ? "מעלה..." : "העלאת קובץ"}
                </button>
              </div>
              {uploadError && <div style={{ fontSize: 12, color: "var(--seal)", marginTop: 4 }}>{uploadError}</div>}
            </div>
            {slide.image_url && (
              <>
                <div className="field">
                  <label>מיקום תמונה</label>
                  <div className="chip-row">
                    {IMG_POSITIONS.map(p => (
                      <button key={p.value} className={`chip${(slide.image_position ?? "top") === p.value ? " active" : ""}`}
                        onClick={() => onChange({ ...slide, image_position: p.value as Slide["image_position"] })}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>גודל תמונה</label>
                  <div className="chip-row">
                    {IMG_SIZES.map(s => (
                      <button key={s.value} className={`chip${(slide.image_size ?? "medium") === s.value ? " active" : ""}`}
                        onClick={() => onChange({ ...slide, image_size: s.value as Slide["image_size"] })}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 14, borderRadius: 8, overflow: "hidden", maxHeight: 160 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slide.image_url} alt="" style={{ width: "100%", objectFit: "cover", display: "block" }} />
                </div>
              </>
            )}

            {/* YouTube */}
            <div className="field">
              <label>קישור יוטיוב</label>
              <input
                value={slide.youtube_url ?? ""}
                onChange={e => onChange({ ...slide, youtube_url: e.target.value || null })}
                placeholder="https://youtube.com/watch?v=..."
                type="url"
              />
            </div>
            {slide.youtube_url && ytId && (
              <div className="yt-preview" style={{ marginBottom: 14 }}>
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            {slide.youtube_url && !ytId && (
              <div style={{ fontSize: 12, color: "var(--seal)", marginBottom: 14 }}>קישור לא מזוהה כיוטיוב תקין</div>
            )}

            {/* External link */}
            <div className="field">
              <label>קישור לחומר חיצוני (URL)</label>
              <input
                value={slide.link_url ?? ""}
                onChange={e => onChange({ ...slide, link_url: e.target.value || null })}
                placeholder="https://..."
                type="url"
              />
            </div>

            {/* Audio */}
            <div className="field" style={{ marginBottom: 0 }}>
              <label>🔊 קישור לאודיו (MP3 / WAV)</label>
              <input
                value={slide.audio_url ?? ""}
                onChange={e => onChange({ ...slide, audio_url: e.target.value || null })}
                placeholder="https://... .mp3"
                type="url"
              />
            </div>
          </div>

          {/* ── Animation section ── */}
          <div className="media-section">
            <div className="section-label">אנימציה</div>
            <div className="field" style={{ marginBottom: 10 }}>
              <select
                value={slide.animation?.name ?? ""}
                onChange={e => {
                  const key = e.target.value
                  onChange({
                    ...slide,
                    animation: key
                      ? { name: key, delay: slide.animation?.delay ?? 0, position: slide.animation?.position ?? "across", loop: slide.animation?.loop ?? false }
                      : null,
                  })
                }}
              >
                <option value="">— ללא אנימציה —</option>
                {Object.entries(ANIMATION_REGISTRY).map(([key, { label, emoji }]) => (
                  <option key={key} value={key}>{emoji} {label}</option>
                ))}
              </select>
            </div>
            {slide.animation && (
              <>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>תזמון — מתי תופיע?</label>
                  <div className="chip-row">
                    {ANIMATION_DELAYS.map(d => (
                      <button key={d.value}
                        className={`chip${(slide.animation?.delay ?? 0) === d.value ? " active" : ""}`}
                        onClick={() => onChange({ ...slide, animation: { ...slide.animation!, delay: d.value } })}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>מיקום</label>
                  <div className="chip-row">
                    {ANIMATION_POSITIONS.map(p => (
                      <button key={p.value}
                        className={`chip${(slide.animation?.position ?? "across") === p.value ? " active" : ""}`}
                        onClick={() => onChange({ ...slide, animation: { ...slide.animation!, position: p.value as any } })}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>חזרה</label>
                  <div className="chip-row">
                    <button className={`chip${!(slide.animation?.loop) ? " active" : ""}`}
                      onClick={() => onChange({ ...slide, animation: { ...slide.animation!, loop: false } })}>
                      פעם אחת
                    </button>
                    <button className={`chip${slide.animation?.loop ? " active" : ""}`}
                      onClick={() => onChange({ ...slide, animation: { ...slide.animation!, loop: true } })}>
                      כל הזמן
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Questions */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)", marginBottom: 8 }}>שאלות</div>
            {(slide.questions ?? []).map((q, i) => (
              <QuestionEditor key={q.id} q={q} type={slide.type} onChange={q => setQ(i, q)} onDelete={() => delQ(i)} />
            ))}
            <button className="add-btn" onClick={addQ}>+ הוספת שאלה</button>
          </div>
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

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

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
    setSlides(slides.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 })))
  }
  function addSlide() {
    const s: Slide = { id: `s${Date.now()}`, order: slides.length + 1, type: "poll", eyebrow: "סקר", title: "שאלה חדשה", questions: [newQuestion()] }
    setSlides([...slides, s])
  }

  // Drag handlers
  function onDragStart(i: number) { setDragIdx(i) }
  function onDragOver(e: React.DragEvent, i: number) { e.preventDefault(); setDragOverIdx(i) }
  function onDrop(i: number) {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return }
    const next = [...slides]
    const [removed] = next.splice(dragIdx, 1)
    next.splice(i, 0, removed)
    setSlides(next.map((s, idx) => ({ ...s, order: idx + 1 })))
    setDragIdx(null); setDragOverIdx(null)
  }
  function onDragEnd() { setDragIdx(null); setDragOverIdx(null) }

  async function save() {
    setSaving(true)
    await fetch(`/api/lessons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slides }),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!lesson) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Heebo',sans-serif", color: "#1B2A4A", opacity: 0.5 }}>טוען...</div>
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper2)", fontFamily: "'Heebo',sans-serif", direction: "rtl" }}>
      <style>{FONT + CSS}</style>

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
          <button onClick={addSlide} style={{ background: "var(--seal)", color: "var(--paper)", border: "none", borderRadius: 8, padding: "8px 16px", fontFamily: "'Heebo'", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            + שקף חדש
          </button>
        </div>

        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`slide-item${dragIdx === i ? " dragging" : ""}${dragOverIdx === i && dragIdx !== i ? " drag-over" : ""}`}
            onDragOver={e => onDragOver(e, i)}
            onDrop={() => onDrop(i)}
            onDragEnd={onDragEnd}
          >
            <SlideEditor
              slide={slide}
              onChange={s => setSlide(i, s)}
              onDelete={() => delSlide(i)}
              dragHandleProps={{
                draggable: true,
                onDragStart: () => onDragStart(i),
              }}
            />
          </div>
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
