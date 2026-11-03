import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

export const LESSON_TITLE = "שיעור 3: דמויות שאני מעריך/ה"
export const SLUG = `chinuch-admired-figures-3`

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "זהות אישית וערכים · שיעור 3",
    title: "דמויות שאני מעריך/ה",
    image_url: null, // suggested: קולאז' מופשט של כמה דמויות מוארות על רקע כהה, בלי פנים מזוהות
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
      { id: "obj1", icon: "star", text: "נזהה מה מעורר בנו הערכה", options: ["אצל אנשים שאנחנו מכירים או שומעים עליהם."], correct_index: null },
      { id: "obj2", icon: "compass", text: "נחבר בין הערצה לערכים אישיים", options: ["מי שאני מעריך מספר עליי, לא רק עליו."], correct_index: null },
      { id: "obj3", icon: "sparkles", text: "נפתח משימה יצירתית", options: ["עם כלי בינה מלאכותית ליצירת דמות."], correct_index: null },
    ],
  },

  // ── שקף 3: דעתכם — את מי קל להעריך ────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "את מי הכי קל לכם להעריך?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "q1",
        text: "מי הדמות שהכי קל לכם להעריך?",
        options: ["דמות מהמשפחה", "דמות ציבורית או מפורסמת", "חבר/ה קרוב/ה", "דמות מספר, סרט או משחק"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 4: הקניה — הערכה מגלה ערכים ───────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "study",
    eyebrow: "הקניה",
    title: "הערכה מגלה ערכים",
    body: `כשאנחנו בוחרים להעריך מישהו בצורה יוצאת דופן, זה כמעט אף פעם לא מקרי. אנחנו לא מעריצים אנשים אקראיים — אנחנו מעריכים אנשים שמגלמים משהו שחשוב **לנו**.

מישהו שמעריך אומץ, כנראה שאומץ הוא ערך מרכזי אצלו. מישהו שמעריך חוכמה, כנראה סקרן ורוצה לדעת.

**מי אתם מעריכים, ומה זה מלמד עליכם?**`,
  },

  // ── שקף 5: הקניה — סוגי הערכה ─────────────────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    layout: "grid",
    eyebrow: "הקניה",
    title: "מה אנחנו מעריכים אצל אנשים",
    questions: [
      { id: "c1", icon: "shield", text: "אומץ", options: ["לעמוד מאחורי מה שנכון, גם כשזה לא פופולרי."], correct_index: null },
      { id: "c2", icon: "sparkles", text: "יצירתיות", options: ["לראות או לבנות משהו שאף אחד לא ראה קודם."], correct_index: null },
      { id: "c3", icon: "book", text: "חוכמה וידע", options: ["להבין דברים לעומק, ולשתף בהם אחרים."], correct_index: null },
      { id: "c4", icon: "heart", text: "נתינה וחמלה", options: ["לדאוג לאחרים בלי לצפות לתמורה."], correct_index: null },
      { id: "c5", icon: "star", text: "התמדה", options: ["להמשיך לנסות גם כשקשה או כשנכשלים."], correct_index: null },
    ],
  },

  // ── שקף 6: בדיקת עירנות ────────────────────────────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "alertness-check",
    eyebrow: "בדיקת עירנות",
    title: "חיבור לשיעור הקודם",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      { id: "ac1", text: "התמדה והישג, לפי מודל שוורץ, הכי קרובים לקבוצת:", options: ["קידום עצמי", "שימור", "פתיחות לשינוי", "התעלות מעבר לעצמי"], correct_index: 0 },
      { id: "ac2", text: "נתינה וחמלה, לפי מודל שוורץ, הכי קרובים לקבוצת:", options: ["קידום עצמי", "שימור", "התעלות מעבר לעצמי", "פתיחות לשינוי"], correct_index: 2 },
    ],
  },

  // ── שקף 7: המשימה ─────────────────────────────────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "homework",
    eyebrow: 'משימה 1: "דמויות שאני מעריך/ה"',
    title: "מי הם האנשים שמעוררים בכם הערכה, ומה זה מלמד עליכם?",
    body: `**1. חקרו ובחרו 2 דמויות**
בחרו שתי דמויות שאתם מעריכים בצורה יוצאת דופן.

> שימו לב: אסור שתהיה לכם היכרות אישית עם הדמויות. הדמויות צריכות להיות שונות זו מזו במאפיינים שמעוררים אצלכם הערכה.

**2. כתבו 4–6 משפטים**
מדוע בחרתם בדמויות אלו? מדוע אתם מעריכים אותן בצורה יוצאת דופן?

**3. צרו דמות אחת משתי הדמויות**
השתמשו בכלי בינה מלאכותית כדי ליצור תמונה של דמות אחת, שהיא חיבור בין שתי הדמויות שבחרתם.

**4. שלחו לאליאב בוואטסאפ**
את התמונה ואת המשפטים, בהודעה פרטית.

**מועד אחרון להגשה: יום רביעי, 28.10**

> התמונה מיועדת להגשה בלבד. אין להפיץ אותה ברשתות או בקבוצות.`,
  },

  // ── שקף 8: מתחילים עכשיו ──────────────────────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    eyebrow: "בזמן שנותר",
    title: "מתחילים עכשיו בכיתה",
    body: `רשמו לעצמכם 2 שמות של דמויות שאתם מעריכים. התחילו לנסח למה — זה בסדר אם זה עוד לא מושלם.

> למורה: סבבו בין התלמידים בזמן הזה. תלמיד שנתקע — שאלו אותו "מי הכי מעצבן אותך שמזלזלים בו?" או "איזה סוג אדם תמיד תופס את תשומת הלב שלך בחדשות?" — זו דרך עקיפה למצוא דמות.`,
  },

  // ── שקף 9: משוב ──────────────────────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "feedback",
    eyebrow: "משוב",
    title: "איך היה השיעור?",
    questions: [
      { id: "f1", text: "באיזו מידה היה לך קל לבחור דמויות להעריך?", options: [], correct_index: null },
      { id: "f2", text: "באיזו מידה ההערכה שלך לדמויות אלו מלמדת אותך משהו על עצמך?", options: [], correct_index: null },
      { id: "f3", text: "באיזו מידה נהנית מהשיעור?", options: [], correct_index: null },
    ],
  },

  // ── שקף 10: העשרה ─────────────────────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "enrichment",
    eyebrow: "העשרה",
    title: "טיפים למשימה",
    questions: [
      {
        id: "e1",
        text: "איך כותבים פרומפט טוב ליצירת תמונה",
        feedback: "טיפ",
        options: ["תארו מאפיינים חזותיים קונקרטיים (הבעת פנים, תנוחה, רקע) ולא רק שמות — כלי הבינה המלאכותית לא תמיד מזהה דמויות אמיתיות."],
        correct_index: null,
      },
      {
        id: "e2",
        text: "מה אם שתי הדמויות מאוד שונות ויזואלית",
        feedback: "טיפ",
        options: ["זו בדיוק הנקודה — נסו לתאר מה מהמאפיינים החיצוניים או הסגנוניים של כל אחת מהן הייתם רוצים לשלב."],
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
