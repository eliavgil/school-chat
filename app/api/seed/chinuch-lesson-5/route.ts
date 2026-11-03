import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

export const LESSON_TITLE = "שיעור 5: שונה ודומה"
export const SLUG = `chinuch-same-different-5`

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "זהות אישית וערכים · שיעור 5",
    title: "שונה ודומה",
    image_url: null, // suggested: קבוצת צלליות אנשים מגוונת, כל אחת בצבע מעט שונה
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
    title: "מה נעשה היום",
    animation: { name: "camel", delay: 3, position: "across", loop: true },
    questions: [
      { id: "obj1", icon: "users", text: "נגלה נקודות דמיון ושוני", options: ["בינינו לבין חברינו לכיתה."], correct_index: null },
      { id: "obj2", icon: "identity", text: "נתרגל הצבעה כנה", options: ["גם כשאנחנו נראים כמו המיעוט בכיתה."], correct_index: null },
      { id: "obj3", icon: "sparkles", text: "נראה שלהיות שונה זה נורמלי", options: ["ולפעמים זה בדיוק מה שמעניין בנו."], correct_index: null },
    ],
  },

  // ── שקף 3: הקניה — חוקי המשחק ─────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "study",
    eyebrow: "לפני שמתחילים",
    title: "הכיתה הזו מכילה יותר גיוון ממה שנראה",
    body: `עכשיו נצביע על כמה שאלות. אחרי כל שאלה נראה את תוצאות הכיתה בזמן אמת.

המשימה שלכם: שימו לב באיזו שאלה הייתם קרובים לרוב הכיתה, ובאיזו הייתם דווקא יוצאי דופן. אין תשובה נכונה — רק תשובה כנה.

> למורה: עודדו תשובה כנה ולא "מה שנשמע טוב". אם כולם עונים אותו דבר בכל שאלה, זה בעצמו ממצא מעניין לדיון.`,
  },

  // ── שקף 4: שאלה 1 ─────────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "שאלה 1",
    title: "מה הייתם עושים ביום חופש בלי שום תוכניות?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "q1",
        text: "בחרו את הקרוב ביותר:",
        options: ["ישנים עד הצהריים", "יוצאים עם חברים", "עושים ספורט או טיול", "יושבים עם מסך"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5: שאלה 2 ─────────────────────────────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "opinion",
    eyebrow: "שאלה 2",
    title: "מה הכי מלחיץ אתכם?",
    animation: { name: "bird", delay: 3, position: "across", loop: true },
    questions: [
      {
        id: "q2",
        text: "בחרו את הקרוב ביותר:",
        options: ["לדבר מול קהל", "לאכזב מישהו", "לטעות בפומבי", "לא לדעת מה הולך לקרות"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 6: שאלה 3 ─────────────────────────────────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "opinion",
    eyebrow: "שאלה 3",
    title: "איך אתם מקבלים החלטה קשה?",
    animation: { name: "cat", delay: 3, position: "corner-left", loop: true },
    questions: [
      {
        id: "q3",
        text: "בחרו את הקרוב ביותר:",
        options: ["חושב/ת לבד הרבה זמן", "מתייעצ/ת עם מישהו קרוב", "הולכ/ת עם הבטן", "דוחה/ה כמה שאפשר"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 7: שאלה 4 ─────────────────────────────────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "opinion",
    eyebrow: "שאלה 4",
    title: "מה הכי חשוב לכם שאנשים יזכרו מכם?",
    animation: { name: "turkey", delay: 3, position: "across", loop: true },
    questions: [
      {
        id: "q4",
        text: "בחרו את הקרוב ביותר:",
        options: ["שהייתי אדיב/ה", "שהייתי מצליח/ה", "שהייתי מצחיק/ה", "שהייתי אמיתי/ת"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 8: מנוחמוח ────────────────────────────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "brain-break",
    eyebrow: "",
    title: "מנוחמוח",
    animation: { name: "piggy", delay: 0, position: "big-center", loop: true },
  },

  // ── שקף 9: שאלה 5 ─────────────────────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "opinion",
    eyebrow: "שאלה 5",
    title: "איך אתם מעדיפים לבלות עם חברים?",
    animation: { name: "totoro", delay: 3, position: "across", loop: true },
    questions: [
      {
        id: "q5",
        text: "בחרו את הקרוב ביותר:",
        options: ["קבוצה גדולה ורועשת", "שניים-שלושה קרובים", "פעילות משותפת, לא רק לדבר", "פשוט לשבת ולדבר"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 10: שאלה 6 ────────────────────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "opinion",
    eyebrow: "שאלה 6",
    title: "מה הכי מעצבן אתכם אצל אחרים?",
    animation: { name: "frog", delay: 3, position: "center", loop: true },
    questions: [
      {
        id: "q6",
        text: "בחרו את הקרוב ביותר:",
        options: ["איחורים", "חוסר כנות", "שיפוטיות", "עצלנות"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 11: שאלה 7 ────────────────────────────────────────────────────────
  {
    id: "s11",
    order: 11,
    type: "opinion",
    eyebrow: "שאלה 7",
    title: "מתי אתם הכי מרגישים \"אתם עצמכם\"?",
    animation: { name: "toucan", delay: 3, position: "across", loop: true },
    questions: [
      {
        id: "q7",
        text: "בחרו את הקרוב ביותר:",
        options: ["לבד", "עם המשפחה", "עם חברים הכי קרובים", "על הבמה, מול קהל"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 12: שאלה 8 ────────────────────────────────────────────────────────
  {
    id: "s12",
    order: 12,
    type: "opinion",
    eyebrow: "שאלה 8",
    title: "אם היה לכם יום שלם בלי שום מחויבויות, הייתם...?",
    animation: { name: "dancing_bug", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "q8",
        text: "בחרו את הקרוב ביותר:",
        options: ["יוצרים משהו", "לומדים משהו חדש", "נחים לגמרי", "יוצאים להרפתקה"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 13: הקניה — מה גילינו ─────────────────────────────────────────────
  {
    id: "s13",
    order: 13,
    type: "study",
    eyebrow: "הקניה",
    title: "מה גילינו?",
    body: `בכל שאלה היה מישהו שהיה לבד, או כמעט לבד, בתשובה שלו.

שאלת דיון: באיזו שאלה הרגשתם הכי "יחיד/ה מול כולם"? זה בסדר להיות שם — זה בדיוק מה שהופך אתכם למי שאתם, ולא לעוד עותק של מישהו אחר.

חיבור לשיעור 1: אותו עיקרון שראינו בין תרבויות — אותם ערכים, דירוג שונה — קיים גם בתוך הכיתה הזו, בין כל אחד מכם.`,
  },

  // ── שקף 14: שיעורי בית ────────────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "homework",
    eyebrow: "לשיעור הבא",
    title: "חושבים קדימה",
    questions: [
      {
        id: "hw1",
        text: "התחילו לחשוב על תחביב, תחום עניין או פעילות שאתם אוהבים מאוד — בשיעור הבא נכתוב עליו.",
        options: [],
        correct_index: null,
      },
    ],
  },

  // ── שקף 15: משוב ──────────────────────────────────────────────────────────
  {
    id: "s15",
    order: 15,
    type: "feedback",
    eyebrow: "משוב",
    title: "איך היה השיעור?",
    questions: [
      { id: "f1", text: "באיזו מידה היה לך כיף להצביע ולראות את תוצאות הכיתה?", options: [], correct_index: null },
      { id: "f2", text: "באיזו מידה גילית משהו חדש על עצמך או על הכיתה?", options: [], correct_index: null },
      { id: "f3", text: "באיזו מידה נהנית מהשיעור?", options: [], correct_index: null },
    ],
  },

  // ── שקף 16: העשרה ─────────────────────────────────────────────────────────
  {
    id: "s16",
    order: 16,
    type: "enrichment",
    eyebrow: "העשרה",
    title: "לסקרנים",
    questions: [
      {
        id: "e1",
        text: "מודל חמשת גורמי האישיות (Big Five)",
        feedback: "מאמר",
        options: ["דרך מדעית פופולרית למיפוי הבדלי אישיות — מעבר לטסטים הקצרים ברשת."],
        correct_index: null,
      },
      {
        id: "e2",
        text: "למה קשה להיות ה\"יחיד/ה שחושב/ת אחרת\"",
        feedback: "למחשבה נוספת",
        options: ["על לחץ חברתי, קונפורמיות, ולמה דעת מיעוט חשובה לקבוצה."],
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
      subject: "חינוך",
      slug: SLUG,
      slides,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: "Lesson created", id: data.id, title: data.title, slideCount: slides.length })
}
