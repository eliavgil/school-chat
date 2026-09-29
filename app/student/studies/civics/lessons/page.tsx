"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface LessonItem { id: string; slug: string; title: string; subject: string }

export default function StudentLessonsPage() {
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/lessons").then(r => r.json()).then(d => {
      setLessons(Array.isArray(d) ? d.filter((l: LessonItem) => l.subject === "אזרחות") : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const sorted = [...lessons].sort((a, b) => {
    const na = parseInt(a.title.match(/שיעור\s+(\d+)/)?.[1] ?? "9999")
    const nb = parseInt(b.title.match(/שיעור\s+(\d+)/)?.[1] ?? "9999")
    return na - nb
  })

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/student/studies/civics" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <div>
          <h1 className="font-semibold text-lg text-white">מצגות השיעורים</h1>
          <p className="text-white/40 text-xs">אזרחות מלאכותית</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        )}

        {!loading && sorted.length === 0 && (
          <div className="glass rounded-2xl px-4 py-10 text-center">
            <p className="text-white/30 text-sm">אין עדיין שיעורים</p>
          </div>
        )}

        {!loading && sorted.length > 0 && (
          <div className="space-y-2">
            {sorted.map(l => (
              <a key={l.id} href={`/lessons/${l.id}/print`} target="_blank" rel="noopener noreferrer"
                className="glass rounded-2xl px-4 py-3.5 flex items-center justify-between hover:bg-white/15 interactive btn-press transition-colors">
                <span className="text-white/85 text-sm font-medium">{l.title}</span>
                <span className="text-white/30 text-xs">צפייה ←</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
