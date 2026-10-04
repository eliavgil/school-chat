"use client"

import { useEffect, useRef, useState } from "react"
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
const QUESTION_INTERVAL_MS = 30_000
const OBSTACLE_SIZE = 26
const OBSTACLE_EMOJIS = ["🪨", "☄️", "⚡", "💥", "🧨"]
// More than can ever be on-screen at once (≈640 / ~90px average vertical
// gap ≈ 8, plus slack) — a fixed pool of real DOM nodes, repositioned via
// direct style writes every frame instead of going through React state.
const PLATFORM_POOL_SIZE = 16
const OBSTACLE_POOL_SIZE = 8

const CHARACTERS: { id: string; emoji: string; label: string }[] = [
  { id: "frog", emoji: "🐸", label: "צפרדע" },
  { id: "cat", emoji: "🐱", label: "חתול" },
  { id: "ninja", emoji: "🥷", label: "נינג׳ה" },
  { id: "rocket", emoji: "🚀", label: "רקטה" },
]

interface Platform { x: number; y: number; scale: number }
interface Obstacle { x: number; y: number; vy: number; emoji: string }
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

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatTime(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60).toString().padStart(2, "0")
  const s = (totalSec % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}

export default function ClimbGamePage() {
  const [screen, setScreen] = useState<Screen>("select")
  const [character, setCharacter] = useState<string>("frog")
  const [displayScore, setDisplayScore] = useState(0)
  const [displayTime, setDisplayTime] = useState("00:00")
  const [finalScore, setFinalScore] = useState(0)
  const [disqualified, setDisqualified] = useState(false)
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
    obstacles: [] as Obstacle[],
    questionQueue: [] as Question[],
    cameraTop: 0, // world-y that maps to screen-y 0; only ever decreases
    maxClimb: 0,
    paused: false,
    nextQuestionAt: 0,
    nextObstacleAt: 0,
    startTime: 0,
    rafId: 0,
    running: false,
    lastScoreUpdate: 0,
  })

  // DOM sprite refs — character, book platforms and falling obstacles are
  // plain positioned <div>s with real emoji text in them (not canvas
  // fillText, which doesn't reliably render emoji glyphs on iOS Safari —
  // the gradient background and the score counter are normal DOM/React, so
  // only canvas-drawn emoji were ever invisible). Positions are written
  // directly via style.transform in the game loop, bypassing React
  // entirely so this stays smooth at 60fps.
  const playerElRef = useRef<HTMLDivElement>(null)
  const platformElRefs = useRef<(HTMLDivElement | null)[]>([])
  const obstacleElRefs = useRef<(HTMLDivElement | null)[]>([])

  const questionsRef = useRef<Question[]>([])
  useEffect(() => {
    fetch("/api/game/questions").then(r => r.json()).then(d => { questionsRef.current = d.questions ?? [] }).catch(() => {})
  }, [])

  const movingLeftRef = useRef(false)
  const movingRightRef = useRef(false)
  useEffect(() => { movingLeftRef.current = movingLeft }, [movingLeft])
  useEffect(() => { movingRightRef.current = movingRight }, [movingRight])

  function makePlatform(y: number): Platform {
    const scale = 0.7 + Math.random() * 0.8
    const effW = PLATFORM_W * scale
    return { x: 20 + Math.random() * (CANVAS_W - 40 - effW), y, scale }
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

  function spawnObstacle() {
    const g = game.current
    g.obstacles.push({
      x: Math.random() * (CANVAS_W - OBSTACLE_SIZE),
      y: g.cameraTop - 40,
      vy: 2.6 + Math.random() * 1.8,
      emoji: OBSTACLE_EMOJIS[Math.floor(Math.random() * OBSTACLE_EMOJIS.length)],
    })
    g.nextObstacleAt = performance.now() + (3200 + Math.random() * 2600)
  }

  function endGame(reason: "fell" | "hit") {
    const g = game.current
    g.running = false
    if (g.rafId) cancelAnimationFrame(g.rafId)
    const score = Math.max(0, Math.floor(g.maxClimb / 10))
    setFinalScore(score)
    setDisqualified(reason === "hit")
    setScreen("gameover")
    fetch("/api/game/scores", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, characterId: character }),
    }).catch(() => {})
    fetch("/api/game/scores").then(r => r.json()).then(d => setLeaderboard(d.leaderboard ?? [])).catch(() => {})
  }

  function triggerQuestion() {
    const g = game.current
    if (g.questionQueue.length === 0) {
      const pool = questionsRef.current
      if (pool.length === 0) return
      g.questionQueue = shuffleArray(pool)
    }
    const q = g.questionQueue.shift()
    if (!q) return
    g.paused = true
    setActiveQuestion(q)
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

  function loop() {
    const g = game.current
    if (!g.running) return

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

      // Landing: falling, and within a platform's (scaled) x-range at its y.
      if (p.vy > 0) {
        for (const plat of g.platforms) {
          const effW = PLATFORM_W * plat.scale
          if (
            p.y + PLAYER_SIZE / 2 >= plat.y && p.y + PLAYER_SIZE / 2 <= plat.y + PLATFORM_H + Math.abs(p.vy) &&
            p.x + PLAYER_SIZE / 2 > plat.x && p.x - PLAYER_SIZE / 2 < plat.x + effW
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
        endGame("fell")
        return
      }

      if (performance.now() >= g.nextObstacleAt) spawnObstacle()
      for (const ob of g.obstacles) ob.y += ob.vy
      g.obstacles = g.obstacles.filter(ob => ob.y - g.cameraTop < CANVAS_H + 60)

      for (const ob of g.obstacles) {
        if (
          p.x + PLAYER_SIZE / 2 > ob.x && p.x - PLAYER_SIZE / 2 < ob.x + OBSTACLE_SIZE &&
          p.y + PLAYER_SIZE / 2 > ob.y && p.y - PLAYER_SIZE / 2 < ob.y + OBSTACLE_SIZE
        ) {
          endGame("hit")
          return
        }
      }

      if (performance.now() >= g.nextQuestionAt) triggerQuestion()
    }

    // Throttled — updating React state every animation frame (60/s) to
    // move a number in the header is unnecessary re-render churn. The
    // stopwatch keeps running even through a paused question overlay.
    const now = performance.now()
    if (now - g.lastScoreUpdate > 150) {
      g.lastScoreUpdate = now
      setDisplayTime(formatTime(now - g.startTime))
      if (!g.paused) setDisplayScore(Math.floor(g.maxClimb / 10))
    }

    // ── position the DOM sprites (runs even while paused, so nothing jumps
    // when a question overlay closes) ──
    const playerEl = playerElRef.current
    if (playerEl) {
      playerEl.style.transform = `translate(${game.current.player.x - PLAYER_SIZE / 2}px, ${game.current.player.y - game.current.cameraTop - PLAYER_SIZE / 2}px)`
    }
    const pool = platformElRefs.current
    let shown = 0
    for (const plat of game.current.platforms) {
      const sy = plat.y - game.current.cameraTop
      if (sy < -40 || sy > CANVAS_H + 40) continue
      if (shown >= PLATFORM_POOL_SIZE) break
      const el = pool[shown]
      if (el) {
        el.style.display = "flex"
        el.style.transform = `translate(${plat.x}px, ${sy}px) scale(${plat.scale})`
      }
      shown++
    }
    for (let i = shown; i < PLATFORM_POOL_SIZE; i++) {
      const el = pool[i]
      if (el) el.style.display = "none"
    }

    const obPool = obstacleElRefs.current
    let obShown = 0
    for (const ob of game.current.obstacles) {
      const sy = ob.y - game.current.cameraTop
      if (sy < -40 || sy > CANVAS_H + 40) continue
      if (obShown >= OBSTACLE_POOL_SIZE) break
      const el = obPool[obShown]
      if (el) {
        el.style.display = "flex"
        el.style.transform = `translate(${ob.x}px, ${sy}px)`
        if (el.textContent !== ob.emoji) el.textContent = ob.emoji
      }
      obShown++
    }
    for (let i = obShown; i < OBSTACLE_POOL_SIZE; i++) {
      const el = obPool[i]
      if (el) el.style.display = "none"
    }

    game.current.rafId = requestAnimationFrame(loop)
  }

  function startGame() {
    const g = game.current
    g.player = { x: CANVAS_W / 2, y: CANVAS_H - 80, vx: 0, vy: 0 }
    g.platforms = [{ x: CANVAS_W / 2 - PLATFORM_W / 2, y: CANVAS_H - 30, scale: 1 }]
    g.obstacles = []
    g.questionQueue = []
    g.cameraTop = 0
    g.maxClimb = 0
    g.paused = false
    g.nextQuestionAt = performance.now() + QUESTION_INTERVAL_MS
    g.nextObstacleAt = performance.now() + (3200 + Math.random() * 2600)
    g.startTime = performance.now()
    g.lastScoreUpdate = 0
    g.running = true
    ensurePlatformsAbove(0)
    setDisplayScore(0)
    setDisplayTime("00:00")
    setDisqualified(false)
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

  const characterEmoji = CHARACTERS.find(c => c.id === character)?.emoji ?? "🐸"

  return (
    <div className="min-h-screen bg-black flex flex-col items-center" dir="rtl">
      <header className="w-full max-w-md flex items-center gap-4 px-4 header-pt pb-3">
        <Link href="/student/games" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-white flex-1">טיפוס האילנות</h1>
        {screen === "playing" && (
          <div className="flex items-center gap-2 text-white/70 text-sm font-mono">
            <span>{displayTime}</span>
            <span className="text-white/30">·</span>
            <span>{displayScore}מ׳</span>
          </div>
        )}
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

      {/* Mounted while playing — a dir="ltr" wrapper so translate(x,y) always
          means screen-physical pixels, never mirrored by the page's own RTL. */}
      {screen === "playing" && (
        <div className="relative overflow-hidden" dir="ltr" style={{ width: CANVAS_W, height: CANVAS_H, maxWidth: "100vw" }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #1e3a5f, #0b1a2e)" }} />

          {/* Platforms render as rows of books — scale varies per-platform via
              CSS transform scale() (anchored top-left to match the collision
              box math in loop()), not font-size, so one div handles any size. */}
          {Array.from({ length: PLATFORM_POOL_SIZE }).map((_, i) => (
            <div key={i} ref={el => { platformElRefs.current[i] = el }}
              className="absolute top-0 left-0 items-center justify-center text-[16px] leading-none select-none tracking-tighter"
              style={{ width: PLATFORM_W, height: 34, display: "none", transformOrigin: "0 0" }}>
              📚📚📚
            </div>
          ))}

          {Array.from({ length: OBSTACLE_POOL_SIZE }).map((_, i) => (
            <div key={i} ref={el => { obstacleElRefs.current[i] = el }}
              className="absolute top-0 left-0 flex items-center justify-center text-[22px] leading-none select-none"
              style={{ width: OBSTACLE_SIZE, height: OBSTACLE_SIZE, display: "none" }} />
          ))}

          <div ref={playerElRef}
            className="absolute top-0 left-0 flex items-center justify-center text-[28px] leading-none select-none"
            style={{ width: PLAYER_SIZE, height: PLAYER_SIZE }}>
            {characterEmoji}
          </div>

          {activeQuestion && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-5" dir="rtl">
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
            <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4" dir="ltr">
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
          <span className="text-5xl">{disqualified ? "💥" : "🏁"}</span>
          <p className="text-white text-xl font-light">{disqualified ? "נפסלת! נפגעת מעצם נופל" : "נפלת!"}</p>
          <p className="text-white/70 text-3xl font-semibold">{finalScore} מטר</p>
          <p className="text-white/40 text-sm font-mono">זמן: {displayTime}</p>

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
