// This school runs three distinct bell patterns across the week:
// א' (Sun), ג' (Tue), ד' (Wed) share one pattern; ה' (Thu) has its own; and
// ב' (Mon) has its own too — ב' and ה' looked identical at first but turned
// out not to be, so they were split into two separate dayTypes. DAY_TYPE_BH
// keeps its original value ("בה") for backward compatibility with existing
// BellSlot rows, even though it now means ה' alone rather than ב'+ה'.
export const DAY_TYPE_AGD = "אגד" // א, ג, ד
export const DAY_TYPE_B   = "ב"   // ב בלבד
export const DAY_TYPE_BH  = "בה"  // ה בלבד (שם היסטורי)

// JS Date.getDay(): 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
const WEEKDAY_TO_DAY_TYPE: Record<number, string | null> = {
  0: DAY_TYPE_AGD,
  1: DAY_TYPE_B,
  2: DAY_TYPE_AGD,
  3: DAY_TYPE_AGD,
  4: DAY_TYPE_BH,
  5: null, // Friday — no bell schedule defined
  6: null, // Saturday — no school
}

export function dayTypeForWeekday(jsDay: number): string | null {
  return WEEKDAY_TO_DAY_TYPE[jsDay] ?? null
}

export function dayTypeLabel(dayType: string): string {
  if (dayType === DAY_TYPE_AGD) return "א', ג', ד'"
  if (dayType === DAY_TYPE_B) return "ב'"
  if (dayType === DAY_TYPE_BH) return "ה'"
  return dayType
}

// The teacher's own personal weekly schedule (what they teach/do each period,
// across all classes) — stored via the same ScheduleSlot pipeline as a class
// schedule, but tagged with this fixed id instead of a real class, so it
// never depends on (or collides with) whichever class happens to be selected
// in the import picker or is set as the teacher's own classId.
export const TEACHER_OWN_SCHEDULE_ID = "teacher-own"
