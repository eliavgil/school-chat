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
  categories: string[]
  results: { label: string; values: string[] }[]
}

interface SheetDomain {
  name: string
  desc: string
  tags: string[]
  metrics: SheetMetric[]
}

type ChartType =
  | "donut_bars"
  | "monthly_trend"
  | "monthly_tiles"
  | "bagrut_bars"
  | "transfer"
  | "grouped_bars"
  | "numbered_list"
  | "task_list"
  | "segmented_bar"
  | "likert_bars"
  | "stat_only"

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT = "#fcd34d"
const GREEN  = "#4ade80"
const AMBER  = "#fbbf24"
const RED    = "#f87171"
const BLUE   = "#60a5fa"
const MUTED  = "rgba(255,255,255,.45)"
const TEXT   = "rgba(255,255,255,.9)"

const MONTH_NAMES = new Set(["ספטמבר","אוקטובר","נובמבר","דצמבר","ינואר","פברואר","מרץ","אפריל","מאי","יוני"])
const CLASS_TOTAL = 22

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePct(v: string): number {
  const n = parseFloat(v.replace("%", "").trim())
  return isNaN(n) ? 0 : n
}

function getChartType(m: SheetMetric): ChartType {
  const g = m.graphInstr
  const cats = m.categories
  if (g.includes("פאי")) return "donut_bars"
  if (cats.some(c => MONTH_NAMES.has(c))) {
    if (m.fillInstr.includes("לסמן") || m.fillInstr.includes("חודש")) return "monthly_tiles"
    return "monthly_trend"
  }
  if (g.includes("ממוצע שנתי") || g.includes("מגמה ביחס לחודש")) return "monthly_trend"
  if (cats.some(c => c.includes("הקבצה"))) return "transfer"
  if (cats.some(c => c.includes("מאגר"))) return "grouped_bars"
  if (g.includes("תלמידים שמסומנים") || g.includes("לא עומד")) return "bagrut_bars"
  if (g.includes("ביצע בהצטיינות") || g.includes("טרם השלים")) return "segmented_bar"
  if (g.includes("במידה רבה")) return "likert_bars"
  if (cats.includes("משימה 1") || cats.some(c => c.startsWith("משימה"))) return "task_list"
  if (g.includes("רשימה מ-1") || (cats.length > 0 && cats.every(c => /^\d+$/.test(c)))) return "numbered_list"
  return "stat_only"
}

type StatusColor = "green" | "amber" | "red"

function evalStatus(value: number, target: string): StatusColor {
  const high = target.match(/גבוה\s+מ[-–]?\s*(\d+)/)
  const low  = target.match(/נמוך\s+מ[-–]?\s*(\d+)/)
  const pctM = target.match(/(\d+)%/)
  if (high) return value > parseFloat(high[1]) ? "green" : "red"
  if (low)  return value < parseFloat(low[1])  ? "green" : "red"
  if (pctM) return value >= parseFloat(pctM[1]) ? "green" : "amber"
  return "amber"
}

const STATUS_COLOR: Record<StatusColor, string> = { green: GREEN, amber: AMBER, red: RED }
const STATUS_LABEL: Record<StatusColor, string> = { green: "✓ עמד ביעד", amber: "↗ בתהליך", red: "✗ מתחת ליעד" }
const STATUS_BG: Record<StatusColor, string> = {
  green: "rgba(74,222,128,.12)", amber: "rgba(251,191,36,.12)", red: "rgba(248,113,113,.12)"
}
const STATUS_BORDER: Record<StatusColor, string> = {
  green: "rgba(74,222,128,.3)", amber: "rgba(251,191,36,.3)", red: "rgba(248,113,113,.3)"
}

// ── Summary (collapsed view) ──────────────────────────────────────────────────

function getSummary(m: SheetMetric, chartType: ChartType): { main: string; sub: string } {
  const vals = m.results[0]?.values ?? []

  switch (chartType) {
    case "donut_bars":
      return { main: vals[0] ?? "—", sub: "ממוצע כיתתי" }

    case "monthly_trend": {
      const nums = m.categories.map((_, i) => vals[i] ? parsePct(vals[i]) : null)
      const filled = nums.filter(v => v !== null) as number[]
      const cur = filled[filled.length - 1]
      const prev = filled[filled.length - 2] ?? null
      if (cur === undefined) return { main: "—", sub: "חודש נוכחי" }
      const delta = prev !== null ? ` (${cur > prev ? "↑" : "↓"}${Math.abs(cur - prev).toFixed(0)}%)` : ""
      return { main: cur.toFixed(0) + "%", sub: "חודש נוכחי" + delta }
    }

    case "monthly_tiles": {
      const filled = vals.filter(v => v.trim()).length
      return { main: `${filled}/${m.categories.length}`, sub: "חודשים דווחו" }
    }

    case "bagrut_bars": {
      const totals = m.categories.map((_, i) => {
        const raw = vals[i] ?? ""
        const missing = raw ? raw.split(",").filter(s => s.trim()).length : 0
        return CLASS_TOTAL - missing
      })
      const avg = totals.length > 0 ? Math.round(totals.reduce((a, v) => a + v, 0) / totals.length) : 0
      return { main: `${avg}/${CLASS_TOTAL}`, sub: "עומדים בתנאים (ממוצע)" }
    }

    case "transfer": {
      const upTotal  = m.categories.filter(c => c.includes("עלו")).reduce((a, c) => a + (parseInt(vals[m.categories.indexOf(c)] ?? "0") || 0), 0)
      const downTotal = m.categories.filter(c => c.includes("ירדו")).reduce((a, c) => a + (parseInt(vals[m.categories.indexOf(c)] ?? "0") || 0), 0)
      const net = upTotal - downTotal
      return { main: (net >= 0 ? "+" : "") + net, sub: "נטו העברות הקבצה" }
    }

    case "grouped_bars": {
      const half = Math.floor(m.categories.length / 2)
      const avail  = m.categories.slice(0, half).reduce((a, _, i) => a + (parseInt(vals[i] ?? "0") || 0), 0)
      const actual = m.categories.slice(half).reduce((a, _, i) => a + (parseInt(vals[half + i] ?? "0") || 0), 0)
      const pct = avail > 0 ? Math.round((actual / avail) * 100) : 0
      return { main: pct + "%", sub: `שעות בוצעו (${actual}/${avail})` }
    }

    case "numbered_list": {
      const done = vals.filter(v => v.trim()).length
      return { main: `${done}/${m.categories.length}`, sub: "שיעורים הושלמו" }
    }

    case "task_list": {
      const total = m.results[0]?.values.reduce((a, v) => a + (parseInt(v) || 0), 0) ?? 0
      return { main: total === 0 ? "✓" : String(total), sub: total === 0 ? "כולם הגישו" : "לא הגישו סה״כ" }
    }

    case "segmented_bar": {
      const data = m.categories.map((_, i) => parseInt(vals[i] ?? "0") || 0)
      const total = data.reduce((a, v) => a + v, 0)
      const done  = data.slice(0, -1).reduce((a, v) => a + v, 0)
      return { main: `${done}/${total}`, sub: "ביצעו" }
    }

    case "likert_bars": {
      const data = m.categories.map((_, i) => parseInt(vals[i] ?? "0") || 0)
      const total = data.reduce((a, v) => a + v, 0)
      const high  = Math.round(((data[0] ?? 0) + (data[1] ?? 0)) / Math.max(total, 1) * 100)
      return { main: high + "%", sub: "שביעות רצון גבוהה" }
    }

    default:
      return { main: vals[0] ?? "—", sub: m.results[0]?.label ?? "" }
  }
}

// ── SVG Donut ─────────────────────────────────────────────────────────────────

function Donut({ value, color, size = 88 }: { value: number; color: string; size?: number }) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const filled = Math.min(value / 100, 1) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="10" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round" />
    </svg>
  )
}

// ── Shared bar row ─────────────────────────────────────────────────────────────

function BarRow({ label, value, max, color, note }: { label: string; value: number; max: number; color: string; note?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{label}</span>
        <span style={{ fontSize: 12, color: MUTED, fontVariantNumeric: "tabular-nums" }}>{note ?? String(value)}</span>
      </div>
      <div style={{ height: 9, background: "rgba(255,255,255,.06)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width .5s" }} />
      </div>
    </div>
  )
}

// ── Chart: DonutBars ──────────────────────────────────────────────────────────

function DonutBarsChart({ m }: { m: SheetMetric }) {
  const vals = m.results[0]?.values ?? []
  const overall = parsePct(vals[0] ?? "0")
  const isHigherBetter = m.graphInstr.includes("ממוצע") || m.target.includes("גבוה")
  const status = evalStatus(overall, m.target)
  const color = STATUS_COLOR[status]
  const subjectData = m.categories.slice(1).map((cat, i) => ({
    name: cat,
    value: parsePct(vals[i + 1] ?? "0"),
  })).filter(d => d.value > 0)
  const labelMax = isHigherBetter ? 100 : 20

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 22 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Donut value={isHigherBetter ? overall : overall * 5} color={color} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 22, fontWeight: 900, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {vals[0] ?? "—"}
            </span>
            <span style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>מ-100</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 3 }}>יעד: {m.target}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color }}>{STATUS_LABEL[status]}</div>
        </div>
      </div>
      <div>
        {subjectData.map(({ name, value }) => (
          <BarRow key={name} label={name} value={value} max={labelMax || 100}
            color={isHigherBetter
              ? value >= parsePct(m.target.replace(/[^\d]/g, "") || "80") ? GREEN : RED
              : value <= parsePct(m.target.replace(/[^\d.]/g, "") || "7") ? GREEN : RED}
            note={String(value) + (m.target.includes("%") ? "%" : "")} />
        ))}
      </div>
    </div>
  )
}

// ── Chart: MonthlyTrend ───────────────────────────────────────────────────────

function MonthlyTrendChart({ m }: { m: SheetMetric }) {
  const vals = m.results[0]?.values ?? []
  const data = m.categories.map((cat, i) => ({ month: cat, value: vals[i] ? parsePct(vals[i]) : null }))
  const filled = data.filter(d => d.value !== null)
  const current = filled[filled.length - 1]?.value ?? 0
  const prev = filled[filled.length - 2]?.value ?? null
  const avg = filled.length > 0 ? filled.reduce((a, d) => a + d.value!, 0) / filled.length : 0
  const isLow = m.target.includes("נמוך")
  const status = evalStatus(current, m.target)
  const trendUp = prev !== null && current > prev
  const trendLabel = prev !== null ? `${trendUp ? "↑" : "↓"} ${Math.abs(current - prev).toFixed(0)}%` : "—"
  const trendColor = isLow ? (trendUp ? RED : GREEN) : (trendUp ? GREEN : RED)
  const maxVal = Math.max(...filled.map(d => d.value!), parsePct(m.target.replace(/[^\d]/g, "") || "10")) * 1.2

  return (
    <div>
      <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
        {[
          { label: "ממוצע שנתי", val: avg.toFixed(1) + "%", color: MUTED },
          { label: "חודש נוכחי", val: current.toFixed(0) + "%", color: STATUS_COLOR[status] },
          { label: "לעומת קודם", val: trendLabel, color: trendColor },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 10, padding: "12px 16px", flex: 1, minWidth: 80 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>
      {data.map(({ month, value }) => (
        <div key={month} style={{ display: "grid", gridTemplateColumns: "80px 1fr 44px", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: MUTED, textAlign: "right" }}>{month}</span>
          <div>
            <div style={{ height: 9, background: "rgba(255,255,255,.06)", borderRadius: 999, overflow: "hidden" }}>
              {value !== null && (
                <div style={{ width: `${Math.min(100, (value / maxVal) * 100)}%`, height: "100%",
                  background: evalStatus(value, m.target) === "green" ? GREEN : RED,
                  borderRadius: 999, transition: "width .5s" }} />
              )}
            </div>
          </div>
          <span style={{ fontSize: 12, color: value !== null ? STATUS_COLOR[evalStatus(value, m.target)] : MUTED,
            fontVariantNumeric: "tabular-nums", textAlign: "left" }}>
            {value !== null ? value + "%" : "—"}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Chart: MonthlyTiles ───────────────────────────────────────────────────────

function MonthlyTilesChart({ m }: { m: SheetMetric }) {
  const vals = m.results[0]?.values ?? []
  const data = m.categories.map((month, i) => ({ month, value: vals[i] ? parsePct(vals[i]) : null }))

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
        {data.map(({ month, value }) => {
          const status = value !== null ? evalStatus(value, m.target) : null
          const col = status ? STATUS_COLOR[status] : MUTED
          const bg = status ? STATUS_BG[status] : "rgba(255,255,255,.03)"
          const border = status ? STATUS_BORDER[status] : "rgba(255,255,255,.08)"
          return (
            <div key={month} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10,
              padding: "12px 14px", opacity: value !== null ? 1 : 0.4 }}>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>{month}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: col, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                {value !== null ? value + "%" : "—"}
              </div>
              {value !== null && (
                <div style={{ height: 3, background: "rgba(255,255,255,.06)", borderRadius: 999, marginTop: 8 }}>
                  <div style={{ width: `${value}%`, height: "100%", background: col, borderRadius: 999 }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Chart: BagrutBars ─────────────────────────────────────────────────────────

function BagrutBarsChart({ m }: { m: SheetMetric }) {
  const vals = m.results[0]?.values ?? []
  return (
    <div>
      {m.categories.map((cond, i) => {
        const raw = vals[i] ?? ""
        const names = raw ? raw.split(",").map(s => s.trim()).filter(Boolean) : []
        const missing = names.length
        const compliant = CLASS_TOTAL - missing
        const pctVal = Math.round((compliant / CLASS_TOTAL) * 100)
        const color = pctVal === 100 ? GREEN : pctVal >= 85 ? AMBER : RED
        return (
          <div key={cond} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{cond}</span>
              <span style={{ fontSize: 11, color: MUTED, fontVariantNumeric: "tabular-nums" }}>
                {missing > 0 ? `${missing} לא עומדים` : "כולם עומדים"}
              </span>
            </div>
            <div style={{ height: 10, background: "rgba(255,255,255,.06)", borderRadius: 999, overflow: "hidden", marginBottom: 4 }}>
              <div style={{ width: `${pctVal}%`, height: "100%", background: color, borderRadius: 999, transition: "width .5s" }} />
            </div>
            {names.length > 0 && (
              <div style={{ fontSize: 11, color: MUTED }}>לא עומדים: {names.join(", ")}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Chart: Transfer ───────────────────────────────────────────────────────────

function TransferChart({ m }: { m: SheetMetric }) {
  const vals = m.results[0]?.values ?? []
  const upCats = m.categories.filter(c => c.includes("עלו"))
  const subjects = upCats.map(c => c.replace("עלו הקבצה ב", "").replace("עלו הקבצה", "").trim())

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {subjects.map((subject) => {
        const upIdx   = m.categories.findIndex(c => c.includes("עלו") && c.includes(subject))
        const downIdx = m.categories.findIndex(c => c.includes("ירדו") && c.includes(subject))
        const up   = parseInt(vals[upIdx]   ?? "0") || 0
        const down = parseInt(vals[downIdx] ?? "0") || 0
        const net  = up - down
        const maxVal = Math.max(up, down, 1)
        return (
          <div key={subject}>
            <div style={{ fontSize: 13, fontWeight: 700, color: MUTED, marginBottom: 10, textAlign: "center" }}>{subject}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,.06)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${(up / maxVal) * 100}%`, height: "100%", background: GREEN, borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 12, color: GREEN, fontWeight: 700, width: 32 }}>↑ {up}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,.06)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${(down / maxVal) * 100}%`, height: "100%", background: RED, borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 12, color: RED, fontWeight: 700, width: 32 }}>↓ {down}</span>
            </div>
            <div style={{ textAlign: "center", fontSize: 24, fontWeight: 900, color: net >= 0 ? GREEN : RED, fontVariantNumeric: "tabular-nums" }}>
              {net >= 0 ? "+" : ""}{net}
              <div style={{ fontSize: 11, fontWeight: 400, color: MUTED, marginTop: 2 }}>נטו</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Chart: GroupedBars ─────────────────────────────────────────────────────────

function GroupedBarsChart({ m }: { m: SheetMetric }) {
  const vals = m.results[0]?.values ?? []
  const half = Math.floor(m.categories.length / 2)
  const available = m.categories.slice(0, half).map((cat, i) => ({
    label: cat.replace("סך מאגר ", "").replace("שעות ", "").replace("סך ", ""),
    value: parseInt(vals[i] ?? "0") || 0,
  }))
  const actual = m.categories.slice(half).map((cat, i) => ({
    label: cat.replace("סך שעות ", "").replace("סך ", "").replace("שהתקיימו", "").trim(),
    value: parseInt(vals[half + i] ?? "0") || 0,
  }))
  const totalAvail  = available.reduce((a, d) => a + d.value, 0)
  const totalActual = actual.reduce((a, d) => a + d.value, 0)
  const pctOverall  = totalAvail > 0 ? Math.round((totalActual / totalAvail) * 100) : 0
  const status = evalStatus(pctOverall, m.target)
  const maxVal = Math.max(...available.map(d => d.value), 1)

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 40, fontWeight: 900, color: STATUS_COLOR[status], fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {pctOverall}%
        </span>
        <span style={{ fontSize: 13, color: MUTED }}>מהשעות בוצעו ({totalActual}/{totalAvail})</span>
      </div>
      <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
        {[{ label: "מוקצה", col: "rgba(96,165,250,.35)" }, { label: "בוצע", col: BLUE }].map(({ label, col }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTED }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: col, flexShrink: 0 }} />
            {label}
          </div>
        ))}
      </div>
      {available.map(({ label, value }, i) => {
        const act = actual[i]?.value ?? 0
        const actPct = Math.round((act / (value || 1)) * 100)
        return (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, marginBottom: 6 }}>{label}</div>
            {[
              { lbl: "מוקצה", val: value, col: "rgba(96,165,250,.35)", disp: `${value} ש׳` },
              { lbl: "בוצע",  val: act,   col: actPct >= 85 ? BLUE : actPct >= 70 ? AMBER : RED, disp: `${act} ש׳ (${actPct}%)` },
            ].map(({ lbl, val, col, disp }) => (
              <div key={lbl} style={{ display: "grid", gridTemplateColumns: "50px 1fr 80px", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: MUTED, textAlign: "right" }}>{lbl}</span>
                <div style={{ height: 8, background: "rgba(255,255,255,.06)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${(val / maxVal) * 100}%`, height: "100%", background: col, borderRadius: 999 }} />
                </div>
                <span style={{ fontSize: 11, color: MUTED, fontVariantNumeric: "tabular-nums" }}>{disp}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ── Chart: NumberedList ───────────────────────────────────────────────────────

function NumberedListChart({ m }: { m: SheetMetric }) {
  const vals = m.results[0]?.values ?? []
  const targetNum = parseInt(m.target.replace(/[^\d]/g, "")) || 10
  const done = vals.filter(v => v.trim()).length
  const slots = m.categories.map((num, i) => ({ num, topic: vals[i]?.trim() ?? "" }))
  const status = evalStatus(done, `גבוה מ-${targetNum - 1}`)

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
        <span style={{ fontSize: 36, fontWeight: 900, color: STATUS_COLOR[status], fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {done}
        </span>
        <span style={{ fontSize: 13, color: MUTED }}>מתוך {targetNum} שיעורים הושלמו</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {slots.map(({ num, topic }) => {
          const isDone = topic.length > 0
          return (
            <div key={num} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 13px",
              background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0,
                background: isDone ? "rgba(74,222,128,.15)" : "rgba(255,255,255,.05)",
                border: `1px solid ${isDone ? "rgba(74,222,128,.3)" : "rgba(255,255,255,.1)"}`,
                color: isDone ? GREEN : MUTED }}>
                {isDone ? "✓" : num}
              </div>
              <span style={{ fontSize: 13, color: isDone ? TEXT : MUTED }}>
                {topic || "טרם הוזן"}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Chart: TaskList ───────────────────────────────────────────────────────────

function TaskListChart({ m }: { m: SheetMetric }) {
  const counts = m.results[0]?.values ?? []
  const names  = m.results[1]?.values ?? []
  const topics = m.results[2]?.values ?? []

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {m.categories.map((task, i) => {
        const count   = parseInt(counts[i] ?? "0") || 0
        const missing = (names[i] ?? "").split(",").map(s => s.trim()).filter(Boolean)
        const topic   = topics[i]?.trim() ?? ""
        return (
          <div key={task} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)",
            borderRadius: 10, padding: "13px 15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{task}</span>
              {topic && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
                  background: "rgba(96,165,250,.1)", border: "1px solid rgba(96,165,250,.2)", color: BLUE }}>
                  {topic}
                </span>
              )}
            </div>
            {count > 0 ? (
              <>
                <div style={{ fontSize: 12, color: MUTED, marginBottom: 7 }}>{count} תלמידים לא הגישו:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {missing.map(name => (
                    <span key={name} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
                      background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.2)", color: RED }}>
                      {name}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: GREEN }}>כולם הגישו ✓</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Chart: SegmentedBar ───────────────────────────────────────────────────────

function SegmentedBarChart({ m }: { m: SheetMetric }) {
  const vals = m.results[0]?.values ?? []
  const data = m.categories.map((cat, i) => ({ cat, val: parseInt(vals[i] ?? "0") || 0 }))
  const total = data.reduce((a, d) => a + d.val, 0)
  const colors = [GREEN, "#22c55e", AMBER, RED]
  const completed = data.slice(0, -1).reduce((a, d) => a + d.val, 0)
  const status = evalStatus(Math.round((completed / Math.max(total, 1)) * 100), m.target)

  return (
    <div>
      <div style={{ display: "flex", height: 18, borderRadius: 999, overflow: "hidden", marginBottom: 16 }}>
        {data.map(({ cat, val }, i) => (
          <div key={cat} style={{ width: `${(val / Math.max(total, 1)) * 100}%`, background: colors[i] ?? MUTED, height: "100%" }} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {data.map(({ cat, val }, i) => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTED }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[i] ?? MUTED, flexShrink: 0 }} />
            {cat}
            <span style={{ fontWeight: 700, color: colors[i] ?? MUTED, fontVariantNumeric: "tabular-nums" }}>&nbsp;{val}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, fontSize: 13, color: STATUS_COLOR[status] }}>
        {completed}/{total} תלמידים ביצעו ברמה כלשהי
      </div>
    </div>
  )
}

// ── Chart: LikertBars ─────────────────────────────────────────────────────────

function LikertBarsChart({ m }: { m: SheetMetric }) {
  const vals = m.results[0]?.values ?? []
  const data = m.categories.map((cat, i) => ({ cat, val: parseInt(vals[i] ?? "0") || 0 }))
  const total = data.reduce((a, d) => a + d.val, 0)
  const maxVal = Math.max(...data.map(d => d.val), 1)
  const colors = [GREEN, "#4ade80", AMBER, RED, "#dc2626"]
  const highPct = Math.round(((data[0]?.val ?? 0) + (data[1]?.val ?? 0)) / Math.max(total, 1) * 100)
  const status = evalStatus(highPct, m.target)

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 36, fontWeight: 900, color: STATUS_COLOR[status], fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {highPct}%
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>שביעות רצון גבוהה — יעד: {m.target}</div>
      </div>
      {data.map(({ cat, val }, i) => (
        <div key={cat} style={{ display: "grid", gridTemplateColumns: "120px 1fr 28px", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: MUTED, textAlign: "right" }}>{cat}</span>
          <div style={{ height: 9, background: "rgba(255,255,255,.06)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${(val / maxVal) * 100}%`, height: "100%", background: colors[i] ?? MUTED, borderRadius: 999 }} />
          </div>
          <span style={{ fontSize: 12, color: MUTED, fontVariantNumeric: "tabular-nums", textAlign: "left" }}>{val}</span>
        </div>
      ))}
    </div>
  )
}

// ── Chart: StatOnly ───────────────────────────────────────────────────────────

function StatOnlyChart({ m }: { m: SheetMetric }) {
  const latest = m.results[m.results.length - 1]
  return (
    <div>
      {latest ? (
        <>
          <div style={{ fontSize: 42, fontWeight: 900, color: ACCENT, fontVariantNumeric: "tabular-nums", lineHeight: 1, marginBottom: 6 }}>
            {latest.values[0] ?? "—"}
          </div>
          <div style={{ fontSize: 12, color: MUTED }}>{latest.label}</div>
        </>
      ) : (
        <div style={{ fontSize: 14, color: MUTED }}>אין נתונים עדיין</div>
      )}
    </div>
  )
}

// ── MetricCard (collapsible) ──────────────────────────────────────────────────

const WIDE_CHARTS = new Set<ChartType>(["bagrut_bars", "grouped_bars", "monthly_tiles"])

function MetricCard({ m, wide }: { m: SheetMetric; wide?: boolean }) {
  const [open, setOpen] = useState(false)
  const chartType = getChartType(m)

  let statusColor: StatusColor = "amber"
  const firstVal = m.results[0]?.values[0]
  if (firstVal) {
    const num = parsePct(firstVal)
    if (!isNaN(num)) statusColor = evalStatus(num, m.target)
  }

  const summary = getSummary(m, chartType)

  return (
    <div className={wide ? "col-span-2" : ""} style={{
      background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
      borderRadius: 16, overflow: "hidden",
    }}>
      {/* Summary row — always visible, click to expand */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: "18px 20px 16px", textAlign: "right", color: TEXT,
          display: "flex", alignItems: "center", gap: 16 }}
      >
        {/* Big number */}
        <div style={{ flexShrink: 0, minWidth: 72, textAlign: "center" }}>
          <div style={{ fontSize: 38, fontWeight: 900, color: STATUS_COLOR[statusColor],
            fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {summary.main}
          </div>
          {summary.sub && (
            <div style={{ fontSize: 10, color: MUTED, marginTop: 3, lineHeight: 1.3 }}>{summary.sub}</div>
          )}
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, color: TEXT, marginBottom: 4 }}>{m.name}</div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 10, color: MUTED }}>{m.period}</span>
            <span style={{ fontSize: 10, color: MUTED }}>·</span>
            <span style={{ fontSize: 10, color: MUTED }}>יעד: {m.target}</span>
          </div>
        </div>

        {/* Status + chevron */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{ padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700,
            background: STATUS_BG[statusColor], border: `1px solid ${STATUS_BORDER[statusColor]}`,
            color: STATUS_COLOR[statusColor], whiteSpace: "nowrap" }}>
            {STATUS_LABEL[statusColor]}
          </div>
          <span style={{ fontSize: 11, color: MUTED, transition: "transform .2s",
            display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>
            ▾
          </span>
        </div>
      </button>

      {/* Expanded chart */}
      {open && (
        <>
          <div style={{ height: 1, background: "rgba(255,255,255,.07)", margin: "0 20px" }} />
          <div style={{ padding: "20px 20px 18px" }}>
            {chartType === "donut_bars"     && <DonutBarsChart m={m} />}
            {chartType === "monthly_trend"  && <MonthlyTrendChart m={m} />}
            {chartType === "monthly_tiles"  && <MonthlyTilesChart m={m} />}
            {chartType === "bagrut_bars"    && <BagrutBarsChart m={m} />}
            {chartType === "transfer"       && <TransferChart m={m} />}
            {chartType === "grouped_bars"   && <GroupedBarsChart m={m} />}
            {chartType === "numbered_list"  && <NumberedListChart m={m} />}
            {chartType === "task_list"      && <TaskListChart m={m} />}
            {chartType === "segmented_bar"  && <SegmentedBarChart m={m} />}
            {chartType === "likert_bars"    && <LikertBarsChart m={m} />}
            {chartType === "stat_only"      && <StatOnlyChart m={m} />}
          </div>
          {m.results[0]?.label && (
            <div style={{ padding: "8px 20px 14px", fontSize: 10, color: MUTED,
              display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_COLOR[statusColor], flexShrink: 0 }} />
              נתוני {m.results[0].label}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── DomainView ────────────────────────────────────────────────────────────────

function DomainView({ domain }: { domain: SheetDomain }) {
  const descParts = [domain.desc, domain.tags.length > 0 ? domain.tags.join(" · ") : ""].filter(Boolean)
  const fullDesc = descParts.join(" — ")

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase",
          color: ACCENT, marginBottom: 8 }}>תחום</div>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 800, letterSpacing: "-.5px",
          lineHeight: 1.15, marginBottom: 10, color: TEXT }}>{domain.name}</h1>
        {fullDesc && (
          <p style={{ fontSize: 14, color: MUTED, maxWidth: 600, lineHeight: 1.6 }}>{fullDesc}</p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {domain.metrics.map((m, i) => {
          const wide = WIDE_CHARTS.has(getChartType(m))
          return <MetricCard key={i} m={m} wide={wide} />
        })}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KpiPage() {
  const [domains, setDomains] = useState<SheetDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
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
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", color: TEXT }}>

      {/* Sticky header */}
      <div className="sticky top-0 z-20">
        <div className="bg-black/40 backdrop-blur-md border-b border-white/10 px-4 header-pt pb-3">
          <div className="flex items-center gap-3 max-w-5xl mx-auto">
            <Link href="/home" className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/70 hover:text-white interactive btn-press transition-colors">🏠</Link>
            <div className="flex-1">
              <div className="font-semibold text-white text-sm">לוח KPI</div>
              <div className="text-white/40 text-xs">מדדי הצלחה לאורך השנה</div>
            </div>
          </div>
        </div>

        {domains.length > 1 && (
          <div className="border-b border-white/10" style={{ background: "rgba(10,18,35,.96)", backdropFilter: "blur(16px)" }}>
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

      {/* Content */}
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
          <DomainView domain={domains[safeTab]} />
        )}
      </main>
    </div>
  )
}
