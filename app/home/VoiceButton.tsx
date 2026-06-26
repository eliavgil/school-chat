"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

type State = "idle" | "listening" | "processing" | "done" | "error"

export default function VoiceButton() {
  const router = useRouter()
  const [state, setState] = useState<State>("idle")
  const [reply, setReply] = useState("")
  const [transcript, setTranscript] = useState("")
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current)
      recognitionRef.current?.abort()
    }
  }, [])

  function showReply(text: string, durationMs = 4000) {
    setReply(text)
    setState("done")
    if (replyTimer.current) clearTimeout(replyTimer.current)
    replyTimer.current = setTimeout(() => {
      setState("idle")
      setReply("")
      setTranscript("")
    }, durationMs)
  }

  async function sendCommand(text: string) {
    setState("processing")
    setTranscript(text)
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      showReply(data.reply ?? "בוצע")
      if (data.action?.type === "navigate" && data.action.route) {
        setTimeout(() => router.push(data.action.route), 800)
      }
    } catch {
      setState("error")
      setReply("שגיאה בחיבור")
      replyTimer.current = setTimeout(() => { setState("idle"); setReply(""); setTranscript("") }, 3000)
    }
  }

  function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      showReply("הדפדפן אינו תומך בזיהוי קול", 3000)
      return
    }

    const rec = new SpeechRecognition()
    rec.lang = "he-IL"
    rec.interimResults = false
    rec.maxAlternatives = 1
    recognitionRef.current = rec

    rec.onstart = () => setState("listening")
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      sendCommand(text)
    }
    rec.onerror = () => {
      setState("error")
      setReply("לא הצלחתי לשמוע")
      replyTimer.current = setTimeout(() => { setState("idle"); setReply("") }, 2500)
    }
    rec.onend = () => {
      if (state === "listening") setState("idle")
    }

    rec.start()
  }

  function handlePress() {
    if (state === "listening") {
      recognitionRef.current?.stop()
      return
    }
    if (state === "idle" || state === "error") {
      startListening()
    }
  }

  const isActive = state === "listening" || state === "processing"

  return (
    <div className="fixed bottom-20 left-4 z-50 flex flex-col items-start gap-2" dir="rtl">

      {/* Reply bubble */}
      {(reply || transcript) && (
        <div className="max-w-[220px] animate-in fade-in slide-in-from-bottom-2 duration-200">
          {transcript && state === "processing" && (
            <div className="bg-white/10 rounded-2xl px-3 py-2 mb-1.5 text-white/50 text-xs text-right">
              "{transcript}"
            </div>
          )}
          {reply && (
            <div className={`rounded-2xl px-3 py-2 text-sm text-right shadow-lg ${
              state === "error" ? "bg-red-500/30 text-red-200" : "bg-white/20 text-white"
            }`}>
              {reply}
            </div>
          )}
        </div>
      )}

      {/* Mic button */}
      <button
        onPointerDown={handlePress}
        disabled={state === "processing"}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 select-none touch-none ${
          state === "listening"
            ? "bg-red-500 scale-110 shadow-red-500/40 shadow-xl"
            : state === "processing"
            ? "bg-white/20 cursor-wait"
            : state === "done"
            ? "bg-white/25"
            : "bg-white/15 hover:bg-white/25 active:scale-95"
        }`}
        aria-label="פקודה קולית"
      >
        {state === "processing" ? (
          <svg className="animate-spin w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        ) : (
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            className={isActive ? "text-white" : "text-white/70"}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 1a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19 10a7 7 0 0 1-14 0M12 19v4M8 23h8"/>
          </svg>
        )}

        {/* Pulse ring when listening */}
        {state === "listening" && (
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
        )}
      </button>
    </div>
  )
}
