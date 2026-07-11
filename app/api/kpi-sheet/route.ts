import { NextResponse } from "next/server"

function parseRow(row: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQ = false
  for (let i = 0; i < row.length; i++) {
    const c = row[i]
    if (c === '"') {
      if (inQ && row[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (c === "," && !inQ) {
      out.push(cur.trim()); cur = ""
    } else {
      cur += c
    }
  }
  out.push(cur.trim())
  return out
}

const PERIODS = new Set(["רבעוני", "חודשי", "מחצית", "שנתי", "שבועי"])
const META_LABELS = new Set(["תחום", "מטרת על", "דגשים", "מדד"])
const RESULT_LABELS = new Set(["תוצאות", "שורת מעקב"])

export interface SheetMetric {
  name: string
  target: string
  period: string
  graphInstr: string
  fillInstr: string
  categories: string[]
  results: { label: string; values: string[] }[]
}

export interface SheetDomain {
  name: string
  desc: string
  tags: string[]
  metrics: SheetMetric[]
}

function parseSheet(csv: string, fallbackName: string): SheetDomain {
  const allRows = csv.split(/\r?\n/).map(parseRow)

  let name = fallbackName
  let desc = ""
  let tags: string[] = []

  const r0 = allRows[0]?.[0]?.trim() ?? ""
  if (r0 && !META_LABELS.has(r0)) {
    name = r0
    const r1 = allRows[1]?.[0]?.trim() ?? ""
    if (r1 && !META_LABELS.has(r1)) {
      desc = r1
      const r2 = allRows[2]?.[0]?.trim() ?? ""
      if (r2 && !META_LABELS.has(r2)) {
        tags = r2.split(",").map(s => s.trim()).filter(Boolean)
      }
    }
  }

  const metrics: SheetMetric[] = []
  let current: SheetMetric | null = null

  for (const cols of allRows) {
    if (!cols.some(c => c)) continue
    const c0 = cols[0]?.trim() ?? ""
    if (!c0 || META_LABELS.has(c0)) continue

    if (c0 === "קטגוריות לבדיקה") {
      if (current) current.categories = cols.slice(2).filter(Boolean)
      continue
    }
    if (RESULT_LABELS.has(c0)) {
      if (current) current.results.push({ label: cols[1]?.trim() ?? "", values: cols.slice(2) })
      continue
    }
    const period = cols[2]?.trim() ?? ""
    if (PERIODS.has(period)) {
      current = {
        name: c0.trim(),
        target: cols[1]?.trim() ?? "",
        period,
        graphInstr: cols[3]?.trim() ?? "",
        fillInstr: cols[4]?.trim() ?? "",
        categories: [],
        results: [],
      }
      metrics.push(current)
    }
  }

  return { name, desc, tags, metrics }
}

async function fetchCsv(url: string): Promise<string> {
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

export async function GET() {
  const configs = [
    { url: process.env.KPI_SHEET_1_URL ?? process.env.KPI_SHEET_CSV_URL, fallback: "הישגים לימודיים" },
    { url: process.env.KPI_SHEET_2_URL, fallback: "זהות וערכים" },
  ].filter(c => c.url)

  if (!configs.length) {
    return NextResponse.json({ error: "No sheet URLs configured (set KPI_SHEET_1_URL / KPI_SHEET_2_URL)" }, { status: 500 })
  }

  try {
    const domains = await Promise.all(
      configs.map(async ({ url, fallback }) => parseSheet(await fetchCsv(url!), fallback))
    )
    return NextResponse.json(domains)
  } catch (err) {
    console.error("[kpi-sheet]", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
