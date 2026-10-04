"use client"

import { useState } from "react"
import Link from "next/link"

const WORD_LENGTH = 5
const MAX_GUESSES = 6

// Curated common Hebrew nouns/adjectives, all exactly 5 letters — no
// dictionary needed for *guesses* (any 5 letters are accepted and scored),
// only the secret answer is drawn from this list.
const WORD_LIST = [
  "שולחן", "מחברת", "תלמיד", "ילקוט", "טלפון", "גיטרה", "תמונה", "מדרגה",
  "משפחה", "מנהלת", "תעודה", "חידון", "תשובה", "שאלון", "ילדות", "בדיחה",
  "סיפור", "חתולה", "כלבלב", "ציפור", "אבטיח", "גלידה", "עוגיה", "ארוחה",
  "מרפסת", "מדרכה", "רמזור", "מדינה", "ממשלה", "משטרה", "רעידה", "עצבות",
  "חברות", "אמונה", "תקווה", "יצירה", "דמיון", "חוכמה", "ענווה", "גאווה",
  "יושרה", "קרפדה", "חרגול", "ינשוף", "סלמון", "תמנון", "ארנבת",
]

const KEYBOARD_ROWS = [
  ["ק", "ר", "א", "ט", "ו", "ן", "ם", "פ"],
  ["ש", "ד", "ג", "כ", "ע", "י", "ח", "ל", "ך", "ף"],
  ["ז", "ס", "ב", "ה", "נ", "מ", "צ", "ת", "ץ"],
]

type LetterStatus = "correct" | "present" | "absent"
type Screen = "intro" | "playing" | "result"

function scoreGuess(secret: string[], guess: string[]): LetterStatus[] {
  const result: LetterStatus[] = Array(guess.length).fill("absent")
  const counts: Record<string, number> = {}
  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) result[i] = "correct"
    else counts[secret[i]] = (counts[secret[i]] ?? 0) + 1
  }
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "correct") continue
    const ch = guess[i]
    if (counts[ch] > 0) { result[i] = "present"; counts[ch]-- }
  }
  return result
}

function computeScore(guessesUsed: number, elapsedSec: number) {
  const guessBonus = (MAX_GUESSES - guessesUsed) * 15
  const timeBonus = Math.max(0, 90 - Math.floor(elapsedSec))
  return 100 + guessBonus + timeBonus
}

export default function WordleGamePage() {
  const [screen, setScreen] = useState<Screen>("intro")
  const [secret, setSecret] = useState<string[]>([])
  const [current, setCurrent] = useState("")
  const [history, setHistory] = useState<{ letters: string[]; statuses: LetterStatus[] }[]>([])
  const [keyStatus, setKeyStatus] = useState<Record<string, LetterStatus>>({})
  const [startTime, setStartTime] = useState(0)
  const [won, setWon] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  function startGame() {
    const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]
    setSecret(word.split(""))
    setCurrent("")
    setHistory([])
    setKeyStatus({})
    setStartTime(Date.now())
    setScreen("playing")
  }

  function typeLetter(ch: string) {
    if (current.length >= WORD_LENGTH) return
    setCurrent(c => c + ch)
  }
  function backspace() {
    setCurrent(c => c.slice(0, -1))
  }

  function submitGuess() {
    if (current.length !== WORD_LENGTH) return
    const guessLetters = current.split("")
    const statuses = scoreGuess(secret, guessLetters)
    const newHistory = [...history, { letters: guessLetters, statuses }]
    setHistory(newHistory)

    setKeyStatus(prev => {
      const next = { ...prev }
      const rank: Record<LetterStatus, number> = { absent: 0, present: 1, correct: 2 }
      guessLetters.forEach((ch, i) => {
        if (!next[ch] || rank[statuses[i]] > rank[next[ch]]) next[ch] = statuses[i]
      })
      return next
    })

    const solved = statuses.every(s => s === "correct")
    const elapsedSec = (Date.now() - startTime) / 1000
    if (solved) {
      const score = computeScore(newHistory.length, elapsedSec)
      setWon(true)
      setFinalScore(score)
      setScreen("result")
      fetch("/api/wordle/scores", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guessesUsed: newHistory.length, timeMs: Math.round(elapsedSec * 1000), score }),
      }).catch(() => {})
    } else if (newHistory.length >= MAX_GUESSES) {
      setWon(false)
      setFinalScore(0)
      setScreen("result")
    } else {
      setCurrent("")
    }
  }

  const statusColor: Record<LetterStatus, string> = {
    correct: "bg-green-500/70 border-green-500/70 text-white",
    present: "bg-amber-400/70 border-amber-400/70 text-white",
    absent: "bg-white/5 border-white/10 text-white/40",
  }
  const keyColor: Record<LetterStatus, string> = {
    correct: "bg-green-500/70 text-white",
    present: "bg-amber-400/70 text-white",
    absent: "bg-white/5 text-white/30",
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center" dir="rtl">
      <header className="w-full max-w-md flex items-center gap-4 px-4 header-pt pb-3">
        <Link href="/student/games" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-white flex-1">מילה</h1>
        {screen === "playing" && <span className="text-white/40 text-xs font-mono">{history.length}/{MAX_GUESSES}</span>}
      </header>

      {screen === "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 w-full max-w-md text-center">
          <span className="text-5xl">🔤</span>
          <p className="text-white/70 text-sm leading-relaxed">
            נחשו מילה בת 5 אותיות תוך 6 ניסיונות.
            <br />🟩 אות נכונה במקום הנכון, 🟨 אות נכונה במקום הלא נכון, ⬜ אות שלא במילה.
          </p>
          <button onClick={startGame}
            className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 rounded-xl interactive btn-press transition-colors">
            התחל
          </button>
          <Link href="/student/games/wordle/leaderboard" className="text-white/40 text-xs underline underline-offset-2">
            טבלת הניקוד השכבתית
          </Link>
        </div>
      )}

      {screen === "playing" && (
        <div className="flex-1 flex flex-col w-full max-w-md px-5 py-4 gap-4">
          <div className="space-y-1.5" dir="rtl">
            {history.map((h, i) => (
              <div key={i} className="flex gap-1.5 justify-center">
                {h.letters.map((ch, j) => (
                  <div key={j} className={`w-10 h-10 rounded-lg border flex items-center justify-center text-lg font-medium ${statusColor[h.statuses[j]]}`}>
                    {ch}
                  </div>
                ))}
              </div>
            ))}
            {history.length < MAX_GUESSES && (
              <div className="flex gap-1.5 justify-center">
                {Array.from({ length: WORD_LENGTH }).map((_, j) => (
                  <div key={j} className="w-10 h-10 rounded-lg border border-white/20 bg-white/5 flex items-center justify-center text-lg font-medium text-white">
                    {current[WORD_LENGTH - 1 - j] ?? ""}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />

          <div className="space-y-1.5" dir="rtl">
            {KEYBOARD_ROWS.map((row, i) => (
              <div key={i} className="flex gap-1 justify-center">
                {row.map(ch => (
                  <button key={ch} onClick={() => typeLetter(ch)}
                    className={`w-8 h-10 rounded-md text-sm font-medium interactive btn-press transition-colors ${keyColor[keyStatus[ch]] ?? "bg-white/10 text-white hover:bg-white/20"}`}>
                    {ch}
                  </button>
                ))}
              </div>
            ))}
            <div className="flex gap-2 justify-center pt-1">
              <button onClick={backspace}
                className="px-4 h-10 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm interactive btn-press transition-colors">⌫</button>
              <button onClick={submitGuess} disabled={current.length !== WORD_LENGTH}
                className="px-6 h-10 rounded-md bg-white/20 hover:bg-white/30 disabled:opacity-30 text-white text-sm font-medium interactive btn-press transition-colors">
                בדוק
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === "result" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 w-full max-w-md">
          <span className="text-5xl">{won ? "🎉" : "💡"}</span>
          <p className="text-white text-xl font-light">{won ? "פיצחת את המילה!" : "נגמרו הניסיונות"}</p>
          {won ? (
            <>
              <p className="text-white/70 text-3xl font-semibold">{finalScore} נק׳</p>
              <p className="text-white/40 text-sm">{history.length} ניסיונות</p>
            </>
          ) : (
            <p className="text-white/50 text-sm">המילה הייתה: <span className="text-white font-medium">{secret.join("")}</span></p>
          )}

          <div className="w-full flex gap-2">
            <button onClick={() => setScreen("intro")}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white font-medium py-3 rounded-xl interactive btn-press transition-colors">
              שחק שוב
            </button>
            <Link href="/student/games/wordle/leaderboard"
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl interactive btn-press transition-colors text-center">
              טבלת ניקוד
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
