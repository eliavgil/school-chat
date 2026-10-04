"use client"

import { useEffect, useRef, useState, use } from "react"
import Link from "next/link"

const CATEGORY_LABELS: Record<string, string> = {
  geography: "גיאוגרפיה", history: "היסטוריה", science: "מדע", culture: "תרבות וספרות",
  sports: "ספורט", israel: "ישראל", tech: "טכנולוגיה", general: "כללי",
}

interface DuelState {
  code: string
  status: "waiting" | "active" | "done"
  youAre: "host" | "guest"
  hostName: string
  guestName: string | null
  currentIndex: number
  total: number
  hostScore: number
  guestScore: number
  revealed: boolean
  questionStartedAt: string | null
  questionMs: number
  yourAnswerIndex: number | null
  opponentAnswered: boolean
  opponentAnswerIndex?: number | null
  winner?: "host" | "guest" | "draw"
  question?: { category: string; text: string; optionA: string; optionB: string; optionC: string; optionD: string; correctIndex?: number }
}

export default function TriviaDuelRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [state, setState] = useState<DuelState | null>(null)
  const [error, setError] = useState("")
  const [remainingMs, setRemainingMs] = useState(0)
  const answeringRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      const res = await fetch(`/api/trivia/duel/${code}`)
      const d = await res.json().catch(() => ({}))
      if (cancelled) return
      if (!res.ok) { setError(d.error ?? "שגיאה"); return }
      setState(d)
      answeringRef.current = false
    }
    poll()
    const id = setInterval(poll, 1200)
    return () => { cancelled = true; clearInterval(id) }
  }, [code])

  useEffect(() => {
    if (!state || state.status !== "active" || !state.questionStartedAt) return
    const id = setInterval(() => {
      const left = state.questionMs - (Date.now() - new Date(state.questionStartedAt!).getTime())
      setRemainingMs(Math.max(0, left))
    }, 150)
    return () => clearInterval(id)
  }, [state?.questionStartedAt, state?.status, state?.questionMs])

  async function answer(idx: number) {
    if (!state || state.yourAnswerIndex !== null || state.revealed || answeringRef.current) return
    answeringRef.current = true
    setState(s => s ? { ...s, yourAnswerIndex: idx } : s)
    await fetch(`/api/trivia/duel/${code}/answer`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ optionIndex: idx }),
    }).catch(() => {})
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 px-6 text-center" dir="rtl">
        <p className="text-white/60 text-sm">{error}</p>
        <Link href="/student/games/trivia/duel" className="text-white/40 text-xs underline underline-offset-2">חזרה</Link>
      </div>
    )
  }
  if (!state) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white/40 text-sm" dir="rtl">טוען...</div>
  }

  const you = state.youAre === "host" ? state.hostScore : state.guestScore
  const opponent = state.youAre === "host" ? state.guestScore : state.hostScore
  const opponentName = state.youAre === "host" ? state.guestName : state.hostName
  const yourName = state.youAre === "host" ? state.hostName : state.guestName
  const options = state.question ? [state.question.optionA, state.question.optionB, state.question.optionC, state.question.optionD] : []
  const urgent = remainingMs < 5000

  return (
    <div className="min-h-screen bg-black flex flex-col items-center" dir="rtl">
      <header className="w-full max-w-md flex items-center gap-4 px-4 header-pt pb-3">
        <Link href="/student/games/trivia" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-white flex-1">דו-קרב טריוויה</h1>
        {state.status === "active" && <span className="text-white/30 text-xs font-mono">{state.currentIndex + 1}/{state.total}</span>}
      </header>

      {state.status === "waiting" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 w-full max-w-md text-center">
          <span className="text-5xl">⏳</span>
          <p className="text-white/70 text-sm">מחכים לשחקן השני...</p>
          <div className="bg-white/10 rounded-2xl px-6 py-4">
            <p className="text-white/40 text-xs mb-1">קוד החדר</p>
            <p className="text-white text-3xl font-mono tracking-widest">{state.code}</p>
          </div>
          <p className="text-white/30 text-xs">שלח/י את הקוד לחבר/ה כדי שיצטרף/תצטרף</p>
        </div>
      )}

      {state.status === "active" && state.question && (
        <div className="flex-1 flex flex-col w-full max-w-md px-5 py-4 gap-4">
          <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5">
            <div className="text-center flex-1">
              <p className="text-white/40 text-[11px]">{yourName} (את/ה)</p>
              <p className="text-white font-mono font-semibold">{you}</p>
            </div>
            <span className="text-white/20 text-xs">⚔️</span>
            <div className="text-center flex-1">
              <p className="text-white/40 text-[11px]">{opponentName ?? "..."}</p>
              <p className="text-white font-mono font-semibold">{opponent}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full transition-[width] duration-150 ${urgent ? "bg-red-400" : "bg-white/60"}`}
                style={{ width: `${(remainingMs / state.questionMs) * 100}%` }} />
            </div>
            <span className="text-[11px] bg-white/10 text-white/50 px-2 py-0.5 rounded-full">{CATEGORY_LABELS[state.question.category] ?? "כללי"}</span>
          </div>

          <p className="text-white text-lg font-medium text-center py-3">{state.question.text}</p>

          {!state.revealed && state.yourAnswerIndex !== null && (
            <p className="text-white/50 text-sm text-center">ממתינ/ה ליריב/ה...</p>
          )}

          {state.revealed ? (
            <div className="grid grid-cols-2 gap-2">
              {options.map((opt, i) => {
                const isCorrect = i === state.question!.correctIndex
                const isYours = i === state.yourAnswerIndex
                const isOpponents = i === state.opponentAnswerIndex
                return (
                  <div key={i}
                    className={`text-sm py-3.5 px-2 rounded-xl text-center relative ${
                      isCorrect ? "bg-green-500/25 text-green-300" : (isYours || isOpponents) ? "bg-red-500/25 text-red-300" : "bg-white/5 text-white/30"
                    }`}>
                    {opt}
                    {(isYours || isOpponents) && (
                      <div className="text-[10px] mt-1 opacity-70">
                        {isYours && isOpponents ? "שניכם" : isYours ? "אתה/את" : opponentName}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {options.map((opt, i) => (
                <button key={i} onClick={() => answer(i)} disabled={state.yourAnswerIndex !== null}
                  className={`text-sm py-3.5 px-2 rounded-xl interactive btn-press transition-colors ${
                    state.yourAnswerIndex === i ? "bg-white/30 text-white" : "bg-white/10 hover:bg-white/20 text-white disabled:hover:bg-white/10"
                  }`}>
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {state.status === "done" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 w-full max-w-md">
          <span className="text-5xl">{state.winner === "draw" ? "🤝" : state.winner === state.youAre ? "🏆" : "⚔️"}</span>
          <p className="text-white text-xl font-light">
            {state.winner === "draw" ? "שוויון!" : state.winner === state.youAre ? "ניצחת!" : `${opponentName} ניצח/ה`}
          </p>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-white/40 text-xs">{yourName}</p>
              <p className="text-white text-2xl font-mono font-semibold">{you}</p>
            </div>
            <span className="text-white/20">—</span>
            <div className="text-center">
              <p className="text-white/40 text-xs">{opponentName}</p>
              <p className="text-white text-2xl font-mono font-semibold">{opponent}</p>
            </div>
          </div>
          <Link href="/student/games/trivia/duel"
            className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 rounded-xl interactive btn-press transition-colors text-center">
            דו-קרב חדש
          </Link>
        </div>
      )}
    </div>
  )
}
