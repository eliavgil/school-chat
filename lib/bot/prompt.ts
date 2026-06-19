import { AllowedCategory } from "./whitelist"

interface BuildPromptArgs {
  question: string
  studentName: string
  category: AllowedCategory
  records: Array<{ date: Date; recordType: string; details: string }>
  dataAsOf: Date
}

export function buildPrompt({
  question,
  studentName,
  category,
  records,
  dataAsOf,
}: BuildPromptArgs): string {
  const recordsText =
    records.length === 0
      ? "אין רשומות קיימות."
      : records
          .map(
            (r) =>
              `- ${r.date.toLocaleDateString("he-IL")} | ${r.recordType} | ${r.details}`
          )
          .join("\n")

  return `אתה עוזר לבית ספר המספק מידע עובדתי להורים על ילדיהם.

כללים נוקשים:
1. ענה ONLY על בסיס הנתונים שלהלן — אל תמציא, אל תשער.
2. אם הנתונים חסרים או לא ברורים — כתוב בדיוק: "לא נמצא מידע מספיק לענות על שאלה זו."
3. תשובה קצרה וישירה — ללא פרשנות.
4. תשובה בעברית.

שם התלמיד: ${studentName}
קטגוריה: ${category}
נתונים נכון לתאריך: ${dataAsOf.toLocaleDateString("he-IL")}

נתונים קיימים:
${recordsText}

שאלת ההורה: ${question}

תשובה:`
}
