"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"

const CANVAS_W = 360
const CANVAS_H = 640
const GRAVITY = 0.42
const JUMP_VELOCITY = -10.5
const BOOST_VELOCITY = -13.5
const MOVE_SPEED = 4.2
const PLAYER_SIZE = 30
const PLATFORM_W = 56
const PLATFORM_H = 12
const QUESTION_INTERVAL_MS = 45_000

const CHARACTERS: { id: string; emoji: string; label: string }[] = [
  { id: "frog", emoji: "🐸", label: "צפרדע" },
  { id: "cat", emoji: "🐱", label: "חתול" },
  { id: "ninja", emoji: "🥷", label: "נינג׳ה" },
  { id: "rocket", emoji: "🚀", label: "רקטה" },
]

interface Platform { x: number; y: number }
interface Question {
  id: string
  subject: string
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctIndex: number
}

type Screen = "select" | "playing" | "gameover"

export default function ClimbGamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [screen, setScreen] = useState<Screen>("select")
  const [character, setCharacter] = useState<string>("frog")
  const [displayScore, setDisplayScore] = useState(0)
  const [finalScore, setFinalScore] = useState(0)
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null)
  const [answerFeedback, setAnswerFeedback] = useState<"correct" | "wrong" | null>(null)
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: number; characterId: string }[]>([])
  const [movingLeft, setMovingLeft] = useState(false)
  const [movingRight, setMovingRight] = useState(false)

  // Mutable game state lives in refs — updated every animation frame, never
  // triggers a re-render on its own (only the throttled score/UI state does).
  const game = useRef({
    player: { x: CANVAS_W / 2, y: CANVAS_H - 80, vx: 0, vy: 0 },
    platforms: [] as Platform[],
    cameraTop: 0, // world-y that maps to screen-y 0; only ever decreases
    maxClimb: 0,
    paused: false,
    nextQuestionAt: 0,
    rafId: 0,
    running: false,
    lastScoreUpdate: 0,
  })

  // A plain ref, not state — the loop below is a useCallback with a fixed
  // dependency array ([character]), so a plain function it calls (like
  // triggerQuestion) closes over whatever `questions` *state* existed at
  // the moment that callback was created. If the user never touches the
  // character buttons, that's mount time — before this fetch resolves —
  // so the question bank would stay permanently empty from the loop's
  // point of view even after setQuestions fires. A ref has no such
  // staleness: .current is always the latest value, read fresh every time.
  const questionsRef = useRef<Question[]>([])
  useEffect(() => {
    fetch("/api/game/questions").then(r => r.json()).then(d => { questionsRef.current = d.questions ?? [] }).catch(() => {})
  }, [])

  const movingLeftRef = useRef(false)
  const movingRightRef = useRef(false)
  useEffect(() => { movingLeftRef.current = movingLeft }, [movingLeft])
  useEffect(() => { movingRightRef.current = movingRight }, [movingRight])

  function makePlatform(y: number): Platform {
    return { x: 20 + Math.random() * (CANVAS_W - 40 - PLATFORM_W), y }
  }

  function ensurePlatformsAbove(topWorldY: number) {
    const g = game.current
    while (g.platforms.length === 0 || g.platforms[g.platforms.length - 1].y > topWorldY - 400) {
      const lastY = g.platforms.length ? g.platforms[g.platforms.length - 1].y : CANVAS_H - 20
      g.platforms.push(makePlatform(lastY - (70 + Math.random() * 55)))
    }
    // Drop platforms far below the camera so the array doesn't grow forever.
    g.platforms = g.platforms.filter(p => p.y < g.cameraTop + CANVAS_H + 200)
  }

  function endGame() {
    const g = game.current
    g.running = false
    if (g.rafId) cancelAnimationFrame(g.rafId)
    const score = Math.max(0, Math.floor(g.maxClimb / 10))
    setFinalScore(score)
    setScreen("gameover")
    fetch("/api/game/scores", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, characterId: character }),
    }).catch(() => {})
    fetch("/api/game/scores").then(r => r.json()).then(d => setLeaderboard(d.leaderboard ?? [])).catch(() => {})
  }

  function triggerQuestion() {
    const qs = questionsRef.current
    if (qs.length === 0) return
    game.current.paused = true
    setActiveQuestion(qs[Math.floor(Math.random() * qs.length)])
  }

  function answerQuestion(idx: number) {
    if (!activeQuestion) return
    const correct = idx === activeQuestion.correctIndex
    setAnswerFeedback(correct ? "correct" : "wrong")
    if (correct) game.current.player.vy = BOOST_VELOCITY
    setTimeout(() => {
      setActiveQuestion(null)
      setAnswerFeedback(null)
      game.current.paused = false
      game.current.nextQuestionAt = performance.now() + QUESTION_INTERVAL_MS
    }, 1100)
  }

  const loop = useCallback(() => {
    const g = game.current
    if (!g.running) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) { g.rafId = requestAnimationFrame(loop); return }

    if (!g.paused) {
      const p = g.player
      if (movingLeftRef.current) p.vx = -MOVE_SPEED
      else if (movingRightRef.current) p.vx = MOVE_SPEED
      else p.vx = 0

      p.vy += GRAVITY
      p.x += p.vx
      p.y += p.vy
      if (p.x < -PLAYER_SIZE / 2) p.x = CANVAS_W + PLAYER_SIZE / 2
      if (p.x > CANVAS_W + PLAYER_SIZE / 2) p.x = -PLAYER_SIZE / 2

      // Landing: falling, and within a platform's x-range at its y.
      if (p.vy > 0) {
        for (const plat of g.platforms) {
          if (
            p.y + PLAYER_SIZE / 2 >= plat.y && p.y + PLAYER_SIZE / 2 <= plat.y + PLATFORM_H + Math.abs(p.vy) &&
            p.x + PLAYER_SIZE / 2 > plat.x && p.x - PLAYER_SIZE / 2 < plat.x + PLATFORM_W
          ) {
            p.vy = JUMP_VELOCITY
            break
          }
        }
      }

      const screenY = p.y - g.cameraTop
      if (screenY < CANVAS_H * 0.42) g.cameraTop = p.y - CANVAS_H * 0.42
      g.maxClimb = Math.max(g.maxClimb, -g.cameraTop)

      ensurePlatformsAbove(g.cameraTop)

      if (p.y - g.cameraTop > CANVAS_H + PLAYER_SIZE) {
        endGame()
        return
      }

      if (performance.now() >= g.nextQuestionAt) triggerQuestion()

      // Throttled — updating React state every animation frame (60/s) to
      // move a number in the header is unnecessary re-render churn.
      const now = performance.now()
      if (now - g.lastScoreUpdate > 150) {
        g.lastScoreUpdate = now
        setDisplayScore(Math.floor(g.maxClimb / 10))
      }
    }

    // ── draw ──
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
    grad.addColorStop(0, "#1e3a5f")
    grad.addColorStop(1, "#0b1a2e")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    ctx.font = "32px sans-serif"
    ctx.textAlign = "center"
    for (const plat of g.platforms) {
      const sy = plat.y - g.cameraTop
      if (sy < -40 || sy > CANVAS_H + 40) continue
      ctx.fillText("🌳", plat.x + PLATFORM_W / 2, sy + 28)
    }

    const char = CHARACTERS.find(c => c.id === character)?.emoji ?? "🐸"
    ctx.font = "30px sans-serif"
    ctx.fillText(char, g.player.x, g.player.y - g.cameraTop + 10)

    g.rafId = requestAnimationFrame(loop)
  }, [character])

  function startGame() {
    const g = game.current
    g.player = { x: CANVAS_W / 2, y: CANVAS_H - 80, vx: 0, vy: 0 }
    g.platforms = [{ x: CANVAS_W / 2 - PLATFORM_W / 2, y: CANVAS_H - 30 }]
    g.cameraTop = 0
    g.maxClimb = 0
    g.paused = false
    g.nextQuestionAt = performance.now() + QUESTION_INTERVAL_MS
    g.lastScoreUpdate = 0
    g.running = true
    ensurePlatformsAbove(0)
    setDisplayScore(0)
    setScreen("playing")
    g.rafId = requestAnimationFrame(loop)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (screen !== "playing") return
      if (e.key === "ArrowLeft" || e.key === "a") setMovingLeft(true)
      if (e.key === "ArrowRight" || e.key === "d") setMovingRight(true)
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a") setMovingLeft(false)
      if (e.key === "ArrowRight" || e.key === "d") setMovingRight(false)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [screen])

  useEffect(() => {
    return () => { if (game.current.rafId) cancelAnimationFrame(game.current.rafId) }
  }, [])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center" dir="rtl">
      <header className="w-full max-w-md flex items-center gap-4 px-4 header-pt pb-3">
        <Link href="/student/games" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-white flex-1">טיפוס האילנות</h1>
        {screen === "playing" && <span className="text-white/70 text-sm font-mono">{displayScore}מ׳</span>}
      </header>

      {screen === "select" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 w-full max-w-md">
          <p className="text-white/70 text-sm">בחר/י דמות</p>
          <div className="grid grid-cols-2 gap-3 w-full">
            {CHARACTERS.map(c => (
              <button key={c.id} onClick={() => setCharacter(c.id)}
                className={`rounded-2xl py-6 flex flex-col items-center gap-2 border transition-colors interactive btn-press ${
                  character === c.id ? "bg-white/20 border-white/40" : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}>
                <span className="text-4xl">{c.emoji}</span>
                <span className="text-white/70 text-xs">{c.label}</span>
              </button>
            ))}
          </div>
          <button onClick={startGame}
            className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 rounded-xl interactive btn-press transition-colors">
            התחל משחק
          </button>
          <Link href="/student/games/climb/leaderboard" className="text-white/40 text-xs underline underline-offset-2">
            טבלת הניקוד השכבתית
          </Link>
        </div>
      )}

      {screen === "playing" && (
        <div className="relative" style={{ width: CANVAS_W, maxWidth: "100vw" }}>
          <canvas
            ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
            style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}
          />
          {activeQuestion && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-5">
              <div className="w-full space-y-3">
                <p className="text-white/50 text-xs text-center">
                  {activeQuestion.subject === "english" ? "אנגלית" : "מתמטיקה"} — ענה נכון לבוסט!
                </p>
                <p className="text-white text-lg font-medium text-center mb-2">{activeQuestion.text}</p>
                {answerFeedback ? (
                  <p className={`text-center text-2xl ${answerFeedback === "correct" ? "text-green-400" : "text-red-400"}`}>
                    {answerFeedback === "correct" ? "✅ נכון! בוסט!" : "❌ לא נכון"}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {[activeQuestion.optionA, activeQuestion.optionB, activeQuestion.optionC, activeQuestion.optionD].map((opt, i) => (
                      <button key={i} onClick={() => answerQuestion(i)}
                        className="bg-white/10 hover:bg-white/20 text-white text-sm py-3 rounded-xl interactive btn-press transition-colors">
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {!activeQuestion && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4">
              <button
                onPointerDown={() => setMovingLeft(true)} onPointerUp={() => setMovingLeft(false)} onPointerLeave={() => setMovingLeft(false)}
                className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center text-white text-2xl select-none touch-none">←</button>
              <button
                onPointerDown={() => setMovingRight(true)} onPointerUp={() => setMovingRight(false)} onPointerLeave={() => setMovingRight(false)}
                className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center text-white text-2xl select-none touch-none">→</button>
            </div>
          )}
        </div>
      )}

      {screen === "gameover" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 w-full max-w-md">
          <span className="text-5xl">🏁</span>
          <p className="text-white text-xl font-light">נפלת!</p>
          <p className="text-white/70 text-3xl font-semibold">{finalScore} מטר</p>

          <div className="w-full glass rounded-2xl overflow-hidden mt-2">
            <div className="px-4 py-2.5 border-b border-white/10 text-white/60 text-xs font-medium">טבלת הניקוד השכבתית — Top 20</div>
            <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
              {leaderboard.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-4">אין עדיין ניקוד</p>
              ) : leaderboard.map((row, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2">
                  <span className="text-white/40 text-xs w-5">{i + 1}</span>
                  <span className="text-lg">{CHARACTERS.find(c => c.id === row.characterId)?.emoji ?? "🐸"}</span>
                  <span className="flex-1 text-white/80 text-sm truncate">{row.name}</span>
                  <span className="text-white/60 text-sm font-mono">{row.score}מ׳</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setScreen("select")}
            className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 rounded-xl interactive btn-press transition-colors">
            שחק שוב
          </button>
        </div>
      )}
    </div>
  )
}
