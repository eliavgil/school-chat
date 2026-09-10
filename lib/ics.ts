// Minimal iCalendar (.ics) parser — just enough to pull events out of a
// Google Calendar export: unfolds wrapped lines per RFC 5545, then reads
// UID/SUMMARY/DTSTART out of each VEVENT block. Recurring events (RRULE)
// are read as their single anchor occurrence only — no recurrence expansion.

export interface ICSEvent {
  uid: string
  summary: string
  dateStr: string // YYYYMMDD, date-only (time of day is dropped — the app only shows events by day)
}

function unfoldLines(text: string): string[] {
  const raw = text.split(/\r\n|\n|\r/)
  const lines: string[] = []
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1)
    } else {
      lines.push(line)
    }
  }
  return lines
}

function unescapeText(v: string): string {
  return v.replace(/\\n/gi, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\")
}

export function parseICS(text: string): ICSEvent[] {
  const lines = unfoldLines(text)
  const events: ICSEvent[] = []
  let cur: { uid?: string; summary?: string; dtstart?: string } | null = null

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") { cur = {}; continue }
    if (line === "END:VEVENT") {
      if (cur?.dtstart && cur.summary) {
        const dateStr = cur.dtstart.replace(/[^0-9]/g, "").slice(0, 8)
        if (dateStr.length === 8) {
          events.push({ uid: cur.uid || `${dateStr}-${cur.summary}`, summary: cur.summary, dateStr })
        }
      }
      cur = null
      continue
    }
    if (!cur) continue

    const idx = line.indexOf(":")
    if (idx === -1) continue
    const key = line.slice(0, idx).split(";")[0].toUpperCase()
    const value = line.slice(idx + 1)

    if (key === "UID") cur.uid = value.trim()
    else if (key === "SUMMARY") cur.summary = unescapeText(value.trim())
    else if (key === "DTSTART") cur.dtstart = value.trim()
  }

  return events
}
