"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function TriviaDuelLobbyPage() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState("")

  async function createRoom() {
    setCreating(true)
    setError("")
    const res = await fetch("/api/trivia/duel", { method: "POST" })
    const d = await res.json().catch(() => ({}))
    setCreating(false)
    if (!res.ok) { setError(d.error ?? "שגיאה ביצירת חדר"); return }
    router.push(`/student/games/trivia/duel/${d.code}`)
  }

  async function joinRoom() {
    if (!joinCode.trim()) return
    setJoining(true)
    setError("")
    const res = await fetch("/api/trivia/duel/join", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: joinCode.trim() }),
    })
    const d = await res.json().catch(() => ({}))
    setJoining(false)
    if (!res.ok) { setError(d.error ?? "שגיאה בהצטרפות לחדר"); return }
    router.push(`/student/games/trivia/duel/${d.code}`)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center" dir="rtl">
      <header className="w-full max-w-md flex items-center gap-4 px-4 header-pt pb-3">
        <Link href="/student/games/trivia" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-white flex-1">דו-קרב טריוויה</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 w-full max-w-md">
        <span className="text-5xl">⚔️</span>
        <p className="text-white/60 text-sm text-center leading-relaxed">
          תחרו אחד נגד השני על אותן שאלות, בזמן אמת.
          <br />מי שיוצר חדר מקבל קוד — שולחים לחבר/ה והקרב מתחיל כשהוא/היא מצטרף/ת.
        </p>

        <button onClick={createRoom} disabled={creating}
          className="w-full bg-white/20 hover:bg-white/30 disabled:opacity-40 text-white font-medium py-3 rounded-xl interactive btn-press transition-colors">
          {creating ? "יוצר חדר..." : "+ צור חדר חדש"}
        </button>

        <div className="w-full flex items-center gap-3 text-white/30 text-xs">
          <div className="flex-1 h-px bg-white/10" />
          או
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="w-full flex gap-2">
          <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && joinRoom()}
            placeholder="קוד חדר" maxLength={5}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-center text-lg tracking-widest text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
          <button onClick={joinRoom} disabled={joining || !joinCode.trim()}
            className="bg-white/20 hover:bg-white/30 disabled:opacity-40 text-white font-medium px-5 rounded-xl interactive btn-press transition-colors">
            {joining ? "מצטרף..." : "הצטרף"}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
    </div>
  )
}
