"use client"

import Link from "next/link"

export default function StudiesPage() {
  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <div>
          <h1 className="font-semibold text-lg text-white">לימודים זה החיים 📚</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl py-6 flex flex-col items-center gap-2 opacity-40 relative border border-dashed border-white/20">
            <span className="text-3xl">🧑‍🏫</span>
            <span className="text-white/60 text-xs font-medium text-center leading-tight">בוט מורה פרטי</span>
            <span className="absolute top-2 left-2 text-[9px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full">בקרוב</span>
          </div>
          <Link href="/student/studies/civics"
            className="glass rounded-2xl py-6 flex flex-col items-center gap-2 hover:bg-white/15 interactive btn-press transition-colors">
            <span className="text-3xl">🏛️</span>
            <span className="text-white/75 text-xs font-medium text-center leading-tight">אזרחות</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
