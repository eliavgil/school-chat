import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// Question-bank editing is eliavgil-only while this game is being trialed —
// same gate used for the glossary and the climbing game's question bank.
function isOwner(session: any) {
  return session?.user?.email === "eliavgil@gmail.com"
}

const STARTER_QUESTIONS: { category: string; text: string; optionA: string; optionB: string; optionC: string; optionD: string; correctIndex: number }[] = [
  // ── גיאוגרפיה ──
  { category: "geography", text: "מה בירת צרפת?", optionA: "לונדון", optionB: "פריז", optionC: "רומא", optionD: "ברלין", correctIndex: 1 },
  { category: "geography", text: "מהי היבשת הגדולה בעולם?", optionA: "אפריקה", optionB: "אסיה", optionC: "אירופה", optionD: "אמריקה", correctIndex: 1 },
  { category: "geography", text: "מהו האוקיינוס הגדול בעולם?", optionA: "האטלנטי", optionB: "השקט", optionC: "ההודי", optionD: "הארקטי", correctIndex: 1 },
  { category: "geography", text: "איזו מדינה הכי גדולה בעולם בשטחה?", optionA: "סין", optionB: "קנדה", optionC: "רוסיה", optionD: "ברזיל", correctIndex: 2 },
  { category: "geography", text: "מהו הנהר הנחשב לארוך בעולם?", optionA: "האמזונס", optionB: "הנילוס", optionC: "המיסיסיפי", optionD: "הירדן", correctIndex: 1 },
  { category: "geography", text: "מה בירת יפן?", optionA: "טוקיו", optionB: "קיוטו", optionC: "אוסקה", optionD: "יוקוהמה", correctIndex: 0 },
  { category: "geography", text: "הפירמידות הגדולות נמצאות ב...", optionA: "מצרים", optionB: "מקסיקו", optionC: "סודן", optionD: "פרו", correctIndex: 0 },
  { category: "geography", text: "איזו מדינה נקראת \"ארץ השמש העולה\"?", optionA: "סין", optionB: "יפן", optionC: "קוריאה", optionD: "תאילנד", correctIndex: 1 },
  { category: "geography", text: "מאיזה כיוון גובל הים התיכון בישראל?", optionA: "מערב", optionB: "מזרח", optionC: "צפון", optionD: "דרום", correctIndex: 0 },
  { category: "geography", text: "מהו ההר הגבוה בעולם?", optionA: "קילימנג'רו", optionB: "האוורסט", optionC: "מקינלי", optionD: "פוג'י", correctIndex: 1 },
  { category: "geography", text: "מהו המדבר החם הגדול בעולם?", optionA: "הסהרה", optionB: "גובי", optionC: "הנגב", optionD: "קלהרי", correctIndex: 0 },
  { category: "geography", text: "איזו מדינה הכי מאוכלסת בעולם כיום?", optionA: "הודו", optionB: "סין", optionC: "ארצות הברית", optionD: "אינדונזיה", correctIndex: 0 },
  { category: "geography", text: "מהי היבשת הקרה ביותר?", optionA: "אנטארקטיקה", optionB: "אסיה", optionC: "אירופה", optionD: "צפון אמריקה", correctIndex: 0 },
  { category: "geography", text: "מה בירת איטליה?", optionA: "מילאנו", optionB: "רומא", optionC: "ונציה", optionD: "נאפולי", correctIndex: 1 },
  { category: "geography", text: "איזו מדינת איים מורכבת מאלפי איים ונמצאת בדרום מזרח אסיה?", optionA: "יפן", optionB: "הפיליפינים", optionC: "אינדונזיה", optionD: "ניו זילנד", correctIndex: 2 },
  // ── היסטוריה ──
  { category: "history", text: "באיזו שנה הוקמה מדינת ישראל?", optionA: "1947", optionB: "1948", optionC: "1949", optionD: "1950", correctIndex: 1 },
  { category: "history", text: "מי היה נשיאה הראשון של מדינת ישראל?", optionA: "דוד בן גוריון", optionB: "חיים ויצמן", optionC: "יצחק בן צבי", optionD: "זלמן שז\"ר", correctIndex: 1 },
  { category: "history", text: "באיזו שנה הסתיימה מלחמת העולם השנייה?", optionA: "1943", optionB: "1944", optionC: "1945", optionD: "1946", correctIndex: 2 },
  { category: "history", text: "מי גילה את אמריקה לפי המקובל?", optionA: "קולומבוס", optionB: "מגלן", optionC: "וסקו דה גאמה", optionD: "קוק", correctIndex: 0 },
  { category: "history", text: "מי היה ראש הממשלה הראשון של ישראל?", optionA: "גולדה מאיר", optionB: "דוד בן גוריון", optionC: "לוי אשכול", optionD: "משה שרת", correctIndex: 1 },
  { category: "history", text: "החומה הגדולה (סין) נבנתה ב...", optionA: "יפן", optionB: "סין", optionC: "קוריאה", optionD: "מונגוליה", correctIndex: 1 },
  { category: "history", text: "מי הכריז על הקמת מדינת ישראל ב-14 במאי 1948?", optionA: "דוד בן גוריון", optionB: "חיים ויצמן", optionC: "יצחק בן צבי", optionD: "משה שרת", correctIndex: 0 },
  { category: "history", text: "באיזו שנה התרחשה מלחמת ששת הימים?", optionA: "1967", optionB: "1973", optionC: "1956", optionD: "1982", correctIndex: 0 },
  { category: "history", text: "באיזו שנה התרחשה מלחמת יום הכיפורים?", optionA: "1967", optionB: "1973", optionC: "1956", optionD: "1982", correctIndex: 1 },
  { category: "history", text: "מי היה הקיסר הצרפתי שניסה לכבוש את רוסיה?", optionA: "נפוליאון", optionB: "לואי ה-14", optionC: "שארל דה גול", optionD: "רובספייר", correctIndex: 0 },
  { category: "history", text: "באיזו יבשת שכנה האימפריה הרומית?", optionA: "אירופה", optionB: "אסיה", optionC: "אפריקה", optionD: "אמריקה", correctIndex: 0 },
  { category: "history", text: "השואה התרחשה בתקופת...", optionA: "מלחמת העולם הראשונה", optionB: "מלחמת העולם השנייה", optionC: "מלחמת וייטנאם", optionD: "המלחמה הקרה", correctIndex: 1 },
  { category: "history", text: "מי היה הנשיא האמריקאי הראשון?", optionA: "אברהם לינקולן", optionB: "ג'ורג' וושינגטון", optionC: "תומאס ג'פרסון", optionD: "בנג'מין פרנקלין", correctIndex: 1 },
  { category: "history", text: "באיזו שנה נפלה חומת ברלין?", optionA: "1985", optionB: "1987", optionC: "1989", optionD: "1991", correctIndex: 2 },
  { category: "history", text: "מי נחשב לקיסר הרומי הראשון?", optionA: "יוליוס קיסר", optionB: "אוגוסטוס", optionC: "נירון", optionD: "קליגולה", correctIndex: 1 },
  // ── מדע ──
  { category: "science", text: "מה הנוסחה הכימית של מים?", optionA: "CO2", optionB: "H2O", optionC: "O2", optionD: "NaCl", correctIndex: 1 },
  { category: "science", text: "כמה עצמות יש בגוף אדם בוגר?", optionA: "206", optionB: "300", optionC: "150", optionD: "250", correctIndex: 0 },
  { category: "science", text: "מה מהירות האור בריק (בערך)?", optionA: "300 קמ\"ש", optionB: "300,000 קמ\"ש", optionC: "300,000 ק\"מ בשנייה", optionD: "30,000 ק\"מ בשנייה", correctIndex: 2 },
  { category: "science", text: "איזה גז הצמחים פולטים בתהליך הפוטוסינתזה?", optionA: "פחמן דו חמצני", optionB: "חמצן", optionC: "חנקן", optionD: "מימן", correctIndex: 1 },
  { category: "science", text: "מי ניסח את תורת היחסות?", optionA: "איינשטיין", optionB: "ניוטון", optionC: "גלילאו", optionD: "דרווין", correctIndex: 0 },
  { category: "science", text: "מהו האיבר הגדול ביותר בגוף האדם?", optionA: "הלב", optionB: "העור", optionC: "הכבד", optionD: "המוח", correctIndex: 1 },
  { category: "science", text: "כמה כרומוזומים יש לאדם?", optionA: "46", optionB: "23", optionC: "44", optionD: "48", correctIndex: 0 },
  { category: "science", text: "מהו הגז הנפוץ ביותר באטמוספירה של כדור הארץ?", optionA: "חמצן", optionB: "חנקן", optionC: "פחמן דו חמצני", optionD: "ארגון", correctIndex: 1 },
  { category: "science", text: "מי מזוהה עם גילוי כוח הכבידה (סיפור התפוח)?", optionA: "איינשטיין", optionB: "ניוטון", optionC: "גלילאו", optionD: "קפלר", correctIndex: 1 },
  { category: "science", text: "מה שם החלקיק הבסיסי בעל מטען שלילי באטום?", optionA: "פרוטון", optionB: "נויטרון", optionC: "אלקטרון", optionD: "פוטון", correctIndex: 2 },
  { category: "science", text: "כמה כוכבי לכת יש במערכת השמש?", optionA: "7", optionB: "8", optionC: "9", optionD: "10", correctIndex: 1 },
  { category: "science", text: "באיזו טמפרטורה (צלזיוס) מים קופאים?", optionA: "0", optionB: "32", optionC: "100", optionD: "-10", correctIndex: 0 },
  { category: "science", text: "היכן נמצא ה-DNA בתא?", optionA: "הגרעין", optionB: "המיטוכונדריה", optionC: "הממברנה", optionD: "הריבוזום", correctIndex: 0 },
  { category: "science", text: "מהו הכוח ששומר אותנו על כדור הארץ?", optionA: "כבידה", optionB: "חשמל", optionC: "מגנטיות", optionD: "לחץ", correctIndex: 0 },
  { category: "science", text: "מהו היסוד הכימי הנפוץ ביותר ביקום?", optionA: "חמצן", optionB: "מימן", optionC: "פחמן", optionD: "הליום", correctIndex: 1 },
  // ── תרבות וספרות ──
  { category: "culture", text: "מי כתב את \"רומיאו ויוליה\"?", optionA: "שייקספיר", optionB: "דיקנס", optionC: "טולסטוי", optionD: "מארק טוויין", correctIndex: 0 },
  { category: "culture", text: "מי חיבר את \"אלף לילה ולילה\"?", optionA: "אין מחבר יחיד — אוסף סיפורי עם", optionB: "הומרוס", optionC: "שייקספיר", optionD: "קפקא", correctIndex: 0 },
  { category: "culture", text: "מי כתבה את \"יומה של נערה\"?", optionA: "אנה פרנק עצמה", optionB: "אמה", optionC: "אביה", optionD: "היסטוריון מאוחר יותר", correctIndex: 0 },
  { category: "culture", text: "מי צייר את \"המונה ליזה\"?", optionA: "ואן גוך", optionB: "פיקאסו", optionC: "לאונרדו דה וינצ'י", optionD: "מיכאלאנג'לו", correctIndex: 2 },
  { category: "culture", text: "מי כתב/ה את סדרת \"הארי פוטר\"?", optionA: "ג'יי קיי רולינג", optionB: "סטיבן קינג", optionC: "ג'ורג' מרטין", optionD: "רואלד דאל", correctIndex: 0 },
  { category: "culture", text: "מי כתב את \"החטא ועונשו\"?", optionA: "דוסטויבסקי", optionB: "טולסטוי", optionC: "צ'כוב", optionD: "פושקין", correctIndex: 0 },
  { category: "culture", text: "באיזו שפה נכתב התנ\"ך ברובו?", optionA: "יוונית", optionB: "עברית", optionC: "ארמית", optionD: "לטינית", correctIndex: 1 },
  { category: "culture", text: "מי הלחין את מה שמוכר כ\"הימנון אירופה\"?", optionA: "בטהובן", optionB: "באך", optionC: "מוצרט", optionD: "ברהמס", correctIndex: 0 },
  { category: "culture", text: "מי הישראלי הראשון שזכה בפרס נובל לספרות?", optionA: "ש\"י עגנון", optionB: "עמוס עוז", optionC: "דוד גרוסמן", optionD: "יהודה עמיחי", correctIndex: 0 },
  { category: "culture", text: "איך נקראת אמנות כתיבת השירה?", optionA: "פרוזה", optionB: "שירה", optionC: "דרמה", optionD: "רטוריקה", correctIndex: 1 },
  // ── ספורט ──
  { category: "sports", text: "כל כמה שנים מתקיימת האולימפיאדה (קיץ)?", optionA: "2", optionB: "3", optionC: "4", optionD: "5", correctIndex: 2 },
  { category: "sports", text: "כמה שחקני שדה (לא כולל שוער) יש לקבוצת כדורגל על המגרש?", optionA: "9", optionB: "10", optionC: "11", optionD: "12", correctIndex: 1 },
  { category: "sports", text: "באיזה ענף ספורט מככב ליאו מסי?", optionA: "כדורסל", optionB: "כדורגל", optionC: "טניס", optionD: "שחייה", correctIndex: 1 },
  { category: "sports", text: "כמה נקודות שווה סל שלוש בכדורסל?", optionA: "1", optionB: "2", optionC: "3", optionD: "4", correctIndex: 2 },
  { category: "sports", text: "מהי מדינת המקור של הסומו?", optionA: "סין", optionB: "יפן", optionC: "קוריאה", optionD: "תאילנד", correctIndex: 1 },
  { category: "sports", text: "באיזה ספורט מתמודדים בטורנירי \"גרנד סלאם\"?", optionA: "גולף", optionB: "טניס", optionC: "כדורגל", optionD: "שחייה", correctIndex: 1 },
  { category: "sports", text: "איזו מדינה זכתה בהכי הרבה מונדיאלים בכדורגל (עד 2022)?", optionA: "גרמניה", optionB: "ברזיל", optionC: "ארגנטינה", optionD: "איטליה", correctIndex: 1 },
  { category: "sports", text: "מהו אורכו של מרתון?", optionA: "21 ק\"מ", optionB: "30 ק\"מ", optionC: "42.2 ק\"מ", optionD: "50 ק\"מ", correctIndex: 2 },
  { category: "sports", text: "באיזה ספורט התפרסם מייקל ג'ורדן?", optionA: "כדורסל", optionB: "פוטבול אמריקאי", optionC: "בייסבול", optionD: "הוקי", correctIndex: 0 },
  { category: "sports", text: "כמה שחקנים יש בקבוצת כדורעף על המגרש?", optionA: "5", optionB: "6", optionC: "7", optionD: "8", correctIndex: 1 },
  // ── ישראל ──
  { category: "israel", text: "מהי העיר עם הכי הרבה תושבים בישראל?", optionA: "תל אביב", optionB: "ירושלים", optionC: "חיפה", optionD: "באר שבע", correctIndex: 1 },
  { category: "israel", text: "מה שם הנהר הארוך בישראל?", optionA: "הירדן", optionB: "הירקון", optionC: "הקישון", optionD: "הבשור", correctIndex: 0 },
  { category: "israel", text: "באיזו עיר יושבת הכנסת?", optionA: "תל אביב", optionB: "ירושלים", optionC: "חיפה", optionD: "אשדוד", correctIndex: 1 },
  { category: "israel", text: "מהי אגם המים המתוקים הגדול בישראל?", optionA: "ים המלח", optionB: "הכנרת", optionC: "ים סוף", optionD: "מפרץ חיפה", correctIndex: 1 },
  { category: "israel", text: "באיזו שנה החלה הטלוויזיה הישראלית לשדר?", optionA: "1968", optionB: "1972", optionC: "1980", optionD: "1990", correctIndex: 0 },
  { category: "israel", text: "מה שם ההר הגבוה בישראל?", optionA: "הר הרמון", optionB: "הר כרמל", optionC: "הר תבור", optionD: "הר מירון", correctIndex: 0 },
  { category: "israel", text: "איזו מילה עברית משמשת גם לברכת שלום וגם לפרידה?", optionA: "שלום", optionB: "טוב", optionC: "ברוך", optionD: "הבא", correctIndex: 0 },
  { category: "israel", text: "מהם צבעי דגל ישראל?", optionA: "כחול ולבן", optionB: "אדום ולבן", optionC: "ירוק ולבן", optionD: "שחור ולבן", correctIndex: 0 },
  { category: "israel", text: "באיזה תאריך עברי חוגגים את יום העצמאות?", optionA: "ה' באייר", optionB: "ז' בתשרי", optionC: "י' בניסן", optionD: "כ' בסיוון", correctIndex: 0 },
  { category: "israel", text: "מהי שפת הרוב בישראל?", optionA: "עברית", optionB: "ערבית", optionC: "אנגלית", optionD: "רוסית", correctIndex: 0 },
  // ── טכנולוגיה ──
  { category: "tech", text: "מי הקים את חברת אפל?", optionA: "סטיב ג'ובס", optionB: "ביל גייטס", optionC: "מארק צוקרברג", optionD: "אילון מאסק", correctIndex: 0 },
  { category: "tech", text: "מי הקים את פייסבוק?", optionA: "סטיב ג'ובס", optionB: "מארק צוקרברג", optionC: "ביל גייטס", optionD: "ג'ף בזוס", correctIndex: 1 },
  { category: "tech", text: "מה פירוש הקיצור \"WWW\"?", optionA: "World Wide Web", optionB: "World Web Wide", optionC: "Wide World Web", optionD: "Web Wide World", correctIndex: 0 },
  { category: "tech", text: "מה שם יחידת המידע הבסיסית במחשב (0 או 1)?", optionA: "בית (Byte)", optionB: "ביט (Bit)", optionC: "פיקסל", optionD: "קוד", correctIndex: 1 },
  { category: "tech", text: "מי הקים את חברת מיקרוסופט?", optionA: "סטיב ג'ובס", optionB: "ביל גייטס", optionC: "לארי פייג'", optionD: "ג'ף בזוס", correctIndex: 1 },
  { category: "tech", text: "מהו מנוע החיפוש הפופולרי ביותר בעולם?", optionA: "בינג", optionB: "גוגל", optionC: "יאהו", optionD: "דאק דאק גו", correctIndex: 1 },
  { category: "tech", text: "מי הקים את חברת אמזון?", optionA: "ג'ף בזוס", optionB: "אילון מאסק", optionC: "ביל גייטס", optionD: "טים קוק", correctIndex: 0 },
  { category: "tech", text: "איזו חברת רכב חשמלי מנהל אילון מאסק?", optionA: "פורד", optionB: "טסלה", optionC: "טויוטה", optionD: "BMW", correctIndex: 1 },
  { category: "tech", text: "מהי מערכת ההפעלה הידועה בקוד הפתוח שלה?", optionA: "לינוקס", optionB: "חלונות (Windows)", optionC: "DOS", optionD: "אנדרואיד", correctIndex: 0 },
  { category: "tech", text: "איזו חברה פיתחה את מערכת ההפעלה אנדרואיד?", optionA: "אפל", optionB: "גוגל", optionC: "סמסונג", optionD: "מיקרוסופט", correctIndex: 1 },
  // ── כללי ──
  { category: "general", text: "כמה דקות יש בשעה?", optionA: "50", optionB: "60", optionC: "100", optionD: "24", correctIndex: 1 },
  { category: "general", text: "כמה חודשים יש בשנה?", optionA: "10", optionB: "11", optionC: "12", optionD: "13", correctIndex: 2 },
  { category: "general", text: "איזה צבע מתקבל מערבוב כחול וצהוב?", optionA: "ירוק", optionB: "סגול", optionC: "כתום", optionD: "אדום", correctIndex: 0 },
  { category: "general", text: "באיזו יחידה נהוג למדוד טמפרטורה בישראל?", optionA: "צלזיוס", optionB: "פרנהייט", optionC: "קלווין", optionD: "ואט", correctIndex: 0 },
  { category: "general", text: "מהי החיה הגדולה בעולם?", optionA: "פיל", optionB: "לווייתן כחול", optionC: "ג'ירפה", optionD: "כריש לבן", correctIndex: 1 },
  { category: "general", text: "מהי החיה המהירה ביותר ביבשה?", optionA: "ברדלס", optionB: "סוס", optionC: "אריה", optionD: "נמר", correctIndex: 0 },
  { category: "general", text: "כמה צבעים יש בקשת בענן?", optionA: "5", optionB: "6", optionC: "7", optionD: "8", correctIndex: 2 },
  { category: "general", text: "מהו המספר הראשוני הראשון?", optionA: "0", optionB: "1", optionC: "2", optionD: "3", correctIndex: 2 },
  { category: "general", text: "מהי המטבע הרשמי של ישראל?", optionA: "שקל חדש", optionB: "דולר", optionC: "יורו", optionD: "דינר", correctIndex: 0 },
  { category: "general", text: "באיזו יבשת חי הקנגורו באופן טבעי?", optionA: "אפריקה", optionB: "אוסטרליה", optionC: "אסיה", optionD: "דרום אמריקה", correctIndex: 1 },
  { category: "general", text: "מהי השפה המדוברת ביותר בעולם כשפת אם?", optionA: "אנגלית", optionB: "סינית מנדרינית", optionC: "ספרדית", optionD: "הינדי", correctIndex: 1 },
  { category: "general", text: "מהי בירת ארצות הברית?", optionA: "ניו יורק", optionB: "וושינגטון די סי", optionC: "לוס אנג'לס", optionD: "שיקגו", correctIndex: 1 },
  { category: "general", text: "אילו איברים משמשים לנשימה בגוף האדם?", optionA: "הלב", optionB: "הריאות", optionC: "הכבד", optionD: "הכליות", correctIndex: 1 },
  { category: "general", text: "כמה אותיות יש באלפבית העברי?", optionA: "20", optionB: "22", optionC: "24", optionD: "26", correctIndex: 1 },
  { category: "general", text: "מהו המרכיב התזונתי שאמור להיות הבסיס של התפריט היומי?", optionA: "חלבונים", optionB: "פחמימות", optionC: "שומנים", optionD: "ויטמינים", correctIndex: 1 },
]

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = req.nextUrl.searchParams.get("admin") === "1"
  if (admin && !isOwner(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Insert any starter question whose exact text isn't in the bank yet —
  // not just on first run — so growing STARTER_QUESTIONS later backfills
  // into an already-seeded production DB without duplicating rows.
  const existing = await prisma.triviaQuestion.findMany({ select: { text: true } })
  const existingTexts = new Set(existing.map(q => q.text))
  const missing = STARTER_QUESTIONS.filter(q => !existingTexts.has(q.text))
  if (missing.length > 0) {
    await prisma.triviaQuestion.createMany({ data: missing })
  }

  const questions = await prisma.triviaQuestion.findMany({
    where: admin ? {} : { active: true },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json({ questions })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isOwner(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { category, text, optionA, optionB, optionC, optionD, correctIndex } = await req.json()
  if (!text?.trim() || !optionA?.trim() || !optionB?.trim() || !optionC?.trim() || !optionD?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }
  const question = await prisma.triviaQuestion.create({
    data: {
      category: category?.trim() || "general",
      text: text.trim(), optionA: optionA.trim(), optionB: optionB.trim(), optionC: optionC.trim(), optionD: optionD.trim(),
      correctIndex: Number(correctIndex) || 0,
    },
  })
  return NextResponse.json({ question })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isOwner(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, category, text, optionA, optionB, optionC, optionD, correctIndex, active } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const question = await prisma.triviaQuestion.update({
    where: { id },
    data: {
      ...(category !== undefined && { category: category.trim() || "general" }),
      ...(text !== undefined && { text: text.trim() }),
      ...(optionA !== undefined && { optionA: optionA.trim() }),
      ...(optionB !== undefined && { optionB: optionB.trim() }),
      ...(optionC !== undefined && { optionC: optionC.trim() }),
      ...(optionD !== undefined && { optionD: optionD.trim() }),
      ...(correctIndex !== undefined && { correctIndex: Number(correctIndex) }),
      ...(active !== undefined && { active: !!active }),
    },
  })
  return NextResponse.json({ question })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isOwner(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.triviaQuestion.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
