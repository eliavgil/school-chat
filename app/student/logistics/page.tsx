"use client"

import Link from "next/link"

const TILES: { label: string; href: string; emoji: string }[] = [
  { label: "אישורים",              href: "/student/logistics/permissions",   emoji: "✅" },
  { label: "הוראות הפעלה למשוב",   href: "/student/logistics/feedback-guide", emoji: "📝" },
  { label: "הודעות חשובות",        href: "/student/logistics/announcements", emoji: "📢" },
]

export default function LogisticsPage() {
  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <div>
          <h1 className="font-semibold text-lg text-white">לוגיסטיקה ומיץ תפוזים 🧃</h1>
          <p className="text-white/40 text-xs">כל מה שצריך כדי שהיום יתנהל חלק</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          {TILES.map(t => (
            <Link key={t.href} href={t.href}
              className="glass rounded-2xl py-6 flex flex-col items-center gap-2 hover:bg-white/15 interactive btn-press transition-colors">
              <span className="text-3xl">{t.emoji}</span>
              <span className="text-white/80 text-sm font-medium text-center leading-tight">{t.label}</span>
            </Link>
          ))}
        </div>
        <p className="text-white/25 text-xs text-center mt-6">עוד תוכן יתווסף כאן בהמשך</p>
      </div>
    </div>
  )
}
