"use client"

import { useEffect, useState } from "react"

interface Step { icon: string; title: string; body: string }

const TEACHER_STEPS: Step[] = [
  { icon: "👆", title: "גלישה בין עמודים", body: "גלול שמאלה וימינה בין 5 עמודים: בית, יומן, תפריט, כיתה והגדרות" },
  { icon: "🎙️", title: "פקודות קוליות", body: "לחץ על כפתור המיקרופון ופקד: צור אירוע, הוסף משימה, עבור לדף..." },
  { icon: "💬", title: "הודעות מהורים", body: 'ב"לוח מחנך" תמצא את כל הפניות — הבוט עונה, ואתה מפקח ומשיב' },
]

const PARENT_STEPS: Step[] = [
  { icon: "💬", title: "שאל את הבוט", body: "שלח שאלה על הציונים, הנוכחות או המערכת — הבוט יענה מיד" },
  { icon: "📲", title: "קבל התראות", body: "הפעל התראות מהתפריט כדי לקבל עדכונים ישר לטלפון" },
  { icon: "🏠", title: "עמוד הבית", body: "כאן תמצא מבחנים קרובים, אירועים ונתוני הנוכחות של ילדך" },
]

export default function Onboarding({ role }: { role: "teacher" | "parent" | "student" }) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  const storageKey = `onboarding-seen-${role}`
  const steps = role === "teacher" ? TEACHER_STEPS : PARENT_STEPS

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(storageKey)) {
      setVisible(true)
    }
  }, [storageKey])

  function finish() {
    localStorage.setItem(storageKey, "1")
    setVisible(false)
  }

  if (!visible || steps.length === 0) return null

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm glass rounded-3xl border border-white/15 overflow-hidden">

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pt-5">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-white/80" : "w-1.5 bg-white/25"}`} />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-6 text-center">
          <div className="text-5xl mb-4">{current.icon}</div>
          <h2 className="text-white font-semibold text-lg mb-2">{current.title}</h2>
          <p className="text-white/60 text-sm leading-relaxed">{current.body}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 px-5 pb-7">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="px-4 py-2.5 text-sm text-white/40 hover:text-white/70 transition-colors">
              חזרה
            </button>
          ) : (
            <button onClick={finish}
              className="px-4 py-2.5 text-sm text-white/30 hover:text-white/50 transition-colors">
              דלג
            </button>
          )}
          <button
            onClick={() => isLast ? finish() : setStep(s => s + 1)}
            className="flex-1 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-medium text-sm transition-all active:scale-95">
            {isLast ? "בואו נתחיל! 🚀" : "הבא →"}
          </button>
        </div>

      </div>
    </div>
  )
}
