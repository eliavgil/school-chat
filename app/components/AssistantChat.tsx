"use client"

import { useEffect, useRef, useState, Fragment } from "react"
import RobotMascot from "./RobotMascot"

interface Message { role: "user" | "bot"; text: string; needsHelp?: boolean }

const URL_PATTERN = /(https?:\/\/[^\s)]+)/g
// The model prefixes an "I don't know" answer with this hidden marker so
// the UI can swap in the confused mascot + escalation prompt instead of
// just showing the raw text — stripped before display either way.
const NEEDS_HELP_MARKER = "[[NEEDS_HELP]]"

// The bot is instructed to include plain https:// URLs (not markdown
// links) when handing out a link, so a message can just be scanned for
// URL substrings — no markdown parser needed. Only applied to settled
// messages, not the live-streaming text, so a URL never renders half-cut.
function linkify(text: string) {
  // split() with one capturing group interleaves as [text, match, text,
  // match, ...] — odd indices are always the captured URLs, so no need
  // to re-test each part (and re-testing a global regex via .test() has
  // its own lastIndex footgun).
  const parts = text.split(URL_PATTERN)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline break-all" onClick={e => e.stopPropagation()}>{part}</a>
      : <Fragment key={i}>{part}</Fragment>
  )
}

const EXAMPLE_QUESTIONS = [
  "מתי מחלקים תעודות מחצית?",
  "באיזה גוש מגמות מגמת ביולוגיה?",
  "מתי מסיימים ללמוד היום?",
  "איפה משיגים טופס אישור יציאה לטיול?",
  "מה המייל של המורה שלי לאזרחות?",
  "מי יודע מדוע ולמה לובשת הזברה פיג'מה?",
]

function MiniMascot({ talking }: { talking?: boolean }) {
  return (
    <div className="w-9 h-9 flex-shrink-0 mt-0.5">
      <RobotMascot state={talking ? "talking" : "idle"} size={36} />
    </div>
  )
}

// Per-message feedback: 👎 always available, plus the inline "forward to
// the coordinator?" prompt that appears after a needs-help answer or a
// flag click. Reports who asked (studentName isn't handled here — the
// server already knows the caller from the session).
function FeedbackRow({ question, answer, needsHelp }: { question: string; answer: string; needsHelp?: boolean }) {
  const [state, setState] = useState<"idle" | "confirming" | "sent">(needsHelp ? "confirming" : "idle")
  const [reason, setReason] = useState<"dont_know" | "flagged_wrong">(needsHelp ? "dont_know" : "flagged_wrong")

  async function confirmSend() {
    setState("sent")
    await fetch("/api/assistant/escalate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer, reason }),
    }).catch(() => {})
  }

  if (state === "sent") {
    return <p className="text-[11px] text-emerald-700/70 mt-1">✓ הועבר — תודה שעזרת לי להשתפר!</p>
  }

  if (state === "confirming") {
    return (
      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-stone-500">להעביר את זה אליו כדי שאשתפר?</span>
        <button onClick={confirmSend} className="text-[11px] text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full interactive">כן</button>
        <button onClick={() => setState("idle")} className="text-[11px] text-stone-400 hover:text-stone-600 interactive px-1">לא תודה</button>
      </div>
    )
  }

  return (
    <button onClick={() => { setReason("flagged_wrong"); setState("confirming") }}
      className="text-[11px] text-stone-300 hover:text-stone-500 interactive mt-1">
      👎 זה לא נכון
    </button>
  )
}

export default function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, loading])

  async function send(text?: string) {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setError(null)
    setInput("")
    setMessages(prev => [...prev, { role: "user", text: q }])
    setLoading(true)
    setStreamingText("")

    const res = await fetch("/api/assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    })

    if (res.status === 429) {
      const data = await res.json()
      setMessages(prev => [...prev, { role: "bot", text: data.error ?? "הגעת למגבלת הבקשות. נסה שוב בעוד שעה." }])
      setLoading(false)
      return
    }
    if (!res.ok || !res.body) {
      setError("שגיאה בטעינת תשובה — נסה שוב")
      setLoading(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let fullText = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n\n")
      buffer = lines.pop() ?? ""
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        try {
          const json = JSON.parse(line.slice(6))
          if (json.text) { fullText += json.text; setStreamingText(fullText) }
          if (json.done) {
            const needsHelp = fullText.startsWith(NEEDS_HELP_MARKER)
            const clean = needsHelp ? fullText.slice(NEEDS_HELP_MARKER.length).trim() : fullText
            setMessages(prev => [...prev, { role: "bot", text: clean || "שגיאה — נסה שוב", needsHelp }])
            setStreamingText("")
          }
        } catch {}
      }
    }
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center pt-2 pb-4">
            <div className="mb-1"><RobotMascot state="idle" size={148} /></div>
            <p className="text-stone-800 font-bold text-lg">ד״ר פקפקובי</p>
            <p className="text-stone-400 text-xs mb-5">העוזר האישי שלך — תאריכים, מגמות, טפסים ועוד</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {EXAMPLE_QUESTIONS.map((q, i) => (
                <button key={q} onClick={() => send(q)}
                  className="rm-bubble bg-amber-50 hover:bg-amber-100 border border-amber-200/70 text-stone-700 text-xs px-3 py-1.5 rounded-2xl interactive btn-press transition-colors"
                  style={{ animationDelay: `${i * 0.35}s` }}>
                  {q}
                </button>
              ))}
            </div>
            <style jsx>{`
              .rm-bubble { animation: rm-float 3.6s ease-in-out infinite; }
              @keyframes rm-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
              @media (prefers-reduced-motion: reduce) { .rm-bubble { animation: none; } }
            `}</style>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {m.role === "bot" && <MiniMascot />}
            <div className="max-w-[80%]">
              <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user" ? "bg-stone-900 text-white rounded-tr-sm" :
                m.needsHelp ? "bg-amber-50 border border-amber-200 text-stone-800 rounded-tl-sm" : "bg-stone-100 text-stone-800 rounded-tl-sm"
              }`}>
                {m.role === "bot" ? linkify(m.text) : m.text}
              </div>
              {m.role === "bot" && (
                <FeedbackRow question={messages[i - 1]?.text ?? ""} answer={m.text} needsHelp={m.needsHelp} />
              )}
            </div>
          </div>
        ))}

        {loading && streamingText && (
          <div className="flex justify-start gap-2">
            <MiniMascot talking />
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-stone-100 text-stone-800">
              {streamingText}
            </div>
          </div>
        )}
        {loading && !streamingText && (
          <div className="flex justify-start gap-2 items-center">
            <RobotMascot state="thinking" size={56} />
          </div>
        )}
        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-stone-200 px-4 py-3 flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") send() }}
            placeholder="שאל את ד״ר פקפקובי משהו..."
            disabled={loading}
            className="flex-1 bg-stone-100 border-0 rounded-full px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-900 placeholder-stone-400"
            style={{ fontSize: "16px" }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="bg-stone-900 text-white rounded-full w-9 h-9 flex items-center justify-center disabled:opacity-40 hover:bg-stone-800 flex-shrink-0 btn-press interactive">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
