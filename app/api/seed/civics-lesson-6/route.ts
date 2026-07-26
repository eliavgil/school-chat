import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"

const LESSON_TITLE = "שיעור 6: תנאי הקמת מדינה"

const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s0",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 6 | אזרחות כיתה י",
    title: "מה בעצם עושה שטח ל'מדינה'?",
    body: `נסיכות סילנד: דגל, מטבע ודרכון משלה — הכול על אסדת בטון נטושה בים הצפוני. מדינה? כמעט כל העולם אומר לא.`,
    image_url: null, // suggested: aerial photo of Sealand's concrete WWII platform in the North Sea
    image_position: "background",
    image_size: "full",
  },

  // ── שקף 2: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s0b",
    order: 2,
    type: "media-only",
    eyebrow: "",
    title: "",
    image_url: null, // suggested: aerial photo of Sealand, or a montage of unusual "state" claimants
  },

  // ── שקף 3: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s1",
    order: 3,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "לדעתך: מה הכי הכרחי כדי להיות 'מדינה'?",
    questions: [
      {
        id: "q1",
        text: "בחרו את התנאי שנראה לכם הכי קריטי:",
        options: ["שטח מוגדר", "אוכלוסייה קבועה", "שלטון מתפקד", "הכרה של מדינות אחרות"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 4: חמשת התנאים — סקירה ────────────────────────────────────────────
  {
    id: "s2",
    order: 4,
    type: "concept-grid",
    layout: "grid",
    eyebrow: "המסגרת המשפטית",
    title: "חמשת התנאים לקיומה של מדינה",
    questions: [
      { id: "c1", icon: "map", text: "1. שטח", options: ["טריטוריה מוגדרת בגבולות מוכרים."], correct_index: null },
      { id: "c2", icon: "users", text: "2. אוכלוסייה", options: ["ציבור קבוע של אזרחים ותושבים."], correct_index: null },
      { id: "c3", icon: "landmark", text: "3. שלטון", options: ["מוסדות שמנהלים ואוכפים חוק וסדר."], correct_index: null },
      { id: "c4", icon: "crown", text: "4. ריבונות", options: ["עצמאות מלאה בניהול מדיניות פנים וחוץ."], correct_index: null },
      { id: "c5", icon: "handshake", text: '5. הכרה בינ"ל', options: ['הכרה של מדינות העולם והאו"ם.'], correct_index: null },
    ],
  },

  // ── שקף 5: תנאי 1 בפירוט — שטח ─────────────────────────────────────────────
  {
    id: "s3",
    order: 5,
    type: "concept-grid",
    layout: "list",
    eyebrow: "תנאי 1: שטח",
    title: "לשטח יש ארבעה מימדים",
    questions: [
      { id: "d1", icon: "mountain", text: "תחום יבשתי", options: ["היבשה והאגמים/נהרות שבתוכה."], correct_index: null },
      { id: "d2", icon: "waves", text: "תחום ימי", options: ["מים טריטוריאליים לאורך החוף."], correct_index: null },
      { id: "d3", icon: "plane", text: "תחום אווירי", options: ["עמוד האוויר שמעל היבשה והים."], correct_index: null },
      { id: "d4", icon: "layers", text: "תחום תת-קרקעי", options: ["הקרקע ומשאבי הטבע שמתחת לפני השטח."], correct_index: null },
    ],
  },

  // ── שקף 6: הגדרות מושגים ──────────────────────────────────────────────────
  {
    id: "s4",
    order: 6,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "ריבונות, ישות, והכרה — מה ההבדל?",
    questions: [
      { id: "t1", text: "ריבונות", options: [""], feedback: "עצמאות מלאה של מדינה בניהול מדיניות הפנים והחוץ שלה, בלי כפייה מגורם חוץ.", correct_index: null },
      { id: "t2", text: "ישות (Entity)", options: [""], feedback: "גוף מדיני שיש לו שטח, אוכלוסייה ושלטון — אך מעמדו כ'מדינה' עוד לא הוכרע.", correct_index: null },
      { id: "t3", text: "הכרה דקלרטיבית", options: [""], feedback: "הכרה בינלאומית שרק מצהירה על מדינה שכבר קיימת בפועל.", correct_index: null },
      { id: "t4", text: "הכרה כינונית", options: [""], feedback: "גישה שלפיה ההכרה הבינלאומית היא זו שבפועל יוצרת את מעמד המדינה.", correct_index: null },
    ],
  },

  // ── שקף 7: בדיקת עירנות ───────────────────────────────────────────────────
  {
    id: "s5",
    order: 7,
    type: "alertness-check",
    eyebrow: "בדיקת עירנות",
    title: 'מי מבין הישויות הבאות חברה מלאה באו"ם?',
    questions: [
      {
        id: "q1",
        text: 'איזו מהישויות הבאות היא חברה מלאה באומות המאוחדות?',
        options: ["סומלילנד", "נסיכות סילנד", "טאיוואן", "מדינת ישראל"],
        correct_index: 3,
      },
    ],
  },

  // ── שקף 8: לימוד — ניתוח מקרים ────────────────────────────────────────────
  {
    id: "s6",
    order: 8,
    type: "study",
    eyebrow: "ניתוח מקרים",
    title: "נבדוק: מי עומד בתנאים?",
    body: `| ישות | שטח | אוכלוסייה | שלטון | ריבונות | הכרה בינ"ל |
|---|---|---|---|---|---|
| **סומלילנד** | ✔ | ✔ | ✔ | ~ | ✘ |
| **נסיכות סילנד** | ✘ | ✘ | ~ | ✘ | ✘ |
| **מדינת ישראל** | ✔ | ✔ | ✔ | ✔ | ✔ |

> סומלילנד עומדת בפועל בארבעה מתוך חמשת התנאים — ועדיין נשארת "בלי מדינה" רשמית. זה המקרה שממחיש למה תנאי ה-5 הוא הכי שנוי במחלוקת.`,
  },

  // ── שקף 9: שיעורי בית ─────────────────────────────────────────────────────
  {
    id: "s7",
    order: 9,
    type: "homework",
    eyebrow: "למפגש הבא",
    title: "משימות",
    questions: [
      { id: "h1", text: 'בחרו ישות שנויה במחלוקת (למשל כורדיסטן, טיבט, פלשתין) ובדקו: באילו מהתנאים היא עומדת, ובאילו לא?', options: [""], correct_index: null },
      { id: "h2", text: 'כתבו פסקה קצרה: האם הכרה בינלאומית היא תנאי הכרחי למדינה, או רק "תוצאה" של תנאים אחרים? נמקו.', options: [""], correct_index: null },
    ],
  },

  // ── שקף 10: משוב ──────────────────────────────────────────────────────────
  {
    id: "s8",
    order: 10,
    type: "feedback",
    eyebrow: "סיכום",
    title: "איך היה השיעור?",
    questions: [
      { id: "f1", text: "כמה הבנתם את חמשת תנאי הקמת המדינה?", options: ["פחות", "בסדר", "טוב", "מצוין"], correct_index: null },
    ],
  },
]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = adminClient()

  const { data: existing } = await sb
    .from("lessons")
    .select("id, title")
    .eq("title", LESSON_TITLE)
    .maybeSingle()

  if (existing) {
    const { error: updateError } = await sb
      .from("lessons")
      .update({ slides })
      .eq("id", existing.id)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    return NextResponse.json({ message: "Lesson updated", id: existing.id, title: existing.title, slideCount: slides.length })
  }

  const slug = `civics-statehood-conditions-6`
  const { data, error } = await sb
    .from("lessons")
    .insert({
      title: LESSON_TITLE,
      subject: "אזרחות",
      slug,
      slides,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: "Lesson created", id: data.id, title: data.title, slideCount: slides.length })
}
