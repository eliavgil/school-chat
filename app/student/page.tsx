"use client"

import { useState, useRef, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import BottomNav from "@/app/components/BottomNav"
import ComingSoon from "@/app/components/ComingSoon"

interface Message {
  role: "user" | "bot"
  text: string
}

const QUICK_ACTIONS = [
  { label: "📊 הציונים שלי", text: "מה הציונים שלי?" },
  { label: "📅 מה יש היום?", text: "מה יש לי היום במערכת השעות?" },
  { label: "📝 מבחנים קרובים", text: "אילו מבחנים קרובים?" },
  { label: "📈 ממוצע הכיתה", text: "מה ממוצע הכיתה?" },
]

const IconHome = () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
const IconInfo = () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const IconBook = () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
const IconStar = () => <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>

function BotThinking() {
  return (
    <div className="flex gap-2 items-start">
      <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow">
        <span className="text-white text-xs font-bold">S</span>
      </div>
      <div className="bg-stone-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 150, 300].map(d => (
          <span key={d} className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  )
}

const CHAT_STORAGE_KEY = "student-chat-history"

export default function StudentPage() {
  const { data: session, status } = useSession()
  const [mainTab, setMainTab] = useState("מידע")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [isFirst, setIsFirst] = useState(true)
  const [noStudent, setNoStudent] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Message[]
        const last50 = parsed.slice(-50)
        setMessages(last50)
        if (last50.length > 0) setIsFirst(false)
      }
    } catch {}
    setHistoryLoaded(true)
  }, [])

  // Save to localStorage whenever messages change (after initial load)
  useEffect(() => {
    if (!historyLoaded) return
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-50)))
    } catch {}
  }, [messages, historyLoaded])

  function clearChat() {
    setMessages([])
    setIsFirst(true)
    localStorage.removeItem(CHAT_STORAGE_KEY)
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, loading])

  async function send(text?: string) {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setInput("")
    setMessages(prev => [...prev, { role: "user", text: q }])
    setLoading(true)
    setStreamingText("")

    const res = await fetch("/api/student/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, isFirstMessage: isFirst }),
    })

    if (res.status === 403) { setNoStudent(true); setLoading(false); return }
    if (res.status === 429) {
      const data = await res.json()
      setMessages(prev => [...prev, { role: "bot", text: data.error ?? "הגעת למגבלת הבקשות. נסה שוב בעוד שעה." }])
      setLoading(false)
      return
    }
    if (!res.body) { setLoading(false); return }

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
    setIsFirst(false)
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const navTabs = [
    { label: "בית",  href: "/home",  icon: <IconHome /> },
    { label: "מידע", icon: <IconInfo /> },
    { label: "לימוד",icon: <IconBook />, comingSoon: true },
    { label: "עוזר", icon: <IconStar />, comingSoon: true },
  ]

  if (status === "loading") return null

  const firstName = session?.user?.name?.split(" ")[0] ?? ""

  return (
    <div className="flex flex-col h-screen bg-[#faf9f6]" dir="rtl">

      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-orange-700 font-bold text-sm">S</span>
            </div>
            <div>
              <div className="font-semibold text-stone-900 text-sm">שלום {firstName}</div>
              <div className="text-xs text-stone-400">כיתה י2 סילבר · סילבר בוט</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button onClick={clearChat} className="text-xs text-stone-400 hover:text-stone-600 interactive px-2 py-1 rounded-lg hover:bg-stone-100" title="נקה שיחה">
                נקה
              </button>
            )}
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs text-stone-400 hover:text-stone-700 interactive px-2 py-1">
              יציאה
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {mainTab === "מידע" && (
          <>
            {noStudent ? (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div>
                  <div className="text-4xl mb-3">🔗</div>
                  <p className="text-gray-700 font-medium">החשבון שלך עדיין לא מקושר לרשימת הכיתה</p>
                  <p className="text-gray-500 text-sm mt-1">פנה/י למחנך/ת כדי שיקשר את החשבון</p>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#faf9f6]">
                  {messages.length === 0 && (
                    <div className="text-center pt-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
                        <span className="text-white text-2xl font-bold">S</span>
                      </div>
                      <p className="font-bold text-stone-800">סילבר בוט</p>
                      <p className="text-stone-500 text-sm mt-1">שאל/י אותי על ציונים, מבחנים, מערכת שעות ועוד</p>

                      <div className="flex flex-wrap justify-center gap-2 mt-4">
                        {QUICK_ACTIONS.map(qa => (
                          <button key={qa.text} onClick={() => send(qa.text)}
                            className="bg-white border border-stone-200 text-stone-700 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-stone-50 interactive btn-press">
                            {qa.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-2 items-start ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      {m.role === "bot" && (
                        <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow">
                          <span className="text-white text-xs font-bold">S</span>
                        </div>
                      )}
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-stone-900 text-white rounded-tr-sm"
                          : "bg-stone-100 text-stone-800 rounded-tl-sm"
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}

                  {loading && !streamingText && <BotThinking />}
                  {streamingText && (
                    <div className="flex gap-2 items-start">
                      <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow">
                        <span className="text-white text-xs font-bold">S</span>
                      </div>
                      <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-stone-100 text-stone-800 rounded-tl-sm text-sm whitespace-pre-wrap">
                        {streamingText}<span className="inline-block w-0.5 h-3.5 bg-stone-400 animate-pulse ml-0.5 align-middle" />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="bg-white border-t border-stone-100 px-3 py-2.5 flex gap-2 items-center flex-shrink-0">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                    placeholder="שאל/י שאלה..."
                    disabled={loading}
                    className="flex-1 bg-stone-100 border-0 rounded-full px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-stone-300 text-stone-900 placeholder-stone-400" style={{ fontSize: "16px" }}
                  />
                  <button onClick={() => send()} disabled={loading || !input.trim()}
                    className="bg-stone-900 text-white rounded-full w-9 h-9 flex items-center justify-center disabled:opacity-40 hover:bg-stone-800 flex-shrink-0 btn-press interactive">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {mainTab === "לימוד" && (
          <ComingSoon icon="📚" title="עזרה לימודית"
            description="בוט שמכיר את חומרי הלימוד שלך — שאל שאלות, קבל הסברים, תרגל לקראת מבחנים."
            featureKey="student-learning-bot" accentColor="bg-stone-900" accentLight="bg-stone-100" accentText="text-stone-700" />
        )}

        {mainTab === "עוזר" && (
          <ComingSoon icon="🧠" title="עוזר אישי"
            description="תכנון שבועי, מעקב משימות ותזכורות חכמות — כדי שלא תפספס כלום."
            featureKey="student-assistant" accentColor="bg-stone-900" accentLight="bg-stone-100" accentText="text-stone-700" />
        )}

      </div>

      <BottomNav tabs={navTabs} activeColor="text-stone-900" activeBg="bg-stone-100" activeTab={mainTab} onTabChange={setMainTab} />
    </div>
  )
}
