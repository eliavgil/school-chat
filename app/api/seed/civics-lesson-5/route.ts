import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"

export const LESSON_TITLE = "שיעור 5: המאפיינים היהודיים של מדינת ישראל"
export const SLUG = "civics-jewish-characteristics-5"

export const slides: Slide[] = [
  // ── שקף 1: נושא השיעור ────────────────────────────────────────────────────
  {
    id: "s1",
    order: 1,
    type: "lesson-topic",
    eyebrow: "שיעור 5 | אזרחות כיתה י",
    title: "המאפיינים היהודיים של מדינת ישראל",
    image_url: null, // suggested: קולאז' של דגל ישראל, מטבע עם מנורה, ולוח שנה עברי
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
      { id: "obj1", icon: "gavel", text: "נציג", options: ["חוקים מרכזיים המבטאים את אופייה היהודי של המדינה (חוק השבות, חוק שעות עבודה ומנוחה, חוק חג המצות ועוד)."], correct_index: null },
      { id: "obj2", icon: "language", text: "נתאר", options: ["את ביטויי הזהות היהודית במרחב הציבורי דרך סמלים, שפה ולוח השנה העברי."], correct_index: null },
      { id: "obj3", icon: "scale", text: "נסביר", options: ["את מהות הסדר הסטטוס-קוו וארבעת הנושאים הכלולים בו כפשרה בין דתיים לחילוניים."], correct_index: null },
      { id: "obj4", icon: "document", text: "ניישם", options: ['את מיומנות ה"ציין-הצג-הסבר" על שאלת בגרות בנושא חקיקה אתנית.'], correct_index: null },
    ],
  },

  // ── שקף 3: מדיה בלבד ──────────────────────────────────────────────────────
  {
    id: "s3",
    order: 3,
    type: "media-only",
    eyebrow: "",
    title: "",
    image_url: null, // suggested: תצלום רחוב ישראלי בערב שבת (חנויות סגורות, שלטים) לצד תמונת מליאת הכנסת
  },

  // ── שקף 4: מה דעתכם ───────────────────────────────────────────────────────
  {
    id: "s4",
    order: 4,
    type: "opinion",
    eyebrow: "מה דעתכם?",
    title: "מה נותן למדינה את הצביון היהודי הכי חזק?",
    questions: [
      {
        id: "q1",
        text: 'מה לדעתכם נותן למדינת ישראל את הצביון היהודי הכי חזק שלה?',
        options: [
          'החוקים שעוברים בכנסת (כמו חוק השבות)',
          'האווירה ברחוב (סמלים, שפה, חופש בחגים)',
          'שניהם באותה מידה',
          'משהו אחר לגמרי',
        ],
        correct_index: null,
      },
    ],
  },

  // ── שקף 5.1: הקניה — היבט משפטי (חקיקה) ───────────────────────────────────
  {
    id: "s5",
    order: 5,
    type: "study",
    eyebrow: "הקניה",
    title: "המדינה היהודית בהיבט המשפטי — חקיקה",
    body: "ישראל היא מדינת לאום יהודית, וזהותה זו מעוגנת בסדרת חוקים.",
    questions: [
      { id: "l1", icon: "identity", text: "חוק השבות", options: ['"עיקר העיקרים" של הציונות — מאפשר לכל יהודי (ובני משפחתו עד נכד) לעלות לישראל ולהתיישב בה.'], correct_index: null },
      { id: "l2", icon: "calendar", text: "חוק שעות עבודה ומנוחה", options: ["קובע את השבת ומועדי ישראל כימי המנוחה הרשמיים ליהודים."], correct_index: null },
      { id: "l3", icon: "food", text: "חוק חג המצות", options: ["אוסר הצגת חמץ בפומבי למכירה באזורים יהודיים במהלך הפסח."], correct_index: null },
      { id: "l4", icon: "family", text: "חוק בתי דין רבניים", options: ["קובע כי נישואין וגירושין של יהודים ייערכו לפי דין תורה."], correct_index: null },
    ],
  },

  // ── שקף 5.2: הקניה — יהדות במרחב הציבורי ──────────────────────────────────
  {
    id: "s6",
    order: 6,
    type: "study",
    layout: "list",
    eyebrow: "הקניה",
    title: "יהדות במרחב הציבורי — שפה ולוח שנה",
    questions: [
      { id: "p1", icon: "language", text: "מעמד השפה העברית", options: ["העברית אינה קבועה בחוק מפורש כשפה יחידה, אך החקיקה והפסיקה מעניקות לה עדיפות כביטוי לאופייה היהודי של המדינה."], correct_index: null },
      { id: "p2", icon: "calendar", text: "לוח השנה העברי", options: ["הלוח הרשמי של המדינה. החוק מחייב שימוש בתאריך עברי בכל מסמך רשמי, והחגים היהודיים הם ימי השבתון הממלכתיים."], correct_index: null },
    ],
  },

  // ── שקף 5.3: הקניה — סמלי המדינה ──────────────────────────────────────────
  {
    id: "s7",
    order: 7,
    type: "study",
    eyebrow: "הקניה",
    title: "סמלי המדינה כביטוי לזהות",
    questions: [
      { id: "s_1", icon: "flag", text: "הדגל", options: ["מורכב ממגן דוד (סמל מסורתי) וצבעי תכלת-לבן הלקוחים מצבעי הטלית."], correct_index: null },
      { id: "s_2", icon: "shield", text: "הסמל", options: ["המנורה שעמדה בבית המקדש בירושלים (עפ\"י נבואת זכריה) וענפי זית לסמל השלום."], correct_index: null },
      { id: "s_3", icon: "quote", text: 'ההמנון ("התקווה")', options: ["מבטא את געגועי העם היהודי לציון והשאיפה לחופש בארצו."], correct_index: null },
    ],
  },

  // ── שקף 5.4: הקניה — הסדר הסטטוס קוו ──────────────────────────────────────
  {
    id: "s8",
    order: 8,
    type: "study",
    eyebrow: "הקניה",
    title: "בין הציבורי לפרטי — הסדר הסטטוס קוו",
    body: "הסדר שנועד למנוע מחלוקות עמוקות ולאפשר חיים משותפים בין דתיים לחילוניים. הוא עוסק בארבעה תחומים:",
    questions: [
      { id: "st1", icon: "calendar", text: "שבת", options: ["הגדרת השבת כיום המנוחה במדינה (ליהודים)."], correct_index: null },
      { id: "st2", icon: "food", text: "כשרות", options: ["שמירת כשרות במוסדות מדינה ומטבחים ממלכתיים (כמו צה\"ל)."], correct_index: null },
      { id: "st3", icon: "family", text: "אישות", options: ["נישואין וגירושין של יהודים יתנהלו בהתאם להלכה (בתי דין רבניים)."], correct_index: null },
      { id: "st4", icon: "book", text: "חינוך", options: ["מתן אוטונומיה לזרם החינוך הדתי והחרדי."], correct_index: null },
    ],
  },

  // ── שקף 9: הגדרות (להעתקה למחברת) ─────────────────────────────────────────
  {
    id: "s9",
    order: 9,
    type: "definitions",
    eyebrow: "מושגים למבחן",
    title: "המאפיינים היהודיים — הגדרות (מחוון 2017)",
    questions: [
      { id: "def1", text: "חוק השבות", options: [""], feedback: "חוק המאפשר לכל יהודי, בן זוגו, ילדו ונכדו (ובני זוגם) לעלות לישראל, בתנאי שהיהודי לא המיר את דתו מרצון. החוק מבטא את תפיסת ישראל כמדינת הלאום של כל יהודי העולם.", correct_index: null },
      { id: "def2", text: "חוק שעות עבודה ומנוחה", options: [""], feedback: "חוק המגדיר את השבת ומועדי ישראל כימי המנוחה השבועיים ליהודים. ללא-יהודים נקבע יום המנוחה בשישי, שבת או ראשון לפי בחירתם.", correct_index: null },
      { id: "def3", text: "סמלי המדינה", options: [""], feedback: 'דגל המדינה (מגן דוד ופסי טלית), סמל המדינה (מנורת המקדש וענפי זית) וההמנון ("התקווה"). הסמלים מבטאים את זהותה היהודית של המדינה ואת ריבונותה.', correct_index: null },
      { id: "def4", text: "הסדר הסטטוס קוו", options: [""], feedback: "הסדר להכרעה במחלוקות דת ומדינה בישראל, העוסק בארבע סוגיות: הגדרת השבת כיום מנוחה, כשרות במוסדות מדינה, נישואין וגירושין לפי ההלכה, ואוטונומיה לחינוך הדתי.", correct_index: null },
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

  // ── שקף 11: תרגול — שאלת אירוע ─────────────────────────────────────────────
  {
    id: "s11",
    order: 11,
    type: "practice",
    eyebrow: 'בגרות חורף תשפ"ה',
    title: "העבודות בשבת ליד הגשר",
    questions: [
      {
        id: "pq1",
        tag: "שאלת אירוע",
        text: `בשנה האחרונה נעשות עבודות בנייה להקמת גשר לרכבת מעל כביש ראשי במרכז הארץ. חבר כנסת מן האופוזיציה פנה לשרת התחבורה בדרישה לעצור את העבודות המתקיימות ביום שבת. השרה נענתה לדרישה והורתה להפסיק את העבודות בשבת, בטענה שיש לכבד את יום המנוחה הרשמי של המדינה.

ציינו והציגו את החוק המבטא את אופייה היהודי של המדינה שמימשה שרת התחבורה בהחלטתה.
הסבירו כיצד חוק זה בא לידי ביטוי בקטע.`,
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
    title: "העבודות בשבת — תשובה מלאה",
    body: `### ציין
חוק שעות עבודה ומנוחה

---

### הצג
חוק המגדיר את שעות העבודה וימי המנוחה במשק, וקובע ליהודים את יום השבת כיום השבתון השבועי. החוק מבטא את אופייה היהודי של המדינה דרך קדושת השבת.

---

### הסבר
בקטע מצוין כי השרה הורתה "להפסיק את העבודות בשבת" כדי "לכבד את יום המנוחה הרשמי של המדינה". החלטה זו תואמת את הוראות חוק שעות עבודה ומנוחה, הקובע את השבת כיום מנוחה רשמי האוסר על פעילות לא חיונית.`,
  },

  // ── שקף 13: מבדק סוף שיעור ───────────────────────────────────────────────
  {
    id: "s13",
    order: 13,
    type: "assessment",
    eyebrow: "מבדק סוף שיעור",
    title: "המאפיינים היהודיים של מדינת ישראל",
    questions: [
      {
        id: "aq1",
        text: "מהו המקור לצבעי התכלת-לבן בדגל המדינה?",
        options: ['דגל האו"ם', "השמיים והים", "צבעי הטלית היהודית", "בגדי המלכים"],
        correct_index: 2,
      },
      {
        id: "aq2",
        text: 'על פי חוק השבות, מי מבין הבאים אינו זכאי לעלות לארץ מכוחו?',
        options: ["נכד של יהודי", "בת זוג של יהודי", "אדם שנולד לאם יהודייה", "יהודי שהמיר את דתו מרצונו"],
        correct_index: 3,
      },
      {
        id: "aq3",
        text: "איזה מהנושאים הבאים אינו כלול בהסדר הסטטוס-קוו?",
        options: ["כשרות במוסדות מדינה", "נישואין וגירושין", 'חובת שירות בצה"ל', "אוטונומיה לחינוך דתי"],
        correct_index: 2,
      },
      {
        id: "aq4",
        text: 'חוק יסודות המשפט קובע כי אם יש "לאקונה" (חסר בחוק), השופט יפסוק לפי:',
        options: ["חוקי המנדט", "דעת הקהל", "עקרונות המורשת היהודית", "החלטת הממשלה"],
        correct_index: 2,
      },
      {
        id: "aq5",
        text: "מהו המעמד הרשמי של השפה הערבית בישראל כיום?",
        options: ["שפה רשמית שווה לעברית", "מעמד מיוחד", "שפת מיעוט ללא הכרה", "שפה אסורה לשימוש בציבור"],
        correct_index: 1,
      },
    ],
  },

  // ── שקף 14: שיעורי בית ────────────────────────────────────────────────────
  {
    id: "s14",
    order: 14,
    type: "homework",
    eyebrow: 'משימת "היהדות שמעבר לחוק"',
    title: "מאפיין יהודי בסביבה הקרובה",
    questions: [
      {
        id: "hw1",
        text: "מצאו בביתכם או בסביבתכם הקרובה חפץ או מסמך שבו מופיע לפחות מאפיין יהודי אחד של המדינה (למשל: תאריך עברי על תעודה, סמל המנורה על מטבע, או מודעה על סגירת עסקים בשבת). צלמו או תארו אותו.",
        options: [],
        correct_index: null,
      },
      {
        id: "hw2",
        text: "הסבירו: האם לדעתכם המאפיין הזה תורם לתחושת השייכות של כלל האזרחים או שהוא מייצר מחלוקת?",
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
      { id: "f1", text: "עד כמה אתה מבין כעת את הקשר בין השבת בהלכה לחוק שעות עבודה ומנוחה?", options: [], correct_index: null },
      { id: "f2", text: "עד כמה נושא הסדר הסטטוס-קוו נראה לך כפתרון הוגן למתח בין דתיים לחילוניים?", options: [], correct_index: null },
      { id: "f3", text: "עד כמה המצגת והתרגול הכינו אותך למענה על שאלות בגרות בנושא זה?", options: [], correct_index: null },
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
        text: '"הסיפור מאחורי סמל המדינה"',
        feedback: "סרטון",
        options: ['סריקת קוד QR בעמוד 43 בחוברת "אזרחות בכיף".'],
        correct_index: null,
      },
      {
        id: "e2",
        text: '"סעיף הנכד" בחוק השבות — למה הוא מעורר סערה?',
        feedback: "דיון",
        options: ["מאמר על המחלוקת סביב חוק השבות."],
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
    .select("id, title")
    .eq("slug", SLUG)
    .maybeSingle()

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 })

  if (existing) {
    const { error: updateError } = await sb
      .from("lessons")
      .update({ title: LESSON_TITLE, slides })
      .eq("id", existing.id)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    return NextResponse.json({ message: "Lesson updated", id: existing.id, title: LESSON_TITLE, slideCount: slides.length })
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
