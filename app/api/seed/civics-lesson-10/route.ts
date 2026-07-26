import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"

const LESSON_TITLE = "שיעור 10: עקרון שלטון העם"

const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 10 | אזרחות כיתה י",
    title: "עקרון שלטון העם: בין דמוקרטיה ישירה לייצוגית",
    image_url: null, // suggested: קלפי מודרנית לצד ציור/תצלום של האגורה באתונה
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
      { id: "obj1", icon: "crown", text: "יגדיר", options: ["את עקרון שלטון העם ויתאר את העם כריבון ומקור הסמכות."], correct_index: null },
      { id: "obj2", icon: "vote", text: "יבחין", options: ["בין דמוקרטיה ישירה (אתונה) לדמוקרטיה עקיפה/ייצוגית (מודרנית) ויסביר את הסיבות למעבר ביניהן."], correct_index: null },
      { id: "obj3", icon: "megaphone", text: "יסביר", options: ["מהו משאל עם ויתאר אותו ככלי של דמוקרטיה ישירה המופעל בתוך משטר ייצוגי."], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    image_url: null, // suggested: תצלום של קלפי בבחירות, או שלט הצבעה במשאל עם
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "להחליט בעצמנו, או להשאיר לנציגים?",
    questions: [
      {
        id: "q1",
        text: "האם לדעתכם האזרחים צריכים להחליט בעצמם על כל חוק וחוק דרך האינטרנט, או שעדיף להשאיר את זה לנציגים מומחים בכנסת?",
        options: [
          "להחליט בעצמנו באינטרנט",
          "להשאיר לנציגים מומחים",
          "שילוב של השניים",
          "תלוי בסוג החוק",
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5.1: הקניה — העם כריבון ────────────────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    eyebrow: "הקניה",
    title: "העם כריבון",
    body: `עקרון שלטון העם קובע כי כלל האזרחים הם מקור הסמכות השלטונית.

בדמוקרטיה מודרנית, האזרחים מעבירים את הריבונות לנציגים לזמן קצוב, אך **הנציגים נושאים באחריות בפני העם**.`,
  },

  // ── שקף 5.2: הקניה — דמוקרטיה ישירה מול עקיפה ──────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    eyebrow: "הקניה",
    title: "דמוקרטיה ישירה מול עקיפה",
    body: `בעבר (אתונה) התקיימה **דמוקרטיה ישירה** בה כולם החליטו יחד. כיום נהוגה **דמוקרטיה עקיפה**, בשל ארבע סיבות:

גודל האוכלוסייה, היעדר זמן ומשאבים של הציבור, הצורך במומחיות לקבלת החלטות מורכבות, ואדישות פוליטית.`,
  },

  // ── שקף 5.3: הקניה — משאל עם ───────────────────────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    eyebrow: "הקניה",
    title: "משאל עם",
    body: `כלי של דמוקרטיה ישירה בתוך משטר ייצוגי. הממשל מפנה שאלה מוגדרת לכלל ציבור הבוחרים כדי לשקף את עמדתם ישירות.

> בחלק מהמדינות הוא **מחייב**, ובחלקן הוא כלי **מייעץ** בלבד.`,
  },

  // ── שקף 8: הגדרות (להעתקה למחברת) ─────────────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "עקרון שלטון העם — הגדרות",
    questions: [
      { id: "def1", text: "עקרון שלטון העם", options: [""], feedback: "עקרון יסוד לפיו כלל האזרחים הם הריבון ומקור הסמכות. האזרחים בוחרים שלטון נציגים לזמן קצוב המוגדר בחוק.", correct_index: null },
      { id: "def2", text: "דמוקרטיה ישירה", options: [""], feedback: "מצב בו כלל האזרחים מקבלים את ההחלטות בענייני המדינה ללא מתווכים או נציגים.", correct_index: null },
      { id: "def3", text: "דמוקרטיה עקיפה / ייצוגית", options: [""], feedback: "האזרחים בוחרים נציגים שהם המקבלים את ההחלטות ומקדמים מדיניות.", correct_index: null },
      { id: "def4", text: "משאל עם", options: [""], feedback: "שאלה מוגדרת המופנית אל כלל ציבור הבוחרים. זהו כלי של דמוקרטיה ישירה שנועד לשקף ישירות את עמדות הציבור.", correct_index: null },
    ],
  },

  // ── שקף 9: מנוחמוח ────────────────────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "brain-break",
    eyebrow: "",
    title: "מנוחמוח",
    animation: { name: "giraffe", delay: 0, position: "big-center", loop: true },
  },

  // ── שקף 10: תרגול — שאלת אירוע ─────────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "practice",
    eyebrow: "בגרות חורף 2020",
    title: "משאל עם על פרישה מאיחוד",
    questions: [
      {
        id: "pq1",
        tag: "שאלת אירוע",
        text: `לאחר דיון ציבורי, נערך משאל בקרב כלל האזרחים במדינה. במשאל זה הביעו האזרחים את רצונם לפרוש מן האיחוד, ונקבע תאריך שבו הפרישה אמורה לצאת לפועל.

ציין והצג את העיקרון הדמוקרטי שמימשו אזרחי המדינה בהשתתפותם במשאל.
הסבר כיצד עיקרון זה בא לידי ביטוי בקטע.`,
        options: [],
        correct_index: null,
      },
    ],
  },

  // ── שקף 11: תשובה ─────────────────────────────────────────────────────────
  {
    id: "s11",
    order: 11,
    type: "answer",
    eyebrow: "תשובת מודל",
    title: "משאל עם על פרישה מאיחוד — תשובה מלאה",
    body: `### ציין
עקרון שלטון העם

---

### הצג
עקרון יסוד בדמוקרטיה לפיו האזרחים הם מקור הסמכות והריבון. הם בוחרים נציגים לזמן קצוב.

---

### הסבר
בקטע מצוין שנערך משאל בקרב כל האזרחים, בו הם הביעו את רצונם וקיבלו החלטה על פרישה. בכך מימשו האזרחים את ריבונותם ישירות ושימשו כמקור הסמכות להחלטה.`,
  },

  // ── שקף 12: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s12",
    order: 12,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "עקרון שלטון העם",
    questions: [
      {
        id: "aq1",
        text: 'מי נחשב ל"ריבון" בדמוקרטיה?',
        options: ["הכנסת", "הממשלה", "כלל האזרחים", 'צה"ל'],
        correct_index: 2,
      },
      {
        id: "aq2",
        text: 'דמוקרטיה ישירה התקיימה במאה ה-5 לפנה"ס ב:',
        options: ["פריז", "ירושלים", "אתונה", "לונדון"],
        correct_index: 2,
      },
      {
        id: "aq3",
        text: "מהי אחת הסיבות למעבר לדמוקרטיה עקיפה?",
        options: ["רצון השליטים", "גודל האוכלוסייה והצורך במומחיות", "מחסור במקומות ישיבה", "איסור על התקהלות"],
        correct_index: 1,
      },
      {
        id: "aq4",
        text: "משאל עם נחשב לכלי של:",
        options: ["דמוקרטיה ישירה", "דמוקרטיה עקיפה", "עריצות רוב", "פיקוח מוסדי"],
        correct_index: 0,
      },
      {
        id: "aq5",
        text: "מה הופך משאל עם לכלי משמעותי?",
        options: ["הוא חוסך כסף", "הוא תמיד מייעץ", "הוא נותן תוקף רב להחלטה כי העם מחליט ישירות", "הוא מתקיים כל שבוע"],
        correct_index: 2,
      },
    ],
  },

  // ── שקף 13: שיעורי בית ────────────────────────────────────────────────────
  {
    id: "s13",
    order: 13,
    type: "homework",
    eyebrow: "משימה",
    title: "משאל עם בעולם",
    questions: [
      {
        id: "hw1",
        text: 'חפשו באינטרנט מקרה של משאל עם שנערך בעולם בשנים האחרונות (למשל ה"ברקזיט" בבריטניה).',
        options: [],
        correct_index: null,
      },
      {
        id: "hw2",
        text: "כתבו 3 משפטים: על מה הייתה השאלה? מה הייתה התוצאה? והאם לדעתכם זהו כלי שמועיל ליציבות המדינה?",
        options: [],
        correct_index: null,
      },
    ],
  },

  // ── שקף 14: משוב ──────────────────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "feedback",
    eyebrow: "משוב",
    title: "איך היה השיעור?",
    questions: [
      { id: "f1", text: 'כמה השיעור עזר לך להבין את המושג "ריבונות העם"?', options: [], correct_index: null },
      { id: "f2", text: 'עד כמה המושג "משאל עם" ברור לך כעת?', options: [], correct_index: null },
      { id: "f3", text: "עד כמה נהנית מהדיון על השתתפות ישירה?", options: [], correct_index: null },
    ],
  },

  // ── שקף 15: העשרה ─────────────────────────────────────────────────────────
  {
    id: "s15",
    order: 15,
    type: "enrichment",
    eyebrow: "העשרה",
    title: "לסקרנים",
    questions: [
      {
        id: "e1",
        text: '"עקרון שלטון העם"',
        feedback: "סרטון",
        options: ['סריקת קוד QR בעמוד 13 בחוברת "אזרחות בכיף".'],
        correct_index: null,
      },
    ],
  },
]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = adminClient()
  const slug = "democracy-popular-sovereignty-10"

  const { data: existing, error: existingError } = await sb
    .from("lessons")
    .select("id, title")
    .eq("slug", slug)
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
      slug,
      slides,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: "Lesson created", id: data.id, title: data.title, slideCount: slides.length })
}
