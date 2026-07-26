import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

export const LESSON_TITLE = "שיעור 12: שיטת הבחירות בישראל ומרכיביה"
export const SLUG = "democracy-israel-election-system-12"

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 12 | אזרחות כיתה י",
    title: "שיטת הבחירות בישראל: ארצית, יחסית ורשימתית",
    image_url: null, // suggested: תצלום של מליאת הכנסת, או פתקי הצבעה של מפלגות שונות
    image_position: "background",
    image_size: "full",
  },

  // ── שקף 2: מטרות השיעור ───────────────────────────────────────────────────
  {
    id: "s2",
    order: 2,
    type: "objectives",
    layout: "grid",
    eyebrow: "מטרות השיעור",
    title: "מה נלמד היום",
    questions: [
      { id: "obj1", icon: "flag", text: "נציג", options: ["את שלושת מאפייני שיטת הבחירות בישראל (ארצית, יחסית, רשימתית)."], correct_index: null },
      { id: "obj2", icon: "scale", text: "נסביר", options: ["מהו אחוז החסימה ונתאר את השפעתו על ייצוג המפלגות בכנסת."], correct_index: null },
      { id: "obj3", icon: "users", text: "ננתח", options: ["את היתרונות והחסרונות של השיטה היחסית בייצוג קבוצות שונות בחברה."], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    image_url: null, // suggested: תצלום של פתק הצבעה למפלגה עם אות בחירות
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "מפלגה גדולה, או מפלגה שמייצגת אתכם?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right" },
    questions: [
      {
        id: "q1",
        text: "האם עדיף להצביע למפלגה גדולה שיכולה להקים ממשלה, או למפלגה קטנה שמייצגת בדיוק את מה שאתם חושבים, גם אם היא עלולה לא לעבור את אחוז החסימה?",
        options: [
          "מפלגה גדולה",
          "מפלגה קטנה שמייצגת אותי",
          "תלוי בבחירות הספציפיות",
          "לא בטוח",
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5.1: הקניה — ישראל כאזור בחירה אחד (ארצית) ─────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    eyebrow: "הקניה",
    title: "ישראל כאזור בחירה אחד — ארצית",
    body: "כל המדינה מהווה אזור בחירה אחד לצורך חישוב תוצאות הבחירות.\n\n> אין חלוקה למחוזות בחירה (כמו בארה\"ב או בריטניה).",
  },

  // ── שקף 5.2: הקניה — חלוקת מנדטים (יחסית) ──────────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    eyebrow: "הקניה",
    title: "חלוקת מנדטים — יחסית",
    body: `חלוקת המושבים בפרלמנט נעשית **יחסית** למספר הקולות שקיבלה כל מפלגה.

> אם מפלגה קיבלה 10% מהקולות, היא תקבל 10% מהמושבים (בתנאי שעברה את אחוז החסימה).`,
  },

  // ── שקף 5.3: הקניה — הצבעה למפלגה (רשימתית) ────────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    eyebrow: "הקניה",
    title: "הצבעה למפלגה — רשימתית",
    body: "האזרחים מצביעים למפלגה, לה רשימת מועמדים שנקבעה מראש (בפריימריז או בדרכים אחרות).",
  },

  // ── שקף 5.4: הקניה — אחוז החסימה ────────────────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    eyebrow: "הקניה",
    title: "אחוז החסימה",
    body: `אחוז הקולות המינימלי שמפלגה חייבת לקבל כדי לזכות בייצוג בפרלמנט. בישראל הוא עומד על **3.25%** (כ-4 מנדטים).

> מטרתו לצמצם את מספר המפלגות הקטנות ולהגביר את יציבות הממשלה.`,
  },

  // ── שקף 9: בדיקת עירנות ────────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "alertness-check",
    eyebrow: "בדיקת עירנות",
    title: "שיטת הבחירות בישראל",
    questions: [
      { id: "ac1", text: "מהו אחוז החסימה הנוכחי בישראל?", options: ["3.25%", "1%", "5%", "10%"], correct_index: 0 },
      { id: "ac2", text: "בשיטה ה\"ארצית\", כמה אזורי בחירה יש בישראל?", options: ["אחד", "שניים", "שלושה עשר", "עשרים"], correct_index: 0 },
    ],
  },

  // ── שקף 10: הגדרות (להעתקה למחברת) ─────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "שיטת הבחירות בישראל — הגדרות",
    questions: [
      { id: "def1", text: "שיטת בחירות ארצית", options: [""], feedback: "כל הארץ מהווה אזור בחירה אחד לצורך חישוב התוצאות.", correct_index: null },
      { id: "def2", text: "שיטת בחירות יחסית", options: [""], feedback: "חלוקת המושבים בפרלמנט היא יחסית למספר הקולות שקיבלה המפלגה מכלל הקולות הכשרים.", correct_index: null },
      { id: "def3", text: "שיטת בחירות רשימתית", options: [""], feedback: "מצביעים למפלגה שלה רשימת מועמדים שנקבעה מראש.", correct_index: null },
      { id: "def4", text: "אחוז החסימה", options: [""], feedback: "אחוז מינימלי מכלל הקולות הדרוש כדי שמפלגה תזכה בייצוג בפרלמנט. בישראל: 3.25%.", correct_index: null },
    ],
  },

  // ── שקף 11: מנוחמוח ───────────────────────────────────────────────────────
  {
    id: "s11",
    order: 11,
    type: "brain-break",
    eyebrow: "",
    title: "מנוחמוח",
    animation: { name: "giraffe", delay: 0, position: "big-center", loop: true },
  },

  // ── שקף 12: תרגול — שאלת ידע ──────────────────────────────────────────────
  {
    id: "s12",
    order: 12,
    type: "practice",
    eyebrow: "תרגול",
    title: "מאפייני שיטת הבחירות בישראל",
    questions: [
      {
        id: "pq1",
        tag: "שאלת ידע",
        text: "הציגו את המאפיינים האלה של שיטת הבחירות בישראל: שיטת בחירות ארצית ושיטת בחירות יחסית.",
        options: [],
        correct_index: null,
      },
    ],
  },

  // ── שקף 13: תשובה ─────────────────────────────────────────────────────────
  {
    id: "s13",
    order: 13,
    type: "answer",
    eyebrow: "תשובת מודל",
    title: "מאפייני שיטת הבחירות — תשובה מלאה",
    body: `### שיטת בחירות ארצית
כל המדינה נחשבת לאזור בחירה אחד לצורך חישוב תוצאות הבחירות וחלוקת המנדטים.

---

### שיטת בחירות יחסית
חלוקת המושבים בפרלמנט נעשית באופן יחסי למספר הקולות שבהם זכתה כל מפלגה מתוך כלל המצביעים, בתנאי שעברה את אחוז החסימה.`,
  },

  // ── שקף 14: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "שיטת הבחירות בישראל",
    questions: [
      {
        id: "aq1",
        text: "מהו אחוז החסימה הנוכחי בישראל?",
        options: ["1.5%", "2%", "3.25%", "5%"],
        correct_index: 2,
      },
      {
        id: "aq2",
        text: 'מה המשמעות של שיטת בחירות "ארצית"?',
        options: ["כל המדינה היא אזור בחירה אחד", "מצביעים רק בערים הגדולות", "לכל עיר יש נציג משלה", "הבחירות נמשכות יום אחד"],
        correct_index: 0,
      },
      {
        id: "aq3",
        text: "בשיטה היחסית, מספר המושבים של מפלגה נקבע לפי:",
        options: ["הגובה של ראש המפלגה", "אחוז הקולות שקיבלה מהציבור", "החלטת הנשיא", "הגרלה"],
        correct_index: 1,
      },
      {
        id: "aq4",
        text: 'למה אנחנו מצביעים בשיטה ה"רשימתית"?',
        options: ["לאדם בודד", "למפלגה עם רשימת מועמדים", "לממשלה כולה", "לחוקים ספציפיים"],
        correct_index: 1,
      },
      {
        id: "aq5",
        text: "כמה מנדטים הם בערך 3.25%?",
        options: ["1", "2", "10", "4"],
        correct_index: 3,
      },
    ],
  },

  // ── שקף 15: שיעורי בית ────────────────────────────────────────────────────
  {
    id: "s15",
    order: 15,
    type: "homework",
    eyebrow: "שאלה למחשבה",
    title: "האם להעלות את אחוז החסימה?",
    questions: [
      {
        id: "hw1",
        text: 'האם לדעתכם צריך להעלות את אחוז החסימה ל-5% כדי שתהיה ממשלה יציבה יותר, או להוריד אותו ל-1% כדי שיותר קבוצות באוכלוסייה יקבלו ייצוג? נמקו את דעתכם בעזרת המושג "פלורליזם פוליטי".',
        options: [],
        correct_index: null,
      },
    ],
  },

  // ── שקף 16: משוב ──────────────────────────────────────────────────────────
  {
    id: "s16",
    order: 16,
    type: "feedback",
    eyebrow: "משוב",
    title: "איך היה השיעור?",
    questions: [
      { id: "f1", text: "כמה ברורה לך כעת הדרך שבה קולות המצביעים הופכים למנדטים בכנסת?", options: [], correct_index: null },
      { id: "f2", text: "עד כמה השיעור עזר לך להבין למה יש כל כך הרבה מפלגות בישראל?", options: [], correct_index: null },
      { id: "f3", text: "מידת העניין בשיעור.", options: [], correct_index: null },
    ],
  },

  // ── שקף 17: העשרה ─────────────────────────────────────────────────────────
  {
    id: "s17",
    order: 17,
    type: "enrichment",
    eyebrow: "העשרה",
    title: "לסקרנים",
    questions: [
      {
        id: "e1",
        text: "מיפוי המושגים",
        feedback: "תרגול נוסף",
        options: ['משימת מיפוי המושגים בחוברת התרגול (עמוד 51-52), מילוי קטגוריית "מאפיין שיטת הבחירות בישראל".'],
        correct_index: null,
      },
    ],
  },
]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = adminClient()

  const { data: existing, error: existingError } = await sb
    .from("lessons")
    .select("id, title, slides")
    .eq("slug", SLUG)
    .maybeSingle()

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 })

  if (existing) {
    const mergedSlides = preserveManualMedia(slides, existing.slides)
    const { error: updateError } = await sb
      .from("lessons")
      .update({ title: LESSON_TITLE, slides: mergedSlides })
      .eq("id", existing.id)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    return NextResponse.json({ message: "Lesson updated", id: existing.id, title: LESSON_TITLE, slideCount: mergedSlides.length })
  }

  const { data, error } = await sb
    .from("lessons")
    .insert({
      title: LESSON_TITLE,
      subject: "אזרחות",
      slug: SLUG,
      slides,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: "Lesson created", id: data.id, title: data.title, slideCount: slides.length })
}
