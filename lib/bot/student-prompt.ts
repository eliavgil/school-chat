import { GradeComponent } from "@/lib/csv/parseGrades"

interface StudentGrade {
  subject: string
  teacherName?: string | null
  weightedAverage?: number | null
  gradeComponents: GradeComponent[]
}

interface ClassAverage {
  subject: string
  classAvg: number
  studentCount: number
}

interface Attendance {
  totalLessons: number
  absences: number
  justifiedAbsences: number
  tardiness: number
  justifiedTardiness: number
}

interface ScheduleSlot { dayHeb: string; period: string; content: string }
interface CalendarEvent { date: Date; description: string; grade?: string | null }

interface StudentBotData {
  studentName: string
  grades: StudentGrade[]
  classAverages: ClassAverage[]
  attendance: Attendance | null
  schedule: ScheduleSlot[]
  calendarEvents: CalendarEvent[]
}

function fmtGrades(grades: StudentGrade[], averages: ClassAverage[]): string {
  if (!grades.length) return "אין נתוני ציונים."
  const avgMap = Object.fromEntries(averages.map(a => [a.subject, a]))
  return grades.map(g => {
    const avg = g.weightedAverage != null ? `ממוצע שלך: ${g.weightedAverage.toFixed(1)}` : ""
    const classAvg = avgMap[g.subject] ? ` | ממוצע כיתה: ${avgMap[g.subject].classAvg.toFixed(1)}` : ""
    const breakdown = g.gradeComponents
      .map((c: GradeComponent) => `  • ${c.name} (משקל ${c.weight}): ${c.score}`)
      .join("\n")
    return `${g.subject}${g.teacherName ? ` | מורה: ${g.teacherName}` : ""}\n${avg}${classAvg}\n${breakdown}`
  }).join("\n\n")
}

function fmtAttendance(a: Attendance | null): string {
  if (!a) return "אין נתוני נוכחות."
  return `סה"כ שיעורים: ${a.totalLessons} | העדרויות: ${a.absences} (${a.justifiedAbsences} מוצדקות) | איחורים: ${a.tardiness} (${a.justifiedTardiness} מוצדקים)`
}

function fmtSchedule(slots: ScheduleSlot[]): string {
  if (!slots.length) return "אין נתוני מערכת שעות."
  const byDay: Record<string, string[]> = {}
  for (const s of slots) {
    if (!byDay[s.dayHeb]) byDay[s.dayHeb] = []
    byDay[s.dayHeb].push(`  שעה ${s.period}: ${s.content}`)
  }
  return Object.entries(byDay).map(([d, ls]) => `יום ${d}:\n${ls.join("\n")}`).join("\n\n")
}

function fmtCalendar(events: CalendarEvent[]): string {
  if (!events.length) return "אין אירועים."
  const today = new Date()
  return events.map(e => {
    const passed = e.date < today ? " [הסתיים]" : ""
    return `${e.date.toLocaleDateString("he-IL")} | ${e.description}${passed}`
  }).join("\n")
}

const SYSTEM_PROMPT = `אתה סילבר בוט — עוזר אישי לתלמידי כיתה י2.
תפקידך לענות על שאלות הקשורות לחיי הכיתה: ציונים, נוכחות, מערכת שעות, מבחנים ואירועים.

## זהות וסגנון
- דבר בגובה העיניים — חברותי, ישיר, לא פורמלי
- תשובות קצרות וממוקדות — לא לרחב מיותר
- השתמש ב-emoji במידה לא מוגזמת
- ענה בעברית תמיד

## מה אתה יודע
- הציונים האישיים של התלמיד/ה — כולל פירוט רכיבים ומשקלות
- ממוצע הכיתה לכל מקצוע (לשם השוואה)
- נוכחות ואיחורים
- מערכת שעות שבועית
- לוח מבחנים ואירועים

## כללים
- ענה רק על מה שנשאל — אל תציג את כל הנתונים בבת אחת
- אם אין נתון — אמור זאת ישירות, אל תנחש
- ציונים של תלמידים אחרים — לא. רק ממוצע כיתתי
- אם שאלה לא קשורה לכיתה — הסבר בנחמדות שאתה מתמחה בנושאי הכיתה`

export function buildStudentPrompt(question: string, data: StudentBotData, isFirst: boolean): string {
  const greeting = isFirst ? `היי ${data.studentName.split(" ")[0]}! 👋 אני סילבר בוט, כאן לעזור לך. מה אפשר לעשות בשבילך?\n\n` : ""

  const sections = [
    `ציונים של ${data.studentName}:\n${fmtGrades(data.grades, data.classAverages)}`,
    `נוכחות:\n${fmtAttendance(data.attendance)}`,
    `מערכת שעות:\n${fmtSchedule(data.schedule)}`,
    `לוח מבחנים ואירועים:\n${fmtCalendar(data.calendarEvents)}`,
  ].join("\n\n---\n\n")

  return `${SYSTEM_PROMPT}

---
שם התלמיד/ה: ${data.studentName}
תאריך היום: ${new Date().toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

## נתוני הכיתה:
${sections}

---
${greeting}שאלה: ${question}

תשובה:`
}
