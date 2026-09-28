"use client"

import Link from "next/link"

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/15 text-white text-sm font-bold flex items-center justify-center">{n}</span>
      <p className="text-white/85 text-sm leading-relaxed pt-0.5">{children}</p>
    </div>
  )
}

export default function InstallAppPage() {
  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/manage" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <div>
          <h1 className="font-semibold text-lg text-white">התקנת האתר כאפליקציה</h1>
          <p className="text-white/40 text-xs">כדי שהאייקון יופיע במסך הבית, בלי דפדפן</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <div className="bg-white/8 border border-white/15 rounded-2xl p-4">
          <p className="text-white/80 text-sm leading-relaxed">
            אפשר להוסיף את האתר הזה למסך הבית של הטלפון, בדיוק כמו אפליקציה רגילה — עם אייקון משלו, בלי סרגל כתובת של דפדפן, וטעינה מהירה יותר. זה לוקח פחות מדקה, וצריך לעשות את זה <strong>פעם אחת בלבד</strong>.
          </p>
        </div>

        {/* ── iPhone ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            <h2 className="text-white text-lg font-semibold">באייפון (iPhone)</h2>
          </div>
          <div className="bg-amber-900/25 border border-amber-500/25 rounded-xl px-4 py-3 text-amber-200 text-xs leading-relaxed">
            <strong>חשוב:</strong> זה עובד רק בדפדפן <strong>Safari</strong> (האייקון של המצפן הכחול) — לא בכרום ולא באפליקציית פייסבוק/אינסטגרם. אם האתר נפתח מתוך אפליקציה אחרת, קודם צריך ללחוץ על שלוש הנקודות ולבחור "פתח בספארי".
          </div>
          <div className="space-y-2">
            <Step n={1}>פתחו את האתר בדפדפן <strong>Safari</strong>.</Step>
            <Step n={2}>למטה במסך (באייפונים ישנים — למעלה) יש שורת כפתורים. לחצו על כפתור ה<strong>שיתוף</strong> — ריבוע עם חץ שמצביע למעלה 	⬆️.</Step>
            <Step n={3}>ייפתח תפריט עם הרבה אפשרויות. גללו למטה עד שרואים <strong>"הוסף למסך הבית"</strong> (Add to Home Screen) — לרוב עם אייקון של פלוס בתוך ריבוע.</Step>
            <Step n={4}>לחצו על "הוסף למסך הבית". אפשר לשנות את השם שיופיע מתחת לאייקון, או להשאיר כמו שזה.</Step>
            <Step n={5}>לחצו על <strong>"הוסף"</strong> בפינה הימנית העליונה.</Step>
            <Step n={6}>סיימתם! סגרו את ספארי וחפשו במסך הבית — יופיע אייקון חדש. לחיצה עליו פותחת את האתר כמו אפליקציה, במסך מלא.</Step>
          </div>
        </section>

        {/* ── Android ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h2 className="text-white text-lg font-semibold">באנדרואיד (Android)</h2>
          </div>
          <div className="bg-amber-900/25 border border-amber-500/25 rounded-xl px-4 py-3 text-amber-200 text-xs leading-relaxed">
            <strong>חשוב:</strong> זה עובד בדפדפן <strong>Chrome</strong> (האייקון הצבעוני העגול). ברוב מכשירי האנדרואיד כרום כבר מותקן כברירת מחדל.
          </div>
          <div className="space-y-2">
            <Step n={1}>פתחו את האתר בדפדפן <strong>Chrome</strong>.</Step>
            <Step n={2}>למעלה בפינה הימנית לחצו על <strong>שלוש הנקודות</strong> (⋮) — תפריט הדפדפן.</Step>
            <Step n={3}>חפשו בתפריט <strong>"התקן אפליקציה"</strong> (Install app) או <strong>"הוסף למסך הבית"</strong> (Add to Home screen) — לפעמים כרום גם מציע את זה אוטומטית בבאנר קטן למטה, בלי צורך לפתוח תפריט.</Step>
            <Step n={4}>לחצו על <strong>"התקן"</strong> (או "הוסף") באישור שמופיע.</Step>
            <Step n={5}>סיימתם! יופיע אייקון חדש במסך הבית (ולפעמים גם במגירת האפליקציות). לחיצה עליו פותחת את האתר כמו אפליקציה, במסך מלא.</Step>
          </div>
        </section>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-white/40 text-xs">
            לא הצליח? אפשר להמשיך להשתמש באתר רגיל דרך הדפדפן — שום דבר לא ישתנה, זה רק דרך נוחה יותר להיכנס.
          </p>
        </div>
      </div>
    </div>
  )
}
