import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

export const LESSON_TITLE = "שיעור 17: זכויות חברתיות וכלכליות"
export const SLUG = "democracy-social-economic-rights-17"

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 17 | אזרחות כיתה י",
    title: "זכויות חברתיות וכלכליות",
    image_url: null, // suggested: איקונים של בית חולים, בית מגורים, בית ספר וחבילת שכר לצד סמל מדינת הרווחה
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
      { id: "obj1", icon: "shield", text: "נגדיר", options: ["את הזכויות החברתיות כזכויות המוענקות על ידי המדינה להבטחת קיום אנושי בכבוד."], correct_index: null },
      { id: "obj2", icon: "building", text: "נמנה", options: ['את חמש הזכויות המרכזיות (ט"ד חת"ר): טיפול רפואי, דיור, חינוך, תנאי העסקה ורמת חיים.'], correct_index: null },
      { id: "obj3", icon: "scale", text: "נסביר", options: ["כי היקף הזכויות תלוי במדיניות הכלכלית ובמשאבי המדינה."], correct_index: null },
      { id: "obj4", icon: "document", text: "נבחין", options: ["בין זכויות אדם טבעיות (חובה) לזכויות חברתיות (מוענקות במידה משתנה)."], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    image_url: null, // suggested: תצלום של שכונת מגורים לצד בית חולים ובית ספר ציבורי
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "דיור חינם לכולם, או עזרה רק למי שבמצוקה?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "q1",
        text: "האם המדינה צריכה לספק לכל אדם דיור (בית) בחינם, או שהיא רק צריכה לעזור למי שנמצא במצוקה קשה?",
        options: [
          "דיור בחינם לכולם",
          "עזרה רק למי שבמצוקה",
          "שילוב של השניים",
          "לא בטוח/ה",
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5.1: הקניה — מהן זכויות חברתיות? ──────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    eyebrow: "הקניה",
    title: "מהן זכויות חברתיות?",
    body: `אלו זכויות שנועדו להבטיח רמת חיים בסיסית וקיום בכבוד לכל אדם.

בניגוד לזכויות טבעיות, המדינה **אינה "חייבת"** להעניקן באותה מידה, והן ניתנות דרך הקצאת משאבים ושירותים.`,
  },

  // ── שקף 5.2: הקניה — חמש הזכויות (ט"ד חת"ר) ───────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    eyebrow: "הקניה",
    title: 'חמש הזכויות — ט"ד חת"ר',
    animation: { name: "pencil", delay: 3, position: "corner-right", loop: true },
    questions: [
      { id: "r1", icon: "shield", text: "טיפול רפואי", options: ["שמירה על הבריאות."], correct_index: null },
      { id: "r2", icon: "building", text: "דיור", options: ["קורת גג ראויה."], correct_index: null },
      { id: "r3", icon: "book", text: "חינוך", options: ["הזדמנות להשכלה."], correct_index: null },
      { id: "r4", icon: "gavel", text: "תנאי העסקה", options: ["זכויות עובדים."], correct_index: null },
      { id: "r5", icon: "food", text: "רמת חיים", options: ["קצבאות ומענקים."], correct_index: null },
    ],
  },

  // ── שקף 5.3: הקניה — זכויות עובדים ותנאי עבודה ────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    eyebrow: "הקניה",
    title: "זכויות עובדים ותנאי עבודה",
    body: "זכויות שהמדינה מחייבת מעסיקים לתת, כגון שכר מינימום, הגבלת שעות עבודה, ימי חופשה והגנה מפני פיטורים שרירותיים.",
  },

  // ── שקף 5.4: הקניה — המדיניות הכלכלית משפיעה ──────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    eyebrow: "הקניה",
    title: "המדיניות הכלכלית משפיעה",
    body: "היקף הזכויות משתנה ממדינה למדינה בהתאם לגישה הכלכלית (**ליברלית** או **סוציאל-דמוקרטית**) ולעושר של המדינה.",
  },

  // ── שקף 9: בדיקת עירנות ────────────────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "alertness-check",
    eyebrow: "בדיקת עירנות",
    title: "זכויות חברתיות וכלכליות",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      { id: "ac1", text: 'מה ראשי התיבות ט"ד חת"ר מייצגים?', options: ["את חמש הזכויות החברתיות המרכזיות", "את תנאי הבחירות", "את זכויות הטבע", "את סוגי הממשל"], correct_index: 0 },
      { id: "ac2", text: "ממה תלוי היקף הזכויות החברתיות שמדינה מעניקה?", options: ["ממזג האוויר", "ממדיניות כלכלית ומשאבי המדינה", "ממספר התושבים בלבד", "מגודל הצבא"], correct_index: 1 },
    ],
  },

  // ── שקף 10: הגדרות (להעתקה למחברת) ────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "זכויות חברתיות — הגדרות",
    questions: [
      { id: "def1", text: "זכויות כלכליות-חברתיות", options: [""], feedback: "זכויות המוענקות על ידי המדינה דרך הקצאת משאבים, במטרה להבטיח קיום אנושי בכבוד ורמת חיים בסיסית (בריאות, חינוך, דיור, רמת חיים וזכויות עובדים).", correct_index: null },
      { id: "def2", text: "זכויות עובדים ותנאי עבודה", options: [""], feedback: "זכויות שהמדינה מחייבת מעסיקים להעניק לעובדים, כגון שכר מינימום, ימי חופשה והגבלת שעות עבודה. היקפן תלוי במדיניות המדינה.", correct_index: null },
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
    title: "מצע לדיור מוזל",
    questions: [
      {
        id: "pq1",
        tag: "שאלת אירוע",
        text: `מצע של מפלגה מבטיח לקדם דיור מוזל ובר-השגה לכולם, שימומן באמצעות מיסים שיוטלו בעיקר על האוכלוסייה בעלת האמצעים.

ציינו והציגו את סוג הזכויות שבא לידי ביטוי במצע המפלגה.
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
    title: "מצע לדיור מוזל — תשובה מלאה",
    body: `### ציין
זכויות חברתיות (כלכליות-חברתיות)

---

### הצג
זכויות המוענקות על ידי המדינה במטרה להבטיח רמת חיים בסיסית וקיום אנושי בכבוד, דרך הקצאת משאבים ושירותים.

---

### הסבר
בקטע מצוין שהמפלגה מבטיחה לקדם "דיור מוזל ובר-השגה לכולם" במימון המדינה. הבטחה זו נועדה לממש את הזכות לדיור, שהיא אחת מהזכויות החברתיות המבטיחות קורת גג לתושבים.`,
  },

  // ── שקף 14: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "זכויות חברתיות וכלכליות",
    questions: [
      {
        id: "aq1",
        text: "מהם ראשי התיבות לזכויות החברתיות?",
        options: ['כ"ח מש"ה', 'ש"א"ר ה"ש', 'ט"ד חת"ר', 'בג"ץ'],
        correct_index: 2,
      },
      {
        id: "aq2",
        text: "איזה מהבאים הוא מרכיב בזכויות עובדים?",
        options: ["חופש הביטוי", "שכר מינימום", "הזכות לפרטיות", "זכות הבחירה"],
        correct_index: 1,
      },
      {
        id: "aq3",
        text: "מה מבדיל זכויות חברתיות מזכויות אדם טבעיות?",
        options: ["חברתיות שייכות רק לעשירים", "חברתיות מוענקות על ידי המדינה והיקפן משתנה", "טבעיות ניתנות רק בבחירות", "אין הבדל"],
        correct_index: 1,
      },
      {
        id: "aq4",
        text: "מדוע מדינה עשירה מעניקה בדרך כלל יותר זכויות חברתיות?",
        options: ["כי יש לה יותר חוקים", "כי היקף הזכויות תלוי בכמות הכסף שיש למדינה לתת", "כי לאנשים עשירים מגיע יותר", 'כי כך קובע האו"ם'],
        correct_index: 1,
      },
      {
        id: "aq5",
        text: "חוק חינם חובה לילדים מגיל 3 מבטא את הזכות ל:",
        options: ["חירות", "חינוך", "רמת חיים", "עיסוק"],
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
    title: "שכר המינימום בישראל",
    questions: [
      {
        id: "hw1",
        text: 'חפשו מידע על "שכר המינימום" בישראל כיום. הסבירו בקצרה מדוע חוק זה נחשב לזכות חברתית (זכויות עובדים).',
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
      { id: "f1", text: 'עד כמה ראשי התיבות ט"ד חת"ר עזרו לזכור את החומר.', options: [], correct_index: null },
      { id: "f2", text: "בהירות הקשר בין מדיניות כלכלית לזכויות.", options: [], correct_index: null },
      { id: "f3", text: "רמת העניין בשיעור.", options: [], correct_index: null },
    ],
  },

  // ── שקף 17: העשרה ─────────────────────────────────────────────────────────
  {
    id: "s17",
    order: 17,
    type: "enrichment",
    eyebrow: "העשרה",
    title: "לסקרנים",
    animation: { name: "turkey", delay: 3, position: "across", loop: true },
    questions: [
      {
        id: "e1",
        text: '"מדינת הרווחה"',
        feedback: "מידע נוסף",
        options: ['סריקת קוד QR בעמוד 22 בחוברת "אזרחות בכיף".'],
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
