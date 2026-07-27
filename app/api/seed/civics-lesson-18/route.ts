import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

export const LESSON_TITLE = "שיעור 18: זכויות קבוצתיות / תרבותיות"
export const SLUG = "democracy-group-cultural-rights-18"

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 18 | אזרחות כיתה י",
    title: "זכויות קבוצתיות / תרבותיות",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/3/3c/2007_Powwow_%282536710352%29.jpg", // רקדנים בטקס "פאו-וואו" של אינדיאנים אמריקאים, וושינגטון — מימוש הזכות הקבוצתית לשמר תרבות ומורשת. Wikimedia Commons, ללא זכויות ידועות
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
      { id: "obj1", icon: "users", text: "נגדיר", options: ["זכויות קבוצתיות כזכויות קיבוציות הניתנות למיעוטים כדי לשמר את זהותם הייחודית."], correct_index: null },
      { id: "obj2", icon: "language", text: "נפרט", options: ["את ארבעת התחומים המרכזיים של זכויות אלו: שפה, חינוך, תרבות וייצוג."], correct_index: null },
      { id: "obj3", icon: "landmark", text: "נסביר", options: ["כי המדינה היא הקובעת את היקף התמיכה בזכויות אלו (בשונה מזכויות פרט שהן חובה)."], correct_index: null },
      { id: "obj4", icon: "flag", text: "נדגים", options: ["את מימוש הזכויות הללו בישראל (למשל: שימוש בשפה הערבית, אוטונומיה בחינוך)."], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Bilingual_street_sign_Brussels.jpg", // שלט רחוב דו-לשוני (צרפתית והולנדית) בבריסלים, בלגיה — דוגמה גלובלית להכרה בזכות השפה של קבוצה. Wikimedia Commons, CC BY-SA 2.0
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "מימון בתי ספר בשפת מיעוט — מכספי כולם?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "q1",
        text: "האם המדינה צריכה לממן מכספי המיסים של כולם בתי ספר שמלמדים רק בשפה של קבוצת מיעוט (כמו ערבית או יידיש)?",
        options: [
          "כן, לגמרי",
          "לא, זה לא נכון",
          "רק במידה חלקית",
          "לא בטוח/ה",
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5.1: הקניה — מהן זכויות קבוצתיות? ──────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    eyebrow: "הקניה",
    title: "מהן זכויות קבוצתיות?",
    body: `אלו זכויות הניתנות לקבוצות אתניות או מיעוטים לאומיים כדי לאפשר להם לשמור על **זהותם הייחודית** השונה מהרוב.

מטרתן להסדיר בצורה מוסדית את ייחוד הקבוצה.`,
  },

  // ── שקף 5.2: הקניה — ארבעת תחומי הזכויות ───────────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    eyebrow: "הקניה",
    title: "ארבעת תחומי הזכויות",
    layout: "grid",
    animation: { name: "pencil", delay: 3, position: "corner-right", loop: true },
    questions: [
      { id: "r1", icon: "language", text: "שפה", options: ["הזכות להשתמש בשפת המיעוט והכרה בה."], correct_index: null },
      { id: "r2", icon: "book", text: "חינוך", options: ["הזכות ללמד את הילדים לפי המורשת והתרבות של המיעוט."], correct_index: null },
      { id: "r3", icon: "scroll", text: "תרבות", options: ["הזכות לקיים טקסים ומנהגים דתיים ותרבותיים נפרדים."], correct_index: null },
      { id: "r4", icon: "vote", text: "ייצוג", options: ["הזכות לנציגים של הקבוצה במוסדות השלטון."], correct_index: null },
    ],
  },

  // ── שקף 5.3: הקניה — מי מחליט על היקף הזכויות? ─────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    eyebrow: "הקניה",
    title: "מי מחליט על היקף הזכויות?",
    body: "בניגוד לזכויות הפרט שהן זכויות יסוד בכל דמוקרטיה, **המדינה** היא זו שקובעת את היקף הענקת זכויות הקבוצה ואת מידת התמיכה המוסדית בהן.",
  },

  // ── שקף 5.4: הקניה — דוגמאות בישראל ────────────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    eyebrow: "הקניה",
    title: "דוגמאות בישראל",
    body: `המדינה מממנת מוסדות חינוך המלמדים בשפה הערבית ועל פי המורשת הדרוזית/ערבית.

המיעוטים חוגגים את חגיהם באופן רשמי ומקיימים פולחן דתי במימון המדינה.`,
  },

  // ── שקף 9: בדיקת עירנות ────────────────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "alertness-check",
    eyebrow: "בדיקת עירנות",
    title: "זכויות קבוצתיות / תרבותיות",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      { id: "ac1", text: "מהם ארבעת תחומי זכויות הקבוצה?", options: ["שפה, חינוך, תרבות וייצוג", "חירות, שוויון, ביטחון וקניין", "דת, מדינה, צבא ומשפט", "עלייה, גיור, ירושה ומיסים"], correct_index: 0 },
      { id: "ac2", text: "מי קובע את היקף התמיכה בזכויות קבוצתיות?", options: ["המיעוט עצמו", 'האו"ם', "המדינה", "בית משפט בינלאומי"], correct_index: 2 },
    ],
  },

  // ── שקף 10: הגדרות (להעתקה למחברת) ────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "זכויות קבוצתיות/תרבותיות — הגדרה",
    questions: [
      { id: "def1", text: "זכויות קבוצתיות/תרבותיות", options: [""], feedback: "זכויות קיבוציות הניתנות לקבוצות אתניות ותרבותיות/מיעוטים לאומיים. מטרתן לאפשר לקבוצה לשמור על זהותה הייחודית בתחומי השפה, החינוך, התרבות והייצוג. המדינה קובעת את היקף התמיכה בהן.", correct_index: null },
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

  // ── שקף 12: תרגול — שאלת ידע ───────────────────────────────────────────────
  {
    id: "s12",
    order: 12,
    type: "practice",
    eyebrow: "תרגול",
    title: "שתי דוגמאות לזכויות קבוצה",
    questions: [
      {
        id: "pq1",
        tag: "שאלת ידע",
        text: "הציגו שתי דוגמאות לזכויות קבוצה שונות.",
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
    title: "שתי דוגמאות לזכויות קבוצה — תשובה מלאה",
    animation: { name: "cat", delay: 3, position: "top", loop: true },
    body: `### דוגמה 1 — הזכות לשפה
הזכות של בני המיעוט להשתמש בשפתם ולקבל הכרה רשמית בה מצד המדינה.

---

### דוגמה 2 — הזכות לחינוך
הזכות של קבוצת מיעוט להקים מוסדות חינוך שבהם ילמדו הילדים את המורשת, ההיסטוריה והתרבות הייחודית של הקבוצה, לעיתים בשפתם.`,
  },

  // ── שקף 14: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "זכויות קבוצתיות / תרבותיות",
    questions: [
      {
        id: "aq1",
        text: "מהי המטרה של זכויות קבוצתיות?",
        options: ["להפוך את כולם לזהים", "לשמור על הזהות הייחודית של המיעוט", "לתת יותר כסף לעשירים", "לבטל את הבחירות"],
        correct_index: 1,
      },
      {
        id: "aq2",
        text: "איזה מהבאים אינו אחד מארבעת תחומי זכויות הקבוצה?",
        options: ["שפה", "חינוך", "ייצוג בשלטון", "הזכות לקניין פרטי"],
        correct_index: 3,
      },
      {
        id: "aq3",
        text: "מי קובע את היקף התמיכה בזכויות קבוצה?",
        options: ["המיעוט עצמו", 'האו"ם', "המדינה", "בית המשפט הבינלאומי"],
        correct_index: 2,
      },
      {
        id: "aq4",
        text: "מה ההבדל בין זכויות פרט של המיעוט לבין זכויות קבוצה?",
        options: ["אין הבדל", "זכויות פרט הן חובה בכל דמוקרטיה, זכויות קבוצה הן בחירה של המדינה", "זכויות קבוצה שייכות רק ליהודים", "זכויות פרט הן רק פוליטיות"],
        correct_index: 1,
      },
      {
        id: "aq5",
        text: "הכרה בשפה הערבית כשפה בעלת מעמד מיוחד בישראל היא מימוש של:",
        options: ["זכויות חברתיות", "זכויות קבוצתיות (שפה)", "חופש הביטוי", "הליך הוגן"],
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
    title: "השפה הערבית במרחב הציבורי",
    animation: { name: "chicken", delay: 3, position: "across", loop: true },
    questions: [
      {
        id: "hw1",
        text: "מצאו דוגמה אחת לשימוש בשפה הערבית במרחב הציבורי (למשל על שלט דרכים, שטר כסף או אתר ממשלתי). הסבירו מדוע זה נחשב למימוש של זכות קבוצתית.",
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
      { id: "f1", text: "הבנת ההבדל בין זכויות אדם לזכויות מיעוט.", options: [], correct_index: null },
      { id: "f2", text: "עד כמה ברור נושא האוטונומיה בחינוך.", options: [], correct_index: null },
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
        text: "פרק 'המיעוטים בישראל'",
        feedback: "קריאה נוספת",
        options: ["בחוברת הלימוד, עמוד 49."],
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
