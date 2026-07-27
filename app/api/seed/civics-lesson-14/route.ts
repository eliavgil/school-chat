import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

export const LESSON_TITLE = "שיעור 14: זכויות טבעיות — חיים, קניין, הליך הוגן וכבוד"
export const SLUG = "democracy-natural-rights-life-property-dueprocess-dignity-14"

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 14 | אזרחות כיתה י",
    title: "זכויות טבעיות: חיים וביטחון, קניין, הליך הוגן והזכות לכבוד ונגזרותיה",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/9/92/Declaration_of_the_Rights_of_Man_and_of_the_Citizen_in_1789_%28brighter%29.jpg", // "הכרזת זכויות האדם והאזרח", צרפת 1789 — המסמך המכונן שעיגן לראשונה את רעיון הזכויות הטבעיות. Wikimedia Commons, נחלת הכלל
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
      { id: "obj1", icon: "shield", text: "נגדיר", options: ["את הזכויות לחיים וביטחון, קניין, הליך הוגן וכבוד."], correct_index: null },
      { id: "obj2", icon: "document", text: "נבחין", options: ["בין קניין חומרי לקניין רוחני."], correct_index: null },
      { id: "obj3", icon: "lock", text: "נזהה", options: ["את הנגזרות של הזכות לכבוד: הזכות לפרטיות והזכות לשם טוב."], correct_index: null },
      { id: "obj4", icon: "gavel", text: "ניישם", options: ["את האמצעים להבטחת הליך הוגן (חובת הוכחה, ייצוג משפטי ועוד)."], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    animation: { name: "toucan", delay: 3, position: "across", loop: true },
    image_url: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Supreme_Court_Of_The_United_States_%28193413861%29.jpeg", // בניין בית המשפט העליון של ארה"ב — סמל גלובלי להליך הוגן ולשלטון החוק. Wikimedia Commons, CC BY 3.0
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "מה פוגע יותר בכבוד האדם?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "q1",
        text: "מה פוגע יותר בכבודו של אדם: חיטוט בתיקו האישי ללא רשותו (פרטיות) או פרסום שמועה שקרית עליו ברשתות החברתיות (שם טוב)?",
        options: [
          "פגיעה בפרטיות",
          "פרסום שמועה שקרית (שם טוב)",
          "שניהם פוגעים באותה מידה",
          "תלוי בנסיבות",
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5.1: הקניה — חיים, ביטחון וקניין ──────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    layout: "list",
    eyebrow: "הקניה",
    title: "חיים, ביטחון וקניין",
    questions: [
      { id: "l1", icon: "shield", text: "חיים וביטחון", options: ["מטילה חובה על המדינה להגן על תושביה מפני פגיעה פיזית או נפשית."], correct_index: null },
      { id: "l2", icon: "document", text: "קניין", options: ["מאפשרת לאדם להחזיק ברכוש שצבר באופן חוקי (חומרי כמו בית, או רוחני כמו שיר או המצאה) מבלי שיילקח ממנו ללא הסכמתו."], correct_index: null },
    ],
  },

  // ── שקף 5.2: הקניה — הזכות להליך הוגן ──────────────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    eyebrow: "הקניה",
    title: "הזכות להליך הוגן",
    body: "הגנה על זכויות אדם בעת מפגש עם מערכת אכיפת החוק. אדם נחשב חף מפשע עד שלא הוכחה אשמתו, ויש לו זכות לייצוג משפטי, שופטים אובייקטיביים, וידיעת ההאשמות נגדו.",
  },

  // ── שקף 5.3: הקניה — הזכות לכבוד ───────────────────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    eyebrow: "הקניה",
    title: "הזכות לכבוד",
    body: "הזכות שלא להיות חשוף ליחס משפיל, מבזה או פוגעני. **היא מהווה בסיס לזכויות רבות אחרות.**",
  },

  // ── שקף 5.4: הקניה — נגזרות הכבוד ──────────────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    layout: "list",
    eyebrow: "הקניה",
    title: "נגזרות הכבוד — פרטיות ושם טוב",
    questions: [
      { id: "d1", icon: "lock", text: "פרטיות", options: ["הזכות לחיות ללא חדירה למרחב הפרטי, לגוף או לחפצים ללא רשות."], correct_index: null },
      { id: "d2", icon: "newspaper", text: "שם טוב", options: ["הזכות שלא יפורסם על האדם מידע שקרי המכפיש את שמו ופוגע בדימויו הציבורי."], correct_index: null },
    ],
  },

  // ── שקף 9: בדיקת עירנות ────────────────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "alertness-check",
    eyebrow: "בדיקת עירנות",
    title: "זכויות טבעיות — חיים, קניין, הליך הוגן וכבוד",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      { id: "ac1", text: 'מה כולל "קניין רוחני"?', options: ["רק בתים ורכוש", "יצירות כמו שיר או המצאה", "רק כסף במזומן", "קרקע חקלאית בלבד"], correct_index: 1 },
      { id: "ac2", text: "מהי הזכות המבטיחה שאדם ייחשב חף מפשע עד שהוכחה אשמתו?", options: ["הזכות לפרטיות", "הזכות לשם טוב", "הזכות להליך הוגן", "הזכות לקניין"], correct_index: 2 },
    ],
  },

  // ── שקף 10: הגדרות (להעתקה למחברת) ────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "זכויות טבעיות — הגדרות",
    questions: [
      { id: "def1", text: "הזכות לחיים ולביטחון", options: [""], feedback: "זכותו של כל אדם לחיות ללא פגיעה פיזית או נפשית, וחובת המדינה להגן עליו.", correct_index: null },
      { id: "def2", text: "זכות הקניין", options: [""], feedback: "זכותו של אדם להחזיק בדבר שיש לו ערך כלכלי (חומרי או רוחני) ולעשות בו שימוש כרצונו, ללא פגיעה בו ללא הסכמתו.", correct_index: null },
      { id: "def3", text: "הזכות להליך הוגן", options: [""], feedback: 'אדם חף מפשע עד שלא הוכחה אשמתו. זכותו של כל אדם הנמצא בהליך משפטי שזכויותיו לא ייפגעו מעבר לנדרש (דוגמאות: ייצוג עו"ד, שופטים בלתי תלויים).', correct_index: null },
      { id: "def4", text: "הזכות לכבוד", options: [""], feedback: "הזכות שלא להיות חשוף ליחס משפיל או מזלזל. כוללת את הזכות לפרטיות (אי חדירה למרחב הפרטי) והזכות לשם טוב (אי פרסום מידע שקרי).", correct_index: null },
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
    title: "מצלמות בכיתות הגן",
    questions: [
      {
        id: "pq1",
        tag: "שאלת אירוע",
        text: `במטרה לייעל את השמירה על טוהר הבחינות, הוחלט להציב מצלמות בכיתות. גננות ומטפלות טענו כי לא יוכלו להתנהג בחופשיות כאשר יש מצלמות המתעדות אותן גם בזמנים שלא קשורים לבחינה.

ציינו והציגו את הזכות של הצוות שעלולה להיפגע.
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
    title: "מצלמות בכיתות הגן — תשובה מלאה",
    body: `### ציין
הזכות לפרטיות

---

### הצג
זכותו הטבעית של אדם לחיות את חייו ללא חשיפה לגופו, חפציו או מרחבו הפרטי ללא רשותו.

---

### הסבר
בקטע מצוין כי "המצלמות יתעדו אותן בזמנים שלא קשורים לבחינה". חשיפה זו של חייהן האישיים בתוך מקום העבודה ללא הסכמתן מהווה חדירה לתחומן הפרטי ופוגעת בזכות לפרטיות.`,
  },

  // ── שקף 14: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "זכויות טבעיות",
    questions: [
      {
        id: "aq1",
        text: 'איזה סוג קניין הוא "זכויות יוצרים על שיר"?',
        options: ["קניין ממשי", "קניין רוחני", "קניין לאומי", "הליך הוגן"],
        correct_index: 1,
      },
      {
        id: "aq2",
        text: "מה מבטיחה הזכות לפרטיות?",
        options: ["שלא יגידו עליך שקרים", "שלא יחדרו למרחב הפרטי שלך ללא רשות", "שיהיה לך עורך דין", "שיהיה לך כסף לקנות בית"],
        correct_index: 1,
      },
      {
        id: "aq3",
        text: "אדם עומד למשפט ואינו יכול לממן עורך דין. איזו זכות נפגעת אם המדינה לא תסייע לו?",
        options: ["חירות", "קניין", "הליך הוגן", "שם טוב"],
        correct_index: 2,
      },
      {
        id: "aq4",
        text: "מה ההבדל בין פרטיות לשם טוב?",
        options: ["אין הבדל", "פרטיות היא מניעת חשיפת מידע אישי, שם טוב הוא מניעת פרסום מידע שקרי", "שם טוב שייך רק לעשירים", "פרטיות היא זכות חברתית"],
        correct_index: 1,
      },
      {
        id: "aq5",
        text: "מדוע חובת המדינה להגן על חיי אדם נגזרת מהזכות לחיים וביטחון?",
        options: ["כי השלטון מעניק את החיים", "כי זוהי זכות טבעית והמדינה היא הכלי להגנתה", "כי לאזרחים אין נשק", "כי כך כתוב בחוזה העבודה"],
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
    title: "קניין רוחני ביום-יום",
    animation: { name: "bear", delay: 3, position: "corner-left", loop: true },
    questions: [
      {
        id: "hw1",
        text: 'מצאו דוגמה ל"קניין רוחני" שאתם משתמשים בו ביום-יום (שיר, סרט, אפליקציה) והסבירו מדוע לדעתכם חשוב להגן עליו.',
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
      { id: "f1", text: "מידת הבנת ההבדל בין קניין חומרי לרוחני.", options: [], correct_index: null },
      { id: "f2", text: 'עד כמה ברור המושג "הליך הוגן".', options: [], correct_index: null },
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
    questions: [
      {
        id: "e1",
        text: '"הזכות להליך הוגן"',
        feedback: "סרטון",
        options: ['סריקת קוד QR בעמוד 12 בחוברת "אזרחות בכיף".'],
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
