"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

interface Section {
  title: string
  emoji: string
  items: { label: string; desc?: string }[]
}

const COMMANDS: Section[] = [
  {
    title: "יצירת אירועים בלוח",
    emoji: "📅",
    items: [
      { label: "תוסיף אירוע מחר", desc: "ואחריו את שם האירוע" },
      { label: "תרשום מבחן ב-15 ליולי" },
      { label: "תוסיף טיול כיתתי ב-20 לחודש" },
      { label: "תרשום ישיבת הורים ב-3 לאוגוסט" },
    ],
  },
  {
    title: "יצירת משימות אישיות",
    emoji: "✅",
    items: [
      { label: "תוסיף משימה להחזיר עבודות" },
      { label: "תזכיר לי לתאם עם יועץ" },
      { label: "תוסיף משימה — לדון עם דנה על התנהגות" },
      { label: "תרשום לעדכן הורים של רון" },
    ],
  },
  {
    title: "ניווט מהיר",
    emoji: "🗺️",
    items: [
      { label: "עבור למערכת שעות" },
      { label: "פתח לוח שנה" },
      { label: "תעבור למשימות" },
      { label: "חזור לדף הבית" },
    ],
  },
]

const TIPS = [
  "דבר בבירור ובמהירות טבעית — אין צורך לאט מידי",
  "ציין תאריך מדויק כשאפשר (\"ב-15 ליולי\" עדיף על \"בחודש הבא\")",
  "כל מורה משתמש בשפה שלו — הבוט מבין וריאציות",
  "אחרי ההקלטה תראה מה הבוט הבין, ותוכל לתקן בטקסט",
  "אפשר להמשיך שיחה בתוך הכרטיס — לשאול שאלות ולהוסיף פרטים",
]

const LIMITATIONS = [
  "לא יכול לערוך או למחוק אירועים ומשימות קיימות",
  "לא יכול לגשת לנתוני תלמידים, ציונים או נוכחות",
  "לא יכול לשלוח הודעות להורים או תלמידים",
  "דורש חיבור אינטרנט פעיל",
  "זיהוי הקול עובד בדפדפן בלבד (לא באפליקציה נייטיב)",
]

export default function VoiceHelpPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0f1117]" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f1117]/90 backdrop-blur-md border-b border-white/8 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-white/60">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6"/>
          </svg>
        </button>
        <div>
          <h1 className="text-white text-base font-semibold leading-none">הוראות הפעלה — בוט קולי</h1>
          <p className="text-white/40 text-xs mt-0.5">מה הבוט יכול לעשות ואיך לעבוד איתו</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto pb-16">

        {/* Intro */}
        <div className="bg-white/6 rounded-2xl px-4 py-4 border border-white/10">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎙️</span>
            <div>
              <p className="text-white/80 text-sm leading-relaxed">
                הבוט הקולי מאפשר לבצע פעולות באפליקציה בעברית דבורה — בלי לדפדף בתפריטים.
              </p>
              <p className="text-white/45 text-xs mt-1.5 leading-relaxed">
                לחץ על כפתור המיקרופון, תן פקודה, ותראה מה הבוט הבין ומה ביצע.
              </p>
            </div>
          </div>
        </div>

        {/* Commands */}
        {COMMANDS.map(section => (
          <div key={section.title} className="bg-white/5 rounded-2xl overflow-hidden border border-white/8">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
              <span className="text-base">{section.emoji}</span>
              <span className="text-white/70 text-sm font-medium">{section.title}</span>
            </div>
            <div className="divide-y divide-white/5">
              {section.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60 flex-shrink-0" />
                  <div>
                    <span className="text-white/75 text-sm">״{item.label}״</span>
                    {item.desc && <span className="text-white/35 text-xs mr-1.5">{item.desc}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Tips */}
        <div className="bg-amber-500/8 rounded-2xl overflow-hidden border border-amber-500/20">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-500/15">
            <span className="text-base">💡</span>
            <span className="text-amber-300/80 text-sm font-medium">טיפים לשימוש</span>
          </div>
          <div className="divide-y divide-white/5">
            {TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                <span className="text-amber-400/60 text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                <span className="text-white/65 text-sm leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Limitations */}
        <div className="bg-white/4 rounded-2xl overflow-hidden border border-white/8">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
            <span className="text-base">⚠️</span>
            <span className="text-white/50 text-sm font-medium">מה הבוט לא יכול לעשות</span>
          </div>
          <div className="divide-y divide-white/5">
            {LIMITATIONS.map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 flex-shrink-0 mt-1.5" />
                <span className="text-white/45 text-sm leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="w-full bg-white/8 hover:bg-white/12 border border-white/12 rounded-2xl py-3 text-white/60 text-sm transition-colors"
        >
          חזור
        </button>

      </div>
    </div>
  )
}
