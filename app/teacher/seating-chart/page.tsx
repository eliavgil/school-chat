"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"

interface RosterItem { id: string; name: string; manual: boolean }
interface ClassOption { id: string; name: string }
interface ChartSummary { id: string; name: string; updatedAt: string }
type Side = "top" | "bottom" | "left" | "right"
type Step = "setup" | "layout" | "roster" | "result"
type Selection = { kind: "desk"; key: string } | { kind: "pool"; id: string } | null

const SIDE_LABEL: Record<Side, string> = { top: "למעלה", bottom: "למטה", left: "שמאל", right: "ימין" }
const SIDES: Side[] = ["top", "bottom", "left", "right"]

function deskKey(row: number, col: number) { return `${row}-${col}` }

/* ── Small side picker (board / door) ─────────────────────────────────── */
function SidePicker({ label, value, onChange, disabledSide }: {
  label: string; value: Side; onChange: (s: Side) => void; disabledSide?: Side
}) {
  return (
    <div>
      <p className="text-white/50 text-xs mb-1.5">{label}</p>
      <div className="grid grid-cols-4 gap-1.5">
        {SIDES.map(s => (
          <button key={s} disabled={s === disabledSide}
            onClick={() => onChange(s)}
            className={`py-2 rounded-xl text-xs font-medium interactive btn-press transition-colors ${
              value === s ? "bg-white text-black" : s === disabledSide ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-white/8 text-white/70 hover:bg-white/15"
            }`}>
            {SIDE_LABEL[s]}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Step 1: pick class + resume/start ────────────────────────────────── */
function SetupStep({ classes, classId, setClassId, charts, loadingCharts, onNew, onLoad, onDelete }: {
  classes: ClassOption[]; classId: string | null; setClassId: (id: string) => void
  charts: ChartSummary[]; loadingCharts: boolean
  onNew: () => void; onLoad: (id: string) => void; onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-white/50 text-xs mb-1.5">כיתה</p>
        <select value={classId ?? ""} onChange={e => setClassId(e.target.value)}
          className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm interactive">
          <option value="" disabled>בחרו כיתה</option>
          {classes.map(c => <option key={c.id} value={c.id} className="bg-neutral-900">{c.name}</option>)}
        </select>
      </div>

      {classId && (
        <>
          <button onClick={onNew}
            className="w-full py-3.5 rounded-2xl bg-white text-black font-semibold text-sm interactive btn-press">
            + סידור ישיבה חדש
          </button>

          <div>
            <p className="text-white/50 text-xs mb-2">סידורים שמורים לכיתה זו</p>
            {loadingCharts && <div className="h-12 bg-white/5 rounded-2xl animate-pulse" />}
            {!loadingCharts && charts.length === 0 && (
              <div className="glass rounded-2xl px-4 py-6 text-center">
                <p className="text-white/30 text-sm">אין עדיין סידורים שמורים</p>
              </div>
            )}
            {!loadingCharts && charts.length > 0 && (
              <div className="space-y-2">
                {charts.map(c => (
                  <div key={c.id} className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-2">
                    <button onClick={() => onLoad(c.id)} className="flex-1 text-right interactive">
                      <p className="text-white/85 text-sm font-medium">{c.name || "סידור ללא שם"}</p>
                      <p className="text-white/35 text-xs mt-0.5">עודכן {new Date(c.updatedAt).toLocaleDateString("he-IL")}</p>
                    </button>
                    <button onClick={() => onDelete(c.id)} className="text-white/30 hover:text-red-400 text-lg interactive px-1">🗑</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Step 2: desk layout editor (uneven rows, add/remove) ─────────────── */
function LayoutStep({ rows, setRows, boardSide, setBoardSide, doorSide, setDoorSide, onNext }: {
  rows: number[]; setRows: (r: number[]) => void
  boardSide: Side; setBoardSide: (s: Side) => void
  doorSide: Side; setDoorSide: (s: Side) => void
  onNext: () => void
}) {
  const total = rows.reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-white/50 text-xs">סידור השולחנות בכיתה — שורה אחר שורה</p>
          <p className="text-white/40 text-xs nums">{total} שולחנות</p>
        </div>
        <div className="space-y-2">
          {rows.map((count, i) => (
            <div key={i} className="glass rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3">
              <span className="text-white/60 text-xs w-14 flex-shrink-0">שורה {i + 1}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setRows(rows.map((v, idx) => idx === i ? Math.max(1, v - 1) : v))}
                  className="w-8 h-8 rounded-lg bg-white/10 text-white text-lg interactive btn-press">−</button>
                <span className="text-white text-sm font-semibold w-6 text-center nums">{count}</span>
                <button onClick={() => setRows(rows.map((v, idx) => idx === i ? v + 1 : v))}
                  className="w-8 h-8 rounded-lg bg-white/10 text-white text-lg interactive btn-press">+</button>
              </div>
              <button onClick={() => setRows(rows.length > 1 ? rows.filter((_, idx) => idx !== i) : rows)}
                disabled={rows.length <= 1}
                className="text-white/25 hover:text-red-400 text-sm interactive disabled:opacity-20">הסר שורה</button>
            </div>
          ))}
        </div>
        <button onClick={() => setRows([...rows, rows[rows.length - 1] ?? 6])}
          className="w-full mt-2 py-2.5 rounded-xl border border-dashed border-white/20 text-white/50 text-sm interactive hover:border-white/40 hover:text-white/70">
          + הוסף שורה
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SidePicker label="איפה הלוח?" value={boardSide} onChange={s => { setBoardSide(s); if (s === doorSide) setDoorSide(SIDES.find(x => x !== s)!) }} disabledSide={doorSide} />
        <SidePicker label="איפה הדלת?" value={doorSide} onChange={s => { setDoorSide(s); if (s === boardSide) setBoardSide(SIDES.find(x => x !== s)!) }} disabledSide={boardSide} />
      </div>

      <button onClick={onNext}
        className="w-full py-3.5 rounded-2xl bg-white text-black font-semibold text-sm interactive btn-press">
        המשך לרשימת תלמידים →
      </button>
    </div>
  )
}

/* ── Step 3: roster editor (add/remove students manually) ─────────────── */
function RosterStep({ roster, setRoster, onGenerate }: {
  roster: RosterItem[]; setRoster: (r: RosterItem[]) => void; onGenerate: () => void
}) {
  const [newName, setNewName] = useState("")

  function add() {
    const name = newName.trim()
    if (!name) return
    setRoster([...roster, { id: crypto.randomUUID(), name, manual: true }])
    setNewName("")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-white/50 text-xs">רשימת תלמידים לסידור</p>
        <p className="text-white/40 text-xs nums">{roster.length} תלמידים</p>
      </div>

      <div className="flex gap-2">
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") add() }}
          placeholder="הוספת תלמיד/ה בשם..."
          className="flex-1 bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30" />
        <button onClick={add} className="px-4 rounded-xl bg-white/15 text-white text-sm font-medium interactive btn-press">הוסף</button>
      </div>

      <div className="space-y-1.5 max-h-[45vh] overflow-y-auto">
        {roster.map(s => (
          <div key={s.id} className="glass rounded-xl px-3.5 py-2 flex items-center justify-between">
            <span className="text-white/80 text-sm">{s.name}{s.manual && <span className="text-white/30 text-xs mr-1.5">(נוסף ידנית)</span>}</span>
            <button onClick={() => setRoster(roster.filter(x => x.id !== s.id))}
              className="text-white/30 hover:text-red-400 interactive px-1">✕</button>
          </div>
        ))}
        {roster.length === 0 && (
          <div className="glass rounded-2xl px-4 py-8 text-center">
            <p className="text-white/30 text-sm">אין תלמידים ברשימה</p>
          </div>
        )}
      </div>

      <button onClick={onGenerate} disabled={roster.length === 0}
        className="w-full py-3.5 rounded-2xl bg-white text-black font-semibold text-sm interactive btn-press disabled:opacity-30">
        🎲 הגרלת סידור ישיבה
      </button>
    </div>
  )
}

/* ── Desk visual (interactive, editable) ──────────────────────────────── */
function DeskCard({ name, empty, selected, onClick, onRemove }: {
  name: string | null; empty: boolean; selected: boolean; onClick: () => void; onRemove?: () => void
}) {
  return (
    <div onClick={onClick}
      className={`relative flex items-center justify-center text-center rounded-lg border px-1.5 py-3 min-h-[56px] cursor-pointer interactive transition-all ${
        selected ? "border-amber-400 bg-amber-400/15 ring-2 ring-amber-400/40"
        : empty ? "border-dashed border-white/15 bg-white/[0.02] text-white/20"
        : "border-white/25 bg-white/10 hover:bg-white/15"
      }`}>
      <span className={`text-[11px] leading-tight font-medium ${empty ? "text-white/20" : "text-white/90"}`}>
        {name ?? "פנוי"}
      </span>
      {!empty && onRemove && (
        <button onClick={e => { e.stopPropagation(); onRemove() }}
          className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-black/70 text-white/70 text-[9px] flex items-center justify-center interactive">✕</button>
      )}
    </div>
  )
}

/* ── Step 4: result grid — editable, with board/door markers ──────────── */
function ResultStep({ rows, boardSide, doorSide, roster, assignments, selected, onDeskClick, onPoolClick, onRemove, onRegenerate }: {
  rows: number[]; boardSide: Side; doorSide: Side; roster: RosterItem[]
  assignments: Record<string, string | null>; selected: Selection
  onDeskClick: (key: string) => void; onPoolClick: (id: string) => void; onRemove: (key: string) => void
  onRegenerate: () => void
}) {
  const nameById = useMemo(() => new Map(roster.map(s => [s.id, s.name])), [roster])
  const assignedIds = useMemo(() => new Set(Object.values(assignments).filter(Boolean) as string[]), [assignments])
  const pool = roster.filter(s => !assignedIds.has(s.id))
  const maxCols = Math.max(...rows, 1)

  const vertical = boardSide === "top" || boardSide === "bottom"
  const Board = (
    <div className={`bg-white/25 rounded-xl flex items-center justify-center text-white/90 text-xs font-bold tracking-wide ${vertical ? "py-2" : "px-2"}`}
      style={vertical ? {} : { writingMode: "vertical-rl" }}>
      🖊 לוח
    </div>
  )
  const doorVertical = doorSide === "top" || doorSide === "bottom"
  const Door = (
    <div className={`text-white/40 text-[10px] font-medium flex items-center gap-1 ${doorVertical ? "" : ""}`}
      style={doorVertical ? {} : { writingMode: "vertical-rl" }}>
      🚪 דלת
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-4">
        <div className={`grid ${boardSide === "top" ? "grid-rows-[auto_1fr]" : boardSide === "bottom" ? "grid-rows-[1fr_auto]" : boardSide === "left" ? "grid-cols-[auto_1fr]" : "grid-cols-[1fr_auto]"} gap-3`}>
          {(boardSide === "top" || boardSide === "left") && Board}
          <div className={`grid ${doorSide === "left" ? "grid-cols-[auto_1fr]" : doorSide === "right" ? "grid-cols-[1fr_auto]" : doorSide === "top" ? "grid-rows-[auto_1fr]" : "grid-rows-[1fr_auto]"} gap-2`}>
            {(doorSide === "top" || doorSide === "left") && Door}
            <div className="space-y-2">
              {rows.map((count, r) => (
                <div key={r} className="flex justify-center gap-2">
                  {Array.from({ length: count }).map((_, c) => {
                    const key = deskKey(r, c)
                    const studentId = assignments[key] ?? null
                    return (
                      <div key={key} style={{ width: `calc((100% - ${(maxCols - 1) * 8}px) / ${maxCols})`, maxWidth: 90 }}>
                        <DeskCard
                          name={studentId ? (nameById.get(studentId) ?? "?") : null}
                          empty={!studentId}
                          selected={selected?.kind === "desk" && selected.key === key}
                          onClick={() => onDeskClick(key)}
                          onRemove={studentId ? () => onRemove(key) : undefined}
                        />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            {(doorSide === "bottom" || doorSide === "right") && Door}
          </div>
          {(boardSide === "bottom" || boardSide === "right") && Board}
        </div>
      </div>

      {pool.length > 0 && (
        <div>
          <p className="text-white/50 text-xs mb-2">תלמידים ללא מקום — הקישו כדי לשבץ</p>
          <div className="flex flex-wrap gap-2">
            {pool.map(s => (
              <button key={s.id} onClick={() => onPoolClick(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium interactive btn-press border ${
                  selected?.kind === "pool" && selected.id === s.id
                    ? "border-amber-400 bg-amber-400/15 text-white"
                    : "border-white/15 bg-white/8 text-white/75 hover:bg-white/15"
                }`}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-white/30 text-xs text-center leading-relaxed">
        הקישו על שולחן כדי לבחור אותו, ואז על שולחן אחר כדי להחליף ביניהם. אפשר גם לגרור תלמיד מהרשימה למעלה למקום פנוי.
      </p>

      <button onClick={onRegenerate}
        className="w-full py-3 rounded-2xl bg-white/10 text-white/80 font-medium text-sm interactive btn-press">
        🎲 הגרלה מחדש
      </button>
    </div>
  )
}

/* ── Canvas export — draws a clean floor-plan-style image for sharing ─── */
async function renderSeatingImage(opts: {
  rows: number[]; boardSide: Side; doorSide: Side
  roster: RosterItem[]; assignments: Record<string, string | null>
  title: string
}): Promise<Blob> {
  const { rows, boardSide, doorSide, roster, assignments, title } = opts
  const nameById = new Map(roster.map(s => [s.id, s.name]))
  const maxCols = Math.max(...rows, 1)

  const SCALE = 2
  const deskW = 108, deskH = 64, gap = 14
  const gridW = maxCols * deskW + (maxCols - 1) * gap
  const gridH = rows.length * deskH + (rows.length - 1) * gap
  const titleH = 64
  const barThick = 64
  const doorThick = 34

  const mTop = boardSide === "top" ? barThick : doorSide === "top" ? doorThick : 24
  const mBottom = boardSide === "bottom" ? barThick : doorSide === "bottom" ? doorThick : 24
  const mLeft = boardSide === "left" ? barThick : doorSide === "left" ? doorThick : 24
  const mRight = boardSide === "right" ? barThick : doorSide === "right" ? doorThick : 24

  const W = (mLeft + gridW + mRight)
  const H = (titleH + mTop + gridH + mBottom)

  const canvas = document.createElement("canvas")
  canvas.width = W * SCALE
  canvas.height = H * SCALE
  const ctx = canvas.getContext("2d")!
  ctx.scale(SCALE, SCALE)

  // background
  ctx.fillStyle = "#f7f5f0"
  ctx.fillRect(0, 0, W, H)

  // title
  ctx.fillStyle = "#1c1c1c"
  ctx.font = "700 22px system-ui, -apple-system, sans-serif"
  ctx.textAlign = "center"
  ctx.direction = "rtl"
  ctx.fillText(title || "סידור ישיבה", W / 2, 38)

  const gridX = mLeft
  const gridY = titleH + mTop

  // board bar
  ctx.fillStyle = "#1f2430"
  if (boardSide === "top") ctx.fillRect(gridX, titleH, gridW, barThick - 10)
  if (boardSide === "bottom") ctx.fillRect(gridX, titleH + mTop + gridH + 10, gridW, barThick - 10)
  if (boardSide === "left") ctx.fillRect(0, gridY, barThick - 10, gridH)
  if (boardSide === "right") ctx.fillRect(gridX + gridW + 10, gridY, barThick - 10, gridH)
  ctx.fillStyle = "#ffffff"
  ctx.font = "600 15px system-ui, sans-serif"
  ctx.textBaseline = "middle"
  if (boardSide === "top") ctx.fillText("לוח", gridX + gridW / 2, titleH + (barThick - 10) / 2)
  if (boardSide === "bottom") ctx.fillText("לוח", gridX + gridW / 2, titleH + mTop + gridH + 10 + (barThick - 10) / 2)
  if (boardSide === "left" || boardSide === "right") {
    ctx.save()
    const bx = boardSide === "left" ? (barThick - 10) / 2 : gridX + gridW + 10 + (barThick - 10) / 2
    ctx.translate(bx, gridY + gridH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText("לוח", 0, 0)
    ctx.restore()
  }

  // door tag (small, near the start of its edge)
  ctx.fillStyle = "#8a5a2b"
  ctx.font = "600 12px system-ui, sans-serif"
  const doorLabel = "🚪 דלת"
  if (doorSide === "top") { ctx.textAlign = "right"; ctx.fillText(doorLabel, gridX + gridW, titleH + doorThick / 2) }
  if (doorSide === "bottom") { ctx.textAlign = "right"; ctx.fillText(doorLabel, gridX + gridW, titleH + mTop + gridH + 10 + doorThick / 2) }
  if (doorSide === "left") { ctx.textAlign = "center"; ctx.fillText(doorLabel, doorThick / 2, gridY + 16) }
  if (doorSide === "right") { ctx.textAlign = "center"; ctx.fillText(doorLabel, gridX + gridW + 10 + doorThick / 2, gridY + 16) }

  // desks, row-centered
  ctx.textAlign = "center"
  rows.forEach((count, r) => {
    const rowW = count * deskW + (count - 1) * gap
    const startX = gridX + (gridW - rowW) / 2
    const y = gridY + r * (deskH + gap)
    for (let c = 0; c < count; c++) {
      const x = startX + c * (deskW + gap)
      const studentId = assignments[deskKey(r, c)] ?? null
      const name = studentId ? (nameById.get(studentId) ?? "") : null

      ctx.lineWidth = 1.5
      ctx.strokeStyle = name ? "#3a3a3a" : "#c8c3b8"
      ctx.fillStyle = name ? "#ffffff" : "#efece4"
      if (!name) ctx.setLineDash([5, 4]); else ctx.setLineDash([])
      const radius = 10
      ctx.beginPath()
      ctx.roundRect(x, y, deskW, deskH, radius)
      ctx.fill()
      ctx.stroke()
      ctx.setLineDash([])

      if (name) {
        ctx.fillStyle = "#1c1c1c"
        const parts = name.split(" ")
        let fontSize = 15
        ctx.font = `600 ${fontSize}px system-ui, sans-serif`
        while (ctx.measureText(name).width > deskW - 14 && fontSize > 10) {
          fontSize -= 1
          ctx.font = `600 ${fontSize}px system-ui, sans-serif`
        }
        if (parts.length > 1 && ctx.measureText(name).width > deskW - 14) {
          ctx.fillText(parts[0], x + deskW / 2, y + deskH / 2 - 9)
          ctx.fillText(parts.slice(1).join(" "), x + deskW / 2, y + deskH / 2 + 9)
        } else {
          ctx.fillText(name, x + deskW / 2, y + deskH / 2)
        }
      }
    }
  })

  return new Promise(resolve => canvas.toBlob(b => resolve(b!), "image/png"))
}

/* ── Page ────────────────────────────────────────────────────────────── */
export default function SeatingChartPage() {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [classId, setClassId] = useState<string | null>(null)
  const [charts, setCharts] = useState<ChartSummary[]>([])
  const [loadingCharts, setLoadingCharts] = useState(false)

  const [step, setStep] = useState<Step>("setup")
  const [chartId, setChartId] = useState<string | null>(null)
  const [chartName, setChartName] = useState("")
  const [rows, setRows] = useState<number[]>([6, 6, 6, 6])
  const [boardSide, setBoardSide] = useState<Side>("top")
  const [doorSide, setDoorSide] = useState<Side>("right")
  const [roster, setRoster] = useState<RosterItem[]>([])
  const [assignments, setAssignments] = useState<Record<string, string | null>>({})
  const [selected, setSelected] = useState<Selection>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(true)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    (async () => {
      const [clsRes, homeRes] = await Promise.all([
        fetch("/api/classes").then(r => r.json()).catch(() => ({ classes: [] })),
        fetch("/api/home").then(r => r.json()).catch(() => ({ classId: null })),
      ])
      setClasses(clsRes.classes ?? [])
      setClassId(homeRes.classId ?? clsRes.classes?.[0]?.id ?? null)
    })()
  }, [])

  useEffect(() => {
    if (!classId || step !== "setup") return
    setLoadingCharts(true)
    fetch(`/api/seating-charts?classId=${classId}`).then(r => r.json())
      .then(d => setCharts(d.charts ?? []))
      .finally(() => setLoadingCharts(false))
  }, [classId, step])

  // autosave, debounced — fires once a chart row exists
  useEffect(() => {
    if (!chartId) return
    setSaved(false)
    const t = setTimeout(async () => {
      await fetch(`/api/seating-charts/${chartId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: chartName, rows, boardSide, doorSide, roster,
          assignments: Object.entries(assignments).map(([k, v]) => {
            const [row, col] = k.split("-").map(Number)
            return { row, col, studentId: v }
          }),
        }),
      })
      setSaved(true)
    }, 700)
    return () => clearTimeout(t)
  }, [chartId, chartName, rows, boardSide, doorSide, roster, assignments])

  async function startNew() {
    if (!classId) return
    setBusy(true)
    const students = await fetch(`/api/class/students?classId=${classId}`).then(r => r.json()).catch(() => [])
    const roster0: RosterItem[] = (Array.isArray(students) ? students : []).map((s: any) => ({ id: s.id, name: s.name, manual: false }))
    const rows0 = [6, 6, 6, 6]
    const res = await fetch("/api/seating-charts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId, name: "", rows: rows0, boardSide: "top", doorSide: "right", roster: roster0, assignments: [] }),
    }).then(r => r.json())
    setChartId(res.chart.id)
    setChartName("")
    setRows(rows0)
    setBoardSide("top"); setDoorSide("right")
    setRoster(roster0)
    setAssignments({})
    setSelected(null)
    setStep("layout")
    setBusy(false)
  }

  async function loadExisting(id: string) {
    setBusy(true)
    const res = await fetch(`/api/seating-charts/${id}`).then(r => r.json())
    const c = res.chart
    setChartId(c.id)
    setChartName(c.name ?? "")
    setRows(c.rows?.length ? c.rows : [6, 6, 6, 6])
    setBoardSide(c.boardSide ?? "top")
    setDoorSide(c.doorSide ?? "right")
    setRoster(c.roster ?? [])
    const a: Record<string, string | null> = {}
    ;(c.assignments ?? []).forEach((x: any) => { a[deskKey(x.row, x.col)] = x.studentId })
    setAssignments(a)
    setSelected(null)
    setStep("result")
    setBusy(false)
  }

  async function deleteChart(id: string) {
    if (!confirm("למחוק את הסידור?")) return
    await fetch(`/api/seating-charts/${id}`, { method: "DELETE" })
    setCharts(charts.filter(c => c.id !== id))
  }

  function generate() {
    const keys: string[] = []
    rows.forEach((count, r) => { for (let c = 0; c < count; c++) keys.push(deskKey(r, c)) })
    const shuffled = [...roster].sort(() => Math.random() - 0.5)
    const next: Record<string, string | null> = {}
    keys.forEach((k, i) => { next[k] = shuffled[i]?.id ?? null })
    setAssignments(next)
    setSelected(null)
    setStep("result")
  }

  function swapDesks(a: string, b: string) {
    setAssignments(prev => {
      const next = { ...prev }
      const tmp = next[a] ?? null
      next[a] = next[b] ?? null
      next[b] = tmp
      return next
    })
  }

  function placeStudent(studentId: string, targetKey: string) {
    setAssignments(prev => {
      const next = { ...prev }
      const srcKey = Object.keys(next).find(k => next[k] === studentId)
      const displaced = next[targetKey] ?? null
      next[targetKey] = studentId
      if (srcKey && srcKey !== targetKey) next[srcKey] = displaced
      return next
    })
  }

  function onDeskClick(key: string) {
    if (!selected) { setSelected({ kind: "desk", key }); return }
    if (selected.kind === "desk") {
      if (selected.key === key) { setSelected(null); return }
      swapDesks(selected.key, key); setSelected(null); return
    }
    if (selected.kind === "pool") { placeStudent(selected.id, key); setSelected(null) }
  }

  function onPoolClick(id: string) {
    if (!selected) { setSelected({ kind: "pool", id }); return }
    if (selected.kind === "pool") { setSelected(selected.id === id ? null : { kind: "pool", id }); return }
    if (selected.kind === "desk") { placeStudent(id, selected.key); setSelected(null) }
  }

  function onRemove(key: string) {
    setAssignments(prev => ({ ...prev, [key]: null }))
  }

  async function handleShare() {
    setSharing(true)
    try {
      const blob = await renderSeatingImage({ rows, boardSide, doorSide, roster, assignments, title: chartName || "סידור ישיבה" })
      const file = new File([blob], `seating-chart.png`, { type: "image/png" })
      if (typeof navigator !== "undefined" && (navigator as any).canShare?.({ files: [file] })) {
        await (navigator as any).share({ files: [file], title: "סידור ישיבה", text: chartName || "סידור ישיבה" })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url; a.download = "seating-chart.png"; a.click()
        URL.revokeObjectURL(url)
      }
    } catch {}
    setSharing(false)
  }

  const stepTitles: Record<Step, string> = { setup: "סידור ישיבה כיתתי", layout: "פריסת שולחנות", roster: "רשימת תלמידים", result: chartName || "סידור ישיבה" }
  const backStep: Partial<Record<Step, Step>> = { layout: "setup", roster: "layout", result: "roster" }

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        {step === "setup" ? (
          <Link href="/home" className="text-white/60 hover:text-white text-2xl interactive leading-none">←</Link>
        ) : (
          <button onClick={() => setStep(backStep[step] ?? "setup")} className="text-white/60 hover:text-white text-2xl interactive leading-none">←</button>
        )}
        <div className="flex-1 min-w-0">
          {step === "result" ? (
            <input value={chartName} onChange={e => setChartName(e.target.value)} placeholder="שם לסידור (לדוגמה: מבחן אזרחות)"
              className="bg-transparent font-semibold text-lg text-white placeholder:text-white/30 w-full outline-none" />
          ) : (
            <h1 className="font-semibold text-lg text-white">{stepTitles[step]}</h1>
          )}
        </div>
        {step === "result" && <span className="text-white/25 text-[10px] flex-shrink-0">{saved ? "נשמר ✓" : "שומר..."}</span>}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {busy && <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />}

        {!busy && step === "setup" && (
          <SetupStep classes={classes} classId={classId} setClassId={setClassId}
            charts={charts} loadingCharts={loadingCharts}
            onNew={startNew} onLoad={loadExisting} onDelete={deleteChart} />
        )}

        {!busy && step === "layout" && (
          <LayoutStep rows={rows} setRows={setRows}
            boardSide={boardSide} setBoardSide={setBoardSide}
            doorSide={doorSide} setDoorSide={setDoorSide}
            onNext={() => setStep("roster")} />
        )}

        {!busy && step === "roster" && (
          <RosterStep roster={roster} setRoster={setRoster} onGenerate={generate} />
        )}

        {!busy && step === "result" && (
          <div className="space-y-5">
            <ResultStep rows={rows} boardSide={boardSide} doorSide={doorSide} roster={roster}
              assignments={assignments} selected={selected}
              onDeskClick={onDeskClick} onPoolClick={onPoolClick} onRemove={onRemove}
              onRegenerate={generate} />

            <div className="flex gap-2 pt-2">
              <button onClick={handleShare} disabled={sharing}
                className="flex-1 py-3.5 rounded-2xl bg-white text-black font-semibold text-sm interactive btn-press disabled:opacity-50">
                {sharing ? "מכין תמונה..." : "📤 שיתוף / הורדה"}
              </button>
            </div>
            <p className="text-white/25 text-[11px] text-center leading-relaxed">
              השיתוף פותח את חלון השיתוף הרגיל של הטלפון — משם בוחרים וואטסאפ (או כל אפליקציה אחרת) ושולחים כמו כל תמונה אחרת.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
