"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

// ── Types ────────────────────────────────────────────────────────────────────

interface SheetMetric {
  name: string
  target: string
  period: string
  graphInstr: string
  fillInstr: string
  mainValue: string
  categories: string[]
  results: { label: string; values: string[] }[]
}

interface SheetDomain {
  name: string
  desc: string
  tags: string[]
  metrics: SheetMetric[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT = "#fcd34d"
const GREEN  = "#4ade80"
const RED    = "#f87171"
const MUTED  = "rgba(255,255,255,.45)"
const TEXT   = "rgba(255,255,255,.9)"
const TRACK  = "rgba(255,255,255,.07)"

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = new Set([
  "ספטמבר","אוקטובר","נובמבר","דצמבר",
  "ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט",
])

// Smart extraction: uses mainValue hint if numeric, otherwise derives from results
function computeMainValue(m: SheetMetric): string {
  // 1. If גרף ראשי column starts with a number/%, use it directly
  if (m.mainValue) {
    const direct = m.mainValue.match(/^(\d+(?:\.\d+)?%?)/)
    if (direct) return direct[1]
  }

  // 2. Find first results row that has any data
  const row = m.results.find(r => r.values.some(v => v.trim()))
  if (!row) return ""

  // 3. Monthly categories → show most recent filled value
  const monthIdxs = m.categories
    .map((c, i) => (MONTH_NAMES.has(c) ? i : -1))
    .filter(i => i >= 0)
  if (monthIdxs.length > 0) {
    for (let i = monthIdxs.length - 1; i >= 0; i--) {
      const v = row.values[monthIdxs[i]]?.trim()
      if (v) return v
    }
    // fallback: count filled months
    const filled = monthIdxs.filter(i => row.values[i]?.trim()).length
    return `${filled}/${monthIdxs.length}`
  }

  // 4. Default → first value (usually the "overall" / average column)
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

// ── Donuts ────────────────────────────────────────────────────────────────────

function MainDonut({ pct, display, inverted = false }: {
  pct: number | null; display: string; inverted?: boolean
}) {
  const size    = 148
  const strokeW = 13
  const r       = (size - strokeW) / 2
  const circ    = 2 * Math.PI * r

  const pctArc  = pct !== null ? Math.max(0, Math.min(pct / 100, 1)) * circ : circ
  const restArc = pct !== null ? Math.max(0, 1 - pct / 100) * circ : 0

  const pctColor  = pct !== null ? (inverted ? RED  : GREEN) : ACCENT
  const restColor = inverted ? GREEN : RED

  const fontSize = display.length > 5 ? 18 : display.length > 3 ? 24 : 32

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={TRACK} strokeWidth={strokeW} />
        {pct !== null && restArc > 0 && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={restColor} strokeWidth={strokeW}
            strokeDasharray={`${restArc} ${circ - restArc}`}
            strokeDashoffset={-pctArc} />
        )}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={pctColor} strokeWidth={strokeW}
          strokeDasharray={`${pctArc} ${circ - pctArc}`}
          strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize, fontWeight: 900, color: TEXT,
          fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {display}
        </span>
      </div>
    </div>
  )
}

function GrayDonut() {
  const size = 148, strokeW = 13
  const r = (size - strokeW) / 2
  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(255,255,255,.12)" strokeWidth={strokeW} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: MUTED,
          textAlign: "center", padding: "0 16px", lineHeight: 1.4 }}>
          אין מידע
        </span>
      </div>
    </div>
  )
}

function TrendDonut({ up, down }: { up: number; down: number }) {
  const size = 148, strokeW = 13
  const r    = (size - strokeW) / 2
  const circ = 2 * Math.PI * r
  const total  = up + down
  const upLen  = total > 0 ? (up / total) * circ : 0
  const dnLen  = circ - upLen

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={TRACK} strokeWidth={strokeW} />
        {down > 0 && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={RED} strokeWidth={strokeW}
            strokeDasharray={`${dnLen} ${circ - dnLen}`}
            strokeDashoffset={-upLen} />
        )}
        {up > 0 && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={up >= down ? GREEN : ACCENT} strokeWidth={strokeW}
            strokeDasharray={`${upLen} ${circ - upLen}`}
            strokeLinecap="round" />
        )}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: GREEN, lineHeight: 1 }}>+{up}</span>
        <span style={{ fontSize: 22, fontWeight: 900, color: RED,   lineHeight: 1 }}>−{down}</span>
      </div>
    </div>
  )
}

// ── MetricCard ────────────────────────────────────────────────────────────────

function MetricCard({ m, active, onToggle }: {
  m: SheetMetric
  active: boolean
  onToggle: () => void
}) {
  const { display, pct } = parseMainValue(computeMainValue(m))

  const isGray   = display === "—"
  const isTrend  = m.name.includes("מגמות")
  const targetLower = m.target.trim().toLowerCase()
  const inverted = !isGray && !isTrend && pct !== null && (
    targetLower.startsWith("<") ||
    targetLower.startsWith("נמוך מ") ||
    targetLower.startsWith("פחות מ") ||
    targetLower.startsWith("קטן מ") ||
    targetLower.startsWith("לא יותר מ")
  )
  const trendData = isTrend ? m.mainValue.trim().match(/^(\d+)\/(\d+)$/) : null

  let donut
  if (isGray) {
    donut = <GrayDonut />
  } else if (isTrend && trendData) {
    donut = <TrendDonut up={parseInt(trendData[1])} down={parseInt(trendData[2])} />
  } else {
    donut = <MainDonut pct={pct} display={display} inverted={inverted} />
  }

  return (
    <button
      onClick={onToggle}
      style={{
        background: active ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.04)",
        border: `1px solid ${active ? "rgba(252,211,77,.35)" : "rgba(255,255,255,.08)"}`,
        borderRadius: 20,
        padding: "22px 16px 18px",
        cursor: "pointer",
        textAlign: "center",
        color: TEXT,
        width: "100%",
        transition: "background .18s, border-color .18s",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, lineHeight: 1.4,
        maxWidth: 160 }}>
        {m.name}
      </div>

      {donut}

      {m.target && (
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.95)" }}>
          🎯 {m.target}
        </div>
      )}
    </button>
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
                fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,.08)",
                whiteSpace: "nowrap" }}>
                שורה
              </th>
              {m.categories.map((cat, i) => (
                <th key={i} style={{ padding: "8px 14px", textAlign: "center", color: MUTED,
                  fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,.08)",
                  whiteSpace: "nowrap" }}>
                  {cat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.results.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                <td style={{ padding: "9px 14px", color: MUTED, fontWeight: 600,
                  whiteSpace: "nowrap" }}>
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
              <span style={{ color: MUTED, fontSize: 12 }}>
                {row.label || `שורה ${ri + 1}`}
              </span>
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

function DomainView({ domain }: { domain: SheetDomain }) {
  const [selected, setSelected] = useState<number | null>(null)

  const descParts = [domain.desc, domain.tags.length > 0 ? domain.tags.join(" · ") : ""].filter(Boolean)
  const fullDesc  = descParts.join(" — ")

  function toggle(i: number) {
    setSelected(selected === i ? null : i)
  }

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em",
          textTransform: "uppercase", color: ACCENT, marginBottom: 8 }}>תחום</div>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 800,
          letterSpacing: "-.5px", lineHeight: 1.15, marginBottom: 10, color: TEXT }}>
          {domain.name}
        </h1>
        {fullDesc && (
          <p style={{ fontSize: 14, color: MUTED, maxWidth: 600, lineHeight: 1.6 }}>
            {fullDesc}
          </p>
        )}
      </div>

      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 16 }}>
        {domain.metrics.map((m, i) => (
          <MetricCard key={i} m={m} active={selected === i} onToggle={() => toggle(i)} />
        ))}
      </div>

      {selected !== null && domain.metrics[selected] && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#1a2540",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 20,
              padding: "28px 24px 24px",
              maxWidth: 720, width: "100%",
              maxHeight: "80vh", overflowY: "auto",
              position: "relative",
            }}
          >
            <button
              onClick={() => setSelected(null)}
              style={{
                position: "absolute", top: 14, left: 14,
                background: "rgba(255,255,255,.08)", border: "none",
                borderRadius: 999, width: 30, height: 30,
                cursor: "pointer", color: TEXT, fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ✕
            </button>
            <DetailTable m={domain.metrics[selected]} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KpiPage() {
  const [domains, setDomains]     = useState<SheetDomain[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
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

  const safeTab = domains.length > 0 ? Math.min(activeTab, domains.length - 1) : 0

  return (
    <div className="min-h-screen" dir="rtl"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        color: TEXT }}>

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
          </div>
        </div>

        {domains.length > 1 && (
          <div className="border-b border-white/10"
            style={{ background: "rgba(10,18,35,.96)", backdropFilter: "blur(16px)" }}>
            <div className="max-w-5xl mx-auto px-4 flex overflow-x-auto"
              style={{ scrollbarWidth: "none" }}>
              {domains.map((d, i) => (
                <button key={i} onClick={() => setActiveTab(i)}
                  className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                    i === safeTab
                      ? "border-amber-300 text-amber-300"
                      : "border-transparent text-white/40 hover:text-white/65"
                  }`}>
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <main className="max-w-5xl mx-auto px-6 pt-8 pb-20">
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
            לא הוגדרו כתובות גיליונות (הגדר KPI_SHEET_1_URL ו-KPI_SHEET_2_URL ב-Vercel)
          </div>
        )}
        {!loading && !error && domains[safeTab] && (
          <DomainView key={safeTab} domain={domains[safeTab]} />
        )}
      </main>
    </div>
  )
}
