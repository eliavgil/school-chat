"use client"

import Link from "next/link"
import { PersonalTasksTab } from "@/app/components/PersonalTasksTab"
import PushManager from "@/app/components/PushManager"

export default function StudentTasksPage() {
  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/student/logistics" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white flex-1">משימות אישיות</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5">
          <p className="text-white/70 text-sm font-medium">🔔 תזכורות ישירות לטלפון</p>
          <p className="text-white/40 text-xs leading-relaxed">
            כשמוסיפים משימה עם "תזכורת", האתר יכול לשלוח לכם הודעת פוש ישירות לטלפון ברגע שהגיע הזמן — גם כשהאתר סגור. כדי שזה יעבוד, צריך פעם אחת ללחוץ "הפעל" כאן למטה (ואם יופיע חלון של הדפדפן, לאשר קבלת התראות).
          </p>
          <PushManager />
        </div>

        <PersonalTasksTab />
      </div>
    </div>
  )
}
