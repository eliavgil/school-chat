"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

type State = "idle" | "listening" | "processing" | "done" | "error"

export default function VoiceButton() {
  const router = useRouter()
  const [state, setState] = useState<State>("idle")
  const stateRef = useRef<State>("idle")
  const [reply, setReply] = useState("")
  const [transcript, setTranscript] = useState("")
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recognitionRef = useRef<any>(null)

  function setS(s: State) {
    stateRef.current = s
    setState(s)
  }

  useEffect(() => {
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current)
      recognitionRef.current?.abort()
    }
  }, [])

  function showReply(text: string, durationMs = 5000) {
    setReply(text)
    setS("done")
    if (replyTimer.current) clearTimeout(replyTimer.current)
    replyTimer.current = setTimeout(() => {
      setS("idle")
      setReply("")
      setTranscript("")
    }, durationMs)
  }

  async function sendCommand(text: string) {
    setS("processing")
    setTranscript(text)
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) {
        showReply(data.reply ?? data.error ?? `שגיאה ${res.status}`, 5000)
        return
      }
      showReply(data.reply ?? "בוצע")
      if (data.action?.type === "navigate" && data.action.route) {
        setTimeout(() => router.push(data.action.route), 900)
      }
    } catch {
      setS("error")
      setReply("שגיאה בחיבור")
      replyTimer.current = setTimeout(() => { setS("idle"); setReply(""); setTranscript("") }, 3000)
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

    rec.onstart  = () => setS("listening")
    rec.onresult = (e: any) => sendCommand(e.results[0][0].transcript)
    rec.onerror  = (e: any) => {
      if (e.error === "no-speech") {
        setS("idle")
        return
      }
      setS("error")
      setReply("לא הצלחתי לשמוע")
      replyTimer.current = setTimeout(() => { setS("idle"); setReply("") }, 2500)
    }
    rec.onend = () => { if (stateRef.current === "listening") setS("idle") }
    rec.start()
  }

  function handlePress() {
    if (stateRef.current === "listening") { recognitionRef.current?.stop(); return }
    if (stateRef.current === "idle" || stateRef.current === "error") startListening()
  }

  const isListening   = state === "listening"
  const isProcessing  = state === "processing"

  return (
    <div className="flex flex-col items-center gap-3 pt-2 pb-1">

      {/* Reply / transcript bubble */}
      {(reply || (transcript && isProcessing)) && (
        <div className="max-w-xs w-full animate-in fade-in slide-in-from-bottom-2 duration-300 text-center">
          {transcript && isProcessing && (
            <p className="text-white/40 text-xs mb-1">"{transcript}"</p>
          )}
          {reply && (
            <div className={`inline-block rounded-2xl px-4 py-2 text-sm shadow-lg ${
              state === "error" ? "bg-red-500/25 text-red-200" : "bg-white/15 text-white"
            }`}>
              {reply}
            </div>
          )}
        </div>
      )}

      {/* Large round mic button */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow ring when listening */}
        {isListening && (
          <span className="absolute w-24 h-24 rounded-full bg-red-400/20 animate-ping" />
        )}
        <button
          onPointerDown={handlePress}
          disabled={isProcessing}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 select-none touch-none border ${
            isListening
              ? "bg-red-500 border-red-400/60 scale-110 shadow-red-500/40"
              : isProcessing
              ? "bg-white/10 border-white/15 cursor-wait"
              : state === "done"
              ? "bg-white/20 border-white/30"
              : "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/35 active:scale-95"
          }`}
          aria-label="פקודה קולית"
        >
          {isProcessing ? (
            <svg className="animate-spin w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
              className={isListening ? "text-white" : "text-white/65"}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 1a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 10a7 7 0 0 1-14 0M12 19v4M8 23h8"/>
            </svg>
          )}
        </button>
      </div>

      {/* Label */}
      <p className={`text-xs transition-colors duration-200 ${
        isListening ? "text-red-300" : "text-white/30"
      }`}>
        {isListening ? "מאזין..." : isProcessing ? "מעבד..." : state === "done" ? "" : "לחץ לפקודה קולית"}
      </p>
    </div>
  )
}
