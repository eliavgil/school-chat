"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type State = "idle" | "listening" | "processing"

interface Message {
  role: "user" | "assistant"
  text: string
}

interface ApiHistory {
  role: string
  content: any
}

export default function VoiceButton() {
  const router = useRouter()
  const [state, setState] = useState<State>("idle")
  const stateRef = useRef<State>("idle")
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [followUp, setFollowUp] = useState("")
  const [apiHistory, setApiHistory] = useState<ApiHistory[]>([])
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    return () => recognitionRef.current?.abort()
  }, [])

  function setS(s: State) {
    stateRef.current = s
    setState(s)
  }

  function addMessage(role: "user" | "assistant", text: string) {
    setMessages(prev => [...prev, { role, text }])
  }

  async function sendText(text: string) {
    setS("processing")
    addMessage("user", text)
    setFollowUp("")
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, history: apiHistory }),
      })
      const data = await res.json()
      addMessage("assistant", data.reply ?? "בוצע")
      if (data.history) setApiHistory(data.history)
      if (data.action?.type === "navigate" && data.action.route) {
        setTimeout(() => router.push(data.action.route), 1200)
      }
    } catch {
      addMessage("assistant", "שגיאה בחיבור לשרת")
    } finally {
      setS("idle")
    }
  }

  function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      addMessage("assistant", "הדפדפן אינו תומך בזיהוי קול")
      setOpen(true)
      return
    }
    const rec = new SpeechRecognition()
    rec.lang = "he-IL"
    rec.interimResults = false
    rec.maxAlternatives = 1
    recognitionRef.current = rec

    rec.onstart = () => { setS("listening"); setOpen(true) }
    rec.onresult = (e: any) => sendText(e.results[0][0].transcript)
    rec.onerror = (e: any) => {
      if (e.error === "no-speech") { setS("idle"); return }
      addMessage("assistant", "לא הצלחתי לשמוע, נסה שוב")
      setS("idle")
    }
    rec.onend = () => { if (stateRef.current === "listening") setS("idle") }
    rec.start()
  }

  function handleMicPress() {
    if (stateRef.current === "listening") { recognitionRef.current?.stop(); return }
    if (stateRef.current === "idle") startListening()
  }

  function handleClose() {
    setOpen(false)
    setMessages([])
    setApiHistory([])
    setFollowUp("")
  }

  function handleFollowUpKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && followUp.trim()) {
      e.preventDefault()
      sendText(followUp.trim())
    }
  }

  const isListening = state === "listening"
  const isProcessing = state === "processing"

  return (
    <div className="flex flex-col items-center gap-3 pt-1 pb-2">

      {/* Conversation card */}
      {open && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="glass rounded-2xl border border-white/15 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-xs">עוזר קולי</span>
                <Link
                  href="/voice-help"
                  className="text-[10px] text-white/30 hover:text-white/55 bg-white/8 hover:bg-white/12 rounded-full px-2 py-0.5 transition-colors"
                >
                  הוראות הפעלה
                </Link>
              </div>
              <button onClick={handleClose} className="text-white/30 hover:text-white/60 transition-colors p-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="px-4 py-3 space-y-2.5 max-h-52 overflow-y-auto">
              {messages.length === 0 && isListening && (
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-white/15 text-white"
                      : "bg-white/8 text-white/85"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isProcessing && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-white/8 rounded-xl px-3 py-2 flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input row */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/10">
              {/* Mic button (small) */}
              <button
                onPointerDown={handleMicPress}
                disabled={isProcessing}
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-red-500 shadow-lg shadow-red-500/30"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {isListening ? (
                  <span className="w-3 h-3 rounded-sm bg-white" />
                ) : (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-white/70">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 10a7 7 0 0 1-14 0M12 19v4M8 23h8"/>
                  </svg>
                )}
              </button>

              {/* Text input */}
              <input
                type="text"
                value={followUp}
                onChange={e => setFollowUp(e.target.value)}
                onKeyDown={handleFollowUpKey}
                placeholder={isListening ? "מאזין..." : "המשך..."}
                disabled={isListening || isProcessing}
                dir="rtl"
                className="flex-1 bg-white/8 rounded-xl px-3 py-1.5 text-sm text-white placeholder-white/25 outline-none border border-transparent focus:border-white/20 disabled:opacity-40"
              />

              {/* Send button */}
              <button
                onClick={() => followUp.trim() && sendText(followUp.trim())}
                disabled={!followUp.trim() || isListening || isProcessing}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-white/70 rotate-180">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 9-18 9V3zM3 12h18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main mic button */}
      <div className="relative flex items-center justify-center">
        {isListening && (
          <span className="absolute w-24 h-24 rounded-full bg-red-400/20 animate-ping" />
        )}
        <button
          onPointerDown={!open ? handleMicPress : undefined}
          onClick={open ? handleMicPress : undefined}
          disabled={isProcessing}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 select-none touch-none border ${
            isListening
              ? "bg-red-500 border-red-400/60 scale-110 shadow-red-500/40"
              : isProcessing
              ? "bg-white/10 border-white/15 cursor-wait"
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

      <p className={`text-xs transition-colors duration-200 ${
        isListening ? "text-red-300" : "text-white/30"
      }`}>
        {isListening ? "מאזין... (לחץ לעצור)" : isProcessing ? "מעבד..." : "לחץ לפקודה קולית"}
      </p>
    </div>
  )
}
