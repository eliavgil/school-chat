import Link from "next/link"

const LINKS: { label: string; desc: string; href: string; emoji: string; icon?: string; soon?: boolean }[] = [
  { label: "מיסטר פקפקובי", desc: "העוזר הכיתתי — שיחה חיה", href: "/assistant", emoji: "🤖", icon: "/mascot/face.png" },
  { label: "פקפקובי בוט - ניהול מאגר ידע", desc: "ניהול מאגר הידע של הבוט", href: "/teacher/school-assistant", emoji: "🗂️" },
  { label: "פקפקובי בוט - מורה פרטי", desc: "בוט לימודי אישי לתלמידים", href: "#", emoji: "🧑‍🏫", soon: true },
]

export default function BotsManagementPage() {
  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white">ניהול בוטים</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        {LINKS.map(l => l.soon ? (
          <div key={l.href}
            className="glass rounded-2xl p-4 flex items-center gap-3 opacity-40 relative border border-dashed border-white/20">
            {l.icon ? <img src={l.icon} alt="" className="w-8 h-8 object-contain flex-shrink-0" /> : <span className="text-2xl flex-shrink-0">{l.emoji}</span>}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">{l.label}</p>
              <p className="text-white/40 text-xs">{l.desc}</p>
            </div>
            <span className="text-[9px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full flex-shrink-0">בקרוב</span>
          </div>
        ) : (
          <Link key={l.href} href={l.href}
            className="glass rounded-2xl p-4 flex items-center gap-3 interactive btn-press hover:bg-white/15 transition-colors">
            {l.icon ? <img src={l.icon} alt="" className="w-8 h-8 object-contain flex-shrink-0" /> : <span className="text-2xl flex-shrink-0">{l.emoji}</span>}
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
