"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

interface RosterItem { id: string; name: string; manual: boolean }
interface ClassOption { id: string; name: string }
interface ChartSummary { id: string; name: string; updatedAt: string }
type Side = "top" | "bottom" | "left" | "right"
type Step = "setup" | "layout" | "roster" | "result"
type Selection = { kind: "seat"; key: string } | { kind: "pool"; id: string } | null

const SIDE_LABEL: Record<Side, string> = { top: "למעלה", bottom: "למטה", left: "שמאל", right: "ימין" }
const SIDES: Side[] = ["top", "bottom", "left", "right"]

// Each desk seats two — seat 0 and seat 1 — so a key is "depth-col-seat".
function seatKey(depth: number, col: number, seat: 0 | 1) { return `${depth}-${col}-${seat}` }

// Student names come from the school's own export as "משפחה פרטי" (family
// name first, given name after). Splits into the given name plus a family
// initial, used to build roster-wide display names below.
function splitName(full: string): { given: string; familyInitial: string } {
  const parts = full.trim().split(/\s+/)
  if (parts.length < 2) return { given: parts[0] ?? full, familyInitial: "" }
  const [family, ...rest] = parts
  return { given: rest.join(" "), familyInitial: family[0] ?? "" }
}

// Display name for the chart itself (grid + shared image), not the roster
// editor: just the given name — e.g. "משה" — and only when another student
// in the roster shares that given name does a family initial get appended,
// e.g. "משה כ.", so the two can be told apart.
function buildDisplayNames(roster: RosterItem[]): Map<string, string> {
  const counts = new Map<string, number>()
  roster.forEach(s => { const { given } = splitName(s.name); counts.set(given, (counts.get(given) ?? 0) + 1) })
  const map = new Map<string, string>()
  roster.forEach(s => {
    const { given, familyInitial } = splitName(s.name)
    const dup = (counts.get(given) ?? 0) > 1
    map.set(s.id, dup && familyInitial ? `${given} ${familyInitial}.` : given)
  })
  return map
}

/* ── Small side picker (board / door — can share a side) ──────────────── */
function SidePicker({ label, value, onChange }: { label: string; value: Side; onChange: (s: Side) => void }) {
  return (
    <div>
      <p className="text-white/50 text-xs mb-1.5">{label}</p>
      <div className="grid grid-cols-4 gap-1.5">
        {SIDES.map(s => (
          <button key={s} onClick={() => onChange(s)}
            className={`py-2 rounded-xl text-xs font-medium interactive btn-press transition-colors ${
              value === s ? "bg-white text-black" : "bg-white/8 text-white/70 hover:bg-white/15"
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

/* ── Compact live preview of the desk layout + board/door placement ───── */
function LayoutPreview({ cols, boardSide, doorSide, doorAtEnd }: {
  cols: number[]; boardSide: Side; doorSide: Side; doorAtEnd: boolean
}) {
  return (
    <div>
      <p className="text-white/50 text-xs mb-1.5">תצוגה מקדימה</p>
      <div className="glass rounded-2xl p-3 space-y-1.5" dir="ltr">
        <EdgeStrip side="top" hasBoard={boardSide === "top"} hasDoor={doorSide === "top"} doorAtEnd={doorAtEnd} />
        <div className="flex gap-1.5 items-stretch">
          <EdgeStrip side="left" hasBoard={boardSide === "left"} hasDoor={doorSide === "left"} doorAtEnd={doorAtEnd} />
          <div className="flex-1 flex gap-1.5">
            {cols.map((count, c) => (
              <div key={c} className="flex-1 flex flex-col gap-1">
                {Array.from({ length: count }).map((_, depth) => (
                  <div key={depth} className="rounded-md border border-dashed border-white/15 bg-white/[0.04] h-5" />
                ))}
              </div>
            ))}
          </div>
          <EdgeStrip side="right" hasBoard={boardSide === "right"} hasDoor={doorSide === "right"} doorAtEnd={doorAtEnd} />
        </div>
        <EdgeStrip side="bottom" hasBoard={boardSide === "bottom"} hasDoor={doorSide === "bottom"} doorAtEnd={doorAtEnd} />
      </div>
    </div>
  )
}

/* ── Step 2: desk layout editor — column by column, uneven depths ─────── */
function LayoutStep({ cols, setCols, boardSide, setBoardSide, doorSide, setDoorSide, doorAtEnd, setDoorAtEnd, onNext }: {
  cols: number[]; setCols: (c: number[]) => void
  boardSide: Side; setBoardSide: (s: Side) => void
  doorSide: Side; setDoorSide: (s: Side) => void
  doorAtEnd: boolean; setDoorAtEnd: (v: boolean) => void
  onNext: () => void
}) {
  const sameSide = boardSide === doorSide
  const horizontal = boardSide === "top" || boardSide === "bottom"
  const total = cols.reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-white/50 text-xs">סידור השולחנות בכיתה — טור אחר טור</p>
          <p className="text-white/40 text-xs nums">{total} שולחנות</p>
        </div>
        <p className="text-white/30 text-[11px] mb-2">כל טור יכול להיות באורך שונה — למשל טורי הצדדים ארוכים יותר מהטור האמצעי.</p>
        <div className="space-y-2">
          {cols.map((count, i) => (
            <div key={i} className="glass rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3">
              <span className="text-white/60 text-xs w-14 flex-shrink-0">טור {i + 1}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCols(cols.map((v, idx) => idx === i ? Math.max(1, v - 1) : v))}
                  className="w-8 h-8 rounded-lg bg-white/10 text-white text-lg interactive btn-press">−</button>
                <span className="text-white text-sm font-semibold w-6 text-center nums">{count}</span>
                <button onClick={() => setCols(cols.map((v, idx) => idx === i ? v + 1 : v))}
                  className="w-8 h-8 rounded-lg bg-white/10 text-white text-lg interactive btn-press">+</button>
              </div>
              <button onClick={() => setCols(cols.length > 1 ? cols.filter((_, idx) => idx !== i) : cols)}
                disabled={cols.length <= 1}
                className="text-white/25 hover:text-red-400 text-sm interactive disabled:opacity-20">הסר טור</button>
            </div>
          ))}
        </div>
        <button onClick={() => setCols([...cols, cols[cols.length - 1] ?? 4])}
          className="w-full mt-2 py-2.5 rounded-xl border border-dashed border-white/20 text-white/50 text-sm interactive hover:border-white/40 hover:text-white/70">
          + הוסף טור
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SidePicker label="איפה הלוח?" value={boardSide} onChange={setBoardSide} />
        <SidePicker label="איפה הדלת?" value={doorSide} onChange={setDoorSide} />
      </div>
      <p className="text-white/30 text-[11px] -mt-3">אפשר לבחור לדלת ולוח את אותו צד — הלוח יצטמצם כדי לפנות מקום לדלת.</p>

      {sameSide && (
        <div>
          <p className="text-white/50 text-xs mb-1.5">מיקום הדלת לצד הלוח</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => setDoorAtEnd(false)}
              className={`py-2 rounded-xl text-xs font-medium interactive btn-press transition-colors ${
                !doorAtEnd ? "bg-white text-black" : "bg-white/8 text-white/70 hover:bg-white/15"
              }`}>
              {horizontal ? "משמאל ללוח" : "מעל ללוח"}
            </button>
            <button onClick={() => setDoorAtEnd(true)}
              className={`py-2 rounded-xl text-xs font-medium interactive btn-press transition-colors ${
                doorAtEnd ? "bg-white text-black" : "bg-white/8 text-white/70 hover:bg-white/15"
              }`}>
              {horizontal ? "מימין ללוח" : "מתחת ללוח"}
            </button>
          </div>
        </div>
      )}

      <LayoutPreview cols={cols} boardSide={boardSide} doorSide={doorSide} doorAtEnd={doorAtEnd} />

      <button onClick={onNext}
        className="w-full py-3.5 rounded-2xl bg-white text-black font-semibold text-sm interactive btn-press">
        המשך לרשימת תלמידים →
      </button>
    </div>
  )
}

/* ── Step 3: roster editor (add/remove/rename students manually) ───────── */
function RosterStep({ roster, setRoster, onGenerate }: {
  roster: RosterItem[]; setRoster: (r: RosterItem[]) => void; onGenerate: () => void
}) {
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  function add() {
    const name = newName.trim()
    if (!name) return
    setRoster([...roster, { id: crypto.randomUUID(), name, manual: true }])
    setNewName("")
  }

  function startEdit(s: RosterItem) {
    setEditingId(s.id)
    setEditValue(s.name)
  }

  function commitEdit() {
    if (editingId) {
      const name = editValue.trim()
      if (name) setRoster(roster.map(x => x.id === editingId ? { ...x, name } : x))
    }
    setEditingId(null)
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
          <div key={s.id} className="glass rounded-xl px-3.5 py-2 flex items-center justify-between gap-2">
            {editingId === s.id ? (
              <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingId(null) }}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm outline-none" />
            ) : (
              <button onClick={() => startEdit(s)} className="flex-1 text-right interactive">
                <span className="text-white/80 text-sm">{s.name}{s.manual && <span className="text-white/30 text-xs mr-1.5">(נוסף ידנית)</span>}</span>
              </button>
            )}
            <div className="flex items-center gap-1 flex-shrink-0">
              {editingId !== s.id && (
                <button onClick={() => startEdit(s)} className="text-white/30 hover:text-white interactive px-1" aria-label="עריכת שם">✎</button>
              )}
              <button onClick={() => setRoster(roster.filter(x => x.id !== s.id))}
                className="text-white/30 hover:text-red-400 interactive px-1">✕</button>
            </div>
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

/* ── One seat within a shared desk ────────────────────────────────────── */
function SeatSlot({ name, selected, onClick, onRemove }: {
  name: string | null; selected: boolean; onClick: () => void; onRemove?: () => void
}) {
  const empty = !name
  return (
    <div onClick={onClick}
      className={`relative flex-1 flex items-center justify-center text-center px-1 py-2.5 cursor-pointer interactive transition-all ${
        selected ? "bg-amber-400/20 ring-2 ring-amber-400/50 rounded-md"
        : empty ? "text-white/15 hover:bg-white/5"
        : "text-white/90 hover:bg-white/10"
      }`}>
      <span className="text-[10px] leading-tight font-medium truncate">{name ?? "פנוי"}</span>
      {!empty && onRemove && (
        <button onClick={e => { e.stopPropagation(); onRemove() }}
          className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-black/70 text-white/70 text-[8px] flex items-center justify-center interactive">✕</button>
      )}
    </div>
  )
}

/* ── A desk — two seats side by side, sharing one outline ────────────── */
function DeskPair({ nameA, nameB, selectedA, selectedB, onClickA, onClickB, onRemoveA, onRemoveB }: {
  nameA: string | null; nameB: string | null; selectedA: boolean; selectedB: boolean
  onClickA: () => void; onClickB: () => void; onRemoveA?: () => void; onRemoveB?: () => void
}) {
  const bothEmpty = !nameA && !nameB
  return (
    <div className={`flex rounded-lg border min-h-[52px] divide-x divide-white/10 overflow-hidden ${
      bothEmpty ? "border-dashed border-white/15 bg-white/[0.02]" : "border-white/25 bg-white/8"
    }`}>
      <SeatSlot name={nameA} selected={selectedA} onClick={onClickA} onRemove={onRemoveA} />
      <SeatSlot name={nameB} selected={selectedB} onClick={onClickB} onRemove={onRemoveB} />
    </div>
  )
}

/* ── Board/door strip along one edge of the grid — may hold both ──────── */
// Rendered inside an ltr-forced wrapper (see ResultStep) so DOM order maps
// directly to left→right / top→bottom, matching the canvas export's pixel
// coordinates — doorAtEnd picks whether the door sits at the far end
// (right/bottom, DOM-last) or the near end (left/top, DOM-first).
function EdgeStrip({ side, hasBoard, hasDoor, doorAtEnd }: { side: Side; hasBoard: boolean; hasDoor: boolean; doorAtEnd: boolean }) {
  if (!hasBoard && !hasDoor) return null
  const horizontal = side === "top" || side === "bottom"
  const board = hasBoard ? (
    <div key="board" className={`flex-1 bg-white/25 rounded-xl flex items-center justify-center text-white/90 text-xs font-bold tracking-wide ${horizontal ? "py-2.5" : "px-2.5"}`}
      style={horizontal ? {} : { writingMode: "vertical-rl" }}>
      🖊 לוח
    </div>
  ) : null
  const door = hasDoor ? (
    <div key="door" className={`${hasBoard ? (horizontal ? "w-14" : "h-12") : "flex-1"} flex items-center justify-center text-white/40 text-[10px] font-medium`}
      style={horizontal ? {} : { writingMode: "vertical-rl" }}>
      🚪 דלת
    </div>
  ) : null
  const children = hasBoard && hasDoor ? (doorAtEnd ? [board, door] : [door, board]) : [board ?? door]
  return <div className={`flex ${horizontal ? "flex-row" : "flex-col h-full"} gap-2`}>{children}</div>
}

/* ── Step 4: result grid — editable, with board/door markers ──────────── */
function ResultStep({ cols, boardSide, doorSide, doorAtEnd, roster, assignments, selected, onSeatClick, onPoolClick, onRemove, onRegenerate }: {
  cols: number[]; boardSide: Side; doorSide: Side; doorAtEnd: boolean; roster: RosterItem[]
  assignments: Record<string, string | null>; selected: Selection
  onSeatClick: (key: string) => void; onPoolClick: (id: string) => void; onRemove: (key: string) => void
  onRegenerate: () => void
}) {
  const displayNames = useMemo(() => buildDisplayNames(roster), [roster])
  const assignedIds = useMemo(() => new Set(Object.values(assignments).filter(Boolean) as string[]), [assignments])
  const pool = roster.filter(s => !assignedIds.has(s.id))

  return (
    <div className="space-y-5">
      {/* Forced ltr: keeps column order and board/door placement pinned to
          fixed left/right, top/bottom positions matching the exported
          image's pixel coordinates — independent of the page's RTL flow. */}
      <div className="glass rounded-2xl p-4 space-y-2" dir="ltr">
        <EdgeStrip side="top" hasBoard={boardSide === "top"} hasDoor={doorSide === "top"} doorAtEnd={doorAtEnd} />
        <div className="flex gap-2 items-stretch">
          <EdgeStrip side="left" hasBoard={boardSide === "left"} hasDoor={doorSide === "left"} doorAtEnd={doorAtEnd} />
          <div className="flex-1 flex gap-2">
            {cols.map((count, c) => (
              <div key={c} className="flex flex-col gap-2" style={{ width: `calc((100% - ${(cols.length - 1) * 8}px) / ${cols.length})`, maxWidth: 130 }}>
                {Array.from({ length: count }).map((_, depth) => {
                  const keyA = seatKey(depth, c, 0), keyB = seatKey(depth, c, 1)
                  const idA = assignments[keyA] ?? null, idB = assignments[keyB] ?? null
                  return (
                    <DeskPair key={keyA}
                      nameA={idA ? (displayNames.get(idA) ?? "?") : null}
                      nameB={idB ? (displayNames.get(idB) ?? "?") : null}
                      selectedA={selected?.kind === "seat" && selected.key === keyA}
                      selectedB={selected?.kind === "seat" && selected.key === keyB}
                      onClickA={() => onSeatClick(keyA)}
                      onClickB={() => onSeatClick(keyB)}
                      onRemoveA={idA ? () => onRemove(keyA) : undefined}
                      onRemoveB={idB ? () => onRemove(keyB) : undefined}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          <EdgeStrip side="right" hasBoard={boardSide === "right"} hasDoor={doorSide === "right"} doorAtEnd={doorAtEnd} />
        </div>
        <EdgeStrip side="bottom" hasBoard={boardSide === "bottom"} hasDoor={doorSide === "bottom"} doorAtEnd={doorAtEnd} />
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
        כל שולחן משותף לשני תלמידים. הקישו על מקום כדי לבחור אותו, ואז על מקום אחר כדי להחליף ביניהם — או על תלמיד מהרשימה למעלה כדי לשבץ אותו למקום פנוי.
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
  cols: number[]; boardSide: Side; doorSide: Side
  doorAtEnd: boolean
  roster: RosterItem[]; assignments: Record<string, string | null>
  title: string
}): Promise<Blob> {
  const { cols, boardSide, doorSide, doorAtEnd, roster, assignments, title } = opts
  const displayNames = buildDisplayNames(roster)
  const maxDepth = Math.max(...cols, 1)

  const SCALE = 2
  const deskW = 176, deskH = 64, gap = 14
  const gridW = cols.length * deskW + (cols.length - 1) * gap
  const gridH = maxDepth * deskH + (maxDepth - 1) * gap
  const titleH = 64
  const barThick = 64
  const doorThick = 34
  const doorSpan = 96 // px of an edge reserved for the door tag when it shares a side with the board

  const marginFor = (side: Side) => boardSide === side ? barThick : doorSide === side ? doorThick : 24
  const mTop = marginFor("top"), mBottom = marginFor("bottom"), mLeft = marginFor("left"), mRight = marginFor("right")

  const W = mLeft + gridW + mRight
  const H = titleH + mTop + gridH + mBottom

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

  // board + door, drawn per edge — when they share an edge the board bar
  // shrinks to leave a slice of that same edge for the door tag.
  function drawEdge(side: Side) {
    const hasBoard = boardSide === side
    const hasDoor = doorSide === side
    if (!hasBoard && !hasDoor) return
    const horizontal = side === "top" || side === "bottom"
    const fullLen = horizontal ? gridW : gridH
    const thick = (hasBoard ? barThick : doorThick) - 10

    let boardStart = 0, boardLen = 0, doorStart = 0, doorLen = 0
    if (hasBoard && hasDoor) {
      if (doorAtEnd) {
        boardStart = 0; boardLen = fullLen - doorSpan - 10
        doorStart = boardLen + 10; doorLen = doorSpan
      } else {
        doorStart = 0; doorLen = doorSpan
        boardStart = doorLen + 10; boardLen = fullLen - doorSpan - 10
      }
    } else if (hasBoard) {
      boardLen = fullLen
    } else {
      doorLen = fullLen
    }

    let baseX = gridX, baseY = gridY
    if (side === "top") baseY = titleH
    if (side === "bottom") baseY = titleH + mTop + gridH + 10
    if (side === "left") baseX = 0
    if (side === "right") baseX = gridX + gridW + 10

    if (hasBoard) {
      ctx.fillStyle = "#1f2430"
      if (horizontal) ctx.fillRect(baseX + boardStart, baseY, boardLen, thick)
      else ctx.fillRect(baseX, baseY + boardStart, thick, boardLen)
      ctx.fillStyle = "#ffffff"
      ctx.font = "600 15px system-ui, sans-serif"
      ctx.textBaseline = "middle"
      if (horizontal) { ctx.textAlign = "center"; ctx.fillText("לוח", baseX + boardStart + boardLen / 2, baseY + thick / 2) }
      else {
        ctx.save(); ctx.translate(baseX + thick / 2, baseY + boardStart + boardLen / 2); ctx.rotate(-Math.PI / 2)
        ctx.textAlign = "center"; ctx.fillText("לוח", 0, 0); ctx.restore()
      }
    }
    if (hasDoor) {
      ctx.fillStyle = "#8a5a2b"
      ctx.font = "600 12px system-ui, sans-serif"
      ctx.textBaseline = "middle"
      const label = "🚪 דלת"
      if (horizontal) { ctx.textAlign = "center"; ctx.fillText(label, baseX + doorStart + doorLen / 2, baseY + thick / 2) }
      else {
        ctx.save(); ctx.translate(baseX + thick / 2, baseY + doorStart + doorLen / 2); ctx.rotate(-Math.PI / 2)
        ctx.textAlign = "center"; ctx.fillText(label, 0, 0); ctx.restore()
      }
    }
  }
  SIDES.forEach(drawEdge)

  // desks, column by column, top-aligned within each column — each seats two
  ctx.textAlign = "center"
  cols.forEach((count, c) => {
    const x = gridX + c * (deskW + gap)
    for (let depth = 0; depth < count; depth++) {
      const y = gridY + depth * (deskH + gap)
      const idA = assignments[seatKey(depth, c, 0)] ?? null
      const idB = assignments[seatKey(depth, c, 1)] ?? null
      const nameA = idA ? (displayNames.get(idA) ?? "") : null
      const nameB = idB ? (displayNames.get(idB) ?? "") : null
      const bothEmpty = !nameA && !nameB

      ctx.lineWidth = 1.5
      ctx.strokeStyle = bothEmpty ? "#c8c3b8" : "#3a3a3a"
      ctx.fillStyle = bothEmpty ? "#efece4" : "#ffffff"
      if (bothEmpty) ctx.setLineDash([5, 4]); else ctx.setLineDash([])
      const radius = 10
      ctx.beginPath()
      ctx.roundRect(x, y, deskW, deskH, radius)
      ctx.fill()
      ctx.stroke()
      ctx.setLineDash([])

      if (!bothEmpty) {
        ctx.strokeStyle = "#d8d4c8"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x + deskW / 2, y + 6)
        ctx.lineTo(x + deskW / 2, y + deskH - 6)
        ctx.stroke()
      }

      const halfW = deskW / 2
      ctx.textBaseline = "middle"
      ;[[nameA, x + halfW / 2], [nameB, x + halfW + halfW / 2]].forEach(([name, cx]) => {
        if (!name) return
        ctx.fillStyle = "#1c1c1c"
        let fontSize = 14
        ctx.font = `600 ${fontSize}px system-ui, sans-serif`
        while (ctx.measureText(name as string).width > halfW - 10 && fontSize > 9) {
          fontSize -= 1
          ctx.font = `600 ${fontSize}px system-ui, sans-serif`
        }
        ctx.fillText(name as string, cx as number, y + deskH / 2)
      })
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
  // Stored/sent to the API under the "rows" field for backward compatibility
  // with the Prisma column name, but now holds per-column desk depths.
  const [cols, setCols] = useState<number[]>([4, 4, 4, 4, 4, 4])
  const [boardSide, setBoardSide] = useState<Side>("top")
  const [doorSide, setDoorSide] = useState<Side>("right")
  const [doorAtEnd, setDoorAtEnd] = useState(true)
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
          name: chartName, rows: cols, boardSide, doorSide, doorAtEnd, roster,
          assignments: Object.entries(assignments).map(([k, v]) => {
            const [row, col, seat] = k.split("-").map(Number)
            return { row, col, seat, studentId: v }
          }),
        }),
      })
      setSaved(true)
    }, 700)
    return () => clearTimeout(t)
  }, [chartId, chartName, cols, boardSide, doorSide, doorAtEnd, roster, assignments])

  async function startNew() {
    if (!classId) return
    setBusy(true)
    const students = await fetch(`/api/class/students?classId=${classId}`).then(r => r.json()).catch(() => [])
    const roster0: RosterItem[] = (Array.isArray(students) ? students : []).map((s: any) => ({ id: s.id, name: s.name, manual: false }))
    const cols0 = [4, 4, 4, 4, 4, 4]
    const res = await fetch("/api/seating-charts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId, name: "", rows: cols0, boardSide: "top", doorSide: "right", doorAtEnd: true, roster: roster0, assignments: [] }),
    }).then(r => r.json())
    setChartId(res.chart.id)
    setChartName("")
    setCols(cols0)
    setBoardSide("top"); setDoorSide("right"); setDoorAtEnd(true)
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
    setCols(c.rows?.length ? c.rows : [4, 4, 4, 4, 4, 4])
    setBoardSide(c.boardSide ?? "top")
    setDoorSide(c.doorSide ?? "right")
    setDoorAtEnd(c.doorAtEnd ?? true)
    setRoster(c.roster ?? [])
    const a: Record<string, string | null> = {}
    ;(c.assignments ?? []).forEach((x: any) => { a[seatKey(x.row, x.col, x.seat === 1 ? 1 : 0)] = x.studentId })
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

  // Fills desk by desk, column by column (both seats of column 0's first
  // desk, then its second desk, …) so pairs are packed first — a lone
  // leftover student only lands on an otherwise-empty desk once every full
  // pair has one.
  function generate() {
    const keys: string[] = []
    cols.forEach((count, c) => { for (let depth = 0; depth < count; depth++) { keys.push(seatKey(depth, c, 0)); keys.push(seatKey(depth, c, 1)) } })
    const shuffled = [...roster].sort(() => Math.random() - 0.5)
    const next: Record<string, string | null> = {}
    keys.forEach((k, i) => { next[k] = shuffled[i]?.id ?? null })
    setAssignments(next)
    setSelected(null)
    setStep("result")
  }

  function swapSeats(a: string, b: string) {
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

  function onSeatClick(key: string) {
    if (!selected) { setSelected({ kind: "seat", key }); return }
    if (selected.kind === "seat") {
      if (selected.key === key) { setSelected(null); return }
      swapSeats(selected.key, key); setSelected(null); return
    }
    if (selected.kind === "pool") { placeStudent(selected.id, key); setSelected(null) }
  }

  function onPoolClick(id: string) {
    if (!selected) { setSelected({ kind: "pool", id }); return }
    if (selected.kind === "pool") { setSelected(selected.id === id ? null : { kind: "pool", id }); return }
    if (selected.kind === "seat") { placeStudent(id, selected.key); setSelected(null) }
  }

  function onRemove(key: string) {
    setAssignments(prev => ({ ...prev, [key]: null }))
  }

  async function handleShare() {
    setSharing(true)
    try {
      const blob = await renderSeatingImage({ cols, boardSide, doorSide, doorAtEnd, roster, assignments, title: chartName || "סידור ישיבה" })
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
          <LayoutStep cols={cols} setCols={setCols}
            boardSide={boardSide} setBoardSide={setBoardSide}
            doorSide={doorSide} setDoorSide={setDoorSide}
            doorAtEnd={doorAtEnd} setDoorAtEnd={setDoorAtEnd}
            onNext={() => setStep("roster")} />
        )}

        {!busy && step === "roster" && (
          <RosterStep roster={roster} setRoster={setRoster} onGenerate={generate} />
        )}

        {!busy && step === "result" && (
          <div className="space-y-5">
            <ResultStep cols={cols} boardSide={boardSide} doorSide={doorSide} doorAtEnd={doorAtEnd} roster={roster}
              assignments={assignments} selected={selected}
              onSeatClick={onSeatClick} onPoolClick={onPoolClick} onRemove={onRemove}
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
