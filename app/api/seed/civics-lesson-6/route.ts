import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"

const LESSON_TITLE = "שיעור 6: תנאים לקיומה של מדינה"

const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 6 | אזרחות כיתה י",
    title: "תנאים לקיומה של מדינה",
    image_url: null,
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
      { id: "obj1", icon: "book", text: "להגדיר מדינה", options: ["ולמנות את חמשת התנאים ההכרחיים לקיומה."], correct_index: null },
      { id: "obj2", icon: "scale", text: "ליישם את הידע", options: ["בזיהוי מרכיבי מדינה חסרים או קיימים מתוך מקרי בוחן אקטואליים."], correct_index: null },
      { id: "obj3", icon: "quote", text: "להתנסות", options: ["במענה לשאלת אירוע."], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    image_url: null,
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "לדעתכם, איזה מהבאים אינו תנאי הכרחי לקיום מדינה?",
    questions: [
      {
        id: "q1",
        text: "בחרו את האפשרות שלדעתכם אינה תנאי הכרחי:",
        options: ["שטח מוגדר", "שלטון אפקטיבי", "ריבונות (ניהול עצמאי ללא התערבות זרה)", "שפה רשמית"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5: הקניה — מהי מדינה? ─────────────────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    eyebrow: "הקניה",
    title: "מהי מדינה?",
    body: `מדינה היא ארגון חברתי הכולל שלטון, על אוכלוסייה היושבת בשטח מוגדר, בעל ריבונות פנימית וחיצונית, והזוכה להכרה בינלאומית.

כדי שישות תוגדר כמדינה, עליה להחזיק בכל חמשת המרכיבים הללו **בו-זמנית**.`,
  },

  // ── שקף 6: הקניה — חמשת התנאים ────────────────────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    layout: "grid",
    eyebrow: "הקניה",
    title: "חמשת התנאים",
    questions: [
      { id: "c1", icon: "map", text: "שטח (טריטוריה)", options: ["אזור גיאוגרפי מוגדר הכולל יבשה, מים טריטוריאליים, מרחב אווירי ותת-קרקע. גודל ורציפות אינם הכרחיים."], correct_index: null },
      { id: "c2", icon: "users", text: "אוכלוסייה", options: ["ציבור אנשים קבוע בעל מעמד חוקי מוכר (אזרחים ותושבים)."], correct_index: null },
      { id: "c3", icon: "crown", text: "ריבונות", options: ["יכולת המדינה לנהל את ענייני הפנים והחוץ שלה באופן עצמאי, ללא התערבות גורם זר."], correct_index: null },
      { id: "c4", icon: "handshake", text: 'הכרה בינלאומית', options: ['הסכמת מדינות העולם והאו"ם לקיומה של המדינה.'], correct_index: null },
      { id: "c5", icon: "landmark", text: "שלטון", options: ["גוף המנהל את ענייני המדינה ואוכף סדר וביטחון."], correct_index: null },
    ],
  },

  // ── שקף 7: הגדרות (להעתקה למחברת) ─────────────────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "תנאים לקיומה של מדינה — הגדרות (מחוון 2017)",
    questions: [
      { id: "d1", text: "מדינה", options: [""], feedback: "ארגון חברתי הכולל שלטון על אוכלוסייה היושבת בשטח מוגדר (טריטוריה), בעל ריבונות פנימית וחיצונית, והזוכה להכרה בינלאומית.", correct_index: null },
      { id: "d2", text: "שטח (טריטוריה)", options: [""], feedback: "אזור גיאוגרפי מוגדר הכולל יבשה, מים, אוויר ותת-קרקע. גודל השטח ורציפותו אינם תנאי להגדרת המדינה.", correct_index: null },
      { id: "d3", text: "אוכלוסייה", options: [""], feedback: "ציבור אנשים קבוע המורכב מאזרחים (בעלי זכויות פוליטיות וחובות) ותושבים בעלי מעמד חוקי מוכר.", correct_index: null },
      { id: "d4", text: "ריבונות", options: [""], feedback: "יכולת המדינה לנהל את ענייני הפנים והחוץ שלה באופן חופשי ועצמאי, ללא כפיפות לגורמים זרים חיצוניים.", correct_index: null },
      { id: "d5", text: "שלטון", options: [""], feedback: "גוף המנהל את ענייני המדינה, בעל סמכות לאכוף סדר וביטחון על האוכלוסייה בשטח.", correct_index: null },
      { id: "d6", text: "הכרה בינלאומית", options: [""], feedback: "הסכמה של מדינות העולם לקיומה של המדינה (קיים ויכוח אם זהו מרכיב חובה בהגדרה או תוצאה שלה).", correct_index: null },
    ],
  },

  // ── שקף 8: מנוחמוח ────────────────────────────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "brain-break",
    eyebrow: "",
    title: "מנוחמוח",
    animation: { name: "giraffe", delay: 0, position: "big-center", loop: true },
  },

  // ── שקף 9: תרגול — שאלת אירוע ──────────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "practice",
    eyebrow: "שאלון 2011",
    title: "הקמת דרום סודן",
    questions: [
      {
        id: "pq1",
        tag: "שאלת אירוע",
        text: `בסודן התרחש תהליך שבו החליטו תושבי האזור הדרומי להקים מדינה משלהם באזור שבו הם מתגוררים כיום. לאחר משאל עם, הוכרז על הקמת מדינת "דרום סודן". מדינות רבות בעולם מיהרו להכיר במדינה החדשה וגם ישראל בירכה על כך ואיחלה להם הצלחה בכך.

ציין והצג את התנאי לקיום מדינה שיתממש עם ביצוע ההחלטה.
הסבר כיצד תנאי זה בא לידי ביטוי בקטע.`,
        options: [],
        correct_index: null,
      },
    ],
  },

  // ── שקף 10: תשובה ─────────────────────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "answer",
    eyebrow: "תשובת מודל",
    title: "הקמת דרום סודן — תשובה מלאה",
    body: `### ציין
הכרה בינלאומית

---

### הצג
הסכמה של מדינות העולם והאו"ם לקיומה של המדינה כחברה במשפחת העמים.

---

### הסבר
בקטע מצוין כי "מדינות רבות בעולם מיהרו להכיר במדינה החדשה וגם ישראל בירכה על כך". כלומר, מדינות העולם נתנו את הסכמתן לקיום הישות הפוליטית החדשה כעובדה מוגמרת.`,
  },

  // ── שקף 11: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s11",
    order: 11,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "תנאים לקיומה של מדינה",
    questions: [
      {
        id: "aq1",
        text: "מהו המרכיב הכולל יבשה, אוויר ותת-קרקע?",
        options: ["שלטון", "אוכלוסייה", "שטח", "ריבונות"],
        correct_index: 2,
      },
      {
        id: "aq2",
        text: "יכולת המדינה לנהל ענייני פנים וחוץ ללא התערבות זרה היא:",
        options: ["הכרה", "ריבונות", "חוקה", "דמוקרטיה"],
        correct_index: 1,
      },
      {
        id: "aq3",
        text: "במדינה א' קיים שלטון, אוכלוסייה ושטח, אך חוקי המיסוי שלה נקבעים על ידי מדינה ב'. איזה תנאי חסר?",
        options: ["שטח", "שלטון", "ריבונות", "הכרה"],
        correct_index: 2,
      },
      {
        id: "aq4",
        text: "האם מדינה ללא רציפות טריטוריאלית (כמו מדינת איים) נחשבת מדינה?",
        options: ["לא, רציפות היא תנאי סף", "כן, גודל ורציפות אינם הכרחיים", "רק אם יש לה צבא", "רק אם היא חברה באו\"ם"],
        correct_index: 1,
      },
    ],
  },

  // ── שקף 12: שיעורי בית ────────────────────────────────────────────────────
  {
    id: "s12",
    order: 12,
    type: "homework",
    eyebrow: "משימת \"מדינות הנייר\"",
    title: "אכזיב או סילנד?",
    questions: [
      {
        id: "hw1",
        text: 'חפשו באינטרנט מידע על "מדינת אכזיב" בישראל או על "סילנד" (Sealand) בעולם. כתבו פסקה קצרה: אילו מרכיבי מדינה קיימים בהן, ואילו מרכיבים חסרים שמונעים מהן להיחשב למדינה ריבונית אמיתית לפי מה שלמדנו.',
        options: [],
        correct_index: null,
      },
    ],
  },

  // ── שקף 13: משוב ──────────────────────────────────────────────────────────
  {
    id: "s13",
    order: 13,
    type: "feedback",
    eyebrow: "משוב",
    title: "איך היה השיעור?",
    questions: [
      { id: "f1", text: 'עד כמה הנושא של "ריבונות" ברור לך כעת?', options: [], correct_index: null },
      { id: "f2", text: "עד כמה השימוש בדוגמאות מהעולם עזר לך להבין את החומר?", options: [], correct_index: null },
      { id: "f3", text: "עד כמה הרגשת פעיל/ה בשיעור היום?", options: [], correct_index: null },
    ],
  },

  // ── שקף 14: העשרה ─────────────────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "enrichment",
    eyebrow: "העשרה",
    title: "לסקרנים",
    questions: [
      {
        id: "e1",
        text: 'סרטון: "מרכיבי המדינה"',
        feedback: "סרטון",
        options: ['מתוך חוברת "אזרחות בכיף" — סריקת קוד QR בעמוד 31.'],
        correct_index: null,
      },
      {
        id: "e2",
        text: "הוויכוח על הכרה בינלאומית כמרכיב חובה",
        feedback: "מאמר",
        options: ["מאמר דעה באתר המכון הישראלי לדמוקרטיה."],
        correct_index: null,
        // link_url not set — no real URL was provided; add one if you have it
      },
    ],
  },
]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = adminClient()
  const slug = `civics-statehood-conditions-6`

  const { data: existing } = await sb
    .from("lessons")
    .select("id, title")
    .eq("slug", slug)
    .maybeSingle()

  if (existing) {
    const { error: updateError } = await sb
      .from("lessons")
      .update({ title: LESSON_TITLE, slides })
      .eq("id", existing.id)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    return NextResponse.json({ message: "Lesson updated", id: existing.id, title: LESSON_TITLE, slideCount: slides.length })
  }

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
