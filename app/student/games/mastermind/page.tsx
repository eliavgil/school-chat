"use client"

import { useState } from "react"
import Link from "next/link"

type Difficulty = "easy" | "medium" | "hard"

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; pegs: number; colors: number; maxGuesses: number; base: number }> = {
  easy: { label: "קל", pegs: 4, colors: 6, maxGuesses: 10, base: 100 },
  medium: { label: "בינוני", pegs: 5, colors: 6, maxGuesses: 10, base: 150 },
  hard: { label: "קשה", pegs: 5, colors: 8, maxGuesses: 8, base: 220 },
}

const COLOR_EMOJI = ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚪", "⚫"]

interface Guess { pegs: number[]; exact: number; partial: number }

type Screen = "intro" | "playing" | "result"

function feedback(secret: number[], guess: number[]) {
  let exact = 0
  const secretRemain: number[] = []
  const guessRemain: number[] = []
  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) exact++
    else { secretRemain.push(secret[i]); guessRemain.push(guess[i]) }
  }
  let partial = 0
  const counts: Record<number, number> = {}
  for (const s of secretRemain) counts[s] = (counts[s] ?? 0) + 1
  for (const g of guessRemain) { if (counts[g] > 0) { partial++; counts[g]-- } }
  return { exact, partial }
}

function computeScore(difficulty: Difficulty, guessesUsed: number, elapsedSec: number) {
  const d = DIFFICULTY_CONFIG[difficulty]
  const guessBonus = (d.maxGuesses - guessesUsed) * 10
  const timeBonus = Math.max(0, 120 - Math.floor(elapsedSec))
  return d.base + guessBonus + timeBonus
}

export default function MastermindGamePage() {
  const [screen, setScreen] = useState<Screen>("intro")
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [secret, setSecret] = useState<number[]>([])
  const [currentGuess, setCurrentGuess] = useState<(number | null)[]>([])
  const [history, setHistory] = useState<Guess[]>([])
  const [startTime, setStartTime] = useState(0)
  const [won, setWon] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [elapsedLabel, setElapsedLabel] = useState("")

  const cfg = DIFFICULTY_CONFIG[difficulty]

  function startGame() {
    const code = Array.from({ length: cfg.pegs }, () => Math.floor(Math.random() * cfg.colors))
    setSecret(code)
    setCurrentGuess(Array(cfg.pegs).fill(null))
    setHistory([])
    setStartTime(Date.now())
    setScreen("playing")
  }

  function pickColor(colorId: number) {
    const i = currentGuess.findIndex(v => v === null)
    if (i === -1) return
    setCurrentGuess(g => g.map((v, idx) => idx === i ? colorId : v))
  }

  function clearSlot(i: number) {
    setCurrentGuess(g => g.map((v, idx) => idx === i ? null : v))
  }

  function submitGuess() {
    if (currentGuess.some(v => v === null)) return
    const guessArr = currentGuess as number[]
    const fb = feedback(secret, guessArr)
    const newHistory = [{ pegs: guessArr, ...fb }, ...history]
    setHistory(newHistory)
    setCurrentGuess(Array(cfg.pegs).fill(null))

    const elapsedSec = (Date.now() - startTime) / 1000
    if (fb.exact === cfg.pegs) {
      const score = computeScore(difficulty, newHistory.length, elapsedSec)
      setWon(true)
      setFinalScore(score)
      setElapsedLabel(`${Math.floor(elapsedSec)} שניות`)
      setScreen("result")
      fetch("/api/mastermind/scores", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty, guessesUsed: newHistory.length, maxGuesses: cfg.maxGuesses, timeMs: Math.round(elapsedSec * 1000), score }),
      }).catch(() => {})
    } else if (newHistory.length >= cfg.maxGuesses) {
      setWon(false)
      setFinalScore(0)
      setScreen("result")
    }
  }

  const guessFull = currentGuess.every(v => v !== null)

  return (
    <div className="min-h-screen bg-black flex flex-col items-center" dir="rtl">
      <header className="w-full max-w-md flex items-center gap-4 px-4 header-pt pb-3">
        <Link href="/student/games" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-white flex-1">שובר קוד</h1>
        {screen === "playing" && <span className="text-white/40 text-xs font-mono">ניסיון {history.length + 1}/{cfg.maxGuesses}</span>}
      </header>

      {screen === "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 w-full max-w-md text-center">
          <span className="text-5xl">🧩</span>
          <p className="text-white/70 text-sm leading-relaxed">
            המחשב בוחר קוד סודי של צבעים. אחרי כל ניחוש תקבלו משוב:
            <br />⚫ כמה נכון בצבע <b>ובמקום</b>, ⚪ כמה נכון בצבע אבל <b>במקום הלא נכון</b>.
            <br />פצחו את הקוד לפני שנגמרים הניסיונות!
          </p>
          <div className="w-full space-y-2">
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-3 border transition-colors interactive btn-press ${
                  difficulty === d ? "bg-white/20 border-white/40" : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}>
                <span className="text-white font-medium">{DIFFICULTY_CONFIG[d].label}</span>
                <span className="text-white/40 text-xs">{DIFFICULTY_CONFIG[d].pegs} משבצות · {DIFFICULTY_CONFIG[d].colors} צבעים · {DIFFICULTY_CONFIG[d].maxGuesses} ניסיונות</span>
              </button>
            ))}
          </div>
          <button onClick={startGame}
            className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 rounded-xl interactive btn-press transition-colors">
            התחל
          </button>
          <Link href="/student/games/mastermind/leaderboard" className="text-white/40 text-xs underline underline-offset-2">
            טבלת הניקוד השכבתית
          </Link>
        </div>
      )}

      {screen === "playing" && (
        <div className="flex-1 flex flex-col w-full max-w-md px-5 py-4 gap-4">
          <div className="flex items-center justify-center gap-3">
            {currentGuess.map((v, i) => (
              <button key={i} onClick={() => clearSlot(i)}
                className="w-11 h-11 rounded-full border-2 border-white/20 bg-white/5 flex items-center justify-center text-xl interactive btn-press">
                {v !== null ? COLOR_EMOJI[v] : ""}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {COLOR_EMOJI.slice(0, cfg.colors).map((emoji, id) => (
              <button key={id} onClick={() => pickColor(id)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg interactive btn-press transition-colors">
                {emoji}
              </button>
            ))}
          </div>

          <button onClick={submitGuess} disabled={!guessFull}
            className="w-full bg-white/20 hover:bg-white/30 disabled:opacity-30 text-white font-medium py-2.5 rounded-xl interactive btn-press transition-colors">
            בדוק ניחוש
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 pt-1">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                <span className="text-white/30 text-xs w-5">{history.length - i}</span>
                <div className="flex gap-1.5">
                  {h.pegs.map((p, j) => <span key={j} className="text-lg">{COLOR_EMOJI[p]}</span>)}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span>{"⚫".repeat(h.exact)}{"⚪".repeat(h.partial)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {screen === "result" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 w-full max-w-md">
          <span className="text-5xl">{won ? "🎉" : "💡"}</span>
          <p className="text-white text-xl font-light">{won ? "פיצחת את הקוד!" : "נגמרו הניסיונות"}</p>
          {won ? (
            <>
              <p className="text-white/70 text-3xl font-semibold">{finalScore} נק׳</p>
              <p className="text-white/40 text-sm">{history.length} ניסיונות · {elapsedLabel}</p>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-sm">הקוד היה:</span>
              {secret.map((c, i) => <span key={i} className="text-xl">{COLOR_EMOJI[c]}</span>)}
            </div>
          )}

          <div className="w-full flex gap-2">
            <button onClick={() => setScreen("intro")}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white font-medium py-3 rounded-xl interactive btn-press transition-colors">
              שחק שוב
            </button>
            <Link href="/student/games/mastermind/leaderboard"
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl interactive btn-press transition-colors text-center">
              טבלת ניקוד
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
