import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

export const LESSON_TITLE = "שיעור 4: הכרזת העצמאות — חלק ב'"
export const SLUG = "civics-declaration-of-independence-part2-4"

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 4 | אזרחות כיתה י",
    title: "הכרזת העצמאות (חלק ב'): מדינה יהודית ודמוקרטית",
    image_url: null, // suggested: דגל ישראל לצד ספר חוקה/מגילת זכויות, או קולאז' המשלב סמלים יהודיים ודמוקרטיים
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
      { id: "obj1", icon: "identity", text: "נזהה ונפרט", options: ["מאפיינים יהודיים ודמוקרטיים כפי שהם מופיעים בטקסט הכרזת העצמאות."], correct_index: null },
      { id: "obj2", icon: "scale", text: "ננתח", options: ["את השילוב שבין זהותה של ישראל כמדינת לאום יהודית לבין מחויבותה לערכים דמוקרטיים ולשוויון זכויות."], correct_index: null },
      { id: "obj3", icon: "handshake", text: "נציג", options: ["את תוכן ארבע הפניות המופיעות בהכרזה ואת התחייבויות המדינה כלפי המיעוטים החיים בה."], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    animation: { name: "bird", delay: 3, position: "across", loop: true },
    image_url: null, // suggested: תצלום או קטע וידאו מהכרזת המדינה, או ויזואל המנגיד סמל יהודי מול סמל דמוקרטי
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "יהודית וגם דמוקרטית — בלי סתירה?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "q1",
        text: 'האם לדעתכם ניתן לקיים מדינה שהיא גם "יהודית" (מדינת לאום של עם ספציפי) וגם "דמוקרטית" (המבטיחה שוויון מלא לכל אזרחיה) ללא סתירה פנימית?',
        options: [
          "כן, אין כל סתירה",
          "לא, יש כאן סתירה מהותית",
          "אפשר, אבל זה דורש איזון מתמיד",
          "תלוי איך מיישמים את זה בפועל",
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5.1: הקניה — המדינה כיהודית ───────────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    eyebrow: "הקניה",
    title: "המדינה כיהודית — ביטויים בהכרזה",
    body: "ההכרזה קובעת את זהותה הלאומית של המדינה כביתו של העם היהודי.",
    questions: [
      { id: "j1", icon: "flag", text: "שם המדינה", options: ['"מדינת ישראל" — והכרזה עליה במפורש כ"מדינה יהודית".'], correct_index: null },
      { id: "j2", icon: "users", text: "פתיחת שערים", options: ["המדינה תהיה פתוחה לעלייה יהודית ולקיבוץ גלויות."], correct_index: null },
      { id: "j3", icon: "scroll", text: "מורשת", options: ["המדינה תושתת על יסודות החירות, הצדק והשלום לאור חזונם של נביאי ישראל."], correct_index: null },
      { id: "j4", icon: "megaphone", text: "קריאה לעם", options: ["קריאה ליהודי התפוצות להתלכד סביב המדינה בעלייה ובבניין."], correct_index: null },
    ],
  },

  // ── שקף 5.2: הקניה — המדינה כדמוקרטית ─────────────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    eyebrow: "הקניה",
    title: "המדינה כדמוקרטית — ביטויים בהכרזה",
    animation: { name: "frog", delay: 3, position: "corner-left", loop: true },
    body: "לצד זהותה היהודית, ההכרזה כוללת התחייבויות לערכים דמוקרטיים אוניברסליים.",
    questions: [
      { id: "d1", icon: "scale", text: "שוויון זכויות", options: ["הבטחה לשוויון זכויות חברתי ומדיני גמור לכל האזרחים ללא הבדל דת, גזע ומין."], correct_index: null },
      { id: "d2", icon: "megaphone", text: "חירויות יסוד", options: ["הבטחת חופש דת, מצפון, לשון, חינוך ותרבות."], correct_index: null },
      { id: "d3", icon: "vote", text: "מוסדות נבחרים", options: ["הכרזה על הקמת מוסדות שלטון נבחרים וקיום בחירות לאסיפה מכוננת שתקבע חוקה."], correct_index: null },
      { id: "d4", icon: "globe", text: 'מגילת האו"ם', options: ['הבטחה להיות נאמנים לעקרונותיה של מגילת האומות המאוחדות.'], correct_index: null },
    ],
  },

  // ── שקף 5.3: הקניה — השילוב והמתח ─────────────────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    eyebrow: "הקניה",
    title: "השילוב והמתח — חזון משותף",
    body: `מגילת העצמאות היא המסמך היחיד שכל חלקי היישוב היהודי הסכימו לחתום עליו, והיא מכוננת חזון המשלב את שני היסודות הללו.
המדינה היא **מדינת לאום יהודית אתנית**, המזוהה עם העם היהודי בארץ ובתפוצות.
בו בזמן, המדינה מחויבת ל**משטר דמוקרטי** שבו כלל האזרחים נוטלים חלק, תוך שמירה על זכויות המיעוט.

> האתגר המרכזי של החברה הישראלית הוא יצירת האיזון החוקתי והמעשי בין היסוד הלאומי-יהודי ליסוד הדמוקרטי.`,
  },

  // ── שקף 5.4: הקניה — ארבע הפניות ──────────────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    eyebrow: "הקניה",
    title: "ארבע הפניות לשיתוף פעולה",
    body: "המדינה מושיטה יד לשלום ופונה לארבעה גורמים מרכזיים:",
    questions: [
      { id: "a1", icon: "globe", text: 'לאו"ם', options: ["לקבל את ישראל לתוך משפחת העמים ולשתף פעולה בהגשמת החלטת החלוקה."], correct_index: null },
      { id: "a2", icon: "handshake", text: "לערביי ישראל", options: ["לשמור על השלום וליטול חלק בבניין המדינה על יסוד אזרחות מלאה ושווה ונציגות מתאימה במוסדותיה."], correct_index: null },
      { id: "a3", icon: "map", text: "למדינות השכנות", options: ["לשלום, שכנות טובה ועזרה הדדית לקידום המזרח התיכון כולו."], correct_index: null },
      { id: "a4", icon: "users", text: "לעם היהודי בתפוצות", options: ["להתלכד סביב היישוב בעלייה ובבניין ולעמוד לימינו במערכה הגדולה."], correct_index: null },
    ],
  },

  // ── שקף 9: בדיקת עירנות ────────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "alertness-check",
    eyebrow: "בדיקת עירנות",
    title: "הכרזת העצמאות — חלק ב'",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      { id: "ac1", text: "לכמה גורמים פונה ההכרזה בקריאה לשלום ולשיתוף פעולה?", options: ["2", "3", "4", "5"], correct_index: 2 },
      { id: "ac2", text: "איזה מהבאים הוא ביטוי ל\"מדינה יהודית\" בהכרזה?", options: ["פתיחת שערים לעלייה יהודית", "שוויון זכויות לכולם", "בחירות לאסיפה מכוננת", "נאמנות למגילת האו\"ם"], correct_index: 0 },
    ],
  },

  // ── שקף 10: הגדרות (להעתקה למחברת) ─────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "מדינה יהודית ודמוקרטית — הגדרות (מחוון 2017)",
    questions: [
      { id: "def1", text: "מאפיינים יהודיים בהכרזה", options: [""], feedback: 'דברים המבטאים את אופייה היהודי של המדינה: שם המדינה (ישראל), ההכרזה עליה כ"מדינה יהודית", פתיחת שעריה לכל יהודי (עלייה), וביסוס ערכיה על מורשת נביאי ישראל.', correct_index: null },
      { id: "def2", text: "מאפיינים דמוקרטיים בהכרזה", options: [""], feedback: "דברים המבטאים את אופייה הדמוקרטי של המדינה: הבטחה לשוויון זכויות חברתי ומדיני גמור לכלל האזרחים (ללא הבדל דת, גזע ומין), הבטחת חירויות יסוד (דת, מצפון, לשון), והכרזה על הקמת מוסדות דמוקרטיים נבחרים.", correct_index: null },
      { id: "def3", text: "התחייבויות כלפי המיעוטים בהכרזה", options: [""], feedback: "המדינה מבטיחה לערביי ישראל ולמיעוטים אזרחות מלאה ושווה, נציגות מתאימה בכל מוסדות המדינה, שמירה על המקומות הקדושים לכל הדתות וחופש דת, לשון וחינוך.", correct_index: null },
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

  // ── שקף 12: תרגול — שאלת ידע ──────────────────────────────────────────────
  {
    id: "s12",
    order: 12,
    type: "practice",
    eyebrow: 'שאלון 34281, קיץ תשפ"ה',
    title: "היחס כלפי המיעוטים בישראל",
    questions: [
      {
        id: "pq1",
        tag: "שאלת ידע",
        text: "הציגו מתוך הכרזת העצמאות שתי דוגמאות המבטאות את היחס כלפי המיעוטים בישראל.",
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
    title: "היחס כלפי המיעוטים — תשובה מלאה",
    body: `### דוגמה 1 — שוויון זכויות
המדינה מבטיחה לשמור על שוויון זכויות חברתי ומדיני גמור לכל אזרחיה, ללא הבדל דת, גזע ומין.

---

### דוגמה 2 — אזרחות מלאה ונציגות
המדינה קוראת לבני העם הערבי תושבי המדינה לשמור על השלום וליטול חלק בבניין המדינה על יסוד אזרחות מלאה ושווה ועל יסוד נציגות מתאימה בכל מוסדותיה.

> דוגמה נוספת שניתן להשתמש בה: הבטחת שמירה על המקומות הקדושים לכל הדתות והענקת חופש דת, מצפון, לשון, חינוך ותרבות.`,
  },

  // ── שקף 14: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "הכרזת העצמאות — חלק ב'",
    questions: [
      {
        id: "aq1",
        text: 'איזה מהבאים הוא מאפיין של המדינה כ"יהודית" המופיע בהכרזה?',
        options: ["הקמת בית משפט", "פתיחת המדינה לעלייה יהודית וקיבוץ גלויות", "קביעת ירושלים כבירה", 'חובת שירות בצה"ל'],
        correct_index: 1,
      },
      {
        id: "aq2",
        text: "מהי ההבטחה הדמוקרטית המרכזית המופיעה בהכרזה כלפי כלל האזרחים?",
        options: ["שוויון זכויות חברתי ומדיני גמור ללא הבדל דת גזע ומין", "חובת הצבעה בבחירות", "קבלת מענק כספי", "חופש התנועה בלבד"],
        correct_index: 0,
      },
      {
        id: "aq3",
        text: 'למי מופנית הקריאה "ליטול חלקם בבניין המדינה על יסוד אזרחות מלאה ושווה"?',
        options: ['לאו"ם', "למדינות השכנות", "לערבים תושבי מדינת ישראל", "לעם היהודי בתפוצות"],
        correct_index: 2,
      },
      {
        id: "aq4",
        text: "כיצד מבטאת ההכרזה את השילוב בין מדינה יהודית לדמוקרטית ביחס לערביי ישראל?",
        options: [
          "היא קובעת שהם יחיו באוטונומיה בנפרד",
          "היא מגדירה את המדינה כיהודית אך מבטיחה להם אזרחות שווה ונציגות במוסדותיה",
          "היא דורשת מהם להתגייר כתנאי לאזרחות",
          "היא לא מזכירה אותם כלל",
        ],
        correct_index: 1,
      },
      {
        id: "aq5",
        text: "על פי ההכרזה, על איזה בסיס ערכי תושתת המדינה בחלק שקשור למורשת?",
        options: ['על חוקי המנדט הבריטי', "על יסודות החירות, הצדק והשלום לאור חזונם של נביאי ישראל", 'על החלטות האו"ם בלבד', "על חוקי התורה המדויקים"],
        correct_index: 1,
      },
    ],
  },

  // ── שקף 15: מה דעתכם (נוסף) ───────────────────────────────────────────────
  {
    id: "s15",
    order: 15,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "יהדות או דמוקרטיה — מה חשוב יותר?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "q2",
        text: "מה לדעתכם צריך להיות ערך חשוב יותר במדינת ישראל?",
        options: ["יהדות", "דמוקרטיה", "שניהם באותה מידה", "תלוי בנושא ובמצב"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 16: שיעורי בית ────────────────────────────────────────────────────
  {
    id: "s16",
    order: 16,
    type: "homework",
    eyebrow: 'משימת "המגילה במבחן המציאות"',
    title: "המגילה בחדשות השבוע",
    animation: { name: "chicken", delay: 3, position: "across", loop: true },
    questions: [
      {
        id: "hw1",
        text: "חפשו בחדשות מהשבוע האחרון אירוע אחד המבטא מימוש של מאפיין יהודי מהמגילה (למשל עלייה או שימוש בשפה העברית).",
        options: [],
        correct_index: null,
      },
      {
        id: "hw2",
        text: "חפשו אירוע נוסף המבטא מימוש או אתגר של מאפיין דמוקרטי מהמגילה (למשל שוויון זכויות או חופש דת), וכתבו בקצרה כיצד שני האירועים קשורים לטקסט המגילה.",
        options: [],
        correct_index: null,
      },
    ],
  },

  // ── שקף 17: משוב ──────────────────────────────────────────────────────────
  {
    id: "s17",
    order: 17,
    type: "feedback",
    eyebrow: "משוב",
    title: "איך היה השיעור?",
    questions: [
      { id: "f1", text: 'עד כמה אתה מבין את ההבדל בין מאפיין "יהודי" למאפיין "דמוקרטי" בהכרזה?', options: [], correct_index: null },
      { id: "f2", text: "עד כמה ברור לך למי המדינה פנתה ב-1948 ומה היא הבטיחה להם?", options: [], correct_index: null },
      { id: "f3", text: "עד כמה הרגשת שהמגילה רלוונטית למציאות החיים שלך היום?", options: [], correct_index: null },
    ],
  },

  // ── שקף 18: העשרה ─────────────────────────────────────────────────────────
  {
    id: "s18",
    order: 18,
    type: "enrichment",
    eyebrow: "העשרה",
    title: "לסקרנים",
    animation: { name: "cat", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "e1",
        text: '"מדינת ישראל יוצאת לדרך — האתגר: מדינה יהודית ודמוקרטית"',
        feedback: "סרטון",
        options: ['מתוך מערכת השידורים הלאומית — סריקת קוד QR בעמוד 34 בחוברת "אזרחות בכיף".'],
        correct_index: null,
      },
      {
        id: "e2",
        text: 'המתח המובנה בין "יהודית" ל"דמוקרטית"',
        feedback: "דיון",
        options: ["מאמר קצר באתר המכון הישראלי לדמוקרטיה."],
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
