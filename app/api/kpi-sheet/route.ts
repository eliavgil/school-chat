import { NextResponse } from "next/server"

function parseCsv(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ""
  let inQ = false

  for (let i = 0; i < csv.length; i++) {
    const c = csv[i]
    if (c === '"') {
      if (inQ && csv[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (c === ',' && !inQ) {
      row.push(cur.trim()); cur = ""
    } else if (!inQ && (c === '\n' || c === '\r')) {
      if (c === '\r' && csv[i + 1] === '\n') i++
      row.push(cur.trim()); cur = ""
      rows.push(row); row = []
    } else {
      cur += c
    }
  }

  if (row.length > 0 || cur.trim()) {
    row.push(cur.trim())
    rows.push(row)
  }

  return rows
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
  mainValue: string
  categories: string[]
  results: { label: string; values: string[] }[]
}

export interface SheetDomain {
  name: string
  desc: string
  tags: string[]
  metrics: SheetMetric[]
}

// New format: each metric block = header row (col A="מדד", col B="נתון מרכזי") + data row
function isNewFormat(allRows: string[][]): boolean {
  return allRows.some(r => r[0]?.trim() === "מדד" && r[1]?.trim() === "נתון מרכזי")
}

function parseSheetNewFormat(allRows: string[][], fallbackName: string): SheetDomain {
  const metrics: SheetMetric[] = []

  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i]
    if (row[0]?.trim() !== "מדד" || row[1]?.trim() !== "נתון מרכזי") continue

    // Find next non-empty row = data row
    let di = i + 1
    while (di < allRows.length && !allRows[di].some(c => c.trim())) di++
    if (di >= allRows.length) continue

    const data = allRows[di]
    const metricName = data[0]?.trim()
    if (!metricName || metricName === "מדד") continue

    const categories = row.slice(6).filter(c => c.trim())
    const vals = data.slice(6)

    metrics.push({
      name: metricName,
      mainValue:  data[1]?.trim() ?? "",
      graphInstr: data[2]?.trim() ?? "",  // תיאור נתון מרכזי
      target:     data[3]?.trim() ?? "",
      period:     data[4]?.trim() ?? "",
      fillInstr:  data[5]?.trim() ?? "",  // נתונים נוספים
      categories,
      results: vals.some(v => v.trim()) ? [{ label: "", values: vals }] : [],
    })

    i = di
  }

  return { name: fallbackName, desc: "", tags: [], metrics }
}

function parseSheet(csv: string, fallbackName: string): SheetDomain {
  const allRows = parseCsv(csv)

  if (isNewFormat(allRows)) return parseSheetNewFormat(allRows, fallbackName)

  // Legacy format
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
        mainValue:  cols[4]?.trim() ?? "",
        fillInstr:  cols[5]?.trim() ?? "",
        categories: [],
        results: [],
      }
      metrics.push(current)
    }
  }

  return { name, desc, tags, metrics }
}

async function fetchCsv(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow", cache: "no-store" })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url.slice(0, 80)}`)
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
