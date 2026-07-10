import { NextResponse } from "next/server"

// Parse a single CSV row — handles quoted fields containing commas
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

// Map Hebrew or English track-type labels to canonical values
const TRACK_TYPE_MAP: Record<string, string> = {
  "חודשי": "checks", "חודשים": "checks", "checks": "checks",
  "תלמידים": "students", "students": "students",
  "מספרים": "numbers", "מספר": "numbers", "numbers": "numbers",
  "אחוזים": "percent", "אחוז": "percent", "percent": "percent",
  "מילולי": "text", "טקסט": "text", "text": "text",
}

export async function GET() {
  const url = process.env.KPI_SHEET_CSV_URL
  if (!url) {
    return NextResponse.json({ error: "KPI_SHEET_CSV_URL not set" }, { status: 500 })
  }

  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const csv = await res.text()

    const rows = csv.split(/\r?\n/).map(parseRow)
    if (rows.length < 2) return NextResponse.json([])

    // Expected columns (row 0 = headers, skipped):
    // 0: תחום  1: שם מטרה  2: תיאור  3: דגשים (;-sep)  4: מדד  5: יעד
    // 6: סוג מדידה  7: יעד גרף  8: תוויות (;-sep labels or plain count for checkboxes)
    const data = rows.slice(1).filter(r => r.some(c => c))

    type RawGoal = {
      domain: string
      name: string
      desc: string
      subgoals: string[]
      metrics: { text: string; target: string; trackType: string; gaugeTarget: number | null; checkLabels: string[] }[]
    }

    const goals: RawGoal[] = []
    const lastGoalByDomain = new Map<string, RawGoal>()

    for (const cols of data) {
      const [domain, name, desc, subgoalsRaw, text, target, trackTypeRaw, gaugeTargetRaw, checkLabelsRaw] = cols
      if (!domain) continue

      if (name) {
        const goal: RawGoal = {
          domain: domain.trim(),
          name: name.trim(),
          desc: (desc || "").trim(),
          subgoals: subgoalsRaw
            ? subgoalsRaw.split(";").map(s => s.trim()).filter(Boolean)
            : [],
          metrics: [],
        }
        goals.push(goal)
        lastGoalByDomain.set(domain.trim(), goal)
      } else if (text) {
        const goal = lastGoalByDomain.get(domain.trim())
        if (goal) {
          const trackType = TRACK_TYPE_MAP[(trackTypeRaw || "").trim().toLowerCase()] ?? "checks"
          const gaugeTargetNum = parseFloat((gaugeTargetRaw || "").trim())

          // Parse checkbox labels: "מפגש 1;מפגש 2;מפגש 3" → array
          // or a plain number "5" → ["1","2","3","4","5"]
          let checkLabels: string[] = []
          const labelsRaw = (checkLabelsRaw || "").trim()
          if (labelsRaw) {
            const asNum = parseInt(labelsRaw, 10)
            if (!isNaN(asNum) && String(asNum) === labelsRaw) {
              checkLabels = Array.from({ length: asNum }, (_, i) => String(i + 1))
            } else {
              checkLabels = labelsRaw.split(";").map(s => s.trim()).filter(Boolean)
            }
          }

          goal.metrics.push({
            text: text.trim(),
            target: (target || "").trim(),
            trackType,
            gaugeTarget: isNaN(gaugeTargetNum) ? null : gaugeTargetNum,
            checkLabels,
          })
        }
      }
    }

    return NextResponse.json(goals)
  } catch (err) {
    console.error("[kpi-sheet]", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
