import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

export const LESSON_TITLE = "שיעור 4: חידוד ערכים — מה הכי חשוב לי"
export const SLUG = `chinuch-value-clarification-4`

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "זהות אישית וערכים · שיעור 4",
    title: "חידוד ערכים",
    image_url: null, // suggested: מניפה של כרטיסי מילים צבעוניים, חלקם מודגשים וחלקם מטושטשים ברקע
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
    title: "מה נעשה היום",
    animation: { name: "camel", delay: 3, position: "across", loop: true },
    questions: [
      { id: "obj1", icon: "compass", text: "נכיר רשימה רחבה של ערכים", options: ["ונבחר מתוכה את מה שהכי מתחבר אלינו."], correct_index: null },
      { id: "obj2", icon: "star", text: "נצמצם לשלושה ערכים מרכזיים", options: ["שהכי מנחים אותנו היום."], correct_index: null },
      { id: "obj3", icon: "scale", text: "נבין מה קורה כשערכים מתנגשים", options: ["ואיך בוחרים כשאי אפשר לקיים את שניהם."], correct_index: null },
    ],
  },

  // ── שקף 3: דעתכם — חימום ──────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "אם הייתם צריכים לבחור ערך אחד שהכי מנחה אתכם היום, זה היה...?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "q1",
        text: "בחרו את הקרוב ביותר:",
        options: ["כנות", "חברות", "הצלחה", "חופש"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 4: הקניה — רשימת ערכים ────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "study",
    eyebrow: "הקניה",
    title: "20 ערכים לבחירה",
    body: `חופש · מסורת · הצלחה · צדק · ביטחון · עושר · נאמנות · סקרנות · השפעה · נתינה · הנאה · כבוד להורים · שוויון · עצמאות · סדר · השגיות · הרפתקנות · הכרה · צייתנות · שמירה על הטבע

אלו עשרת ערכי היסוד של שוורץ, פרושים לעשרים מילים קרובות. אין תשובה נכונה — המטרה היא למצוא את מה שבאמת מתחבר אליכם, לא את מה ש"צריך" להיות חשוב.`,
  },

  // ── שקף 5: פעילות אישית — 7 ואז 3 ─────────────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    eyebrow: "פעילות אישית · 6 דקות",
    title: "7 ואז 3",
    body: `**שלב א׳** — מתוך הרשימה, בחרו 7 ערכים שהכי מתחברים אליכם.

**שלב ב׳** — מתוך ה-7, צמצמו ל-3 שהכי חשובים לכם היום.

> למורה: 3 דקות לכל שלב. הקושי האמיתי הוא בצמצום מ-7 ל-3 — זה המקום שבו תלמידים מגלים שהם צריכים לוותר על ערך שהם אוהבים לטובת ערך שהם צריכים יותר. אפשר לשאול: "על איזה ערך היה הכי קשה לוותר?"`,
  },

  // ── שקף 6: דעתכם — מראה לכיתה ─────────────────────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "איזה מהבאים הכי קרוב לאחד משלושת הערכים שבחרתם?",
    questions: [
      {
        id: "q2",
        text: "בחרו את הקרוב ביותר לשלושת הערכים שלכם:",
        options: ["חופש ועצמאות", "משפחה וכבוד להורים", "הצלחה והשגיות", "נאמנות וחברות"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 7: הקניה — תוצאות הכיתה ───────────────────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    eyebrow: "הקניה",
    title: "מה המראה הזו מגלה עלינו כקבוצה?",
    body: `התוצאה שלמעלה היא תמונה חיה של מה שהכיתה הזו, היום, חושבת שהכי חשוב. זו לא תמונה קבועה — בעוד שנה היא יכולה להיראות אחרת לגמרי, גם אצלכם וגם כקבוצה.

שאלה לדיון: הופתעתם מהתוצאה? מה היה בולט במיוחד — הסכמה רחבה, או דווקא פיזור גדול?`,
  },

  // ── שקף 8: הקניה — התנגשות ערכים ──────────────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    eyebrow: "הקניה",
    title: "מה קורה כשערכים מתנגשים?",
    body: `לרוב, הרגע שבו אנחנו **באמת** מגלים מה חשוב לנו הוא כשאי אפשר לקיים שני ערכים בו-זמנית, וצריך לבחור.

חבר מבקש מכם לשקר בשבילו כדי לכסות עליו. איזה ערך מתנגש כאן מול איזה?`,
  },

  // ── שקף 9: דעתכם — דילמה ──────────────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "חבר ביקש מכם לשקר כדי לכסות עליו. מה הייתם עושים?",
    questions: [
      {
        id: "q3",
        text: "בחרו את הקרוב ביותר למה שהייתם עושים:",
        options: ["משקר/ת כדי להגן על החברות", "אומר/ת את האמת גם אם זה פוגע בחברות", "מנסה לשכנע אותו להודות בעצמו", "לא בטוח/ה מה הייתי עושה"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 10: מנוחמוח ────────────────────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "brain-break",
    eyebrow: "",
    title: "מנוחמוח",
    animation: { name: "bear", delay: 0, position: "big-center", loop: true },
  },

  // ── שקף 11: בדיקת עירנות ───────────────────────────────────────────────────
  {
    id: "s11",
    order: 11,
    type: "alertness-check",
    eyebrow: "בדיקת עירנות",
    title: "חזרה מהירה",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      { id: "ac1", text: "למה מצמצמים מ-7 ערכים ל-3, ולא מסתפקים ב-7?", options: ["כי 7 זה יותר מדי לזכור", "כי הצמצום מכריח לבחור מה הכי חשוב כשצריך לוותר", "אין סיבה מיוחדת", "כי זה מספר יפה"], correct_index: 1 },
      { id: "ac2", text: "הרגע שבו הכי מגלים מה חשוב לנו הוא בדרך כלל...", options: ["כשהכל קל", "כששני ערכים מתנגשים וצריך לבחור", "כשאף אחד לא רואה", "כשיש הרבה זמן"], correct_index: 1 },
    ],
  },

  // ── שקף 12: מבדק סוף שיעור ────────────────────────────────────────────────
  {
    id: "s12",
    order: 12,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "חידוד ערכים",
    questions: [
      { id: "aq1", text: "רשימת 20 הערכים בשיעור מבוססת על...", options: ["עשרת ערכי היסוד של שוורץ", "עשרת הדיברות", "חוקי מדינת ישראל", "רשימה אקראית"], correct_index: 0 },
      { id: "aq2", text: "הקושי העיקרי בתרגיל 7-ואז-3 הוא...", options: ["לזכור את הרשימה", "לוותר על ערכים שחשובים, לטובת מה שהכי חשוב", "לכתוב מהר", "אין קושי מיוחד"], correct_index: 1 },
      { id: "aq3", text: "כאשר ערך 'כנות' וערך 'חברות' מתנגשים, זה מראה בעיקר ש...", options: ["אחד מהערכים מזויף", "לכל אדם יש דירוג אישי בין ערכים שמתגלה ברגע הקונפליקט", "אסור שיהיו שני ערכים", "זה לא קשור לערכים"], correct_index: 1 },
      { id: "aq4", text: "הרשימה של 20 הערכים בשיעור הזה היא...", options: ["קבועה ולא ניתנת לשינוי", "פתוחה — אין תשובה 'נכונה' של ערכים", "מדורגת מראש מהחשוב לפחות חשוב", "זהה לכל אדם"], correct_index: 1 },
    ],
  },

  // ── שקף 13: שיעורי בית ────────────────────────────────────────────────────
  {
    id: "s13",
    order: 13,
    type: "homework",
    eyebrow: "למחברת",
    title: "קונפליקט אישי",
    questions: [
      {
        id: "hw1",
        text: "כתבו 2–3 משפטים: מתי לאחרונה הרגשתם קונפליקט בין שני ערכים שלכם? מה בחרתם לעשות, ולמה?",
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
      { id: "f1", text: "באיזו מידה היה לך קל לצמצם ל-3 ערכים?", options: [], correct_index: null },
      { id: "f2", text: "באיזו מידה הרגשת שהתוצאה מייצגת אותך באמת?", options: [], correct_index: null },
      { id: "f3", text: "באיזו מידה נהנית מהשיעור?", options: [], correct_index: null },
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
        text: "שאלון הערכים המלא של שוורץ (PVQ)",
        feedback: "כלי אבחון",
        options: ["גרסה מורחבת של תרגיל הדירוג שעשינו היום, בשימוש חוקרים ברחבי העולם."],
        correct_index: null,
      },
      {
        id: "e2",
        text: "דילמות מוסריות מפורסמות",
        feedback: "למחשבה נוספת",
        options: ["אוסף של דילמות קלאסיות שמעמתות בין ערכים — לקריאה ולדיון עצמי."],
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
      subject: "חינוך",
      slug: SLUG,
      slides,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: "Lesson created", id: data.id, title: data.title, slideCount: slides.length })
}
