"use client"

import Link from "next/link"

export default function CivicsPage() {
  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/student/studies" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <div>
          <h1 className="font-semibold text-lg text-white">אזרחות 🏛️</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/glossary"
            className="glass rounded-2xl py-6 flex flex-col items-center gap-2 hover:bg-white/15 interactive btn-press transition-colors">
            <span className="text-3xl">📖</span>
            <span className="text-white/75 text-xs font-medium text-center leading-tight">מילון מושגים</span>
          </Link>
          <Link href="/student/studies/civics/lessons"
            className="glass rounded-2xl py-6 flex flex-col items-center gap-2 hover:bg-white/15 interactive btn-press transition-colors">
            <span className="text-3xl">🎓</span>
            <span className="text-white/75 text-xs font-medium text-center leading-tight">מצגות השיעורים</span>
          </Link>
          <Link href="/student/studies/civics/practice"
            className="glass rounded-2xl py-6 flex flex-col items-center gap-2 hover:bg-white/15 interactive btn-press transition-colors">
            <span className="text-3xl">✏️</span>
            <span className="text-white/75 text-xs font-medium text-center leading-tight">תרגול שאלות</span>
          </Link>
          <Link href="/student/studies/civics/sample-exams"
            className="glass rounded-2xl py-6 flex flex-col items-center gap-2 hover:bg-white/15 interactive btn-press transition-colors">
            <span className="text-3xl">📄</span>
            <span className="text-white/75 text-xs font-medium text-center leading-tight">מבחנים לדוגמא</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
