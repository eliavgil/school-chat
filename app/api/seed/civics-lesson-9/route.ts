import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

export const LESSON_TITLE = "שיעור 9: דמוקרטיה במאה ה-21"
export const SLUG = "democracy-21st-century-9"

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 9 | אזרחות כיתה י",
    title: "דמוקרטיה במאה ה-21: טכנולוגיה, גלובליזציה ומודלים שונים בעולם",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Tahrir_Square_29_January_2011_-_%22The_people_and_the_army_are_one_hand%22_%2840339040312%29.jpg", // מיליוני מפגינים בכיכר תחריר, מצרים 2011 — מהפכה שהתארגנה ברשתות החברתיות. Wikimedia Commons, CC BY-SA 2.0
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
    questions: [
      { id: "obj1", icon: "globe", text: "נבחין", options: ["בין המודלים השונים של הדמוקרטיות הליברליות בעולם (אינדיבידואלית, רפובליקנית ורב-תרבותית)."], correct_index: null },
      { id: "obj2", icon: "globe", text: "ננתח", options: ['את השפעת הגלובליזציה על טשטוש גבולות המדינה והיווצרות ה"כפר הגלובלי".'], correct_index: null },
      { id: "obj3", icon: "megaphone", text: "נסביר", options: ['את תפקיד הרשתות החברתיות כמנגנון פיקוח בלתי פורמלי ואת האתגרים המודרניים של "פייק ניוז" וגירעון דמוקרטי.'], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Tahrir_Square_-_Protesters_Charging_Mobile_Phones_%286620193705%29.jpg", // מפגינים בכיכר תחריר טוענים סוללות טלפון על גנרטור מאולתר — הטלפון הפך לכלי מרכזי במחאה האזרחית. Wikimedia Commons, CC BY-SA 2.0
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "הרשתות החברתיות — מחזקות או פוגעות בדמוקרטיה?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "q1",
        text: "האם לדעתכם הרשתות החברתיות מחזקות את כוחו של העם מול השלטון, או שהן דווקא פוגעות בדמוקרטיה בגלל הפצת שמועות ושנאה?",
        options: [
          "מחזקות את כוח העם",
          "פוגעות בדמוקרטיה",
          "גם וגם, תלוי בשימוש",
          "לא בטוח, תלוי במקרה",
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5.1: הקניה — דמוקרטיות שונות בעולם ────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    eyebrow: "הקניה",
    title: "דמוקרטיות שונות בעולם — המודלים",
    body: "הדמוקרטיות המערביות נבדלות בדרך שבה הן רואות את הקשר בין הפרט למדינה:",
    questions: [
      { id: "m1", icon: "identity", text: "התפיסה האינדיבידואלית", options: ['מעמידה במרכז את הפרט וזכויותיו. המדינה היא "כלי" למימוש רצונות האזרח (למשל: ארה"ב).'], correct_index: null },
      { id: "m2", icon: "flag", text: "התפיסה הרפובליקנית", options: ["רואה באדם גם פרט וגם חלק מקהילה לאומית. המדינה מקדמת \"טוב משותף\" וערכים קולקטיביים (למשל: ישראל בהיבטים מסוימים)."], correct_index: null },
      { id: "m3", icon: "globe", text: "התפיסה הרב-תרבותית", options: ["המדינה תומכת בקהילות השונות בתוכה במידה שווה ומנכיחה את תרבויותיהן במרחב הציבורי."], correct_index: null },
    ],
  },

  // ── שקף 5.2: הקניה — דמוקרטיה בעידן הגלובליזציה ───────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    eyebrow: "הקניה",
    title: "דמוקרטיה בעידן הגלובליזציה",
    body: '' + 'העולם הופך ל"כפר גלובלי" וזה משפיע ישירות על המשטר הדמוקרטי:',
    questions: [
      { id: "g1", icon: "globe", text: "טשטוש גבולות", options: ["מעבר מהיר של מידע, רעיונות ובני אדם בין מדינות."], correct_index: null },
      { id: "g2", icon: "flag", text: "מתח זהויות", options: ["מצד אחד נוצרת שפה בינלאומית וערכים אוניברסליים, ומצד שני מתרחשים תהליכים של חיזוק זהויות לאומיות ודתיות כתגובת נגד."], correct_index: null },
      { id: "g3", icon: "building", text: "השפעה כלכלית", options: ["חברות ענק בינלאומיות הופכות לבעלות כוח פוליטי המשפיע על החלטות של מדינות ריבוניות."], correct_index: null },
    ],
  },

  // ── שקף 5.3: הקניה — טכנולוגיה כמנגנון פיקוח ──────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    layout: "list",
    eyebrow: "הקניה",
    title: "טכנולוגיה כמנגנון פיקוח בלתי פורמלי",
    animation: { name: "cat", delay: 3, position: "center", loop: true },
    body: "בדמוקרטיה המודרנית, הטכנולוגיה משמשת כלי עוצמתי להגבלת השלטון:",
    questions: [
      { id: "t1", icon: "megaphone", text: "פיקוח אזרחי", options: ["הרשתות החברתיות מאפשרות לאזרחים לחשוף שחיתויות, לארגן הפגנות (כמו בתוניסיה) ולהפעיל לחץ ישיר על מקבלי החלטות."], correct_index: null },
      { id: "t2", icon: "newspaper", text: "שקיפות וחופש המידע", options: ['האינטרנט מאפשר נגישות למידע ממשלתי ומימוש "זכות הציבור לדעת" במהירות שיא.'], correct_index: null },
    ],
  },

  // ── שקף 5.4: הקניה — אתגרי המודרנה ────────────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    eyebrow: "הקניה",
    title: "אתגרי המודרנה — פייק ניוז וגירעון דמוקרטי",
    body: "לצד היתרונות, הטכנולוגיה מייצרת איומים חדשים:",
    questions: [
      { id: "n1", icon: "newspaper", text: 'חדשות כזב ("פייק ניוז")', options: ["פרסום מידע שקרי שעלול להטות בחירות ולפגוע בזכות לשם טוב."], correct_index: null },
      { id: "n2", icon: "alert", text: "גירעון דמוקרטי", options: ["מצב שבו מוסדות דמוקרטיים רשמיים נחלשים או לא מממשים את רצון העם, בעוד שמוקדי כוח בלתי נבחרים מתחזקים."], correct_index: null },
      { id: "n3", icon: "lock", text: "צנזורה בעידן הדיגיטלי", options: ['הדילמה האם פלטפורמות כמו "מטא" צריכות לבדוק עובדות או לאפשר חופש ביטוי מוחלט.'], correct_index: null },
    ],
  },

  // ── שקף 9: בדיקת עירנות ────────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "alertness-check",
    eyebrow: "בדיקת עירנות",
    title: "דמוקרטיה במאה ה-21",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      { id: "ac1", text: "איזה מודל דמוקרטי מדגיש את הפרט וזכויותיו מעל הקולקטיב?", options: ["אינדיבידואלי", "רפובליקני", "רב-תרבותי", "סוציאליסטי"], correct_index: 0 },
      { id: "ac2", text: "מה נקרא \"מנגנון פיקוח בלתי פורמלי\"?", options: ["ביקורת אזרחים דרך רשתות חברתיות", "חוקי הכנסת", "בית המשפט העליון", "מבקר המדינה"], correct_index: 0 },
    ],
  },

  // ── שקף 10: הגדרות (להעתקה למחברת) ─────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "דמוקרטיה במאה ה-21 — הגדרות (מחוון 2017)",
    animation: { name: "totoro", delay: 3, position: "across", loop: true },
    questions: [
      { id: "def1", text: "דמוקרטיה ליברלית-אינדיבידואלית", options: [""], feedback: "תפיסה המעמידה במרכז את הפרט ואת זכויותיו. תפקיד המדינה לאפשר לכל אזרח מימוש מרבי של רצונותיו ללא התייחסות להשתייכותו האתנית.", correct_index: null },
      { id: "def2", text: "דמוקרטיה סוציאל-דמוקרטית", options: [""], feedback: "גישה המדגישה את השוויון החברתי-כלכלי ומחויבת להבטיח קיום בסיסי בכבוד לכל אדם דרך מעורבות רבה של המדינה.", correct_index: null },
      { id: "def3", text: "גלובליזציה", options: [""], feedback: "תהליכים כלל עולמיים של תנועה הולכת וגדלה של סחורות, שירותים, מידע, רעיונות ובני אדם במהירות ובקלות יחסית.", correct_index: null },
      { id: "def4", text: "מנגנון פיקוח וביקורת בלתי פורמלי", options: [""], feedback: "ביקורת המבוצעת על ידי אזרחים מיוזמתם (דרך תקשורת, רשתות חברתיות, הפגנות ואמנות) במטרה להגביל את השלטון.", correct_index: null },
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
    eyebrow: 'שאלון 34281, חורף 2025',
    title: "מטא וביטול בדיקת העובדות",
    questions: [
      {
        id: "pq1",
        tag: "שאלת אירוע",
        text: `באחרונה הודיע המנכ"ל של תאגיד 'מטא' (פייסבוק) על החלטה לבטל את מערך בדיקת העובדות שמפעיל התאגיד. מערך הבדיקות שימש עד כה במאבק על פרסום חדשות כזב ('פייק ניוז') ודברי הסתה. מעתה יפורסם כל מה שיכתבו הגולשים ברשתות החברתיות ללא פיקוח. יש התומכים בהחלטה זו בטענה שהיא מחזקת את זרימת הרעיונות החופשית.

ציינו והציגו את הזכות שמי שמתנגד להחלטה של תאגיד 'מטא' מבקש להגן עליה (היעזרו בנגזרות הזכות לכבוד).
הסבירו כיצד זכות זו באה לידי ביטוי בקטע.`,
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
    title: "מטא וביטול בדיקת העובדות — תשובה מלאה",
    body: `### ציין
הזכות לשם טוב

---

### הצג
זכותו של כל אדם ששמו לא יוכפש ושלא יפורסם עליו מידע שקרי הפוגע בכבודו או בפרנסתו.

---

### הסבר
בקטע מצוין כי ביטול מערך בדיקת העובדות יאפשר פרסום של "חדשות כזב" ודברי הסתה ללא פיקוח. פרסום כזה עלול לכלול מידע שקרי על אנשים, ובכך לפגוע בשמם הטוב — זכות שהמתנגדים מבקשים להגן עליה.`,
  },

  // ── שקף 14: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "דמוקרטיה במאה ה-21",
    questions: [
      {
        id: "aq1",
        text: "איזה מודל דמוקרטי מעודד את המדינה לתקצב קהילות שונות כדי לשמר את זהותן הייחודית?",
        options: ["אינדיבידואלית", "רב-תרבותית", "רפובליקנית", "ישירה"],
        correct_index: 1,
      },
      {
        id: "aq2",
        text: "כיצד משפיעה הגלובליזציה על מדינת הלאום המודרנית?",
        options: ["היא מחזקת את הגבולות הפיזיים", "היא גורמת לטשטוש גבולות ומעבר מהיר של מידע", "היא מבטלת את הצורך בבחירות", "היא מונעת קשרים בין מדינות"],
        correct_index: 1,
      },
      {
        id: "aq3",
        text: 'מהו "גירעון דמוקרטי" לפי הקטע?',
        options: ["מחסור בכסף בקופת המדינה", "מצב שבו מוסדות דמוקרטיים אינם מממשים בפועל את עקרונות הדמוקרטיה", "אי קיום בחירות", "עודף של חוקים"],
        correct_index: 1,
      },
      {
        id: "aq4",
        text: 'שימוש ב"פייסבוק" לארגון הפגנה נגד השלטון הוא דוגמה ל:',
        options: ["מנגנון פיקוח מוסדי", "מנגנון פיקוח בלתי פורמלי", "דמוקרטיה מתגוננת", "עבריינות פוליטית"],
        correct_index: 1,
      },
      {
        id: "aq5",
        text: "הגישה הליברלית-ניאו-ליברלית תתמוך ב:",
        options: [
          "מיסוי גבוה לשם שוויון",
          "יוזמה פרטית ותחרות חופשית למינימום מעורבות מדינה",
          "בעלות ממשלתית על כל המפעלים",
          "קצבאות ילדים גבוהות מאוד",
        ],
        correct_index: 1,
      },
    ],
  },

  // ── שקף 15: שיעורי בית ────────────────────────────────────────────────────
  {
    id: "s15",
    order: 15,
    type: "homework",
    eyebrow: 'משימת "האזרח הדיגיטלי"',
    title: "פוסט ויראלי שהשפיע על החלטה",
    questions: [
      {
        id: "hw1",
        text: 'מצאו מקרה אחד מהשנה האחרונה שבו "פוסט" או סרטון ויראלי ברשתות החברתיות הוביל לשינוי של החלטת ממשלה או לביקורת ציבורית חריפה (למשל: מחאת יוקר המחיה, חשיפת עוולה חברתית).',
        options: [],
        correct_index: null,
      },
      {
        id: "hw2",
        text: 'כתבו בקצרה: כיצד המקרה הזה מדגים את הטכנולוגיה כ"מנגנון פיקוח בלתי פורמלי" על השלטון?',
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
      { id: "f1", text: 'עד כמה המושג "גלובליזציה" ברור לך כעת בהקשר של דמוקרטיה?', options: [], correct_index: null },
      { id: "f2", text: 'עד כמה השיעור עזר לך להבין את הסכנות של "פייק ניוז" במדינה דמוקרטית?', options: [], correct_index: null },
      { id: "f3", text: 'עד כמה התרגול של שאלת האירוע על "מטא" היה מובן?', options: [], correct_index: null },
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
        text: "כיצד אלגוריתמים משפיעים על דעת הקהל שלנו?",
        feedback: "סרטון",
        options: ["מומלץ לחפש הרצאות TED בנושא."],
        correct_index: null,
      },
      {
        id: "e2",
        text: "השפעת מצבי חירום וגלובליזציה על הדמוקרטיה",
        feedback: "קריאה נוספת",
        options: ['עמודים 26-27 בחוברת "אזרחות בכיף".'],
        correct_index: null,
      },
      {
        id: "e3",
        text: '"המשרוקית" של גלובס',
        feedback: "אתר אינטרנט",
        options: ["אתר לבדיקת עובדות (Fact-checking) בישראל."],
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
