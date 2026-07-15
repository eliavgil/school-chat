"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────
interface SheetMetric {
  name: string; target: string; period: string
  graphInstr: string; fillInstr: string; mainValue: string
  categories: string[]; results: { label: string; values: string[] }[]
}
interface SheetDomain { name: string; desc: string; tags: string[]; metrics: SheetMetric[] }

type LayoutItem =
  | { kind: "metric"; name: string }
  | { kind: "header"; id: string; text: string }
interface DomainLayoutData {
  titleOverride?: string
  descOverride?: string
  items: LayoutItem[]
}
type LayoutStore = Record<string, DomainLayoutData>

// ── Constants ─────────────────────────────────────────────────────────────────
const ACCENT = "#fcd34d"
const GREEN  = "#4ade80"
const RED    = "#f87171"
const MUTED  = "rgba(255,255,255,.45)"
const TEXT   = "rgba(255,255,255,.9)"
const TRACK  = "rgba(255,255,255,.07)"
const LAYOUT_KEY = "kpi-layout-v1"

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTH_NAMES = new Set([
  "ספטמבר","אוקטובר","נובמבר","דצמבר",
  "ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט",
])

function computeMainValue(m: SheetMetric): string {
  if (m.mainValue) {
    const direct = m.mainValue.match(/^(\d+(?:\.\d+)?%?)/)
    if (direct) return direct[1]
  }
  const row = m.results.find(r => r.values.some(v => v.trim()))
  if (!row) return ""
  const monthIdxs = m.categories
    .map((c, i) => (MONTH_NAMES.has(c) ? i : -1))
    .filter(i => i >= 0)
  if (monthIdxs.length > 0) {
    for (let i = monthIdxs.length - 1; i >= 0; i--) {
      const v = row.values[monthIdxs[i]]?.trim()
      if (v) return v
    }
    const filled = monthIdxs.filter(i => row.values[i]?.trim()).length
    return `${filled}/${monthIdxs.length}`
  }
  return row.values[0]?.trim() ?? ""
}

function parseMainValue(s: string): { display: string; pct: number | null } {
  if (!s) return { display: "—", pct: null }
  const pctMatch = s.match(/^(\d+(?:\.\d+)?)%/)
  if (pctMatch) return { display: pctMatch[0], pct: parseFloat(pctMatch[1]) }
  const numMatch = s.match(/^(\d+(?:\.\d+)?)/)
  if (numMatch) return { display: numMatch[1], pct: null }
  return { display: "—", pct: null }
}

// ── Layout helpers ────────────────────────────────────────────────────────────
function loadLayout(): LayoutStore {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? "{}") } catch { return {} }
}

function saveLayout(layout: LayoutStore) {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)) } catch {}
}

function reconcileLayout(stored: DomainLayoutData | undefined, domain: SheetDomain): DomainLayoutData {
  const metricNames = new Set(domain.metrics.map(m => m.name))
  if (!stored) {
    return { items: domain.metrics.map(m => ({ kind: "metric" as const, name: m.name })) }
  }
  const items: LayoutItem[] = stored.items.filter(item =>
    item.kind === "header" || metricNames.has((item as Extract<LayoutItem, { kind: "metric" }>).name)
  )
  const inLayout = new Set(
    items.filter(i => i.kind === "metric").map(i => (i as Extract<LayoutItem, { kind: "metric" }>).name)
  )
  for (const m of domain.metrics) {
    if (!inLayout.has(m.name)) items.push({ kind: "metric", name: m.name })
  }
  return { ...stored, items }
}

// ── SVG Donut (viewBox-based, fully responsive) ───────────────────────────────
const VB   = 100
const SW   = 9
const RSVG = VB / 2 - SW / 2
const CIRC = 2 * Math.PI * RSVG

function MainDonut({ pct, display, inverted = false }: {
  pct: number | null; display: string; inverted?: boolean
}) {
  const pctArc  = pct !== null ? Math.max(0, Math.min(pct / 100, 1)) * CIRC : CIRC
  const restArc = pct !== null ? Math.max(0, 1 - pct / 100) * CIRC : 0
  const pctColor  = pct !== null ? (inverted ? RED : GREEN) : ACCENT
  const restColor = inverted ? GREEN : RED

  return (
    <div className="donut-wrap">
      <svg viewBox={`0 0 ${VB} ${VB}`} className="donut-svg">
        <circle cx={VB/2} cy={VB/2} r={RSVG} fill="none" stroke={TRACK} strokeWidth={SW} />
        {pct !== null && restArc > 0 && (
          <circle cx={VB/2} cy={VB/2} r={RSVG} fill="none" stroke={restColor} strokeWidth={SW}
            strokeDasharray={`${restArc} ${CIRC - restArc}`} strokeDashoffset={-pctArc} />
        )}
        <circle cx={VB/2} cy={VB/2} r={RSVG} fill="none" stroke={pctColor} strokeWidth={SW}
          strokeDasharray={`${pctArc} ${CIRC - pctArc}`} strokeLinecap="round" />
      </svg>
      <div className="donut-center">
        <span className={`donut-text${display.length > 3 ? " donut-text-sm" : ""}`}>
          {display}
        </span>
      </div>
    </div>
  )
}

function GrayDonut() {
  return (
    <div className="donut-wrap">
      <svg viewBox={`0 0 ${VB} ${VB}`} className="donut-svg">
        <circle cx={VB/2} cy={VB/2} r={RSVG} fill="none"
          stroke="rgba(255,255,255,.12)" strokeWidth={SW} />
      </svg>
      <div className="donut-center">
        <span className="donut-text donut-text-xs">אין מידע</span>
      </div>
    </div>
  )
}

function TrendDonut({ up, down }: { up: number; down: number }) {
  const total = up + down
  const upLen = total > 0 ? (up / total) * CIRC : 0
  const dnLen = CIRC - upLen
  return (
    <div className="donut-wrap">
      <svg viewBox={`0 0 ${VB} ${VB}`} className="donut-svg">
        <circle cx={VB/2} cy={VB/2} r={RSVG} fill="none" stroke={TRACK} strokeWidth={SW} />
        {down > 0 && (
          <circle cx={VB/2} cy={VB/2} r={RSVG} fill="none" stroke={RED} strokeWidth={SW}
            strokeDasharray={`${dnLen} ${CIRC - dnLen}`} strokeDashoffset={-upLen} />
        )}
        {up > 0 && (
          <circle cx={VB/2} cy={VB/2} r={RSVG} fill="none"
            stroke={up >= down ? GREEN : ACCENT} strokeWidth={SW}
            strokeDasharray={`${upLen} ${CIRC - upLen}`} strokeLinecap="round" />
        )}
      </svg>
      <div className="donut-center" style={{ flexDirection: "column", gap: 1 }}>
        <span className="donut-text donut-text-trend" style={{ color: GREEN }}>+{up}</span>
        <span className="donut-text donut-text-trend" style={{ color: RED }}>−{down}</span>
      </div>
    </div>
  )
}

// ── MetricCard ────────────────────────────────────────────────────────────────
function MetricCard({ m, active, onToggle, editMode, onMoveUp, onMoveDown, onAddHeader }: {
  m: SheetMetric; active: boolean; onToggle: () => void
  editMode: boolean; onMoveUp: () => void; onMoveDown: () => void; onAddHeader: () => void
}) {
  const { display, pct } = parseMainValue(computeMainValue(m))
  const isGray  = display === "—"
  const isTrend = m.name.includes("מגמות")
  const tgt     = m.target.trim().toLowerCase()
  const inverted = !isGray && !isTrend && pct !== null && (
    tgt.startsWith("<") || tgt.startsWith("נמוך מ") ||
    tgt.startsWith("פחות מ") || tgt.startsWith("קטן מ") ||
    tgt.startsWith("לא יותר מ")
  )
  const trendData = isTrend ? m.mainValue.trim().match(/^(\d+)\/(\d+)$/) : null

  let donut
  if (isGray) donut = <GrayDonut />
  else if (isTrend && trendData) donut = <TrendDonut up={parseInt(trendData[1])} down={parseInt(trendData[2])} />
  else donut = <MainDonut pct={pct} display={display} inverted={inverted} />

  if (editMode) {
    return (
      <div className="metric-card" style={{
        background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.12)",
        borderRadius: 20, textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        position: "relative",
      }}>
        <div style={{ display: "flex", gap: 4, alignSelf: "stretch", justifyContent: "flex-end" }}>
          <button onClick={onMoveUp} className="edit-btn">↑</button>
          <button onClick={onMoveDown} className="edit-btn">↓</button>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, lineHeight: 1.3 }}>{m.name}</div>
        <div style={{ width: "100%" }}>{donut}</div>
        <button onClick={onAddHeader} className="add-header-btn">＋ כותרת כאן</button>
      </div>
    )
  }

  return (
    <button onClick={onToggle} className="metric-card" style={{
      background: active ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.04)",
      border: `1px solid ${active ? "rgba(252,211,77,.35)" : "rgba(255,255,255,.08)"}`,
      borderRadius: 20, cursor: "pointer", textAlign: "center", color: TEXT, width: "100%",
      transition: "background .18s, border-color .18s",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, lineHeight: 1.35 }}>
        {m.name}
      </div>
      {donut}
      {m.target && (
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.9)" }}>
          🎯 {m.target}
        </div>
      )}
    </button>
  )
}

// ── HeaderItem ────────────────────────────────────────────────────────────────
function HeaderItem({ item, editMode, onMoveUp, onMoveDown, onDelete, onChangeText }: {
  item: Extract<LayoutItem, { kind: "header" }>
  editMode: boolean; onMoveUp: () => void; onMoveDown: () => void
  onDelete: () => void; onChangeText: (t: string) => void
}) {
  if (!editMode) {
    return (
      <div style={{
        gridColumn: "1 / -1",
        fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
        color: MUTED, padding: "6px 2px 2px",
        borderBottom: "1px solid rgba(255,255,255,.08)", marginBottom: 2,
      }}>
        {item.text}
      </div>
    )
  }
  return (
    <div style={{
      gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 6,
      background: "rgba(252,211,77,.06)", border: "1px dashed rgba(252,211,77,.25)",
      borderRadius: 10, padding: "6px 10px",
    }}>
      <span style={{ color: ACCENT, fontSize: 11, flexShrink: 0 }}>✦</span>
      <input
        value={item.text}
        onChange={e => onChangeText(e.target.value)}
        style={{
          flex: 1, background: "transparent", border: "none", outline: "none",
          color: TEXT, fontSize: 12, fontWeight: 700, minWidth: 0,
        }}
      />
      <button onClick={onMoveUp} className="edit-btn">↑</button>
      <button onClick={onMoveDown} className="edit-btn">↓</button>
      <button onClick={onDelete} className="edit-btn" style={{ color: RED }}>✕</button>
    </div>
  )
}

// ── Detail Table ──────────────────────────────────────────────────────────────
function CellValue({ v }: { v: string | undefined }) {
  const val = v?.trim() ?? ""
  if (!val) return <>—</>
  const parts = val.split(",").map(s => s.trim()).filter(Boolean)
  if (parts.length <= 1) return <>{val}</>
  return <>{parts.map((p, i) => <div key={i}>{p}</div>)}</>
}

function DetailTable({ m }: { m: SheetMetric }) {
  const hasCategories = m.categories.length > 0
  const hasResults    = m.results.length > 0

  return (
    <div style={{ marginTop: 20, background: "rgba(255,255,255,.03)",
      border: "1px solid rgba(255,255,255,.08)", borderRadius: 16,
      padding: "20px", overflowX: "auto" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 14,
        letterSpacing: ".1em", textTransform: "uppercase" }}>
        {m.name} — פירוט
      </div>
      {!hasCategories && !hasResults && (
        <div style={{ fontSize: 13, color: MUTED, textAlign: "center", padding: "12px 0" }}>
          אין נתונים נוספים
        </div>
      )}
      {hasCategories && hasResults && (
        <table style={{ width: "100%", borderCollapse: "collapse",
          fontSize: 12, direction: "rtl", minWidth: 400 }}>
          <thead>
            <tr>
              <th style={{ padding: "8px 14px", textAlign: "right", color: MUTED,
                fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,.08)", whiteSpace: "nowrap" }}>
                שורה
              </th>
              {m.categories.map((cat, i) => (
                <th key={i} style={{ padding: "8px 14px", textAlign: "center", color: MUTED,
                  fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,.08)", whiteSpace: "nowrap" }}>
                  {cat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.results.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                <td style={{ padding: "9px 14px", color: MUTED, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {row.label || `שורה ${ri + 1}`}
                </td>
                {m.categories.map((_, ci) => (
                  <td key={ci} style={{ padding: "9px 14px", textAlign: "center",
                    color: TEXT, fontVariantNumeric: "tabular-nums" }}>
                    <CellValue v={row.values[ci]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!hasCategories && hasResults && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {m.results.map((row, ri) => (
            <div key={ri} style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", padding: "9px 4px",
              borderBottom: "1px solid rgba(255,255,255,.05)" }}>
              <span style={{ color: MUTED, fontSize: 12 }}>{row.label || `שורה ${ri + 1}`}</span>
              <span style={{ color: TEXT, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                <CellValue v={row.values[0]} />
              </span>
            </div>
          ))}
        </div>
      )}
      {hasCategories && !hasResults && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {m.categories.map((cat, i) => (
            <span key={i} style={{ fontSize: 12, color: TEXT, padding: "5px 12px",
              background: "rgba(255,255,255,.06)", borderRadius: 999 }}>
              {cat}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── DomainView ────────────────────────────────────────────────────────────────
function DomainView({ domain, layoutData, onLayoutChange, editMode }: {
  domain: SheetDomain
  layoutData: DomainLayoutData
  onLayoutChange: (data: DomainLayoutData) => void
  editMode: boolean
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDesc,  setEditingDesc]  = useState(false)

  const title    = layoutData.titleOverride ?? domain.name
  const descBase = [domain.desc, domain.tags.join(" · ")].filter(Boolean).join(" — ")
  const desc     = layoutData.descOverride ?? descBase

  function updateItems(fn: (items: LayoutItem[]) => LayoutItem[]) {
    onLayoutChange({ ...layoutData, items: fn(layoutData.items) })
  }

  function moveItem(idx: number, dir: -1 | 1) {
    updateItems(items => {
      const next = [...items]
      const to = idx + dir
      if (to < 0 || to >= next.length) return items
      ;[next[idx], next[to]] = [next[to], next[idx]]
      return next
    })
  }

  function addHeaderAfter(idx: number) {
    updateItems(items => {
      const next = [...items]
      next.splice(idx + 1, 0, { kind: "header", id: `h-${Date.now()}`, text: "כותרת" })
      return next
    })
  }

  function deleteItem(idx: number) {
    updateItems(items => items.filter((_, i) => i !== idx))
  }

  function updateHeaderText(idx: number, text: string) {
    updateItems(items => items.map((item, i) =>
      i === idx && item.kind === "header" ? { ...item, text } : item
    ))
  }

  const metricMap = new Map(domain.metrics.map(m => [m.name, m]))

  return (
    <div>
      {/* Domain header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em",
          textTransform: "uppercase", color: ACCENT, marginBottom: 8 }}>תחום</div>

        {editMode && editingTitle ? (
          <input
            autoFocus
            value={layoutData.titleOverride ?? domain.name}
            onChange={e => onLayoutChange({ ...layoutData, titleOverride: e.target.value })}
            onBlur={() => setEditingTitle(false)}
            style={{ fontSize: "clamp(22px, 5vw, 42px)", fontWeight: 800, color: TEXT,
              background: "transparent", border: "none", borderBottom: `2px solid ${ACCENT}`,
              outline: "none", width: "100%", marginBottom: 10 }}
          />
        ) : (
          <h1
            onClick={() => editMode && setEditingTitle(true)}
            style={{ fontSize: "clamp(22px, 5vw, 42px)", fontWeight: 800,
              letterSpacing: "-.5px", lineHeight: 1.15, marginBottom: 10, color: TEXT,
              cursor: editMode ? "text" : undefined, display: "flex", alignItems: "center", gap: 8 }}
          >
            {title}
            {editMode && <span style={{ fontSize: 14, opacity: 0.4 }}>✏️</span>}
          </h1>
        )}

        {editMode && editingDesc ? (
          <textarea
            autoFocus
            value={layoutData.descOverride ?? descBase}
            onChange={e => onLayoutChange({ ...layoutData, descOverride: e.target.value })}
            onBlur={() => setEditingDesc(false)}
            rows={2}
            style={{ fontSize: 14, color: MUTED, background: "transparent", border: "none",
              borderBottom: `1px solid ${MUTED}`, outline: "none", width: "100%",
              resize: "none", lineHeight: 1.6 }}
          />
        ) : (
          <p
            onClick={() => editMode && setEditingDesc(true)}
            style={{ fontSize: 14, color: MUTED, maxWidth: 600, lineHeight: 1.6,
              cursor: editMode ? "text" : undefined, display: "flex", alignItems: "center", gap: 6 }}
          >
            {desc}
            {editMode && <span style={{ fontSize: 12, opacity: 0.4, flexShrink: 0 }}>✏️</span>}
          </p>
        )}
      </div>

      {/* Grid */}
      <div className="kpi-grid">
        {layoutData.items.map((item, i) => {
          if (item.kind === "header") {
            return (
              <HeaderItem
                key={item.id} item={item} editMode={editMode}
                onMoveUp={() => moveItem(i, -1)}
                onMoveDown={() => moveItem(i, 1)}
                onDelete={() => deleteItem(i)}
                onChangeText={text => updateHeaderText(i, text)}
              />
            )
          }
          const m = metricMap.get(item.name)
          if (!m) return null
          return (
            <MetricCard
              key={item.name} m={m}
              active={!editMode && selected === item.name}
              onToggle={() => { if (!editMode) setSelected(selected === item.name ? null : item.name) }}
              editMode={editMode}
              onMoveUp={() => moveItem(i, -1)}
              onMoveDown={() => moveItem(i, 1)}
              onAddHeader={() => addHeaderAfter(i)}
            />
          )
        })}
      </div>

      {/* Detail modal */}
      {!editMode && selected && metricMap.has(selected) && (
        <div onClick={() => setSelected(null)} style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#1a2540", border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 20, padding: "28px 24px 24px",
            maxWidth: 720, width: "100%", maxHeight: "80vh", overflowY: "auto",
            position: "relative",
          }}>
            <button onClick={() => setSelected(null)} style={{
              position: "absolute", top: 14, left: 14,
              background: "rgba(255,255,255,.08)", border: "none",
              borderRadius: 999, width: 30, height: 30, cursor: "pointer", color: TEXT,
              fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
            <DetailTable m={metricMap.get(selected)!} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function KpiPage() {
  const [domains,   setDomains]   = useState<SheetDomain[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [editMode,  setEditMode]  = useState(false)
  const [layout,    setLayout]    = useState<LayoutStore>({})

  useEffect(() => {
    setLayout(loadLayout())
    Promise.all([
      fetch("/api/kpi-mashov").then(r => r.json()).catch(() => null),
      fetch("/api/kpi-sheet").then(r => r.json()).catch(() => null),
    ]).then(([mashov, sheets]) => {
      const result: SheetDomain[] = []
      if (mashov && !mashov.error) result.push(mashov)
      if (Array.isArray(sheets)) result.push(...sheets)
      else if (sheets?.error && result.length === 0) setError(sheets.error)
      if (result.length > 0) setDomains(result)
    })
    .catch(e => setError(String(e)))
    .finally(() => setLoading(false))
  }, [])

  // Reconcile layout when domains arrive
  useEffect(() => {
    if (!domains.length) return
    setLayout(prev => {
      const next: LayoutStore = { ...prev }
      for (const d of domains) next[d.name] = reconcileLayout(prev[d.name], d)
      return next
    })
  }, [domains])

  function updateDomainLayout(domainName: string, data: DomainLayoutData) {
    setLayout(prev => {
      const next = { ...prev, [domainName]: data }
      setTimeout(() => saveLayout(next), 0)
      return next
    })
  }

  const safeTab = domains.length > 0 ? Math.min(activeTab, domains.length - 1) : 0
  const domain  = domains[safeTab]

  return (
    <div className="min-h-screen" dir="rtl"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", color: TEXT }}>

      <style>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (min-width: 640px) {
          .kpi-grid { grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 16px; }
        }
        .metric-card { padding: 10px 8px 10px; }
        @media (min-width: 640px) { .metric-card { padding: 22px 16px 18px; } }
        .donut-wrap {
          position: relative; width: 100%; max-width: 130px;
          aspect-ratio: 1; margin: 0 auto; container-type: inline-size;
        }
        .donut-svg { width: 100%; height: 100%; display: block; transform: rotate(-90deg); }
        .donut-center {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .donut-text {
          font-weight: 900; color: rgba(255,255,255,.9);
          font-variant-numeric: tabular-nums; line-height: 1;
          font-size: clamp(12px, 24cqi, 32px);
        }
        .donut-text-sm  { font-size: clamp(11px, 18cqi, 24px); }
        .donut-text-xs  { font-size: clamp(9px, 12cqi, 13px); text-align: center; padding: 0 10%; line-height: 1.4; }
        .donut-text-trend { font-size: clamp(11px, 19cqi, 24px); font-weight: 900; line-height: 1; font-variant-numeric: tabular-nums; }
        .edit-btn {
          background: rgba(255,255,255,.08); border: none; border-radius: 6px;
          padding: 3px 7px; color: rgba(255,255,255,.65); cursor: pointer;
          font-size: 11px; line-height: 1; transition: background .15s;
        }
        .edit-btn:hover { background: rgba(255,255,255,.16); color: white; }
        .add-header-btn {
          background: rgba(252,211,77,.06); border: 1px dashed rgba(252,211,77,.28);
          border-radius: 8px; padding: 4px 0; color: rgba(252,211,77,.6);
          cursor: pointer; font-size: 10px; font-weight: 600; width: 100%;
          transition: background .15s;
        }
        .add-header-btn:hover { background: rgba(252,211,77,.14); color: #fcd34d; }
      `}</style>

      {/* Header */}
      <div className="sticky top-0 z-20">
        <div className="bg-black/40 backdrop-blur-md border-b border-white/10 px-4 header-pt pb-3">
          <div className="flex items-center gap-3 max-w-5xl mx-auto">
            <Link href="/home"
              className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/70 hover:text-white interactive btn-press transition-colors">
              🏠
            </Link>
            <div className="flex-1">
              <div className="font-semibold text-white text-sm">לוח KPI</div>
              <div className="text-white/40 text-xs">מדדי הצלחה לאורך השנה</div>
            </div>
            {!loading && !error && domains.length > 0 && (
              <button
                onClick={() => setEditMode(e => !e)}
                style={{
                  background: editMode ? "rgba(252,211,77,.15)" : "rgba(255,255,255,.06)",
                  border: `1px solid ${editMode ? "rgba(252,211,77,.4)" : "rgba(255,255,255,.12)"}`,
                  borderRadius: 10, padding: "6px 14px",
                  color: editMode ? ACCENT : MUTED,
                  cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all .2s",
                }}
              >
                {editMode ? "✓ סיום עריכה" : "✏️ עריכה"}
              </button>
            )}
          </div>
        </div>

        {domains.length > 1 && (
          <div className="border-b border-white/10"
            style={{ background: "rgba(10,18,35,.96)", backdropFilter: "blur(16px)" }}>
            <div className="max-w-5xl mx-auto px-4 flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {domains.map((d, i) => (
                <button key={i} onClick={() => setActiveTab(i)}
                  className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                    i === safeTab ? "border-amber-300 text-amber-300" : "border-transparent text-white/40 hover:text-white/65"
                  }`}>
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 pt-8 pb-20">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div style={{ color: MUTED, fontSize: 14 }}>טוען נתונים...</div>
          </div>
        )}
        {error && (
          <div className="glass rounded-2xl p-6 text-center">
            <div style={{ color: RED, fontSize: 14, marginBottom: 6 }}>שגיאה בטעינת הנתונים</div>
            <div style={{ color: MUTED, fontSize: 12 }}>{error}</div>
          </div>
        )}
        {!loading && !error && domains.length === 0 && (
          <div className="glass rounded-2xl p-6 text-center" style={{ color: MUTED, fontSize: 14 }}>
            לא הוגדרו כתובות גיליונות (הגדר KPI_SHEET_1_URL / KPI_SHEET_2_URL ב-Vercel)
          </div>
        )}
        {!loading && !error && domain && (
          <DomainView
            key={safeTab}
            domain={domain}
            layoutData={layout[domain.name] ?? reconcileLayout(undefined, domain)}
            onLayoutChange={data => updateDomainLayout(domain.name, data)}
            editMode={editMode}
          />
        )}
      </main>
    </div>
  )
}
