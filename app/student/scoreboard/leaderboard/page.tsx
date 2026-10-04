"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Row { name: string; total: number; levelName: string; levelIcon: string }

export default function ScoreboardLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/student/xp/leaderboard").then(r => r.json()).then(d => setLeaderboard(d.leaderboard ?? []))
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/student/scoreboard" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white">טבלת הדרגות השכבתית</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="glass rounded-2xl overflow-hidden">
          {loading ? (
            <p className="text-white/40 text-sm text-center py-8">טוען...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">אין עדיין נתונים</p>
          ) : (
            <div className="divide-y divide-white/5">
              {leaderboard.map((row, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-white/40 text-sm w-6">{i + 1}</span>
                  <span className="text-xl">{row.levelIcon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/85 text-sm truncate">{row.name}</p>
                    <p className="text-white/30 text-[11px]">{row.levelName}</p>
                  </div>
                  <span className="text-white/60 text-sm font-mono">{row.total} נק׳</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
