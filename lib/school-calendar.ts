// Israeli school calendar תשפ"ו (2025-26) + תשפ"ז (2026-27)

export interface Vacation {
  name: string
  start: string // YYYY-MM-DD inclusive
  end: string   // YYYY-MM-DD exclusive (first day back)
}

export const SCHOOL_VACATIONS: Vacation[] = [
  // ── תשפ"ו 2025-2026 ──────────────────────────────────
  { name: "ראש השנה",     start: "2025-09-22", end: "2025-09-25" },
  { name: "יום כיפור",    start: "2025-10-01", end: "2025-10-03" },
  { name: "סוכות",        start: "2025-10-06", end: "2025-10-14" },
  { name: "חנוכה",        start: "2025-12-25", end: "2026-01-02" },
  { name: "פורים",        start: "2026-03-12", end: "2026-03-16" },
  { name: "פסח",          start: "2026-04-01", end: "2026-04-09" },
  { name: "יום העצמאות",  start: "2026-04-29", end: "2026-04-30" },
  { name: "שבועות",       start: "2026-05-21", end: "2026-05-24" },
  { name: "חופש גדול",    start: "2026-06-26", end: "2026-09-01" },
  // ── תשפ"ז 2026-2027 ──────────────────────────────────
  { name: "ראש השנה",     start: "2026-09-11", end: "2026-09-14" },
  { name: "יום כיפור",    start: "2026-09-20", end: "2026-09-22" },
  { name: "סוכות",        start: "2026-09-25", end: "2026-10-04" },
  { name: "חנוכה",        start: "2026-12-14", end: "2026-12-23" },
  { name: "פורים",        start: "2027-03-02", end: "2027-03-04" },
  { name: "פסח",          start: "2027-03-22", end: "2027-03-31" },
  { name: "יום העצמאות",  start: "2027-04-22", end: "2027-04-23" },
  { name: "שבועות",       start: "2027-06-11", end: "2027-06-14" },
  { name: "חופש גדול",    start: "2027-06-25", end: "2028-09-01" },
]

// Start of current school year (used for remaining-days baseline)
export const SCHOOL_YEAR_START = new Date("2026-09-01T00:00:00")
export const SUMMER_START      = new Date("2027-06-25T00:00:00")

function dateStr(d: Date): string { return d.toISOString().slice(0, 10) }

export function isVacationDay(date: Date): boolean {
  const ds = dateStr(date)
  return SCHOOL_VACATIONS.some(v => ds >= v.start && ds < v.end)
}

export function isWeekend(date: Date): boolean { return date.getDay() === 6 }

export function isSchoolDay(date: Date): boolean {
  return !isWeekend(date) && !isVacationDay(date)
}

/** School days from today until end of year */
export function getRemainingSchoolDays(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // If in summer, count from Sept 1
  const from = today < SCHOOL_YEAR_START ? new Date(SCHOOL_YEAR_START) : today
  let count = 0
  const cur = new Date(from)
  while (cur < SUMMER_START) {
    if (isSchoolDay(cur)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

/** Calendar days until חופש גדול */
export function getDaysUntilSummer(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = SUMMER_START.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

/** Next upcoming vacation that hasn't started yet (skips current summer) */
export function getNextVacation(): Vacation | null {
  const today = dateStr(new Date())
  return SCHOOL_VACATIONS.find(v => v.start > today && v.name !== "חופש גדול") ?? null
}

/** Days until next vacation */
export function getDaysUntilNextVacation(): number {
  const v = getNextVacation()
  if (!v) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = new Date(v.start).getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}
