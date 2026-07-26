import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

export const LESSON_TITLE = "שיעור 3: הכרזת העצמאות — חלק א'"
export const SLUG = "civics-declaration-of-independence-part1-3"

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 3 | אזרחות כיתה י",
    title: "הכרזת העצמאות (חלק א'): המסע למדינה והזכות עליה",
    image_url: null, // suggested: תצלום של דוד בן-גוריון מקריא את מגילת העצמאות בתל אביב, 14.5.1948
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
      { id: "obj1", icon: "calendar", text: "נתאר", options: ["את השתלשלות האירועים ההיסטוריים המרכזיים שהובילו להכרזת העצמאות."], correct_index: null },
      { id: "obj2", icon: "scale", text: "נזהה ונסווג", options: ["את שלושת סוגי ההצדקות להקמת המדינה: היסטוריות, בינלאומיות (משפטיות) וטבעית/אוניברסלית."], correct_index: null },
      { id: "obj3", icon: "scroll", text: "נפרט", options: ["את החלק האופרטיבי (המעשי) של ההכרזה — ההכרזה הרשמית ושם המדינה."], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    image_url: null, // suggested: תצלום או קטע וידאו של בן גוריון מקריא את המגילה באולם המוזיאון
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "מה הטיעון הכי חזק להקמת מדינה?",
    questions: [
      {
        id: "q1",
        text: "דמיינו שאתם צריכים לשכנע את מדינות העולם שמגיע לכם להקים מדינה משלכם — מהו הטיעון הכי חזק שתשתמשו בו?",
        options: [
          "הקשר ההיסטורי העתיק שלכם לאדמה",
          "הכרה רשמית שקיבלתם מהאו\"ם",
          "שילוב של שניהם",
          "משהו אחר לגמרי",
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5.1: הקניה — רקע היסטורי (ציר זמן) ────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    layout: "timeline",
    eyebrow: "הקניה",
    title: "רקע היסטורי — ציר הזמן אל ההכרזה",
    questions: [
      { id: "t1", icon: "calendar", text: "1882", options: ["תחילת העלייה הראשונה — המאמץ לשיבה לארץ בדורות האחרונים."], correct_index: null },
      { id: "t2", icon: "calendar", text: "1897", options: ["הקונגרס הציוני הראשון בראשות הרצל — הכרזה על זכות העם לתקומה לאומית."], correct_index: null },
      { id: "t3", icon: "calendar", text: "1917", options: ["הצהרת בלפור — ממשלת בריטניה מודיעה שתעזור להקים בית לאומי לעם היהודי."], correct_index: null },
      { id: "t4", icon: "calendar", text: "1922", options: ["כתב המנדט — חבר הלאומים נותן לבריטניה מנדט ליישום הצהרת בלפור."], correct_index: null },
      { id: "t5", icon: "calendar", text: "1939-1945", options: ["השואה — טבח מיליוני יהודים שהוכיח את ההכרח בפתרון בעיית חוסר המולדת."], correct_index: null },
      { id: "t6", icon: "calendar", text: "29.11.1947", options: ['החלטה 181 של האו"ם (תוכנית החלוקה) — הקמת מדינה יהודית ומדינה ערבית.'], correct_index: null },
      { id: "t7", icon: "calendar", text: "14.5.1948", options: ["הכרזת העצמאות — מועצת העם מכריזה על הקמת מדינת ישראל."], correct_index: null },
    ],
  },

  // ── שקף 5.2: הקניה — הצדקות היסטוריות ─────────────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    eyebrow: "הקניה",
    title: "הצדקות היסטוריות — מאיפה באנו?",
    body: "הצדקות המבוססות על הקשר הרציף בין העם היהודי לארץ ישראל לאורך הדורות.",
    questions: [
      { id: "h1", icon: "book", text: "צמיחת העם", options: ['בארץ ישראל קם העם היהודי ויצר בה נכסי תרבות ובראשם התנ"ך.'], correct_index: null },
      { id: "h2", icon: "globe", text: "שיבה מהגלות", options: ["העם המשיך לשמור אמונים לארצו בכל ארצות פזוריו ולא חדל מלקוות לשוב אליה."], correct_index: null },
      { id: "h3", icon: "alert", text: "השואה", options: ["הוכיחה את ההכרח בפתרון בעיית חוסר המולדת על ידי חידוש המדינה היהודית."], correct_index: null },
    ],
  },

  // ── שקף 5.3: הקניה — הצדקות בינלאומיות וטבעיות ────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    eyebrow: "הקניה",
    title: "הצדקות בינלאומיות וטבעיות — מה הזכות שלנו?",
    questions: [
      { id: "i1", icon: "handshake", text: "הצדקות בינלאומיות (משפטיות)", options: ['נובעות מהחלטות רשמיות של מדינות וגופים בינלאומיים — הצהרת בלפור, כתב המנדט והחלטת האו"ם 181.'], correct_index: null },
      { id: "i2", icon: "globe", text: "הצדקה טבעית / אוניברסלית", options: ["הזכות הטבעית של כל עם להיות אדון לגורלו במדינתו הריבונית — הזכות להגדרה עצמית."], correct_index: null },
    ],
  },

  // ── שקף 5.4: הקניה — החלק המעשי ───────────────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    eyebrow: "הקניה",
    title: "החלק המעשי — הקמת המדינה",
    body: "בחלק זה מכריזים רשמית על הקמת המדינה וקובעים עובדות בשטח.",
    questions: [
      { id: "o1", icon: "scroll", text: "הכרזה", options: ['"אנו מכריזים בזאת על הקמת מדינה יהודית בארץ ישראל".'], correct_index: null },
      { id: "o2", icon: "flag", text: "שם המדינה", options: ['ייקרא שמה "ישראל".'], correct_index: null },
      { id: "o3", icon: "landmark", text: "מוסדות שלטון", options: ["קביעת מועצת המדינה הזמנית והממשלה הזמנית עד לבחירות."], correct_index: null },
    ],
  },

  // ── שקף 9: הגדרות (להעתקה למחברת) ─────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "הכרזת העצמאות — הגדרות (מחוון 2017)",
    questions: [
      { id: "d1", text: "הכרזת העצמאות", options: [""], feedback: "מסמך ההכרזה על הקמת מדינת ישראל, הכולל הצדקות להכרזה, הצהרת כוונות לגבי אופי המדינה ופניות לגורמים שונים.", correct_index: null },
      { id: "d2", text: "הצדקות היסטוריות", options: [""], feedback: 'הצדקות להקמת מדינה יהודית הקשורות לאירועים היסטוריים כמו הקשר הרציף לארץ, יצירת התנ"ך והשואה.', correct_index: null },
      { id: "d3", text: "הצדקות בינלאומיות", options: [""], feedback: 'הצדקה הנובעת מתמיכה או הכרה בינלאומית רשמית בזכות העם היהודי למדינה, כמו הצהרת בלפור והחלטת האו"ם 181.', correct_index: null },
      { id: "d4", text: "הצדקה טבעית / אוניברסלית", options: [""], feedback: "הזכות הטבעית והאוניברסלית של כל עם להגדרה עצמית במסגרת מדינה ריבונית.", correct_index: null },
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
    eyebrow: 'שאלון 34281, חורף תשפ"ה',
    title: "שתי הצדקות להקמת מדינת ישראל",
    questions: [
      {
        id: "pq1",
        tag: "שאלת ידע",
        text: 'הציגו את שתי ההצדקות האלה להקמת מדינת ישראל המופיעות בהכרזת העצמאות: הצדקה היסטורית והצדקה בין־לאומית (משפטית).',
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
    title: "שתי הצדקות — תשובה מלאה",
    body: `### הצדקה היסטורית
על התלמיד להציג אירועים היסטוריים הקושרים את העם היהודי לארץ ישראל, למשל: העובדה שבה העם התעצב ויצר את התנ"ך, המאמץ לשוב אליה במהלך הגלות, או השואה שהוכיחה את ההכרח בפתרון בעיית חוסר המולדת.

---

### הצדקה בין־לאומית (משפטית)
הצדקה הנובעת מהכרה של מדינות וגופים בינלאומיים בזכות העם למדינה, למשל: הצהרת בלפור, כתב המנדט או החלטת האו"ם 181 (תוכנית החלוקה).`,
  },

  // ── שקף 13: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s13",
    order: 13,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "הכרזת העצמאות — חלק א'",
    questions: [
      {
        id: "aq1",
        text: "איזה אירוע היסטורי מוזכר במגילה כהוכחה לצורך בפתרון בעיית חוסר המולדת?",
        options: ["הקונגרס הציוני", "השואה", "הצהרת בלפור", "מלחמת העצמאות"],
        correct_index: 1,
      },
      {
        id: "aq2",
        text: 'מהי "הצדקה טבעית"?',
        options: ["זכות שניתנה על ידי בריטניה", "זכות המבוססת על התנ\"ך", "זכותו של כל עם להגדרה עצמית", "זכות המבוססת על ניצחון במלחמה"],
        correct_index: 2,
      },
      {
        id: "aq3",
        text: 'מה הוחלט בכ"ט בנובמבר 1947?',
        options: ["סיום המנדט", "תוכנית החלוקה (החלטה 181)", "פרסום הצהרת בלפור", 'הקמת צה"ל'],
        correct_index: 1,
      },
      {
        id: "aq4",
        text: "הצהרת בלפור וכתב המנדט שייכים לסוג הצדקה:",
        options: ["היסטורית", "בינלאומית-משפטית", "טבעית", "אופרטיבית"],
        correct_index: 1,
      },
      {
        id: "aq5",
        text: 'איזה מהבאים הוא חלק מהקטע ה"אופרטיבי" (המעשי) של ההכרזה?',
        options: ['קביעת שם המדינה "ישראל"', "הקריאה ליהודי התפוצות", "תיאור השואה", "ההבטחה לשוויון זכויות"],
        correct_index: 0,
      },
    ],
  },

  // ── שקף 14: שיעורי בית ────────────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "homework",
    eyebrow: 'משימת "הזכות האישית"',
    title: "סיפור משפחתי שמתחבר להצדקה",
    questions: [
      {
        id: "hw1",
        text: 'בחרו אחת מההצדקות ההיסטוריות המופיעות במגילה: הקשר לתנ"ך, שנות הגלות, המאמץ של הדורות האחרונים, או השואה.',
        options: [],
        correct_index: null,
      },
      {
        id: "hw2",
        text: 'כתבו פסקה קצרה המספרת סיפור משפחתי או אישי שמתחבר להצדקה שבחרתם — איך המשפחה שלכם לקחה חלק במימוש ה"זכות" הזו להקמת המדינה?',
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
      { id: "f1", text: "עד כמה ציר הזמן עזר לך לעשות סדר באירועים שקדמו למדינה?", options: [], correct_index: null },
      { id: "f2", text: 'עד כמה ברור לך ההבדל בין הצדקה "בינלאומית" להצדקה "טבעית"?', options: [], correct_index: null },
      { id: "f3", text: "האם קריאת קטעי המגילה המקוריים עזרה לך להבין את החומר?", options: [], correct_index: null },
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
        text: '"מגילת העצמאות — מאחורי הקלעים"',
        feedback: "סרטון",
        options: ['סריקת קוד QR בעמוד 34 בחוברת "אזרחות בכיף".'],
        correct_index: null,
      },
      {
        id: "e2",
        text: "המסמך המקורי",
        feedback: "מידע נוסף",
        options: ["צפייה בצילום של מגילת העצמאות המקורית וחתימות חברי מועצת העם."],
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
