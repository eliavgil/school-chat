// Israeli school calendar 2025-2026 (תשפ"ו)
// Source: Ministry of Education + Hebrew calendar

export interface Vacation {
  name: string
  start: string // YYYY-MM-DD inclusive
  end: string   // YYYY-MM-DD exclusive (first day back)
}

export const SCHOOL_VACATIONS: Vacation[] = [
  { name: "ראש השנה",     start: "2025-09-22", end: "2025-09-25" },
  { name: "יום כיפור",    start: "2025-10-01", end: "2025-10-03" },
  { name: "סוכות",        start: "2025-10-06", end: "2025-10-14" },
  { name: "חנוכה",        start: "2025-12-25", end: "2026-01-02" },
  { name: "פורים",        start: "2026-03-12", end: "2026-03-16" },
  { name: "פסח",          start: "2026-04-01", end: "2026-04-09" },
  { name: "יום העצמאות",  start: "2026-04-29", end: "2026-04-30" },
  { name: "שבועות",       start: "2026-05-21", end: "2026-05-24" },
  { name: "חופש גדול",    start: "2026-06-26", end: "2027-09-01" },
]

// Last school day of the year (inclusive)
export const SUMMER_START = new Date("2026-06-26T00:00:00")

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function isVacationDay(date: Date): boolean {
  const ds = dateStr(date)
  return SCHOOL_VACATIONS.some(v => ds >= v.start && ds < v.end)
}

// Saturday = 6 (no school). Friday = 5 (school in some Israeli schools — we keep it)
export function isWeekend(date: Date): boolean {
  return date.getDay() === 6
}

export function isSchoolDay(date: Date): boolean {
  return !isWeekend(date) && !isVacationDay(date)
}

/** Count school days from today (inclusive) until summer vacation */
export function getRemainingSchoolDays(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let count = 0
  const cur = new Date(today)
  while (cur < SUMMER_START) {
    if (isSchoolDay(cur)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

/** Calendar days until summer vacation (first day of חופש גדול) */
export function getDaysUntilSummer(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = SUMMER_START.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

/** First upcoming vacation that hasn't started yet */
export function getNextVacation(): Vacation | null {
  const today = dateStr(new Date())
  return SCHOOL_VACATIONS.find(v => v.start > today) ?? null
}

/** Days until the next vacation starts */
export function getDaysUntilNextVacation(): number {
  const v = getNextVacation()
  if (!v) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = new Date(v.start).getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}
