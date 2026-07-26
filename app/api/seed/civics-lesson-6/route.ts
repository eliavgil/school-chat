import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"

export const LESSON_TITLE = "שיעור 6: חוק הלאום"
export const SLUG = "civics-nation-state-law-6"

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 6 | אזרחות כיתה י",
    title: 'חוק יסוד: ישראל – מדינת הלאום של העם היהודי (חוק הלאום)',
    image_url: null, // suggested: תצלום מליאת הכנסת בהצבעה, או עמוד השער של ספר החוקים עם חוק הלאום
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
      { id: "obj1", icon: "scale", text: "נסביר", options: ["את מעמדו של חוק הלאום כחוק יסוד המהווה תשתית חוקתית למדינת ישראל."], correct_index: null },
      { id: "obj2", icon: "scroll", text: "נזהה ונפרט", options: ["את עיקרי סעיפי החוק המעגנים את זהות המדינה כביתו הלאומי של העם היהודי."], correct_index: null },
      { id: "obj3", icon: "document", text: "ניישם", options: ["את הידע בפתרון שאלת ידע מתוך בחינת הבגרות העוסקת בתוכן החוק."], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    image_url: null, // suggested: תצלום מרגע ההצבעה על חוק הלאום בכנסת, יולי 2018
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "עליונות הדת היהודית — במחיר של פגיעה?",
    questions: [
      {
        id: "q1",
        text: "האם לדעתכם נכון לחוקק חוק שיבהיר את עליונות הדת היהודית במדינת ישראל, גם במידה של פגיעה מסוימת בישראלים בני דתות אחרות?",
        options: [
          "כן, גם במחיר הזה",
          "לא, זה פוגע בשוויון",
          "אפשר, אבל בזהירות ובאיזון",
          "לא בטוח, תלוי בפרטים",
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5.1: הקניה — המעמד החוקתי ─────────────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    eyebrow: "הקניה",
    title: "המעמד החוקתי של חוק הלאום",
    body: `חוק הלאום הוא **חוק יסוד**, ובשל כך הוא נחשב לחלק מהתשתית החוקתית של מדינת ישראל. החוק מעגן את זהות המדינה כביתו הלאומי של העם היהודי ואת זכותו הייחודית להגדרה עצמית לאומית בה.

> החוק מסתמך על עקרונות המופיעים כבר במגילת העצמאות.`,
  },

  // ── שקף 5.2: הקניה — סמלים, בירה ושפה ──────────────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    eyebrow: "הקניה",
    title: "סמלים, בירה ושפה",
    body: "החוק מעגן מספר סמלים וערכים מרכזיים של המדינה:",
    questions: [
      { id: "c1", icon: "flag", text: "סמלי המדינה", options: ['הדגל (מגן דוד ופסי טלית), סמל המדינה (מנורה וענפי זית) וההמנון ("התקווה").'], correct_index: null },
      { id: "c2", icon: "landmark", text: "בירת המדינה", options: ["ירושלים השלמה והמאוחדת היא בירת ישראל."], correct_index: null },
      { id: "c3", icon: "language", text: "שפת המדינה", options: ["השפה העברית היא שפת המדינה, ולשפה הערבית מוענק מעמד מיוחד במדינה."], correct_index: null },
    ],
  },

  // ── שקף 5.3: הקניה — עלייה, התיישבות ולוח שנה ─────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    eyebrow: "הקניה",
    title: "עלייה, התיישבות ולוח שנה",
    body: "החוק מתייחס להיבטים נוספים של הזהות הלאומית:",
    questions: [
      { id: "d_1", icon: "identity", text: "קיבוץ גלויות", options: ["המדינה תהיה פתוחה לעלייה יהודית וקיבוץ גלויות."], correct_index: null },
      { id: "d_2", icon: "building", text: "התיישבות יהודית", options: ["המדינה רואה בפיתוח התיישבות יהודית ערך לאומי ותפעל לעודד ולקדם את הקמתו וביסוסו."], correct_index: null },
      { id: "d_3", icon: "calendar", text: "לוח השנה", options: ["לוח השנה העברי הוא לוח רשמי של המדינה לצד הלוח הלועזי."], correct_index: null },
    ],
  },

  // ── שקף 5.4: הקניה — הקשר ליהדות התפוצות ──────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    eyebrow: "הקניה",
    title: "הקשר בין המדינה ליהדות התפוצות",
    body: `חוק הלאום מעגן גם את האחריות של המדינה כלפי העם היהודי בתפוצות. המדינה תפעל לשמור על זיקת העם היהודי בתפוצות למדינה, תפעל בתוך התפוצות לשימור המורשת היהודית ותסייע ליהודים הנמצאים במצוקה בשל יהדותם.`,
  },

  // ── שקף 9: הגדרות (להעתקה למחברת) ─────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "חוק הלאום — הגדרות ועיקרי החוק (מחוון 2017)",
    questions: [
      { id: "def1", text: "חוק יסוד: ישראל – מדינת הלאום של העם היהודי", options: [""], feedback: "חוק יסוד המעגן את זהותה של מדינת ישראל כביתו הלאומי של העם היהודי.", correct_index: null },
      { id: "def2", text: "סמלי המדינה", options: [""], feedback: "הדגל, הסמל וההמנון הם סמלי המדינה.", correct_index: null },
      { id: "def3", text: "בירת המדינה", options: [""], feedback: "ירושלים השלמה והמאוחדת היא בירת ישראל.", correct_index: null },
      { id: "def4", text: "שפת המדינה", options: [""], feedback: "עברית היא שפת המדינה; לשפה הערבית מעמד מיוחד במדינה.", correct_index: null },
      { id: "def5", text: "קיבוץ גלויות", options: [""], feedback: "המדינה תהיה פתוחה לעלייה יהודית וקיבוץ גלויות.", correct_index: null },
      { id: "def6", text: "התיישבות יהודית", options: [""], feedback: "המדינה רואה בפיתוח התיישבות יהודית ערך לאומי ותפעל לעודד ולקדם את הקמתו וביסוסו.", correct_index: null },
      { id: "def7", text: "לוח השנה", options: [""], feedback: "לוח השנה העברי הוא לוח רשמי של המדינה.", correct_index: null },
    ],
  },

  // ── שקף 10: מנוחמוח ───────────────────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "brain-break",
    eyebrow: "",
    title: "מנוחמוח",
    animation: { name: "giraffe", delay: 0, position: "big-center", loop: true },
  },

  // ── שקף 11: תרגול — שאלת ידע ──────────────────────────────────────────────
  {
    id: "s11",
    order: 11,
    type: "practice",
    eyebrow: "שאלון 34281, חורף 2026",
    title: "עיקרי חוק הלאום",
    questions: [
      {
        id: "pq1",
        tag: "שאלת ידע",
        text: "הציגו את עיקרי התוכן של חוק יסוד: ישראל – מדינת הלאום של העם היהודי.",
        options: [],
        correct_index: null,
      },
    ],
  },

  // ── שקף 12: תשובה ─────────────────────────────────────────────────────────
  {
    id: "s12",
    order: 12,
    type: "answer",
    eyebrow: "תשובת מודל",
    title: "עיקרי חוק הלאום — תשובה מלאה",
    body: `### זהות המדינה
החוק מעגן את זהותה של מדינת ישראל כביתו הלאומי של העם היהודי.

---

### סמלים, בירה ושפה
החוק כולל סעיפים המעגנים את סמלי המדינה (דגל, סמל וההמנון), קובע כי ירושלים השלמה והמאוחדת היא בירת ישראל, ומגדיר את השפה העברית כשפת המדינה (כאשר לערבית מעמד מיוחד).

---

### עלייה, התיישבות ולוח שנה
החוק קובע כי המדינה תהיה פתוחה לקיבוץ גלויות, רואה בהתיישבות היהודית ערך לאומי ומגדיר את לוח השנה העברי כלוח רשמי של המדינה.`,
  },

  // ── שקף 13: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s13",
    order: 13,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "חוק הלאום",
    questions: [
      {
        id: "aq1",
        text: "מהו המעמד המשפטי של חוק הלאום?",
        options: ["חוק רגיל", "חוק יסוד חוקתי", "תקנה לשעת חירום", "הצהרה לא מחייבת"],
        correct_index: 1,
      },
      {
        id: "aq2",
        text: "כיצד מוגדר מעמד השפה הערבית בחוק הלאום?",
        options: ["שפה רשמית שווה לעברית", "שפה אסורה לשימוש", "מעמד מיוחד", "שפת המיעוטים בלבד"],
        correct_index: 2,
      },
      {
        id: "aq3",
        text: "מה קובע החוק בנוגע להתיישבות יהודית?",
        options: ["היא אסורה על פי חוק", "המדינה רואה בה ערך לאומי ותפעל לקדמה", "היא מותרת רק בתוך הקו הירוק", "המדינה לא מתערבת בנושא"],
        correct_index: 1,
      },
      {
        id: "aq4",
        text: "איזה לוח שנה מוגדר כלוח רשמי של המדינה בחוק?",
        options: ["הלועזי בלבד", "העברי כלוח רשמי", "המוסלמי", "אין לוח שנה רשמי"],
        correct_index: 1,
      },
      {
        id: "aq5",
        text: "מהי הגדרת ירושלים בחוק הלאום?",
        options: ["עיר בינלאומית", "בירת העם היהודי בלבד", "ירושלים השלמה והמאוחדת היא בירת ישראל", "בירה שתחולק בעתיד"],
        correct_index: 2,
      },
    ],
  },

  // ── שקף 14: שיעורי בית ────────────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "homework",
    eyebrow: "משימה",
    title: "סעיף נוסף בחוק הלאום",
    questions: [
      {
        id: "hw1",
        text: 'חפשו באתר האינטרנט של הכנסת או במאגרי מידע משפטיים את נוסח חוק הלאום המלא, ובחרו סעיף אחד מתוכו שאינו מופיע ברשימת "עיקרי החוק" שלמדנו בשיעור (למשל הסעיף העוסק בקשר עם יהדות התפוצות או ביום העצמאות).',
        options: [],
        correct_index: null,
      },
      {
        id: "hw2",
        text: "הסבירו בקצרה מדוע הסעיף שבחרתם חשוב לדעתכם לעיגון זהות המדינה.",
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
      { id: "f1", text: "עד כמה הבנת את ההבדל בין חוק יסוד לחוק רגיל?", options: [], correct_index: null },
      { id: "f2", text: "עד כמה סעיפי חוק הלאום ברורים לך כעת?", options: [], correct_index: null },
      { id: "f3", text: "עד כמה התרגול של שאלת הבגרות עזר לך להבין מה נדרש בבחינה?", options: [], correct_index: null },
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
        text: "תרגול נוסף על היסודות החוקתיים",
        feedback: "קישור דיגיטלי",
        options: ['סריקת קוד QR בעמוד 45 בחוברת "אזרחות בכיף".'],
        correct_index: null,
      },
      {
        id: "e2",
        text: "חוק הלאום — משמעויות משפטיות וציבוריות",
        feedback: "סרטון הרחבה",
        options: ["מתוך אתר מערכת השידורים הלאומית."],
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
    .select("id, title")
    .eq("slug", SLUG)
    .maybeSingle()

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 })

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
      slug: SLUG,
      slides,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: "Lesson created", id: data.id, title: data.title, slideCount: slides.length })
}
