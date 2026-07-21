import { AllowedCategory } from "./whitelist"
import { GradeComponent } from "@/lib/csv/parseGrades"

interface StudentData {
  grades?: Array<{
    subject: string
    teacherName?: string | null
    weightedAverage?: number | null
    gradeComponents: GradeComponent[]
  }>
  attendance?: {
    totalLessons: number
    absences: number
    justifiedAbsences: number
    tardiness: number
    justifiedTardiness: number
  } | null
  schedule?: Array<{ dayHeb: string; period: string; content: string }>
  calendarEvents?: Array<{ date: Date; description: string; grade?: string | null }>
  teachers?: Array<{ name: string; phone?: string | null; mobile?: string | null; email?: string | null; subjects?: string | null; role?: string | null }>
}

interface BuildPromptArgs {
  question: string
  studentName: string
  category: AllowedCategory
  data: StudentData
  dataAsOf: Date
  isFirstMessage?: boolean
}

function formatGrades(grades: StudentData["grades"]): string {
  if (!grades || grades.length === 0) return "אין נתוני ציונים."
  return grades
    .map((g) => {
      const avg = g.weightedAverage != null ? `ממוצע משוקלל: ${g.weightedAverage}` : ""
      const breakdown = g.gradeComponents
        .map((c: GradeComponent) => `  • ${c.name} (משקל ${c.weight}): ${c.score}`)
        .join("\n")
      return `${g.subject}${g.teacherName ? ` | מורה: ${g.teacherName}` : ""}\n${avg}\n${breakdown}`
    })
    .join("\n\n")
}

function formatAttendance(a: StudentData["attendance"]): string {
  if (!a) return "אין נתוני נוכחות."
  return `סה"כ שיעורים: ${a.totalLessons}
העדרויות: ${a.absences} (מתוכן ${a.justifiedAbsences} מוצדקות)
איחורים: ${a.tardiness} (מתוכן ${a.justifiedTardiness} מוצדקים)`
}

function formatSchedule(slots: StudentData["schedule"]): string {
  if (!slots || slots.length === 0) return "אין נתוני מערכת שעות."
  const byDay: Record<string, string[]> = {}
  for (const s of slots) {
    if (!byDay[s.dayHeb]) byDay[s.dayHeb] = []
    byDay[s.dayHeb].push(`  שעה ${s.period}: ${s.content}`)
  }
  return Object.entries(byDay)
    .map(([day, lines]) => `יום ${day}:\n${lines.join("\n")}`)
    .join("\n\n")
}

function formatCalendar(events: StudentData["calendarEvents"]): string {
  if (!events || events.length === 0) return "אין אירועים בלוח."
  const today = new Date()
  return events
    .map((e) => {
      const passed = e.date < today ? " [הסתיים]" : ""
      return `${e.date.toLocaleDateString("he-IL")} | ${e.grade ?? "כללי"} | ${e.description}${passed}`
    })
    .join("\n")
}

function formatTeachers(teachers: StudentData["teachers"]): string {
  if (!teachers || teachers.length === 0) return "אין נתוני מורים."
  return teachers
    .map((t) => {
      const parts = t.name.trim().split(/\s+/)
      const reversed = parts.length >= 2 ? parts.slice(1).join(" ") + " " + parts[0] : t.name
      const nameStr = reversed !== t.name ? `${t.name} / ${reversed}` : t.name
      return `${nameStr}${t.role ? ` (${t.role})` : ""}${t.subjects ? ` | מקצועות: ${t.subjects}` : ""}${t.phone ? ` | טלפון: ${t.phone}` : ""}${t.mobile ? ` | נייד: ${t.mobile}` : ""}${t.email ? ` | מייל: ${t.email}` : ""}`
    })
    .join("\n")
}

const SYSTEM_PROMPT = `אתה סילבר בוט — בוט חכם המסייע למחנך כיתה י4 בבית הספר.
תפקידך לענות על שאלות הורים הקשורות לילדיהם או לכיתה בכלל.

## זהות ותפקיד
- אתה עוזר של המחנך, לא מחליף אותו
- אתה עונה בעברית, בטון חם ואישי אך ענייני
- אתה עונה רק על נתונים שמופיעים במסד הנתונים שסופק לך — לא ממציא ולא משער

## כללי גישה למידע
- **נתונים אישיים** (ציונים, נוכחות, התנהגות): ענה רק על הנתונים של התלמיד/ה שמשויך/ת לחשבון ההורה השואל
- **נתונים כלליים** (מערכת שעות, לוח אירועים, אלפון מורים): ענה לכל הורה באופן חופשי

## איך לענות
1. **קרא את השאלה בעיון** — הורים לא תמיד מנסחים בצורה מדויקת, עשויות להיות טעויות כתיב, קיצורים, ניסוחים שונים
2. **חפש בכל הנתונים** לפני שאתה מוותר — אם מחפשים מורה לפי שם פרטי, חפש גם לפי שם משפחה (הנתונים בפורמט "שם משפחה שם פרטי")
3. **אם אינך בטוח מה ההורה מתכוון** — שאל אותו לפרט או לנסח מחדש את השאלה, אל תוותר מיד
4. **אל תוותר מהר** — רוב השאלות אמורות לקבל תשובה מהנתונים הקיימים
5. **אם באמת אין מידע** — ענה בחום: "לא מצאתי מידע על כך, ההודעה תועבר למחנך/ת להמשך טיפול"

## הודעות היעדרות
אם הורה מודיע שבנו/ביתו יעדר מבית הספר (בתאריך מסוים, מחר, יום מסוים בשבוע וכד') — ענה בפורמט הבא בדיוק:

"קבלתי 🙏 המידע יועבר למחנך/ת.
שים/י לב:
• יש לספק סיבה להיעדרות — במידה והסיבה רפואית יש לצרף אישור רופא/מרפאה.
• [שם התלמיד/ה] נעדר/ה השנה [X] שיעורים ([Y] מוצדקות).

השיעורים שיתקיימו ביום ההיעדרות ([יום]):
[רשימת שמות המקצועות בלבד לאותו יום, ללא שעות, מורים או חדרים]"

חשוב: זהה את יום השבוע מהתאריך שציין ההורה ושלוף את המערכת לאותו יום. אם ציין "מחר" — חשב את יום המחרת מהתאריך הנוכחי. ההודעה תועבר למחנך/ת אוטומטית.

## אירועים בלוח
- אם אירוע מסומן [הסתיים] — ציין זאת בתשובה

## סגנון תשובה
- חם ואישי, לא רובוטי
- קצר וממוקד — אל תרחיב מעבר למה שנשאל
- לא לכלול הערות פרשנות (כמו "מומלץ לשפר") אלא אם נשאל במפורש`

export function buildPrompt({ question, studentName, category, data, dataAsOf, isFirstMessage }: BuildPromptArgs): string {
  const greeting = isFirstMessage
    ? `שלום! אני סילבר בוט, כאן לעזור לך עם שאלות על ${studentName} ועל הכיתה. במה אוכל לסייע?\n\n`
    : ""

  const dataSection = [
    `ציונים שוטפים של התלמיד/ה ${studentName} לפי מקצוע:\n${formatGrades(data.grades)}`,
    `נוכחות והתנהגות של ${studentName}:\n${formatAttendance(data.attendance)}`,
    `מערכת שעות שבועית של הכיתה:\n${formatSchedule(data.schedule)}`,
    `אירועים, טיולים ומבחנים מלוח בית הספר (אירועים שעברו מסומנים [הסתיים]):\n${formatCalendar(data.calendarEvents)}`,
    `אלפון מורים (פורמט שמות: "שם משפחה שם פרטי"):\n${formatTeachers(data.teachers)}`,
  ].join("\n\n---\n\n")

  return `${SYSTEM_PROMPT}

---
שם התלמיד/ה המשויך/ת להורה זה: ${studentName}
תאריך היום: ${new Date().toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
נתונים עודכנו: ${dataAsOf.toLocaleDateString("he-IL")}

## נתוני הכיתה:
${dataSection}

---
${greeting}שאלת ההורה: ${question}

תשובה:`
}
