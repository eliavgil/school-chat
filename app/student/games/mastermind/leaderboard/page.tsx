"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const DIFFICULTY_LABELS: Record<string, string> = { easy: "קל", medium: "בינוני", hard: "קשה" }

interface Row { name: string; score: number; difficulty: string }

export default function MastermindLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/mastermind/scores").then(r => r.json()).then(d => setLeaderboard(d.leaderboard ?? []))
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/student/games/mastermind" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white">טבלת הניקוד השכבתית</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="glass rounded-2xl overflow-hidden">
          {loading ? (
            <p className="text-white/40 text-sm text-center py-8">טוען...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">אין עדיין ניקוד — תהיה/י הראשון/ה!</p>
          ) : (
            <div className="divide-y divide-white/5">
              {leaderboard.map((row, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-white/40 text-sm w-6">{i + 1}</span>
                  <span className="flex-1 text-white/85 text-sm truncate">{row.name}</span>
                  <span className="text-white/30 text-[10px] bg-white/5 px-2 py-0.5 rounded-full">{DIFFICULTY_LABELS[row.difficulty] ?? row.difficulty}</span>
                  <span className="text-white/60 text-sm font-mono">{row.score} נק׳</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
