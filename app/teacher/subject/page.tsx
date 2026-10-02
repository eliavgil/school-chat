"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"

export default function SubjectTeacherPage() {
  const { data: session } = useSession()
  // Glossary is still eliavgil-only while it's being trialed — same gate
  // used everywhere else it's shown.
  const showGlossary = session?.user?.email === "eliavgil@gmail.com"

  const links: { label: string; desc: string; href: string; emoji: string }[] = [
    { label: "אזרחות מלאכותית", desc: "גישה לשיעורים החיים", href: "/lessons", emoji: "🎓" },
    ...(showGlossary ? [{ label: "מילון מושגים", desc: "חיפוש מושגים מכל השיעורים", href: "/glossary", emoji: "📖" }] : []),
    { label: "סידור ישיבה", desc: "סידור הישיבה של הכיתה", href: "/teacher/seating-chart", emoji: "🪑" },
  ]

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <div>
          <h1 className="font-semibold text-lg text-white">מורה מקצועי</h1>
          <p className="text-white/40 text-xs">ניהול מקצועות וציונים שוטפים</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className="glass rounded-2xl p-4 flex items-center gap-3 interactive btn-press hover:bg-white/15 transition-colors">
            <span className="text-2xl flex-shrink-0">{l.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">{l.label}</p>
              <p className="text-white/40 text-xs">{l.desc}</p>
            </div>
            <span className="text-white/30 flex-shrink-0">←</span>
          </Link>
        ))}

        <div className="flex flex-col items-center gap-3 text-center py-10">
          <span className="text-5xl">📚</span>
          <h2 className="text-white text-lg font-light">ניהול ציונים שוטפים</h2>
          <p className="text-white/40 text-sm max-w-xs">
            כאן תוכל לנהל ציונים שוטפים, מבחנים ומטלות עבור הכיתות שאתה מלמד.
          </p>
          <div className="mt-2 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white/30 text-sm">
            בבנייה — בקרוב
          </div>
        </div>
      </div>
    </div>
  )
}
