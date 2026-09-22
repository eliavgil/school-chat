"use client"

import { useEffect, useRef, useState } from "react"

interface Message { role: "user" | "bot"; text: string }

const QUICK_ACTIONS = [
  { label: "🚌 טיול שנתי", text: "מתי הטיול השנתי?" },
  { label: "🏫 איפה המגמה שלי", text: "איפה נמצאת הכיתה של המגמה שלי?" },
  { label: "📄 טופס יציאה", text: "איפה מוצאים אישור יציאה לפעילות ערב?" },
]

function BotThinking() {
  return (
    <div className="flex gap-2 items-start">
      <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow">
        <span className="text-white text-xs">🤖</span>
      </div>
      <div className="bg-stone-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 150, 300].map(d => (
          <span key={d} className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
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
            setMessages(prev => [...prev, { role: "bot", text: fullText || "שגיאה — נסה שוב" }])
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
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">🤖</div>
            <p className="text-stone-800 font-medium text-sm mb-1">פקפקובי בוט - עוזר אישי</p>
            <p className="text-stone-500 text-xs mb-4">שאל אותי שאלות לוגיסטיות — תאריכים, מגמות, טפסים ועוד</p>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              {QUICK_ACTIONS.map(qa => (
                <button key={qa.label} onClick={() => send(qa.text)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs px-3 py-2 rounded-xl interactive btn-press transition-colors">
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {m.role === "bot" && (
              <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow">
                <span className="text-white text-xs">🤖</span>
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user" ? "bg-stone-900 text-white rounded-tr-sm" : "bg-stone-100 text-stone-800 rounded-tl-sm"
            }`}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && streamingText && (
          <div className="flex justify-start gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow">
              <span className="text-white text-xs">🤖</span>
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-stone-100 text-stone-800">
              {streamingText}
            </div>
          </div>
        )}
        {loading && !streamingText && <BotThinking />}
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
            placeholder="שאל אותי משהו..."
            disabled={loading}
            className="flex-1 bg-stone-100 border-0 rounded-full px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-300 text-stone-900 placeholder-stone-400"
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
