"use client"

import Link from "next/link"

// Shared "not built yet" page — matches the look of /teacher/general-education,
// reused wherever a page is linked from the nav before it has real content.
export default function PlaceholderPage({ title, subtitle, icon, backHref }: {
  title: string; subtitle?: string; icon: string; backHref: string
}) {
  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href={backHref} className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <div>
          <h1 className="font-semibold text-lg text-white">{title}</h1>
          {subtitle && <p className="text-white/40 text-xs">{subtitle}</p>}
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <span className="text-6xl">{icon}</span>
        <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white/30 text-sm">
          בבנייה — בקרוב
        </div>
      </div>
    </div>
  )
}
