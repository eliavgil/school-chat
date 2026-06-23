import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `אתה מחלץ נתוני תלמידים מתוך הכתבה קולית של מורה שעברה זיהוי קולי אוטומטי.

הטקסט יכול להכיל שמות תלמידים ומה עשו (איחרו, נעדרו, הפריעו וכד').

החזר תשובה בפורמט JSON בלבד, ללא שום טקסט נוסף:
{
  "records": [
    {
      "student_name": "שם מלא כפי שמוזכר",
      "category": "אחת מהקטגוריות הבאות בלבד: חיסור | איחור | הפרעה | אירוע חיובי | אחר",
      "note": "הערה חופשית אם קיימת, אחרת null"
    }
  ]
}

כללים:
- אם שם מוזכר פעמיים, צור שתי שורות נפרדות.
- אם הקטגוריה לא ברורה — השתמש ב"אחר".
- אל תמציא פרטים שלא מוזכרים בטקסט.
- אל תכלול שום טקסט מחוץ ל-JSON.`

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: "No text" }, { status: 400 })

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: text }],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text.trim()

  let parsed: { records: { student_name: string; category: string; note: string | null }[] }
  try {
    const jsonStr = raw.startsWith("```") ? raw.replace(/```json?\n?/g, "").replace(/```/g, "") : raw
    parsed = JSON.parse(jsonStr)
  } catch {
    return NextResponse.json({ error: "Failed to parse Claude response", raw }, { status: 500 })
  }

  return NextResponse.json(parsed)
}
