"use client"

import Link from "next/link"

export default function GradeHubPage() {
  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <div>
          <h1 className="font-semibold text-lg text-white">ריכוז שכבה</h1>
          <p className="text-white/40 text-xs">תצוגת שכבה — כלל הכיתות</p>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <span className="text-6xl">🏫</span>
        <h2 className="text-white text-xl font-light">ריכוז שכבה</h2>
        <p className="text-white/40 text-sm max-w-xs">
          כאן תוכל לצפות בנתוני כלל הכיתות בשכבה — ארועים, נוכחות, אנטנות ואזהרות.
        </p>
        <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white/30 text-sm">
          בבנייה — בקרוב
        </div>
      </div>
    </div>
  )
}
