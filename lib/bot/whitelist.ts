// Hard-coded category whitelist — only these topics get an auto-response.
// Everything else goes straight to the teacher, no AI attempt.

export type AllowedCategory = "attendance" | "grade" | "schedule"

export const ALLOWED_CATEGORIES: AllowedCategory[] = [
  "attendance",
  "grade",
  "schedule",
]

export const CATEGORY_KEYWORDS: Record<AllowedCategory, string[]> = {
  attendance: [
    "נוכחות", "נעדר", "נעדרת", "היעדרות", "העדרות", "העדרויות",
    "חיסור", "חיסורים", "חסר", "חסרה", "הגיע", "הגיעה", "נכח", "נכחה",
    "attendance", "absent",
  ],
  grade: [
    "ציון", "ציונים", "מבחן", "בחינה", "ממוצע", "הערכה", "grade",
    "test", "מתמטיקה", "אנגלית", "עברית", "מדע", "היסטוריה",
  ],
  schedule: [
    "מערכת שעות", "לוח זמנים", "שעה", "שיעור", "הפסקה", "schedule",
    "schedule", "מתי", "שיעורים", "תכנית",
  ],
}
