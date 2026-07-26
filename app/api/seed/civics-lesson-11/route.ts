import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"

const LESSON_TITLE = 'שיעור 11: תנאי יסוד לבחירות דמוקרטיות (כ"ח מש"ה)'

const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 11 | אזרחות כיתה י",
    title: 'תנאי יסוד לבחירות דמוקרטיות (כ"ח מש"ה)',
    image_url: null, // suggested: תצלום של תא הצבעה חשאי בקלפי
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
      { id: "obj1", icon: "vote", text: "ימנה", options: ['את חמשת התנאים ההכרחיים לקיום בחירות דמוקרטיות (כ"ח מש"ה).'], correct_index: null },
      { id: "obj2", icon: "scale", text: "יסביר", options: ["את החשיבות של כל תנאי להבטחת הליך דמוקרטי תקין וחילופי שלטון."], correct_index: null },
      { id: "obj3", icon: "alert", text: "יזהה", options: ["פגיעה בתנאי בחירות מתוך תיאור מקרה של בחירות שאינן תקינות."], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    image_url: null, // suggested: תצלום של פתק הצבעה ומעטפה בקלפי ישראלית
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "בחירות עם מועמד אחד — עדיין דמוקרטיה?",
    questions: [
      {
        id: "q1",
        text: "דמיינו שבמדינה מסוימת יש בחירות, אבל מותר להצביע רק למועמד אחד. האם אלו בחירות דמוקרטיות? מה חסר בהן?",
        options: [
          "כן, זו עדיין דמוקרטיה",
          "לא, זה לא דמוקרטי בכלל",
          "תלוי בפרטים נוספים",
          "לא בטוח",
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5.1: הקניה — בחירות כמרכיב בסיסי ──────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    eyebrow: "הקניה",
    title: "בחירות כמרכיב בסיסי",
    body: `הבחירות הן הליך המאפשר את מימוש שלטון העם וחילופי שלטון.

כדי שהן יהיו דמוקרטיות, חייבים להתקיים 5 תנאים, המיוצגים בראשי התיבות: **כ"ח מש"ה**.`,
  },

  // ── שקף 5.2: הקניה — כלליות וחשאיות ────────────────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    layout: "list",
    eyebrow: "הקניה",
    title: "כלליות וחשאיות",
    questions: [
      { id: "c1", icon: "vote", text: "כלליות", options: ["כל אזרחי המדינה זכאים לבחור ולהיבחר (במגבלות גיל וחוק)."], correct_index: null },
      { id: "c2", icon: "lock", text: "חשאיות", options: ["איש מלבד הבוחר לא יודע במי בחר, כדי למנוע לחצים בלתי הוגנים."], correct_index: null },
    ],
  },

  // ── שקף 5.3: הקניה — מחזוריות ושוויוניות ───────────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    layout: "list",
    eyebrow: "הקניה",
    title: "מחזוריות ושוויוניות",
    questions: [
      { id: "m1", icon: "calendar", text: "מחזוריות", options: ["הבחירות חוזרות במרווחי זמן ידועים וסדירים הקבועים בחוק."], correct_index: null },
      { id: "m2", icon: "scale", text: "שוויוניות", options: ['"אדם אחד — קול אחד" — כל קול שווה למשנהו בכוחו.'], correct_index: null },
    ],
  },

  // ── שקף 5.4: הקניה — התמודדות חופשית/הוגנת ─────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    eyebrow: "הקניה",
    title: "התמודדות חופשית / הוגנת",
    body: "תחרות הוגנת המבוססת על **חירויות פוליטיות** (חופש הביטוי, התאגדות) המאפשרת למועמדים שונים להציג את דעתם.",
  },

  // ── שקף 9: הגדרות (להעתקה למחברת) ─────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: 'תנאי יסוד לבחירות דמוקרטיות — הגדרות (כ"ח מש"ה)',
    questions: [
      { id: "def1", text: "בחירות דמוקרטיות", options: [""], feedback: "מאפיין בסיסי המאפשר חילופי שלטון.", correct_index: null },
      { id: "def2", text: "כלליות", options: [""], feedback: "כל אזרח זכאי לבחור ולהיבחר במגבלות החוק.", correct_index: null },
      { id: "def3", text: "חשאיות", options: [""], feedback: "מובטח שהבוחר לא ייחשף ולא יופעלו עליו לחצים.", correct_index: null },
      { id: "def4", text: "מחזוריות", options: [""], feedback: "בחירות במרווחי זמן קבועים בחוק.", correct_index: null },
      { id: "def5", text: "שוויוניות", options: [""], feedback: "קולו של כל מצביע שווה למשנהו.", correct_index: null },
      { id: "def6", text: "התמודדות חופשית / הוגנת", options: [""], feedback: "קיום תחרות הוגנת בין מועמדים על בסיס חירויות פוליטיות.", correct_index: null },
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

  // ── שקף 11: תרגול — שאלת אירוע ─────────────────────────────────────────────
  {
    id: "s11",
    order: 11,
    type: "practice",
    eyebrow: "חוברת השאלות",
    title: "סגירת עיתונים לקראת הבחירות",
    questions: [
      {
        id: "pq1",
        tag: "שאלת אירוע",
        text: `במדינה מסוימת לקראת תחילת מערכת הבחירות אסר השלטון לקיים אספת בחירות וסגר עיתונים וערוצי תקשורת פרטיים.

ציין והצג איזה תנאי הכרחי לקיום בחירות דמוקרטיות נפגע?
הסבר כיצד תנאי זה בא לידי ביטוי בקטע.`,
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
    title: "סגירת עיתונים לקראת הבחירות — תשובה מלאה",
    body: `### ציין
התמודדות חופשית והוגנת

---

### הצג
קיום תחרות הוגנת המבוססת על חירויות פוליטיות כמו חופש הביטוי והעיתונות.

---

### הסבר
בקטע מצוין שהשלטון סגר ערוצי תקשורת ואסר אספות בחירות. פעולות אלו מונעות מהמועמדים להציג את עמדותיהם ולהתמודד באופן הוגן מול השלטון, ובכך נפגע התנאי להתמודדות חופשית.`,
  },

  // ── שקף 13: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s13",
    order: 13,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: 'תנאי יסוד לבחירות דמוקרטיות',
    questions: [
      {
        id: "aq1",
        text: "ראשי התיבות לתנאי בחירות הם:",
        options: ['א"ר ה"ש', 'כ"ח מש"ה', 'צה"ל', 'בג"ץ'],
        correct_index: 1,
      },
      {
        id: "aq2",
        text: 'מה מבטיח תנאי ה"חשאיות"?',
        options: ["שאף אחד לא ידע שיש בחירות", "איש מלבד הבוחר לא ידע במי בחר", "שרק האזרחים יוכלו להצביע", "שהקולות ייספרו בסוד"],
        correct_index: 1,
      },
      {
        id: "aq3",
        text: "אם כל קול שווה בכוחו לאחר, זהו תנאי ה:",
        options: ["כלליות", "מחזוריות", "שוויוניות", "חשאיות"],
        correct_index: 2,
      },
      {
        id: "aq4",
        text: "בחירות שנערכות כל 4 שנים בממוצע מקיימות את תנאי ה:",
        options: ["מחזוריות", "כלליות", "שוויוניות", "חשאיות"],
        correct_index: 0,
      },
      {
        id: "aq5",
        text: "איזה תנאי דורש שלכל אזרח תהיה זכות לבחור ולהיבחר?",
        options: ["כלליות", "שוויוניות", "חשאיות", "מחזוריות"],
        correct_index: 0,
      },
    ],
  },

  // ── שקף 14: שיעורי בית ────────────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "homework",
    eyebrow: "משימה",
    title: "בחירות בדיקטטורה",
    questions: [
      {
        id: "hw1",
        text: "בחרו מדינה אחת שאינה דמוקרטית (דיקטטורה). בדקו באינטרנט: האם מתקיימות בה בחירות?",
        options: [],
        correct_index: null,
      },
      {
        id: "hw2",
        text: 'אם כן, איזה מתנאי כ"ח מש"ה חסר בהן בצורה הכי בולטת? הסבירו ב-2 משפטים.',
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
      { id: "f1", text: 'האם ראשי התיבות כ"ח מש"ה עזרו לך לזכור את החומר?', options: [], correct_index: null },
      { id: "f2", text: "עד כמה ברור לך למה חשוב שהבחירות יהיו חשאיות?", options: [], correct_index: null },
      { id: "f3", text: "רמת העניין שלך בשיעור.", options: [], correct_index: null },
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
        text: "תנאי הבחירות הדמוקרטיים",
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
  const slug = "democracy-election-conditions-11"

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
