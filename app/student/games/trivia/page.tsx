"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

const TIME_PER_QUESTION_MS = 15_000
const START_LIVES = 3

const CATEGORY_LABELS: Record<string, string> = {
  geography: "גיאוגרפיה",
  history: "היסטוריה",
  science: "מדע",
  culture: "תרבות וספרות",
  sports: "ספורט",
  israel: "ישראל",
  tech: "טכנולוגיה",
  general: "כללי",
}

interface Question {
  id: string
  category: string
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctIndex: number
}

type Screen = "intro" | "playing" | "gameover"
type Feedback = "correct" | "wrong" | "timeout" | null

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function TriviaGamePage() {
  const [screen, setScreen] = useState<Screen>("intro")
  const [questionsLoaded, setQuestionsLoaded] = useState(false)
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [remainingMs, setRemainingMs] = useState(TIME_PER_QUESTION_MS)
  const [lastPoints, setLastPoints] = useState(0)
  const [livesDisplay, setLivesDisplay] = useState(START_LIVES)
  const [scoreDisplay, setScoreDisplay] = useState(0)
  const [streakDisplay, setStreakDisplay] = useState(0)
  const [finalScore, setFinalScore] = useState(0)
  const [finalBestStreak, setFinalBestStreak] = useState(0)
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: number }[]>([])

  // Logic-critical values live in a ref (not state) so timers and callbacks
  // never read a stale closure — only the throttled *Display states drive
  // the UI, same pattern as the climbing game.
  const game = useRef({ lives: START_LIVES, score: 0, streak: 0, bestStreak: 0, queue: [] as Question[] })
  const poolRef = useRef<Question[]>([])

  useEffect(() => {
    fetch("/api/trivia/questions").then(r => r.json())
      .then(d => { poolRef.current = d.questions ?? [] })
      .catch(() => {})
      .finally(() => setQuestionsLoaded(true))
  }, [])

  function nextQuestion() {
    const g = game.current
    if (g.queue.length === 0) {
      if (poolRef.current.length === 0) return
      g.queue = shuffleArray(poolRef.current)
    }
    const q = g.queue.shift()
    if (!q) return
    setActiveQuestion(q)
    setSelectedIndex(null)
    setFeedback(null)
    setRemainingMs(TIME_PER_QUESTION_MS)
  }

  function startGame() {
    const g = game.current
    g.lives = START_LIVES
    g.score = 0
    g.streak = 0
    g.bestStreak = 0
    g.queue = []
    setLivesDisplay(START_LIVES)
    setScoreDisplay(0)
    setStreakDisplay(0)
    setScreen("playing")
    nextQuestion()
  }

  function endGame() {
    const g = game.current
    setFinalScore(g.score)
    setFinalBestStreak(g.bestStreak)
    setScreen("gameover")
    setActiveQuestion(null)
    fetch("/api/trivia/scores", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: g.score }),
    }).catch(() => {})
    fetch("/api/trivia/scores").then(r => r.json()).then(d => setLeaderboard(d.leaderboard ?? [])).catch(() => {})
  }

  function handleTimeout() {
    if (feedback) return
    const g = game.current
    g.streak = 0
    g.lives -= 1
    setStreakDisplay(0)
    setLivesDisplay(g.lives)
    setFeedback("timeout")
    setTimeout(() => { if (g.lives <= 0) endGame(); else nextQuestion() }, 1500)
  }

  function handleAnswer(idx: number) {
    if (feedback || !activeQuestion) return
    setSelectedIndex(idx)
    const g = game.current
    const correct = idx === activeQuestion.correctIndex
    if (correct) {
      g.streak += 1
      g.bestStreak = Math.max(g.bestStreak, g.streak)
      const speedBonus = Math.floor(remainingMs / 1000)
      const comboBonus = g.streak % 3 === 0 ? 15 : 0
      const points = 10 + speedBonus + comboBonus
      g.score += points
      setLastPoints(points)
      setScoreDisplay(g.score)
      setStreakDisplay(g.streak)
      setFeedback("correct")
    } else {
      g.streak = 0
      g.lives -= 1
      setStreakDisplay(0)
      setLivesDisplay(g.lives)
      setFeedback("wrong")
    }
    setTimeout(() => { if (g.lives <= 0) endGame(); else nextQuestion() }, 1500)
  }

  // Per-question countdown — re-armed whenever a fresh question is shown
  // (and stopped the instant it's answered or timed out).
  useEffect(() => {
    if (screen !== "playing" || !activeQuestion || feedback) return
    const id = setInterval(() => {
      setRemainingMs(prev => {
        if (prev <= 100) {
          clearInterval(id)
          handleTimeout()
          return 0
        }
        return prev - 100
      })
    }, 100)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, activeQuestion, feedback])

  const options = activeQuestion ? [activeQuestion.optionA, activeQuestion.optionB, activeQuestion.optionC, activeQuestion.optionD] : []
  const urgent = remainingMs < 5000

  return (
    <div className="min-h-screen bg-black flex flex-col items-center" dir="rtl">
      <header className="w-full max-w-md flex items-center gap-4 px-4 header-pt pb-3">
        <Link href="/student/games" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-white flex-1">חידון ידע כללי</h1>
        {screen === "playing" && (
          <div className="flex items-center gap-2 text-sm">
            <span>{"❤️".repeat(Math.max(0, livesDisplay))}{"🖤".repeat(Math.max(0, START_LIVES - livesDisplay))}</span>
            <span className="text-white/30">·</span>
            <span className="text-white/70 font-mono">{scoreDisplay} נק׳</span>
          </div>
        )}
      </header>

      {screen === "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 w-full max-w-md text-center">
          <span className="text-5xl">🧠</span>
          <p className="text-white/70 text-sm leading-relaxed">
            100 שאלות ידע כללי — גיאוגרפיה, היסטוריה, מדע, תרבות, ספורט, ישראל וטכנולוגיה.
            <br />15 שניות לכל שאלה, 3 חיים, ובונוס מהירות וקומבו על רצף תשובות נכונות.
          </p>
          <button onClick={startGame} disabled={!questionsLoaded}
            className="w-full bg-white/20 hover:bg-white/30 disabled:opacity-40 text-white font-medium py-3 rounded-xl interactive btn-press transition-colors">
            {questionsLoaded ? "התחל חידון" : "טוען שאלות..."}
          </button>
          <div className="flex items-center gap-4">
            <Link href="/student/games/trivia/duel" className="text-white/40 text-xs underline underline-offset-2">
              דו-קרב מול חבר/ה ⚔️
            </Link>
            <Link href="/student/games/trivia/leaderboard" className="text-white/40 text-xs underline underline-offset-2">
              טבלת הניקוד השכבתית
            </Link>
          </div>
        </div>
      )}

      {screen === "playing" && activeQuestion && (
        <div className="flex-1 flex flex-col w-full max-w-md px-5 py-4 gap-4">
          <div className="space-y-2">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full transition-[width] duration-100 ${urgent ? "bg-red-400" : "bg-white/60"}`}
                style={{ width: `${(remainingMs / TIME_PER_QUESTION_MS) * 100}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/40">
              <span className="bg-white/10 px-2 py-0.5 rounded-full">{CATEGORY_LABELS[activeQuestion.category] ?? "כללי"}</span>
              {streakDisplay >= 2 && <span className="text-amber-300">🔥 רצף {streakDisplay}</span>}
            </div>
          </div>

          <p className="text-white text-lg font-medium text-center py-4">{activeQuestion.text}</p>

          {feedback ? (
            <p className={`text-center text-base font-medium ${feedback === "correct" ? "text-green-400" : "text-red-400"}`}>
              {feedback === "correct" && `✅ נכון! +${lastPoints} נק׳`}
              {feedback === "wrong" && `❌ לא נכון — התשובה: ${options[activeQuestion.correctIndex]}`}
              {feedback === "timeout" && `⏱️ נגמר הזמן — התשובה: ${options[activeQuestion.correctIndex]}`}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {options.map((opt, i) => (
                <button key={i} onClick={() => handleAnswer(i)}
                  className="bg-white/10 hover:bg-white/20 text-white text-sm py-3.5 px-2 rounded-xl interactive btn-press transition-colors">
                  {opt}
                </button>
              ))}
            </div>
          )}
          {feedback && (
            <div className="grid grid-cols-2 gap-2">
              {options.map((opt, i) => {
                const isCorrect = i === activeQuestion.correctIndex
                const isPicked = i === selectedIndex
                return (
                  <div key={i}
                    className={`text-sm py-3.5 px-2 rounded-xl text-center ${
                      isCorrect ? "bg-green-500/25 text-green-300" : isPicked ? "bg-red-500/25 text-red-300" : "bg-white/5 text-white/30"
                    }`}>
                    {opt}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {screen === "gameover" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 w-full max-w-md">
          <span className="text-5xl">🧠</span>
          <p className="text-white text-xl font-light">נגמרו החיים!</p>
          <p className="text-white/70 text-3xl font-semibold">{finalScore} נק׳</p>
          {finalBestStreak >= 2 && <p className="text-amber-300/80 text-sm">🔥 הרצף הטוב ביותר: {finalBestStreak}</p>}

          <div className="w-full glass rounded-2xl overflow-hidden mt-2">
            <div className="px-4 py-2.5 border-b border-white/10 text-white/60 text-xs font-medium">טבלת הניקוד השכבתית — Top 20</div>
            <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
              {leaderboard.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-4">אין עדיין ניקוד</p>
              ) : leaderboard.map((row, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2">
                  <span className="text-white/40 text-xs w-5">{i + 1}</span>
                  <span className="flex-1 text-white/80 text-sm truncate">{row.name}</span>
                  <span className="text-white/60 text-sm font-mono">{row.score} נק׳</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={startGame}
            className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 rounded-xl interactive btn-press transition-colors">
            שחק שוב
          </button>
        </div>
      )}
    </div>
  )
}
