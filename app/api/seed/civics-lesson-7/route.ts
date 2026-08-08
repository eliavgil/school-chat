import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

export const LESSON_TITLE = "שיעור 7: מבוא לרעיון הדמוקרטי"
export const SLUG = "democracy-intro-concept-7"

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 7 | אזרחות כיתה י",
    title: "מבוא לרעיון הדמוקרטי",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/f/f2/The_Acropolis_of_Athens_from_the_Pnyx_on_February_26%2C_2020.jpg", // האקרופוליס נשקף מהפניקס — הכיכר שבה נאספו אזרחי אתונה להצביע. Wikimedia Commons, CC BY-SA 4.0, George E. Koronaios
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
    animation: { name: "pencil", delay: 3, position: "top", loop: true },
    questions: [
      { id: "obj1", icon: "quote", text: "נסביר", options: ['את מקור המילה "דמוקרטיה" ואת תפיסת העם כריבון ומקור הסמכות.'], correct_index: null },
      { id: "obj2", icon: "scale", text: "נבחין", options: ["בין המובן הפורמלי של הדמוקרטיה (צורת ממשל) למובן המהותי שלה (ערך ואורח חיים)."], correct_index: null },
      { id: "obj3", icon: "identity", text: "נזהה", options: ['את הערכים הדמוקרטיים של "האדם במרכז" ו"האדם כיצור תבוני" כבסיס לרעיון הדמוקרטי.'], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/0/02/Ostraka_for_Ostracism%2C_5th_century_BC%2C_Museum_of_the_Ancient_Agora%2C_Athens%2C_Greece_%2813896440260%29.jpg", // חרסים ("אוסטרקה") ששימשו את אזרחי אתונה להצביע על גירוש פוליטיקאי — כך הצביעו לפני 2,500 שנה. Wikimedia Commons, CC BY-SA 2.0, Carole Raddato
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "תחת איזו צורת משטר הכי היית רוצה לחיות?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "q1",
        text: "תחת איזו צורת משטר הכי היית רוצה לחיות?",
        options: [
          "מלוכה",
          "דמוקרטיה",
          "תיאוקרטיה (שלטון דתי)",
          "אנרכיה (אין חוקים)",
          "שלטון צבאי",
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5.1: הקניה — מקור הדמוקרטיה והעם כריבון ───────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    eyebrow: "הקניה",
    title: "מקור הדמוקרטיה והעם כריבון",
    body: `המילה "דמוקרטיה" מקורה ביוונית: "דמוס" (עם) ו"קרטיה" (שלטון). הרעיון המרכזי הוא ש**העם הוא הריבון** ומקור הסמכות של השלטון.

בדמוקרטיה מודרנית, האזרחים מעבירים את הריבונות לנציגיהם לזמן קצוב המוגדר בחוק, אך הסמכות נותרת בידי העם.`,
  },

  // ── שקף 5.2: הקניה — דמוקרטיה כצורת ממשל (פורמלי) ─────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    eyebrow: "הקניה",
    title: "דמוקרטיה כצורת ממשל — המובן הפורמלי",
    body: `מובן זה רואה בדמוקרטיה מערכת של מוסדות ונהלים המאפשרים ניהול תקין של המדינה.

**הדגש:** טכניקה שלטונית — קיום בחירות דמוקרטיות, הפרדת רשויות, הכרעת הרוב ושלטון החוק.

> המטרה היא להבטיח שהשלטון יפעל לפי רצון העם ולא יהפוך לעריצות.`,
  },

  // ── שקף 5.3: הקניה — דמוקרטיה כערך (מהותי) ────────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    eyebrow: "הקניה",
    title: "דמוקרטיה כערך — המובן המהותי",
    body: `מובן זה רואה בדמוקרטיה השקפת עולם ואורח חיים המושתתים על ערכים הומניסטיים.

**הדגש:** זכויות האדם והאזרח, שוויון, חירות וסובלנות.

> דמוקרטיה במובן זה אינה מסתפקת בבחירות, אלא שואפת להגן על כבודו של כל אדם באשר הוא אדם, גם אם הוא שייך למיעוט.`,
  },

  // ── שקף 5.4: הקניה — ערכי היסוד: האדם במרכז ───────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    layout: "list",
    eyebrow: "הקניה",
    title: "ערכי היסוד — האדם במרכז",
    body: "הרעיון הדמוקרטי נשען על שתי הנחות יסוד מוסריות:",
    questions: [
      { id: "v1", icon: "identity", text: "האדם במרכז", options: ["האדם הוא הערך העליון. המדינה קיימת עבור האדם ונועדה להבטיח את זכויותיו ורווחתו."], correct_index: null },
      { id: "v2", icon: "scale", text: "האדם כיצור תבוני", options: ["לכל אדם יש יכולת לחשוב, להבחין בין טוב לרע ולקבל החלטות מושכלות על חייו ועל ענייני המדינה."], correct_index: null },
    ],
  },

  // ── שקף 5.5: הקניה — תקופת הנאורות ────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "study",
    eyebrow: "הקניה",
    title: "תקופת הנאורות — המהפכה המחשבתית",
    body: "בתקופה זו חל שינוי דרמטי בתפיסת מקומו של האדם בעולם, המהווה את התשתית לרעיון הדמוקרטי:",
    questions: [
      { id: "e_1", icon: "scale", text: "האדם כיצור תבוני", options: ["ההכרה כי לכל בני האדם יש יכולת לחשוב, להבין ולשפוט בעצמם את המציאות."], correct_index: null },
      { id: "e_2", icon: "identity", text: "האדם במרכז", options: ["האמונה כי האדם הוא הערך העליון והמטרה, ולא רק אמצעי בידי השלטון או האל."], correct_index: null },
      { id: "e_3", icon: "quote", text: "שאלת יצר האדם", options: ['פילוסופים החלו לשאול — האם בני האדם "רעים מנעוריהם" וזקוקים ליד חזקה שתשליט סדר, או שהם יצורים מוסריים השואפים לחופש?'], correct_index: null },
    ],
  },

  // ── שקף 5.6: הקניה — האמנה החברתית ────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "study",
    eyebrow: "הקניה",
    title: '"האמנה החברתית" והמעבר ממצב הטבע למדינה',
    body: "תאוריית האמנה החברתית מסבירה מדוע בני אדם החליטו להתארגן במסגרת של מדינה:",
    questions: [
      { id: "sc1", icon: "alert", text: "מצב הטבע", options: ["שלב קדום בו לא היה שלטון. בני האדם נהנו מחופש מוחלט, אך חיו בחשש מתמיד מפגיעה בחייהם וברכושם."], correct_index: null },
      { id: "sc2", icon: "handshake", text: "האמנה", options: ["הסכם דמיוני בו האזרחים מסכימים לוותר על חלק מחירותם המוחלטת ולהעביר את הריבונות והסמכות השלטונית לנציגים."], correct_index: null },
      { id: "sc3", icon: "scroll", text: "המטרה", options: ['המדינה והשלטון אינם "גזירת גורל", אלא תוצר של רצון חופשי של בני אדם שנועד לשרת את האינטרסים שלהם.'], correct_index: null },
    ],
  },

  // ── שקף 5.7: הקניה — הובס מול לוק ─────────────────────────────────────────
  {
    id: "s11",
    order: 11,
    type: "study",
    layout: "list",
    eyebrow: "הקניה",
    title: "הובס מול לוק — שתי גישות לאדם ולשלטון",
    questions: [
      { id: "ph1", icon: "shield", text: "תומס הובס (גישה פסימית)", options: ['האמין כי יצר האדם רע ו"מלחמתי". ללא שלטון חזק, בני האדם יפגעו זה בזה ("אדם לאדם זאב"), ולכן עליהם למסור את כל כוחם לשליט יחיד שיבטיח סדר וביטחון.'], correct_index: null },
      { id: "ph2", icon: "scale", text: "ג'ון לוק (גישה אופטימית — אבי הליברליזם)", options: ["טען כי האדם הוא יצור תבוני ומוסרי בבסיסו. לכל אדם זכויות טבעיות — חיים, חירות וקניין — המגיעות לו מעצם היותו אדם ואינן מוענקות על ידי השלטון. תפקיד המדינה הוא להגן על זכויות אלו בלבד; אם היא פוגעת בהן, היא מאבדת את הלגיטימיות שלה."], correct_index: null },
    ],
  },

  // ── שקף 12: בדיקת עירנות ────────────────────────────────────────────
  {
    id: "s12",
    order: 12,
    type: "alertness-check",
    eyebrow: "בדיקת עירנות",
    title: "מבוא לרעיון הדמוקרטי",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      { id: "ac1", text: "מהיכן מגיעה המילה \"דמוקרטיה\"?", options: ["מיוונית: עם ושלטון", "מלטינית: חוק וסדר", "מעברית: שוויון", "מערבית: עצה"], correct_index: 0 },
      { id: "ac2", text: "מי טען שהאדם הוא יצור תבוני ומוסרי, ושתפקיד המדינה הוא להגן על זכויותיו הטבעיות?", options: ["תומס הובס", "ג'ון לוק", "קרל מרקס", "אריסטו"], correct_index: 1 },
    ],
  },

  // ── שקף 13: הגדרות (להעתקה למחברת) ────────────────────────────────────────
  {
    id: "s13",
    order: 13,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "מבוא לרעיון הדמוקרטי — הגדרות",
    questions: [
      { id: "def1", text: "דמוקרטיה כצורת ממשל (פורמלית)", options: [""], feedback: "גישה הרואה בדמוקרטיה מערכת של כללים ומוסדות, כגון בחירות ומוסדות שלטון, שמטרתם לנהל את המדינה לפי רצון הרוב.", correct_index: null },
      { id: "def2", text: "דמוקרטיה כערך (מהותית)", options: [""], feedback: "גישה הרואה בדמוקרטיה השקפת עולם ואורח חיים המעמידים במרכז את זכויות האדם והאזרח ואת ערכי החירות והשוויון.", correct_index: null },
      { id: "def3", text: "האדם במרכז", options: [""], feedback: "ערך דמוקרטי המגדיר את האדם כערך עליון ואת המדינה ככלי המשרת את מימוש זכויותיו.", correct_index: null },
      { id: "def4", text: "האדם כיצור תבוני", options: [""], feedback: "ערך דמוקרטי המכיר ביכולתו של כל אדם לקבל החלטות מושכלות ואוטונומיות על חייו.", correct_index: null },
    ],
  },

  // ── שקף 14: מנוחמוח ───────────────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "brain-break",
    eyebrow: "",
    title: "מנוחמוח",
    animation: { name: "giraffe", delay: 0, position: "big-center", loop: true },
  },

  // ── שקף 15: תרגול — שאלת אירוע ─────────────────────────────────────────────
  {
    id: "s15",
    order: 15,
    type: "practice",
    eyebrow: "תרגול",
    title: "שלטון הרוב מול זכויות המיעוט",
    questions: [
      {
        id: "pq1",
        tag: "שאלת אירוע",
        text: `קבוצת אזרחים במדינה מסוימת פנתה לבית המשפט בדרישה לבטל חוק שחוקק הפרלמנט ברוב גדול. לטענתם, על אף שהחוק התקבל בדרך דמוקרטית על ידי נציגי העם שנבחרו בבחירות, הוא פוגע בזכויות יסוד של קבוצת מיעוט. בית המשפט קיבל את העתירה וקבע כי דמוקרטיה אינה רק שלטון הרוב, אלא מחויבות להגנה על זכויות אדם.

ציינו והציגו את מובן הדמוקרטיה (כצורת ממשל או כערך) שבא לידי ביטוי בדברי בית המשפט.
הסבירו כיצד מובן זה בא לידי ביטוי בקטע.`,
        options: [],
        correct_index: null,
      },
    ],
  },

  // ── שקף 16: תשובה ─────────────────────────────────────────────────────────
  {
    id: "s16",
    order: 16,
    type: "answer",
    eyebrow: "תשובת מודל",
    title: "שלטון הרוב מול זכויות המיעוט — תשובה מלאה",
    body: `### ציין
דמוקרטיה כערך (המובן המהותי)

---

### הצג
השקפת עולם ואורח חיים המעמידים במרכז את האדם וזכויותיו. במובן זה, הדמוקרטיה מחויבת לערכים כמו חירות, שוויון והגנה על המיעוט, מעבר לכללים הטכניים של הכרעת הרוב.

---

### הסבר
בקטע מצוין כי בית המשפט קבע ש"דמוקרטיה אינה רק שלטון הרוב, אלא מחויבות להגנה על זכויות אדם". קביעה זו מדגישה את הפן הערכי-מהותי של המשטר, המגן על זכויות הפרט והמיעוט גם מול החלטות שהתקבלו ברוב, ובכך מבטאת את המובן של הדמוקרטיה כערך.`,
  },

  // ── שקף 17: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s17",
    order: 17,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "מבוא לרעיון הדמוקרטי",
    questions: [
      {
        id: "aq1",
        text: 'מה פירוש המילה "דמוס" במונח דמוקרטיה?',
        options: ["שלטון", "עם", "חוק", "צבא"],
        correct_index: 1,
      },
      {
        id: "aq2",
        text: 'מי נחשב ל"ריבון" במדינה דמוקרטית?',
        options: ["ראש הממשלה", "השופטים", "כלל ציבור האזרחים", "הפרלמנט"],
        correct_index: 2,
      },
      {
        id: "aq3",
        text: "דמוקרטיה המתמקדת רק בקיום בחירות ומוסדות שלטון היא:",
        options: ["דמוקרטיה כצורת ממשל", "דמוקרטיה כערך", "דמוקרטיה ישירה", "אנרכיה"],
        correct_index: 0,
      },
      {
        id: "aq4",
        text: 'מדוע ערך "האדם כיצור תבוני" חיוני לדמוקרטיה?',
        options: [
          "כי הוא מחייב את כולם ללמוד באוניברסיטה",
          "כי הוא בבסיס האמונה שלאזרחים יש יכולת לבחור את נציגיהם ולקבל החלטות",
          "כי הוא קובע שהשלטון תמיד צודק",
          "כי הוא מבטל את זכויות המיעוט",
        ],
        correct_index: 1,
      },
      {
        id: "aq5",
        text: 'אדם הטוען ש"דמוקרטיה מחייבת אותנו לכבד כל אדם באשר הוא אדם" מתייחס ל:',
        options: ["דמוקרטיה פורמלית בלבד", "דמוקרטיה כערך (מהותית)", "שלטון החוק בלבד", "דמוקרטיה ישירה"],
        correct_index: 1,
      },
    ],
  },

  // ── שקף 18: שיעורי בית ────────────────────────────────────────────────────
  {
    id: "s18",
    order: 18,
    type: "homework",
    eyebrow: 'משימת "הדמוקרטיה בבית שלי"',
    title: "כלל או נוהל מהבית",
    animation: { name: "survey", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "hw1",
        text: "חשבו על כלל או נוהל שקיים אצלכם בבית או בבית הספר, ותארו אותו בקצרה.",
        options: [],
        correct_index: null,
      },
      {
        id: "hw2",
        text: 'הסבירו: האם הוא מבטא דמוקרטיה כ"צורת ממשל" (למשל: הצבעה על לאן נוסעים לטיול) או דמוקרטיה כ"ערך" (למשל: שמירה על הפרטיות שלכם בחדר)? נמקו את תשובתכם בעזרת המושגים שלמדנו.',
        options: [],
        correct_index: null,
      },
    ],
  },

  // ── שקף 19: משוב ──────────────────────────────────────────────────────────
  {
    id: "s19",
    order: 19,
    type: "feedback",
    eyebrow: "משוב",
    title: "איך היה השיעור?",
    questions: [
      { id: "f1", text: 'עד כמה ברור לך כעת ההבדל בין דמוקרטיה כ"צורת ממשל" לבין דמוקרטיה כ"ערך"?', options: [], correct_index: null },
      { id: "f2", text: 'עד כמה המושגים "האדם במרכז" ו"האדם כתבוני" נראים לך חשובים להבנת הדמוקרטיה?', options: [], correct_index: null },
      { id: "f3", text: "איך היית מדרג את מידת העניין שלך בנושאים התיאורטיים שדיברנו עליהם היום?", options: [], correct_index: null },
    ],
  },

  // ── שקף 20: העשרה ─────────────────────────────────────────────────────────
  {
    id: "s20",
    order: 20,
    type: "enrichment",
    eyebrow: "העשרה",
    title: "לסקרנים",
    questions: [
      {
        id: "e1",
        text: "מהי דמוקרטיה? — המובן הפורמלי והמהותי",
        feedback: "סרטון",
        options: ['סריקת קוד QR בעמוד 12 בחוברת "אזרחות בכיף".'],
        correct_index: null,
      },
      {
        id: "e2",
        text: '"הרעיון הדמוקרטי"',
        feedback: "קריאה נוספת",
        options: ["פרק בחוברת השאלות (עמוד 10), לתרגול שאלות ידע נוספות על ערך האדם."],
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
