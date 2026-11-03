import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

export const LESSON_TITLE = "שיעור 1: מהם ערכים?"
export const SLUG = `chinuch-what-are-values-1`

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "זהות אישית וערכים · שיעור 1",
    title: "מהם ערכים?",
    image_url: null, // suggested: עיגולים מצטלבים בגוונים חמים, תחושה של מפגש בין צבעים/זהויות שונות
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
      { id: "obj1", icon: "compass", text: "נגדיר מהו ערך", options: ["ונבדיל אותו מנורמה, חוק, העדפה ואמונה."], correct_index: null },
      { id: "obj2", icon: "sparkles", text: "נכיר מודל שמסדר ערכים", options: ["לארבע קבוצות, ונמקם את עצמנו בתוכו."], correct_index: null },
      { id: "obj3", icon: "globe", text: "נגלה שערכים לא קבועים", options: ["אותם ערכים מקבלים דירוג וביטוי שונים בתרבויות שונות."], correct_index: null },
    ],
  },

  // ── שקף 3: פעילות פתיחה — הבית בוער ───────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "opinion",
    eyebrow: "פעילות פתיחה",
    title: "הבית בוער. כל בני המשפחה ובעלי החיים בחוץ ובטוחים. יש לכם 30 שניות להוציא 3 חפצים — מה קודם לכם?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      {
        id: "q1",
        text: "מה הייתם מצילים קודם?",
        options: [
          "תמונות ומסמכים — זיכרון ותיעוד",
          "חפץ עם ערך רגשי — מתנה, זיכרון מאדם מסוים",
          "משהו שימושי — כסף, מסמכים רשמיים",
          "חפץ של מישהו אחר שחשוב לו",
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 4: הקניה — מהו ערך ────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "study",
    eyebrow: "הקניה",
    title: "למה בחרתם במה שבחרתם?",
    body: `מה שהוצאתם מהבית הבוער מספר משהו עליכם — לא במקרה, אלא כי זה מה שחשוב לכם.

**ערך הוא עיקרון שאדם רואה בו דבר חשוב ורצוי, אשר מכוון את הבחירות וההתנהגות שלו לאורך זמן ובמצבים שונים.**

> למורה: לפני שחושפים את ההגדרה, שווה לשאול את הכיתה "מה משותף לדברים שאנשים שונים בחרו להציל?" ולבנות את ההגדרה איתם על הלוח.`,
  },

  // ── שקף 5: הקניה — ארבעה מאפיינים ─────────────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    layout: "grid",
    eyebrow: "הקניה",
    title: "ארבעה מאפיינים של ערך",
    questions: [
      { id: "c1", icon: "lock", text: "יציב", options: ["ערך לא משתנה מיום ליום."], correct_index: null },
      { id: "c2", icon: "quote", text: "מופשט", options: ['״כנות״ היא ערך. ״לא להעתיק במבחן״ היא התנהגות שנובעת ממנו.'], correct_index: null },
      { id: "c3", icon: "compass", text: "מכוון בחירות", options: ["עומד מאחורי החלטות, במיוחד כשמתלבטים."], correct_index: null },
      { id: "c4", icon: "scale", text: "מדורג", options: ["לכל אחד סדר עדיפויות, שמתגלה כששני ערכים מתנגשים."], correct_index: null },
    ],
  },

  // ── שקף 6: הקניה — מה ערך איננו ───────────────────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    eyebrow: "הקניה",
    title: "מה ערך איננו?",
    body: `| דוגמה | הגדרה קצרה | מושג |
| --- | --- | --- |
| הגינות | עיקרון כללי שנחשב חשוב | ערך |
| עומדים בתור | כלל התנהגות מקובל בחברה מסוימת | נורמה |
| אסור לגנוב | כלל מחייב שהמדינה אוכפת | חוק |
| אני אוהב פיצה | טעם אישי, לא מחייב מוסרית | העדפה |
| העולם הולך ומשתפר | טענה שאדם מחזיק כנכונה | אמונה |

שאלה לכיתה: הנורמה ״עומדים בתור״ נשענת על איזה ערך?`,
  },

  // ── שקף 7: בדיקת עירנות ────────────────────────────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "alertness-check",
    eyebrow: "בדיקת עירנות",
    title: "ערך, נורמה, חוק או העדפה?",
    animation: { name: "loading_hand", delay: 3, position: "corner-right", loop: true },
    questions: [
      { id: "ac1", text: '"אני אוהב/ת פיצה" היא דוגמה ל...', options: ["ערך", "נורמה", "העדפה אישית", "חוק"], correct_index: 2 },
      { id: "ac2", text: "ההבדל המרכזי בין ערך לנורמה הוא ש...", options: ["נורמה היא כלל התנהגות מקובל, וערך הוא העיקרון שמאחוריו", "אין הבדל", "נורמה חשובה יותר", "חוק הוא תמיד ערך"], correct_index: 0 },
    ],
  },

  // ── שקף 8: הקניה — ארבע קבוצות ערכים (שוורץ) ──────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    layout: "grid",
    eyebrow: "הקניה · מודל שלום שוורץ",
    title: "ארבע קבוצות ערכים",
    body: "פסיכולוג חברתי בשם שלום שוורץ מצא, במחקרים בעשרות מדינות, עשרה ערכי יסוד שחוזרים בכל התרבויות — ומיין אותם לארבע קבוצות. קבוצות מנוגדות (למעלה מול למטה) יוצרות מתח: אצל כל אדם ובכל תרבות הדירוג ביניהן שונה.",
    questions: [
      { id: "g1", icon: "sparkles", text: "פתיחות לשינוי", options: ["חופש · עצמאות · סקרנות · הרפתקנות · הנאה"], correct_index: null },
      { id: "g2", icon: "lock", text: "שימור", options: ["ביטחון · מסורת · כבוד להורים · סדר · צייתנות"], correct_index: null },
      { id: "g3", icon: "heart", text: "התעלות מעבר לעצמי", options: ["נתינה · צדק · שוויון · נאמנות · שמירה על הטבע"], correct_index: null },
      { id: "g4", icon: "star", text: "קידום עצמי", options: ["הצלחה · השגיות · השפעה · עושר · הכרה"], correct_index: null },
    ],
  },

  // ── שקף 9: דעתכם — מיקום עצמי במודל ──────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "איזו מהקבוצות הכי מתארת אתכם היום?",
    questions: [
      {
        id: "q2",
        text: "בחרו את הקבוצה הכי קרובה אליכם כרגע:",
        options: ["פתיחות לשינוי", "שימור", "התעלות מעבר לעצמי", "קידום עצמי"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 10: הקניה — מקורות לערכים ─────────────────────────────────────────
  {
    id: "s10",
    order: 10,
    type: "study",
    layout: "list",
    eyebrow: "הקניה",
    title: "שלושה מקורות לערכים",
    body: "ערכים נרכשים בתהליך של חברות, ובגיל ההתבגרות בוחנים אותם ובוחרים מה לאמץ.",
    questions: [
      { id: "src1", icon: "family", text: "המשפחה", options: ["ילדים לומדים בעיקר מחיקוי ההורים, לא ממה שהם אומרים."], correct_index: null },
      { id: "src2", icon: "users", text: "מוסדות וקבוצות", options: ["בית ספר, חברים, קהילה, רשתות חברתיות — בגיל ההתבגרות השפעת החברים עולה."], correct_index: null },
      { id: "src3", icon: "alert", text: "ניסיון אישי", options: ["משבר, אובדן, מפגש עם עוול. אירוע מכונן יכול לשנות סדר עדיפויות."], correct_index: null },
    ],
  },

  // ── שקף 11: מנוחמוח ────────────────────────────────────────────────────────
  {
    id: "s11",
    order: 11,
    type: "brain-break",
    eyebrow: "",
    title: "מנוחמוח",
    animation: { name: "giraffe", delay: 0, position: "big-center", loop: true },
  },

  // ── שקף 12: פעילות אישית — עץ הערכים שלי ──────────────────────────────────
  {
    id: "s12",
    order: 12,
    type: "study",
    eyebrow: "פעילות אישית · 8 דקות",
    title: "עץ הערכים שלי",
    image_url: null, // suggested: איור של עץ עם שורשים, גזע, ענפים ועלה יבש
    body: `**שורשים** — מאיפה קיבלתי את הערכים שלי? אנשים, מקומות, אירועים.

**גזע** — שניים־שלושה ערכים שהם הבסיס שלי.

**ענפים** — פעולה מוחשית אחת בחיי היומיום לכל ערך.

**עלה יבש** — ערך שקיבלתי ואני לא בטוח/ה שאני מסכים/ה איתו.

> למורה: 5 דקות עבודה אישית, ואז 3 דקות שיתוף בשלשות. אין חובה לשתף את העלה היבש. שאלת מליאה אפשרית: מי גילה שמקור מרכזי של הערכים שלו הוא לא המשפחה?`,
  },

  // ── שקף 13: הקניה — אותו ערך, תרבות אחרת (מקרה 1) ─────────────────────────
  {
    id: "s13",
    order: 13,
    type: "study",
    eyebrow: "ערכים בתרבויות · מקרה 1",
    title: "קשר עין",
    image_url: null, // suggested: שתי איורי פנים — מבט מושפל מול מבט ישיר בעיניים
    body: `**יפן ומזרח אסיה** — מבט ממושך בעיני מבוגר או בכיר עלול להיחשב לחוצפה. משפילים מעט את המבט כסימן כבוד.

**ארה״ב ומערב אירופה** — מבט ישיר בעיניים נתפס כסימן לכנות ולביטחון עצמי. מי שמשפיל מבט ״מסתיר משהו״.

אותו ערך (כבוד, כנות) בביטוי הפוך לגמרי. אותו ערך בביטוי שונה, או דירוג שונה בין ערכים?`,
  },

  // ── שקף 14: הקניה — אותו ערך, תרבות אחרת (מקרה 2) ─────────────────────────
  {
    id: "s14",
    order: 14,
    type: "study",
    eyebrow: "ערכים בתרבויות · מקרה 2",
    title: "כבוד למבוגרים",
    image_url: null, // suggested: תלמיד מתווכח עם מורה מול צעיר מרכין ראש מול אדם מבוגר
    body: `**ישראל** — ילד שמתווכח עם מורה נתפס לא פעם כ״ילד עם דעה״, ופונים למורים בשם הפרטי.

**יפן וקוריאה** — בשפה יש צורות דיבור מיוחדות לפנייה למבוגר או לבכיר, ומרכינים ראש בברכה.

גם בישראל מכבדים מבוגרים, אבל הכבוד מתבטא אחרת — והדירוג שונה: שוויון ופתיחות מול היררכיה ומסורת.`,
  },

  // ── שקף 15: הקניה — אותו ערך, תרבות אחרת (מקרה 3) ─────────────────────────
  {
    id: "s15",
    order: 15,
    type: "study",
    eyebrow: "ערכים בתרבויות · מקרה 3",
    title: "מי אני? דרך הקבוצה או דרך עצמי",
    image_url: null, // suggested: דמות עומדת על במה עם כוכב מעליה, מול מעגל דמויות מחוברות
    body: `**ארה״ב** — ״לממש את עצמך״, ״לרדוף אחרי החלום שלך״. הזהות נבנית סביב הבחירות וההישגים האישיים.

**דרום אפריקה, ״אובונטו״** — ״אדם הוא אדם דרך אנשים אחרים״. הזהות נבנית בתוך הקהילה ובאחריות כלפיה.

אובונטו הוא מושג שנעשה מוכר בעולם בזכות נלסון מנדלה. איפה החברה הישראלית על הציר הזה — בין ״כל ישראל ערבים זה לזה״ לבין תרבות סטארט-אפ והצלחה אישית? ואיפה אתם?`,
  },

  // ── שקף 16: דעתכם — דירוג או ביטוי ────────────────────────────────────────
  {
    id: "s16",
    order: 16,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "בשלושת המקרים שראינו — זה בעיקר...?",
    questions: [
      {
        id: "q3",
        text: "לדעתכם ההבדלים שראינו הם בעיקר:",
        options: ["דירוג שונה בין ערכים", "אותו ערך בביטוי שונה", "קצת משניהם", "קשה לדעת"],
        correct_index: null,
      },
    ],
  },

  // ── שקף 17: הקניה — נטייה, לא כלל ─────────────────────────────────────────
  {
    id: "s17",
    order: 17,
    type: "study",
    layout: "list",
    eyebrow: "לפני שמכלילים",
    title: "נטייה, לא כלל",
    questions: [
      { id: "n1", icon: "users", text: "נטייה כללית, לא כל אדם", options: ["כל מקרה מתאר נטייה כללית בתרבות, לא את כל האנשים בה."], correct_index: null },
      { id: "n2", icon: "globe", text: "שונות גם בפנים", options: ["בתוך כל תרבות יש שונות גדולה, וגם בתוך החברה הישראלית."], correct_index: null },
      { id: "n3", icon: "quote", text: "אף אחד לא נציג", options: ["אף אחד בכיתה לא ״נציג״ של תרבות. משתף רק מי שרוצה."], correct_index: null },
    ],
  },

  // ── שקף 18: מבדק סוף שיעור ────────────────────────────────────────────────
  {
    id: "s18",
    order: 18,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "מהם ערכים?",
    questions: [
      { id: "aq1", text: "מה מהבאים הוא מאפיין של ערך?", options: ["הוא משתנה כל יום", "הוא מכוון בחירות לאורך זמן", "הוא תמיד חוק", "הוא תמיד זהה לכולם"], correct_index: 1 },
      { id: "aq2", text: '"עומדים בתור" היא דוגמה ל...', options: ["ערך", "נורמה", "חוק", "אמונה"], correct_index: 1 },
      { id: "aq3", text: "לפי מודל שוורץ, 'עושר' ו'הצלחה' שייכים לקבוצת:", options: ["שימור", "פתיחות לשינוי", "קידום עצמי", "התעלות מעבר לעצמי"], correct_index: 2 },
      { id: "aq4", text: "איזה מהבאים הוא מקור לערכים, לפי מה שלמדנו?", options: ["רק בית הספר", "המשפחה, מוסדות וקבוצות, וניסיון אישי", "רק החוק", "רק הדת"], correct_index: 1 },
      { id: "aq5", text: "כששתי תרבויות מבטאות 'כבוד' בצורה הפוכה לגמרי, זו דוגמה ל...", options: ["דירוג שונה בין ערכים", "אותו ערך בביטוי שונה", "חוסר ערכים", "העדר כבוד"], correct_index: 1 },
    ],
  },

  // ── שקף 19: שיעורי בית ────────────────────────────────────────────────────
  {
    id: "s19",
    order: 19,
    type: "homework",
    eyebrow: "למחברת",
    title: "משפט אחד להמשך",
    questions: [
      {
        id: "hw1",
        text: "כתבו משפט אחד: איזה ערך שלכם הגיע בעיקר מהמשפחה, ואיזה ערך שלכם הגיע בעיקר מניסיון אישי שעברתם?",
        options: [],
        correct_index: null,
      },
    ],
  },

  // ── שקף 20: משוב ──────────────────────────────────────────────────────────
  {
    id: "s20",
    order: 20,
    type: "feedback",
    eyebrow: "משוב",
    title: "איך היה השיעור?",
    questions: [
      { id: "f1", text: "באיזו מידה השיעור היה מעניין מבחינתך?", options: [], correct_index: null },
      { id: "f2", text: "באיזו מידה הרגשת שלמדת משהו חדש על עצמך?", options: [], correct_index: null },
      { id: "f3", text: "באיזו מידה נהנית מהשיעור?", options: [], correct_index: null },
    ],
  },

  // ── שקף 21: העשרה ─────────────────────────────────────────────────────────
  {
    id: "s21",
    order: 21,
    type: "enrichment",
    eyebrow: "העשרה",
    title: "לסקרנים",
    questions: [
      {
        id: "e1",
        text: "מודל הערכים של שלום שוורץ",
        feedback: "מאמר",
        options: ["הסבר מורחב על עשרת ערכי היסוד ועל המחקר הבין-תרבותי שמאחוריהם."],
        correct_index: null,
      },
      {
        id: "e2",
        text: "מימד התרבות של גירט הופסטדה",
        feedback: "מאמר",
        options: ["הציר שבו תרבויות שונות נבדלות: אינדיבידואליזם מול קולקטיביזם, ועוד."],
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
