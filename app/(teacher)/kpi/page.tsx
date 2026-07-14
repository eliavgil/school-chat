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

function parseMainValue(s: string): { display: string; pct: number | null } {
  if (!s) return { display: "—", pct: null }
  const pctMatch = s.match(/^(\d+(?:\.\d+)?)%/)
  if (pctMatch) return { display: pctMatch[0], pct: parseFloat(pctMatch[1]) }
  const numMatch = s.match(/^(\d+(?:\.\d+)?)/)
  if (numMatch) return { display: numMatch[1], pct: null }
  return { display: s, pct: null }
}

// ── Main Donut ────────────────────────────────────────────────────────────────

function MainDonut({ pct, display }: { pct: number | null; display: string }) {
  const size    = 148
  const strokeW = 13
  const r       = (size - strokeW) / 2
  const circ    = 2 * Math.PI * r

  const greenLen = pct !== null ? Math.max(0, Math.min(pct / 100, 1)) * circ : circ
  const redLen   = pct !== null ? Math.max(0, 1 - pct / 100) * circ : 0
  const arcColor = pct !== null ? GREEN : ACCENT
  const fontSize = display.length > 5 ? 18 : display.length > 3 ? 24 : 32

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={TRACK} strokeWidth={strokeW} />
        {/* Red remainder */}
        {pct !== null && redLen > 0 && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={RED} strokeWidth={strokeW}
            strokeDasharray={`${redLen} ${circ - redLen}`}
            strokeDashoffset={-greenLen} />
        )}
        {/* Green / accent progress arc */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={arcColor} strokeWidth={strokeW}
          strokeDasharray={`${greenLen} ${circ - greenLen}`}
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

// ── MetricCard ────────────────────────────────────────────────────────────────

function MetricCard({ m, active, onToggle }: {
  m: SheetMetric
  active: boolean
  onToggle: () => void
}) {
  const { display, pct } = parseMainValue(m.mainValue)

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

      <MainDonut pct={pct} display={display} />

      <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
        <span>יעד — {m.target}</span>
        {m.period && (
          <>
            <span style={{ margin: "0 5px" }}>·</span>
            <span>{m.period}</span>
          </>
        )}
      </div>
    </button>
  )
}

// ── Detail Table ──────────────────────────────────────────────────────────────

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
                    {row.values[ci] ?? "—"}
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
                {row.values[0] ?? "—"}
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
        <DetailTable m={domain.metrics[selected]} />
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
    fetch("/api/kpi-sheet")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setDomains(data)
        else if (data?.error) setError(data.error)
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
