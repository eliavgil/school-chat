import Link from "next/link"

const LINKS: { label: string; desc: string; href: string; emoji: string }[] = [
  { label: "ניהול כיתה",      desc: "רשימת תלמידי הכיתה והערות",   href: "/teacher/students",      emoji: "👥" },
  { label: "מענים אישיים",    desc: "התאמות ומענים לתלמידים",   href: "/teacher/accommodations", emoji: "🧩" },
  { label: "שאלונים",         desc: "שאלוני כיתה ומעקב מענה",    href: "/teacher/surveys",         emoji: "📋" },
  { label: "מעקב רגשי-חברתי", desc: "מצב רגשי וחברתי של התלמידים", href: "/teacher/emotional",     emoji: "💙" },
  { label: "סידור ישיבה",     desc: "סידור הישיבה של הכיתה",     href: "/teacher/seating-chart",   emoji: "🪑" },
]

export default function ClassEducationPage() {
  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white">חינוך כיתה</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        {LINKS.map(l => (
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
      </div>
    </div>
  )
}
