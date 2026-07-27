import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

export const LESSON_TITLE = "שיעור 13: חירות ושוויון כערכי יסוד"
export const SLUG = "democracy-liberty-equality-natural-rights-13"

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 13 | אזרחות כיתה י",
    title: "חירות ושוויון כערכי יסוד ורעיון הזכויות הטבעיות",
    animation: { name: "elephant", delay: 3, position: "across", loop: true },
    image_url: null, // suggested: איורי מאזניים המנוגדים בין סמל חירות (שרשרת שבורה) לסמל שוויון (מאזניים)
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
      { id: "obj1", icon: "scroll", text: "נגדיר", options: ["את תאוריית הזכויות הטבעיות כזכויות המוקנות לכל אדם באשר הוא אדם ואינן מוענקות על ידי השלטון."], correct_index: null },
      { id: "obj2", icon: "scale", text: "נסביר", options: ["את המתח המובנה בין ערך החירות לערך השוויון בדמוקרטיה."], correct_index: null },
      { id: "obj3", icon: "shield", text: "נתאר", options: ["את אחריות השלטון לשמירה על זכויות האדם כעקרון יסוד דמוקרטי."], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    image_url: null, // suggested: איור המנגיד סמל חירות (ציפור פורחת) מול סמל שוויון (מאזניים)
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "לוותר על חופש תמורת שוויון מלא?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "q1",
        text: "אם היו מציעים לכם לוותר על חלק מהחופש שלכם (חירות) תמורת הבטחה שכולם יהיו שווים בדיוק במשאבים שלהם (שוויון), הייתם מסכימים?",
        options: [
          "כן, הייתי מסכים/ה",
          "לא, הייתי מסרב/ת",
          "תלוי כמה חופש צריך לוותר",
          "לא בטוח/ה",
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5.1: הקניה — תאוריית הזכויות הטבעיות ──────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    eyebrow: "הקניה",
    title: "תאוריית הזכויות הטבעיות",
    body: "תפיסה מוסרית הרואה באדם בעל זכויות יסוד מרגע לידתו. הן **אינן מוענקות על ידי המדינה**, ולכן השלטון אינו יכול לקחת אותן, אלא מחויב להגן עליהן.",
  },

  // ── שקף 5.2: הקניה — חירות ושוויון כערכי יסוד ─────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    layout: "list",
    eyebrow: "הקניה",
    title: "חירות ושוויון כערכי יסוד",
    body: "שני ערכים אלו עומדים בבסיס הדמוקרטיה, ומהם נגזרות כל זכויות האדם:",
    questions: [
      { id: "v1", icon: "identity", text: "חירות", options: ["מדגישה את חופש הפעולה של האדם."], correct_index: null },
      { id: "v2", icon: "scale", text: "שוויון", options: ["מדגיש את הזכות לקבל יחס שווה ללא קשר לזהות האדם."], correct_index: null },
    ],
  },

  // ── שקף 5.3: הקניה — הקונפליקט בין הערכים ─────────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    eyebrow: "הקניה",
    title: "הקונפליקט בין הערכים",
    body: `בדמוקרטיה קיים מתח מתמיד ביניהם.

> הגדלת השוויון (למשל על ידי מיסוי גבוה) פוגעת לעיתים בחירות (הזכות לקניין), ולהיפך.`,
  },

  // ── שקף 5.4: הקניה — זכויות אינן מוחלטות ──────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    eyebrow: "הקניה",
    title: "זכויות אינן מוחלטות",
    body: `הזכויות הן יחסיות ומתנגשות זו בזו.

> במקרה של התנגשות נדרש **"שקלול ואיזון"** המאפשר פגיעה מינימלית בכל אחת מהן.`,
  },

  // ── שקף 9: בדיקת עירנות ────────────────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "alertness-check",
    eyebrow: "בדיקת עירנות",
    title: "חירות ושוויון כערכי יסוד",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      { id: "ac1", text: "מי מעניק לאדם את זכויותיו הטבעיות לפי התאוריה?", options: ["השלטון", 'האו"ם', "אף גורם — הן מוקנות מעצם היותו אדם", "הכנסת"], correct_index: 2 },
      { id: "ac2", text: "מה קורה כאשר שתי זכויות מתנגשות?", options: ["מבטלים אחת מהן לגמרי", "נדרש שקלול ואיזון", 'פונים לבג"ץ תמיד', "אין פתרון"], correct_index: 1 },
    ],
  },

  // ── שקף 10: הגדרות (להעתקה למחברת) ────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "חירות ושוויון — הגדרות",
    questions: [
      { id: "def1", text: "תאוריית הזכויות הטבעיות", options: [""], feedback: "תפיסה מוסרית-פוליטית המתארת זכויות יסוד המוקנות לכל אדם באשר הוא אדם. הן אינן מוענקות על ידי השלטון ואינן תלויות בו, והשלטון מחויב להגן עליהן.", correct_index: null },
      { id: "def2", text: "התנגשות בין זכויות", options: [""], feedback: "הזכויות הן יחסיות ואינן מוחלטות. במקרה של התנגשות בין זכויות או בין זכות לאינטרס ציבורי, נדרש איזון סביר ופגיעה מידתית בזכות הנפגעת.", correct_index: null },
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

  // ── שקף 12: תרגול — שאלת אירוע ─────────────────────────────────────────────
  {
    id: "s12",
    order: 12,
    type: "practice",
    eyebrow: "תרגול",
    title: "הגבלת מכירת נשק",
    questions: [
      {
        id: "pq1",
        tag: "שאלת אירוע",
        text: `אדם תומך בדרישה להגביל את מכירת הנשק במדינה ולקבוע כללים ברורים להרשאות רכישה, כדי להגן על שלום הציבור. לעומתו, אחרים טוענים כי זו פגיעה בחופש של האדם להחליט כיצד לנהל את חייו.

ציינו והציגו את המושג עליו מתבססת העמדה המנוגדת לאיסור.
הסבירו כיצד הוא בא לידי ביטוי בקטע.`,
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
    title: "הגבלת מכירת נשק — תשובה מלאה",
    body: `### ציין
הזכות לחירות

---

### הצג
לכל אדם זכות לחיות ולפעול על פי רצונו החופשי, ואין לשלול חירות זו ללא סיבה מוצדקת.

---

### הסבר
בקטע נטען כי אדם יכול "להחליט כיצד לנהל את חייו" וכי אין לאף אחד זכות להתערב בהחלטותיו. משפט זה מדגיש את זכותו של הפרט לפעול לפי רצונו ללא כפייה של השלטון.`,
  },

  // ── שקף 14: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "חירות ושוויון כערכי יסוד",
    animation: { name: "frog", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "aq1",
        text: "מי מעניק לאדם את זכויותיו הטבעיות?",
        options: ["השלטון", "המדינה", "אף גורם, הן מוקנות לאדם מעצם היותו אדם", 'האו"ם'],
        correct_index: 2,
      },
      {
        id: "aq2",
        text: 'מה משמעות המושג "זכויות אינן מוחלטות"?',
        options: ["שמותר לבטלן", "שהן יחסיות ועלולות להתנגש זו בזו", "שהן שייכות רק לאזרחים", "שהן קבועות בחוקה"],
        correct_index: 1,
      },
      {
        id: "aq3",
        text: "מהו תפקיד השלטון לפי תאוריית הזכויות הטבעיות?",
        options: ["להחליט למי מגיעות זכויות", "לאפשר את הזכויות ולהגן עליהן", "לכתוב את הזכויות בספר החוקים", "לצמצם את הזכויות לטובת הכלל"],
        correct_index: 1,
      },
      {
        id: "aq4",
        text: "מדוע קיים מתח בין חירות לשוויון?",
        options: ["כי הם מילים נרדפות", "כי מימוש מרבי של חירות אחת עלול לפגוע בשוויון של אחר", "כי הדמוקרטיה תומכת רק בחירות", "כי השוויון הוא רק פוליטי"],
        correct_index: 1,
      },
      {
        id: "aq5",
        text: 'מהו "שקלול ואיזון"?',
        options: ["ביטול זכות אחת לטובת השנייה", "מציאת פתרון המאפשר מימוש מקסימלי של שתי זכויות מתנגשות", "חלוקה שווה של כסף", "הענשת מי שפוגע בזכויות"],
        correct_index: 1,
      },
    ],
  },

  // ── שקף 15: שיעורי בית ────────────────────────────────────────────────────
  {
    id: "s15",
    order: 15,
    type: "homework",
    eyebrow: "משימה",
    title: "התנגשות זכות מול צורך המדינה",
    questions: [
      {
        id: "hw1",
        text: 'חפשו כתבה על מקרה בו זכות של אדם התנגשה עם צורך של המדינה (למשל סגר בקורונה או חסימת כבישים בהפגנה).',
        options: [],
        correct_index: null,
      },
      {
        id: "hw2",
        text: 'הסבירו בקצרה אילו שתי "זכויות/ערכים" התנגשו במקרה זה.',
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
      { id: "f1", text: "רמת העניין בנושא הזכויות.", options: [], correct_index: null },
      { id: "f2", text: 'מידת ההבנה של המושג "זכות טבעית".', options: [], correct_index: null },
      { id: "f3", text: "עד כמה הדיון על המתח בין חירות לשוויון היה ברור.", options: [], correct_index: null },
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
        text: '"זכויות האדם והאזרח"',
        feedback: "סרטון",
        options: ['סריקת קוד QR בעמוד 4 בחוברת "אזרחות בכיף".'],
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
