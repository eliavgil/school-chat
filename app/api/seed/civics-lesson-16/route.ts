import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

export const LESSON_TITLE = "שיעור 16: הזכות לשוויון — הבחנה, אפליה והעדפה מתקנת"
export const SLUG = "democracy-right-to-equality-discrimination-affirmative-16"

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 16 | אזרחות כיתה י",
    title: "הזכות לשוויון: אפליה פסולה, הבחנה מותרת והעדפה מתקנת",
    image_url: null, // suggested: איור של מאזני צדק, או תמונת ידיים שונות המחזיקות באותו שלט "שוויון"
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
      { id: "obj1", icon: "scale", text: "נגדיר", options: ["את הזכות לשוויון ואת שני מובניה: המצומצם (בפני החוק) והרחב (הזדמנויות)."], correct_index: null },
      { id: "obj2", icon: "gavel", text: "נבחין", options: ['בין "אפליה פסולה" לבין "הבחנה מותרת" על בסיס רלוונטיות השונות לנושא.'], correct_index: null },
      { id: "obj3", icon: "handshake", text: "נסביר", options: ['את המושג "העדפה מתקנת" ככלי זמני לצמצום פערים חברתיים.'], correct_index: null },
      { id: "obj4", icon: "flag", text: "נדגים", options: ["כל אחד מסוגי המדיניות ממציאות החיים בישראל."], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    image_url: null, // suggested: תצלום המחיש הבדל בין שוויון פורמלי לשוויון מהותי (איור עם ארגזים בגבהים שונים)
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "מלגה גדולה יותר לסטודנטים מהפריפריה?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "q1",
        text: "האם זה הוגן לתת לסטודנטים מהפריפריה מלגת לימודים גדולה יותר מאשר לסטודנטים מהמרכז, גם אם הציונים שלהם זהים?",
        options: [
          "כן, זה הוגן",
          "לא, זה לא הוגן",
          "תלוי בנסיבות הכלכליות",
          "לא בטוח/ה",
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5.1: הקניה — הזכות לשוויון ─────────────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    eyebrow: "הקניה",
    title: "הזכות לשוויון",
    body: "זכותו של כל אדם לקבל יחס שווה ללא הבדל דת, גזע, מין או נטייה מינית. היא כוללת **שוויון בפני החוק** (פורמלי) ו**שוויון הזדמנויות** (מהותי).",
  },

  // ── שקף 5.2: הקניה — אפליה פסולה ───────────────────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    eyebrow: "הקניה",
    title: "אפליה פסולה",
    body: "מתן יחס שונה לבני אדם שווים בשל סיבה שאינה מוצדקת (למשל בגלל מראה חיצוני או מוצא).",
  },

  // ── שקף 5.3: הקניה — הבחנה מותרת ───────────────────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    eyebrow: "הקניה",
    title: "הבחנה מותרת",
    body: "מתן יחס שונה כאשר השונות רלוונטית לנושא הנידון (למשל: תוספת זמן במבחן לתלמיד לקוי למידה, או הקלות במס לנכים).",
  },

  // ── שקף 5.4: הקניה — העדפה מתקנת ───────────────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    eyebrow: "הקניה",
    title: "העדפה מתקנת",
    body: `מתן יחס מועדף לקבוצה מקופחת למשך זמן מסוים, במטרה לצמצם פערים בינה לבין שאר האוכלוסייה.

> קיימת מחלוקת לגביה, כי היא יוצרת "אפליה הפוכה" כלפי פרטים אחרים.`,
  },

  // ── שקף 9: בדיקת עירנות ────────────────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "alertness-check",
    eyebrow: "בדיקת עירנות",
    title: "הזכות לשוויון",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      { id: "ac1", text: "מהו ההבדל בין אפליה פסולה להבחנה מותרת?", options: ["אין הבדל", "בהבחנה השונות רלוונטית לנושא, באפליה לא", "אפליה מותרת בחוק", "הבחנה אסורה תמיד"], correct_index: 1 },
      { id: "ac2", text: "כמה זמן אמורה העדפה מתקנת להימשך?", options: ["לתמיד", "זמן מוגבל, עד לצמצום הפער", "יום אחד בלבד", "אין לה זמן קצוב לעולם"], correct_index: 1 },
    ],
  },

  // ── שקף 10: הגדרות (להעתקה למחברת) ────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "הזכות לשוויון — הגדרות",
    animation: { name: "survey", delay: 3, position: "center", loop: true },
    questions: [
      { id: "def1", text: "הזכות לשוויון", options: [""], feedback: "אין להפלות אדם בשל זהותו או שיוכו (דת, גזע, מין וכו'), אלא אם השונות רלוונטית לנושא (הבחנה).", correct_index: null },
      { id: "def2", text: "אפליה פסולה", options: [""], feedback: "הענקת יחס שונה לבני אדם ללא סיבה מוצדקת, ובפרט בשל סממן חיצוני או זהות.", correct_index: null },
      { id: "def3", text: "הבחנה (מותרת)", options: [""], feedback: "הענקת יחס שונה כאשר השונות רלוונטית לנושא הנידון.", correct_index: null },
      { id: "def4", text: "העדפה מתקנת", options: [""], feedback: "הענקת הטבה/יחס מועדף לקבוצה מקופחת למשך זמן מסוים, במטרה לצמצם פערים ואי-שוויון.", correct_index: null },
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
    title: "עדיפות לעולים חדשים בקורס צוערים",
    animation: { name: "dog", delay: 3, position: "across", loop: true },
    questions: [
      {
        id: "pq1",
        tag: "שאלת אירוע",
        text: `במטרה לשלב עולים חדשים ותושבי פיתוח בשירות המדינה, הוחלט להעניק להם עדיפות בקבלה לקורס צוערים, וזאת בתנאי שיעברו את בחינות הסף בהצלחה.

ציינו והציגו את סוג המדיניות שבא לידי ביטוי בהחלטה זו.
הסבירו כיצד היא באה לידי ביטוי בקטע.`,
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
    title: "עדיפות לעולים חדשים — תשובה מלאה",
    body: `### ציין
מדיניות של העדפה מתקנת

---

### הצג
הענקת הטבה או יחס מועדף לקבוצה מקופחת או חלשה למשך זמן מסוים, במטרה לצמצם את הפער בינה לבין שאר האוכלוסייה.

---

### הסבר
בקטע מצוין כי הוחלט "להעניק עדיפות" לאוכלוסיות (עולים ותושבי פיתוח) שנוכחותם בשירות המדינה נמוכה. מטרת העדיפות היא לשלבם במערכת ולצמצם את תת-הייצוג שלהם, וזהו המאפיין של העדפה מתקנת.`,
  },

  // ── שקף 14: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "הזכות לשוויון",
    questions: [
      {
        id: "aq1",
        text: "אדם נדחה מראיון עבודה כי המעסיק אינו מוכן להעסיק אנשים עם מוגבלות פיזית (למרות שהיא לא מפריעה לעבודה). זוהי:",
        options: ["הבחנה", "אפליה פסולה", "העדפה מתקנת", "זכות חברתית"],
        correct_index: 1,
      },
      {
        id: "aq2",
        text: "מתן מלגות מיוחדות רק לסטודנטים שיצאו למילואים הוא דוגמה ל:",
        options: ["אפליה פסולה", "הבחנה מותרת", "שוויון בפני החוק", "קניין רוחני"],
        correct_index: 1,
      },
      {
        id: "aq3",
        text: 'מהו התנאי המרכזי ל"העדפה מתקנת"?',
        options: ["שהיא תהיה לתמיד", "שהיא תינתן לכל האזרחים", "שהיא תינתן לקבוצה מקופחת למשך זמן מוגבל", "שהיא תבוצע רק על ידי הצבא"],
        correct_index: 2,
      },
      {
        id: "aq4",
        text: "מה הדומה בין הבחנה להעדפה מתקנת?",
        options: ["שתיהן לתמיד", "בשתיהן מתקיימת פגיעה בשוויון (יחס שונה) מסיבה מוצדקת", "שתיהן אסורות בדמוקרטיה", "שתיהן קשורות רק לכסף"],
        correct_index: 1,
      },
      {
        id: "aq5",
        text: "מדוע הענקת תוספת זמן במבחן לתלמיד עם דיסלקציה היא הבחנה ולא אפליה?",
        options: ["כי זה עוזר לו להצליח", "כי לקות הלמידה היא שונות רלוונטית לנושא המבחן", "כי כל התלמידים רוצים תוספת זמן", "כי זו הוראה של משרד החינוך"],
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
    title: "דוגמה להבחנה מותרת",
    questions: [
      {
        id: "hw1",
        text: 'מצאו דוגמה מהמציאות (למשל בספורט, בחינוך או בעבודה) ל"הבחנה מותרת" והסבירו מדוע השונות באותו מקרה היא רלוונטית.',
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
      { id: "f1", text: "הבנת ההבדל בין אפליה להבחנה.", options: [], correct_index: null },
      { id: "f2", text: "בהירות המושג העדפה מתקנת.", options: [], correct_index: null },
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
        text: '"שוויון פורמלי מול שוויון מהותי"',
        feedback: "תמונה",
        options: ['עמוד 26 בחוברת "אזרחות בכיף".'],
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
