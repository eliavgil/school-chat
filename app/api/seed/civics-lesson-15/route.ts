import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

export const LESSON_TITLE = "שיעור 15: הזכות לחירות ונגזרותיה"
export const SLUG = "democracy-right-to-liberty-derivatives-15"

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 15 | אזרחות כיתה י",
    title: "הזכות לחירות ונגזרותיה",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/0/0f/View_of_the_crowd_-WomensMarch_-WomensMarch2018_-SenecaFalls_-NY_%2838908937755%29.jpg", // המונים במצעד נשים, סניקה פולס ארה"ב 2018 — מימוש המוני של הזכות לחירות הביטוי וההתאספות. Wikimedia Commons, CC BY 2.0
    image_position: "top",
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
    animation: { name: "camel", delay: 3, position: "across", loop: true },
    questions: [
      { id: "obj1", icon: "identity", text: "נגדיר", options: ["את הזכות לחירות ואת משמעותה כזכותו של אדם לעצב את אישיותו ולפעול לפי רצונו."], correct_index: null },
      { id: "obj2", icon: "megaphone", text: "נמנה ונסביר", options: ["לפחות חמש חירויות הנגזרות מהזכות לחירות (ביטוי, מחשבה, תנועה, עיסוק, דת/מדת)."], correct_index: null },
      { id: "obj3", icon: "scale", text: "ננתח", options: ["את המתח בין חופש הביטוי לבין זכויות אחרות (כמו שם טוב או ביטחון)."], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/2/29/Womens-March-MadisonWI-Jan212017-11.jpg", // מפגינות עם שלטים במצעד נשים, מדיסון ויסקונסין 2017. Wikimedia Commons, CC BY-SA 4.0
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "האם חופש הביטוי צריך להיות מוחלט?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "q1",
        text: "האם חופש הביטוי צריך להיות מוחלט? האם מותר לאדם לומר כל מה שעולה על דעתו גם אם זה מעליב אחרים או מסכן את ביטחון המדינה?",
        options: [
          "כן, מוחלט לגמרי",
          "לא, יש לו גבולות",
          "תלוי בהקשר",
          "לא בטוח/ה",
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5.1: הקניה — הזכות לחירות ──────────────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    eyebrow: "הקניה",
    title: "הזכות לחירות",
    body: "זכותו של כל אדם לחיות, לפעול או להימנע מפעולה על פי רצונו החופשי. היא כוללת היבט חיובי (חופש בחירה) ושלילי (**איסור על מעצר שרירותי**).",
  },

  // ── שקף 5.2: הקניה — חופש הביטוי וחופש המחשבה ──────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    layout: "list",
    eyebrow: "הקניה",
    title: "חופש הביטוי וחופש המחשבה",
    questions: [
      { id: "c1", icon: "megaphone", text: "חופש הביטוי", options: ["הזכות להפיץ דעות ואמונות בכל דרך (דיבור, אמנות, לבוש) ובפומבי."], correct_index: null },
      { id: "c2", icon: "quote", text: "חופש המחשבה והמצפון", options: ["הזכות להחזיק בכל דעה בלב ולסרב לפעול בניגוד למוסר האישי."], correct_index: null },
    ],
  },

  // ── שקף 5.3: הקניה — חופש התנועה וחופש העיסוק ──────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    layout: "list",
    eyebrow: "הקניה",
    title: "חופש התנועה וחופש העיסוק",
    questions: [
      { id: "m1", icon: "plane", text: "חופש התנועה", options: ["הזכות לנוע בחופשיות ולבחור את מקום המגורים."], correct_index: null },
      { id: "m2", icon: "building", text: "חופש העיסוק", options: ["הזכות לבחור כל מקצוע או מקום עבודה (מוענק בישראל לאזרחים ותושבים בלבד)."], correct_index: null },
    ],
  },

  // ── שקף 5.4: הקניה — חופש דת וחופש מדת ─────────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    layout: "list",
    eyebrow: "הקניה",
    title: "חופש דת וחופש מדת",
    questions: [
      { id: "r1", icon: "family", text: "חופש דת", options: ["הזכות להאמין ולקיים פולחן דתי."], correct_index: null },
      { id: "r2", icon: "quote", text: "חופש מדת", options: ["הזכות לא להאמין ולא לסבול מכפייה או הטפה דתית מצד המדינה."], correct_index: null },
    ],
  },

  // ── שקף 9: בדיקת עירנות ────────────────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "alertness-check",
    eyebrow: "בדיקת עירנות",
    title: "הזכות לחירות ונגזרותיה",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      { id: "ac1", text: "איזו חירות עוסקת בזכות לבחור מקצוע?", options: ["חופש הביטוי", "חופש העיסוק", "חופש התנועה", "חופש דת"], correct_index: 1 },
      { id: "ac2", text: "מהו חופש מדת?", options: ["הזכות להאמין ולקיים פולחן", "הזכות לא להאמין ולא לסבול מכפייה דתית", "הזכות לבחור מקום מגורים", "הזכות להביע דעה בפומבי"], correct_index: 1 },
    ],
  },

  // ── שקף 10: הגדרות (להעתקה למחברת) ────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "הזכות לחירות — הגדרות",
    questions: [
      { id: "def1", text: "הזכות לחירות", options: [""], feedback: "לכל אדם זכות לחיות/לפעול/לעצב את אישיותו על פי רצונו החופשי. אין לשלול את חירותו על ידי מעצר שרירותי.", correct_index: null },
      { id: "def2", text: "חופש הביטוי", options: [""], feedback: "לכל אדם זכות לבטא ולהפיץ את עמדותיו ודעותיו בכל דרך (דיבור, כתב, אמנות, לבוש) ובפומבי.", correct_index: null },
      { id: "def3", text: "חופש העיסוק", options: [""], feedback: "לכל אדם זכות לעבוד בכל עבודה או מקצוע, בכפוף להכשרה נדרשת.", correct_index: null },
      { id: "def4", text: "חופש דת וחופש מדת", options: [""], feedback: "חופש דת הוא הזכות להשתייך לקבוצה דתית ולקיים פולחן. חופש מדת הוא הזכות לא להחזיק באמונה ולא לסבול מכפייה דתית.", correct_index: null },
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
    title: "ביטול בדיקת העובדות ברשתות",
    questions: [
      {
        id: "pq1",
        tag: "שאלת אירוע",
        text: `באחרונה הוחלט לבטל את מערך בדיקת העובדות ברשתות החברתיות, כך שכל גולש יוכל לפרסם את דעתו ללא פיקוח. התומכים טוענים כי הדבר יאפשר לאנשים להיחשף למידע מגוון ולהביע את רעיונותיהם באופן חופשי.

ציינו והציגו את הזכות שהתומכים מבקשים לקדם.
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
    title: "ביטול בדיקת העובדות — תשובה מלאה",
    body: `### ציין
הזכות לחופש הביטוי

---

### הצג
זכותו של כל אדם להביע ולהפיץ את דעותיו, רגשותיו או אמונותיו בכל דרך שיבחר ובפומבי.

---

### הסבר
בקטע נכתב כי ביטול הפיקוח יאפשר לאנשים "להביע את הרעיונות והעמדות שלהם" ללא חסמים. בכך ממומשת זכותם של הגולשים להפיץ את דבריהם ברבים ללא הגבלה של השלטון או גוף מפקח.`,
  },

  // ── שקף 14: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "הזכות לחירות ונגזרותיה",
    questions: [
      {
        id: "aq1",
        text: 'איזו חירות נפגעת אם המדינה אוסרת על אזרח לצאת לטיול בחו"ל ללא סיבה מוצדקת?',
        options: ["ביטוי", "תנועה", "דת", "עיסוק"],
        correct_index: 1,
      },
      {
        id: "aq2",
        text: "מה ההבדל בין חופש המחשבה לחופש הביטוי?",
        options: ["אין הבדל", "מחשבה היא פנימית, ביטוי הוא הוצאה החוצה לרבים", "ביטוי הוא רק בכתב", "מחשבה שייכת רק לילדים"],
        correct_index: 1,
      },
      {
        id: "aq3",
        text: "הזכות של אדם לא לקיים טקסים דתיים בניגוד לרצונו נקראת:",
        options: ["חופש דת", "חופש המצפון", "חופש מדת", "חופש העיסוק"],
        correct_index: 2,
      },
      {
        id: "aq4",
        text: 'מדוע חופש העיסוק מוגבל לעיתים על ידי "הכשרה מקצועית"?',
        options: ["כדי לפגוע בחירות", "כהבחנה מותרת שנועדה להגן על הציבור (למשל רישיון לרפואה)", "כי אין מספיק מקומות עבודה", "כי זו זכות חברתית"],
        correct_index: 1,
      },
      {
        id: "aq5",
        text: "האם פקודה של המשטרה לפזר הפגנה אלימה היא פגיעה מוצדקת בחירות?",
        options: ["לא, חירות היא מוחלטת", "כן, כי מימוש הזכות פוגע בזכויות הזולת או בסדר הציבורי", "רק אם המפגינים אינם אזרחים", "כן, כי למשטרה מותר הכל"],
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
    title: "חופש ביטוי דרך לבוש",
    questions: [
      {
        id: "hw1",
        text: 'חשבו על דוגמה ל"חופש הביטוי" דרך לבוש שראיתם בבית הספר או בטלוויזיה. הסבירו איך הלבוש הזה מבטא עמדה או זהות.',
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
    animation: { name: "piggy", delay: 3, position: "top", loop: true },
    questions: [
      { id: "f1", text: "עד כמה הנושא של חופש מדת ברור.", options: [], correct_index: null },
      { id: "f2", text: "הבנת המושג חופש העיסוק.", options: [], correct_index: null },
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
        text: '"חופש הביטוי"',
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
