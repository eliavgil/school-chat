import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

export const LESSON_TITLE = "שיעור 8: היסטוריה של הדמוקרטיה"
export const SLUG = "democracy-history-athens-8"

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 8 | אזרחות כיתה י",
    title: "היסטוריה של הדמוקרטיה: מהכיכר באתונה ועד לקלפי המודרנית",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Stoa_of_Attalos_at_the_Ancient_Agora_of_Athens_2.jpg", // האגורה של אתונה — הלב הציבורי של הדמוקרטיה העתיקה. Wikimedia Commons, CC BY-SA 3.0
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
      { id: "obj1", icon: "landmark", text: "נתאר", options: ["את מאפייני הדמוקרטיה הישירה באתונה העתיקה כערש הרעיון הדמוקרטי."], correct_index: null },
      { id: "obj2", icon: "vote", text: "נסביר", options: ["את הסיבות למעבר ההיסטורי מדמוקרטיה ישירה לדמוקרטיה עקיפה/ייצוגית בעת המודרנית."], correct_index: null },
      { id: "obj3", icon: "scale", text: "נזהה", options: ["את שלבי התפתחות זכות הבחירה והפיכתה מנחלתם של מעטים לזכות כללית ושוויונית לכלל האזרחים."], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/3/32/Charles_Th%C3%A9venin_-_Prise_de_la_Bastille%2C_le_14_juillet_1789_-_P572_-_Mus%C3%A9e_Carnavalet.jpg", // "כיבוש הבסטיליה", 14 ביולי 1789 — ציור מאת שארל תבנין, מוזיאון קרנבלה. אחד הרגעים המכוננים בהיסטוריה של הדמוקרטיה המודרנית. נחלת הכלל
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "להצביע בעצמכם על כל חוק, או לבחור נציגים?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "q1",
        text: "לו יכולתם להצביע בעצמכם על כל חוק וחוק ישירות מהטלפון הנייד (דמוקרטיה ישירה), האם הייתם מעדיפים לעשות זאת או שאתם מעדיפים להמשיך לבחור נציגים שיחליטו עבורכם?",
        options: [
          "להצביע בעצמי על הכל",
          "להמשיך לבחור נציגים",
          "שילוב של השניים",
          "תלוי בנושא",
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5.1: הקניה — אתונה העתיקה ─────────────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    layout: "list",
    eyebrow: "הקניה",
    title: "אתונה העתיקה — הדמוקרטיה הראשונה",
    body: 'הדמוקרטיה נולדה באתונה במאה ה-5 לפנה"ס. היא הייתה דמוקרטיה ישירה.',
    questions: [
      { id: "a1", icon: "users", text: "השיטה", options: ["כלל האזרחים (גברים חופשיים בלבד) היו שותפים ישירים בתהליך קבלת ההחלטות."], correct_index: null },
      { id: "a2", icon: "landmark", text: "הביצוע", options: ["האזרחים התכנסו בכיכר העיר (האגורה), דנו בבעיות המדינה והצביעו בעצמם ללא מתווכים."], correct_index: null },
    ],
  },

  // ── שקף 5.2: הקניה — המעבר לדמוקרטיה עקיפה ────────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    eyebrow: "הקניה",
    title: "המעבר לדמוקרטיה עקיפה / ייצוגית",
    body: "כיום, כל הדמוקרטיות המערביות בעולם הן עקיפות. המעבר נבע מארבע סיבות מרכזיות:",
    questions: [
      { id: "b1", icon: "users", text: "גודל האוכלוסייה", options: ["בלתי אפשרי טכנית לכנס מיליוני אזרחים לקבלת החלטות יומיומית."], correct_index: null },
      { id: "b2", icon: "calendar", text: "היעדר זמן ומשאבים", options: ["רוב העם עסוק בפרנסתו ואינו יכול להקדיש את כל זמנו לפוליטיקה."], correct_index: null },
      { id: "b3", icon: "book", text: "הצורך במומחיות", options: ["קבלת החלטות מודרנית דורשת ידע מקצועי נרחב בתחומים מורכבים."], correct_index: null },
      { id: "b4", icon: "alert", text: "אדישות פוליטית", options: ["חלק גדול מהציבור אינו מעוניין להכיר את כל הסוגיות לעומק."], correct_index: null },
    ],
  },

  // ── שקף 5.3: הקניה — המאבק על זכות הבחירה ─────────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    layout: "list",
    eyebrow: "הקניה",
    title: 'המאבק על "זכות המילה" (זכות הבחירה)',
    body: "בראשית הדמוקרטיה המודרנית, זכות ההצבעה הייתה מוגבלת מאוד.",
    questions: [
      { id: "c1", icon: "lock", text: "מגבלות העבר", options: ["הזכות ניתנה רק לגברים, ולעיתים רק לאלו שהיו בעלי רכוש, משלמי מיסים או בעלי השכלה מסוימת."], correct_index: null },
      { id: "c2", icon: "scale", text: "המטרה המקורית", options: ['להבטיח שרק מי ש"תורם" או "מבין" יקבל החלטות.'], correct_index: null },
    ],
  },

  // ── שקף 5.4: הקניה — המהפכה השוויונית ─────────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    layout: "list",
    eyebrow: "הקניה",
    title: "המהפכה השוויונית",
    body: 'בעקבות המהפכה הצרפתית ולאורך המאה ה-19 וה-20, חל שינוי דרמטי.',
    questions: [
      { id: "d1", icon: "vote", text: "הרחבת הזכות", options: ["זכות ההצבעה הפכה לכללית וכללה בהדרגה נשים, קבוצות מיעוט ומיעוטי יכולת."], correct_index: null },
      { id: "d2", icon: "scale", text: "התפיסה החדשה", options: ["ניתוק בין זכות היסוד לבין מילוי חובות (כמו מס). כל אדם שווה קול אחד, מה שמגשים את ערך השוויון ואת ריבונות העם."], correct_index: null },
    ],
  },

  // ── שקף 9: בדיקת עירנות ────────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "alertness-check",
    eyebrow: "בדיקת עירנות",
    title: "היסטוריה של הדמוקרטיה",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      { id: "ac1", text: "היכן התקיימה הדמוקרטיה הישירה הראשונה?", options: ["רומא", "אתונה", "ירושלים", "לונדון"], correct_index: 1 },
      { id: "ac2", text: "איזו מהסיבות הבאות גרמה למעבר לדמוקרטיה עקיפה?", options: ["גודל האוכלוסייה", "מזג האוויר", "מלחמות דת", "חוסר בכסף"], correct_index: 0 },
    ],
  },

  // ── שקף 10: הגדרות (להעתקה למחברת) ─────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "היסטוריה של הדמוקרטיה — הגדרות",
    questions: [
      { id: "def1", text: "דמוקרטיה ישירה", options: [""], feedback: "שיטת ממשל בה כלל האזרחים מקבלים את ההחלטות בענייני המדינה באופן ישיר, ללא מתווכים או נציגים.", correct_index: null },
      { id: "def2", text: "דמוקרטיה עקיפה / ייצוגית", options: [""], feedback: "שיטת ממשל בה כלל האזרחים בוחרים נציגים לזמן קצוב, והם אלו שמקבלים את ההחלטות ומקדמים מדיניות בשם העם.", correct_index: null },
      { id: "def3", text: "זכות בחירה כללית", options: [""], feedback: "התנאי לפיו כל אזרח במדינה (בכפוף למגבלת גיל) זכאי לבחור ולהיבחר למוסדות השלטון ללא התניה ברכוש, דת או השכלה.", correct_index: null },
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
    title: "דמוקרטיה ישירה מול ייצוגית",
    animation: { name: "turkey", delay: 3, position: "across", loop: true },
    questions: [
      {
        id: "pq1",
        tag: "שאלת אירוע",
        text: `במאה ה-5 לפנה"ס באתונה, נהגו האזרחים להתאסף ולקבל בעצמם החלטות על יציאה למלחמה. לעומת זאת, במאה ה-21 בישראל, האזרחים הולכים לקלפי אחת לכמה שנים כדי לבחור את 120 חברי הכנסת שיחליטו עבורם על המדיניות הביטחונית.

ציינו והציגו את סוג הדמוקרטיה שהתקיים באתונה העתיקה על פי המתואר.
הסבירו כיצד סוג זה בא לידי ביטוי בקטע.`,
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
    title: "דמוקרטיה ישירה מול ייצוגית — תשובה מלאה",
    body: `### ציין
דמוקרטיה ישירה

---

### הצג
שיטה בה כלל האזרחים שותפים בניהול המדינה ובקבלת ההחלטות באופן פעיל וישיר, ללא תיווך של נציגים.

---

### הסבר
בקטע נכתב כי באתונה האזרחים נהגו "להתאסף ולקבל בעצמם החלטות". מכאן שהאזרחים לא השתמשו בנציגים אלא מימשו את ריבונותם באופן בלתי אמצעי, וזהו המאפיין המרכזי של דמוקרטיה ישירה.`,
  },

  // ── שקף 14: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "היסטוריה של הדמוקרטיה",
    questions: [
      {
        id: "aq1",
        text: "מה היה המקום המרכזי בו התקיימה דמוקרטיה ישירה בעבר?",
        options: ["פריז", "אתונה", "וושינגטון", "לונדון"],
        correct_index: 1,
      },
      {
        id: "aq2",
        text: "מהי הסיבה המרכזית לכך שמדינות מודרניות אינן מקיימות דמוקרטיה ישירה?",
        options: ["כי העם לא רוצה", "בגלל גודל האוכלוסייה והצורך במומחיות", "כי זה לא חוקי", "כי אין אינטרנט בכל מקום"],
        correct_index: 1,
      },
      {
        id: "aq3",
        text: "מה אפיין את זכות הבחירה בתחילת דרכה של הדמוקרטיה המודרנית?",
        options: ["היא ניתנה לכולם", "היא הוגבלה לרוב לגברים בעלי רכוש", "רק נשים יכלו להצביע", "היא ניתנה רק לילדים"],
        correct_index: 1,
      },
      {
        id: "aq4",
        text: "באיזו מאה חלה ההתפתחות המשמעותית ביותר בהרחבת זכות ההצבעה לכלל הציבור?",
        options: ['המאה ה-5 לפנה"ס', "המאה ה-19 וה-20", "המאה ה-12", "המאה ה-15"],
        correct_index: 1,
      },
      {
        id: "aq5",
        text: 'מהו המובן של "ריבונות העם" בדמוקרטיה עקיפה?',
        options: ["העם מחליט הכל בכיכר העיר", "העם הוא מקור הסמכות ובוחר את נציגיו", "המלך מחליט עבור העם", "אין צורך בנציגים"],
        correct_index: 1,
      },
    ],
  },

  // ── שקף 15: שיעורי בית ────────────────────────────────────────────────────
  {
    id: "s15",
    order: 15,
    type: "homework",
    eyebrow: 'משימת "לוח הזמנים של החופש"',
    title: "זכות הבחירה לנשים",
    questions: [
      {
        id: "hw1",
        text: "חפשו באינטרנט באיזו שנה ניתנה זכות בחירה לנשים במדינה אחת לבחירתכם (למשל: ארה\"ב, שוויץ, ניו זילנד או ערב הסעודית).",
        options: [],
        correct_index: null,
      },
      {
        id: "hw2",
        text: 'כתבו פסקה קצרה: האם לדעתכם הרחבת זכות הבחירה לנשים חיזקה את היציבות של אותה מדינה? נמקו בעזרת המושג "שלטון העם".',
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
    animation: { name: "death_dance", delay: 3, position: "corner-right", loop: true },
    questions: [
      { id: "f1", text: "עד כמה השיעור עזר לך להבין מדוע אנחנו לא מחליטים הכל בעצמנו היום?", options: [], correct_index: null },
      { id: "f2", text: "כמה עניין מצאת בסיפור על אתונה העתיקה?", options: [], correct_index: null },
      { id: "f3", text: 'האם המושג "דמוקרטיה ישירה" ברור לך כעת?', options: [], correct_index: null },
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
        text: "יום בחייו של אזרח אתונאי",
        feedback: "סרטון",
        options: ["מומלץ TED-Ed."],
        correct_index: null,
      },
      {
        id: "e2",
        text: "הסיבות למעבר לדמוקרטיה עקיפה",
        feedback: "קריאה נוספת",
        options: ['עמודים 19-20 בחוברת "אזרחות בכיף".'],
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
