"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface XpData {
  preview: boolean
  name: string
  icon: string
  min: number
  next: { min: number; name: string; icon: string } | null
  progress: number
  xp: number
  rank?: number
  outOf?: number
  breakdown: { climb: number; trivia: number; duel: number; mastermind: number; wordle: number; surveys: number }
}

const CARDS = [
  { key: "climb", emoji: "🐸📚", label: "טיפוס האילנות", href: "/student/games/climb" },
  { key: "trivia", emoji: "🧠", label: "חידון ידע כללי", href: "/student/games/trivia" },
  { key: "duel", emoji: "⚔️", label: "דו-קרב טריוויה", href: "/student/games/trivia/duel" },
  { key: "mastermind", emoji: "🧩", label: "שובר קוד", href: "/student/games/mastermind" },
  { key: "wordle", emoji: "🔤", label: "מילה", href: "/student/games/wordle" },
  { key: "surveys", emoji: "📋", label: "שאלונים שמולאו", href: "/student" },
] as const

export default function ScoreboardPage() {
  const [data, setData] = useState<XpData | null>(null)

  useEffect(() => {
    fetch("/api/student/xp").then(r => r.json()).then(setData).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white flex-1">לוח התוצאות שלי</h1>
        <Link href="/student/scoreboard/leaderboard" className="text-white/60 hover:text-white text-xs bg-white/10 px-3 py-1.5 rounded-full interactive btn-press">
          🏆 טבלה
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {!data ? (
          <p className="text-white/40 text-sm text-center py-8">טוען...</p>
        ) : data.preview ? (
          <p className="text-white/30 text-sm text-center py-8">לוח התוצאות מוצג רק לתלמידים</p>
        ) : (
          <>
            <div className="glass rounded-2xl p-5 text-center space-y-2">
              <span className="text-5xl">{data.icon}</span>
              <p className="text-white text-xl font-semibold">{data.name}</p>
              <p className="text-white/50 text-sm font-mono">{data.xp} נק׳{data.rank && data.outOf ? ` · מקום ${data.rank} מתוך ${data.outOf}` : ""}</p>
              {data.next ? (
                <div className="pt-2 space-y-1">
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white/60" style={{ width: `${data.progress * 100}%` }} />
                  </div>
                  <p className="text-white/30 text-xs">{data.next.min - data.xp} נק׳ לדרגה הבאה — {data.next.icon} {data.next.name}</p>
                </div>
              ) : (
                <p className="text-amber-300/80 text-xs pt-1">הדרגה הגבוהה ביותר! 👑</p>
              )}
            </div>

            <div className="space-y-2">
              {CARDS.map(c => (
                <Link key={c.key} href={c.href}
                  className="glass rounded-2xl p-4 flex items-center gap-3 interactive btn-press hover:bg-white/15 transition-colors">
                  <span className="text-2xl flex-shrink-0">{c.emoji}</span>
                  <p className="flex-1 text-white text-sm font-medium">{c.label}</p>
                  <span className="text-white/60 text-sm font-mono">{data.breakdown[c.key]} נק׳</span>
                  <span className="text-white/30 flex-shrink-0">←</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
