"use client"

import { useEffect, useRef, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import BottomNav from "@/app/components/BottomNav"
import ComingSoon from "@/app/components/ComingSoon"

interface Student {
  id: string
  name: string
}

interface Message {
  id: string
  content: string
  status: string
  botResponse?: string
  dataAsOf?: string
  teacherResponse?: string
  flaggedByParent?: boolean
  createdAt: string
}

// Sidebar categories and their quick-send items
const SIDEBAR_SECTIONS = [
  {
    icon: "📅",
    title: "היעדרות עתידית",
    items: [
      "אני רוצה לדווח על היעדרות עתידית של התלמיד",
    ],
  },
  {
    icon: "🗓️",
    title: 'לו"ז ואירועים',
    items: [
      "מתי יום ההורים?",
      "מתי הטיול השנתי?",
      "מתי המבחנים הקרובים?",
      "מהם מועדי הגשת המשימות הקרובים?",
    ],
  },
  {
    icon: "📋",
    title: "טפסים ואישורים",
    items: [
      "אני צריך/ה אישור יציאה לפעילות חינוכית",
      "אני רוצה לקבל טופס הצהרת בריאות",
      "אני רוצה לברר לגבי תשלומים לבית הספר",
    ],
  },
  {
    icon: "ℹ️",
    title: "נתונים וכללים",
    items: [
      "מהו קוד הלבוש של בית הספר?",
      "מה מספר הטלפון של המורה לאנגלית?",
      "האם ניתן לקבל סיוע פרטני במקצוע מסוים?",
    ],
  },
]

function SilverBotThinking() {
  return (
    <div className="flex justify-start">
      <div className="bg-stone-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3 max-w-xs">
        <div className="relative w-10 h-10 flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="7" cy="9" r="2" fill="white" />
              <circle cx="15" cy="9" r="2" fill="white" />
              <line x1="11" y1="1" x2="11" y2="4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="11" cy="1" r="1" fill="white" />
              <rect x="6" y="13" width="10" height="2" rx="1" fill="white" opacity="0.8" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-xl border-2 border-stone-400 animate-ping opacity-30" />
        </div>
        <div>
          <div className="text-stone-700 font-bold text-sm">סילבר בוט</div>
          <div className="text-stone-400 text-xs flex items-center gap-1">
            סילבר בוט בודק
            <span className="flex gap-0.5">
              <span className="w-1 h-1 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function BotAvatar() {
  return (
    <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow flex-shrink-0 mt-1">
      <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
        <circle cx="7" cy="9" r="2" fill="white" />
        <circle cx="15" cy="9" r="2" fill="white" />
        <line x1="11" y1="1" x2="11" y2="4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="11" cy="1" r="1" fill="white" />
        <rect x="6" y="13" width="10" height="2" rx="1" fill="white" opacity="0.8" />
      </svg>
    </div>
  )
}

function WelcomeMessages({
  onDismiss,
  onExample,
}: {
  onDismiss: () => void
  onExample: (text: string) => void
}) {
  const examples = [
    "מתי הטיול השנתי?",
    "כמה שיעורי מתמטיקה בני החסיר מתחילת השנה?",
    "אני מאשר לביתי להעדר מחר מבית הספר, אנחנו נוסעים לחופשה משפחתית",
  ]
  return (
    <div className="space-y-3">
      <div className="bg-stone-100 rounded-2xl px-4 py-3 text-sm text-stone-700 leading-relaxed">
        <p>שלום רב, כאן תוכלו לכתוב פניה למחנך בכל נושא.</p>
        <p className="mt-2">כלל הפניות מגיעות למחנך והוא עונה עליהן בשעות העבודה המוגדרות לו לכך.</p>
        <p className="mt-2">
          הפניות מגיעות תחילה ל<strong>סילבר בוט</strong>, בוט ייעודי שמוזן על ידי המחנך במידע הרלוונטי עבור תלמידי הכיתה.
          במידה וסילבר בוט משוכנע שהוא יודע לענות תשובה נכונה, הוא יענה. במידה ולא — הוא יעדכן שהמחנך יענה.
        </p>
        <p className="mt-2">בכל מקרה, גם כאשר הבוט עונה, המחנך עובר על כל ההודעות.</p>
        <button onClick={onDismiss} className="mt-3 text-xs text-stone-400 underline hover:text-stone-700">
          אל תראה הודעה זו יותר
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-700">
        <p className="font-semibold text-stone-800 mb-2">פניות שסילבר בוט יודע לענות:</p>
        <ul className="space-y-3">
          {[
            { label: 'שאלות בנוגע לתאריכים ולו"ז', example: examples[0] },
            { label: "שאלות בנוגע לציונים, העדרויות, איחורים (מתעדכן תחילת כל שבוע)", example: examples[1] },
            { label: "אישורי הורים להעדרויות ופעילויות", example: examples[2] },
          ].map(({ label, example }) => (
            <li key={example}>
              <p className="text-stone-500">{label} — למשל:</p>
              <button onClick={() => onExample(example)} className="mt-1 text-stone-600 underline text-xs hover:text-stone-900">
                {example}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Quick-actions sidebar
function Sidebar({ onSend, disabled }: { onSend: (text: string) => void; disabled: boolean }) {
  const [openSection, setOpenSection] = useState<string | null>(null)

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-l border-stone-200 flex flex-col overflow-y-auto">
      <div className="bg-stone-50 border-b border-stone-200 px-3 py-3">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-wide">שאלות ופעולות נפוצות</p>
      </div>
      <div className="flex-1 py-2">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.title} className="border-b border-stone-100 last:border-0">
            <button
              onClick={() => setOpenSection(openSection === section.title ? null : section.title)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-right hover:bg-stone-50 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-stone-700">
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </span>
              <span className="text-stone-400 text-xs">{openSection === section.title ? "▲" : "▼"}</span>
            </button>

            {openSection === section.title && (
              <div className="pb-2 px-2 space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item}
                    onClick={() => { if (!disabled) onSend(item) }}
                    disabled={disabled}
                    className="w-full text-right text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 rounded-lg px-3 py-2 transition-colors leading-snug"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}

export default function ParentChat() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)
  const [loadError, setLoadError] = useState("")
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})
  const [flagDismissed, setFlagDismissed] = useState<Record<string, boolean>>({})
  const [streamingText, setStreamingText] = useState("")
  const [showWelcome, setShowWelcome] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    const user = session?.user as any
    if (status === "authenticated" && (user?.role === "TEACHER" || user?.role === "ADMIN")) router.push("/dashboard")
    if (status === "authenticated" && user?.accessStatus !== "APPROVED") router.push("/pending")
  }, [status, router])

  useEffect(() => {
    const dismissed = localStorage.getItem("silver-welcome-dismissed")
    setShowWelcome(dismissed !== "true")
  }, [])

  useEffect(() => {
    if (!session) return
    fetch("/api/parent/students")
      .then((r) => r.json())
      .then((data) => {
        if (data.students?.length > 0) setStudent(data.students[0])
        else setLoadError("לא נמצאו תלמידים המקושרים לחשבונך. פנה/י למזכירות בית הספר.")
      })
      .catch(() => setLoadError("שגיאה בטעינת נתונים."))
  }, [session])

  useEffect(() => {
    if (!student) return
    fetch(`/api/messages?studentId=${student.id}`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages ?? []))
  }, [student])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, sending])

  function dismissWelcome() {
    localStorage.setItem("silver-welcome-dismissed", "true")
    setShowWelcome(false)
  }

  async function doSend(text: string) {
    if (!text.trim() || !student || sending) return
    setSending(true)
    setStreamingText("")
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, studentId: student.id }),
    })
    if (res.status === 429) {
      const data = await res.json()
      const fakeMsg: Message = {
        id: `rate-limit-${Date.now()}`,
        content: text,
        status: "BOT_ANSWERED",
        botResponse: data.error ?? "הגעת למגבלת הבקשות. נסה שוב בעוד שעה.",
        createdAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, fakeMsg])
      setSending(false)
      return
    }
    if (!res.ok || !res.body) { setSending(false); return }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

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
          if (json.text) setStreamingText(prev => prev + json.text)
          if (json.done) {
            setMessages(prev => [...prev, json.message])
            setStreamingText("")
          }
        } catch {}
      }
    }
    setSending(false)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = input
    setInput("")
    await doSend(text)
  }

  async function flagMessage(messageId: string) {
    await fetch("/api/messages/flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId }),
    })
    setFlagged((prev) => ({ ...prev, [messageId]: true }))
  }

  const [mainTab, setMainTab] = useState("צ'אט")

  const parentNavTabs = [
    {
      label: "בית",
      href: "/home",
      icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    },
    {
      label: "צ'אט",
      href: "/chat",
      icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    },
    {
      label: "טפסים",
      comingSoon: true,
      icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    },
  ]

  if (status === "loading") return <div className="p-8 text-center">טוען...</div>
  if (loadError) return <div className="p-8 text-center text-red-500">{loadError}</div>
  if (!student) return <div className="p-8 text-center text-gray-400">טוען נתוני תלמיד...</div>

  return (
    <div className="flex flex-col h-screen" dir="rtl">
    <div className="flex flex-1 overflow-hidden">

      {mainTab === "צ'אט" && <>
      {/* Sidebar — hidden on small screens */}
      <div className="hidden md:flex">
        <Sidebar onSend={(text) => doSend(text)} disabled={sending} />
      </div>

      {/* Chat — left */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-stone-900 text-sm leading-tight truncate">
              {(() => {
                const u = session?.user as any
                const firstName = u?.name?.split(" ")[0] ?? ""
                const type = u?.parentType ?? "הורה"
                return `${firstName} · ${type} של ${student.name}`
              })()}
            </div>
            <div className="text-xs text-stone-400 mt-0.5">פניות למחנך · סילבר בוט</div>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-stone-400 hover:text-stone-700 interactive px-2 py-1">
            יציאה
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#faf9f6]">
          {showWelcome && (
            <WelcomeMessages
              onDismiss={dismissWelcome}
              onExample={(text) => { setInput(text); inputRef.current?.focus() }}
            />
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              <div className="flex justify-end">
                <div className="bg-stone-900 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-sm">
                  <div>{msg.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>

              {msg.botResponse && (
                <div className="space-y-1">
                  <div className="flex justify-start items-start gap-2">
                    <BotAvatar />
                    <div className="bg-stone-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm">
                      <div className="text-xs font-bold text-stone-500 mb-1">סילבר בוט</div>
                      <div className="text-sm whitespace-pre-wrap text-stone-800">{msg.botResponse}</div>
                      {msg.dataAsOf && (
                        <div className="text-xs text-stone-400 mt-1">
                          נכון לתאריך {new Date(msg.dataAsOf).toLocaleDateString("he-IL")}
                        </div>
                      )}
                      <div className="text-xs text-amber-700 mt-2 border-t border-stone-200 pt-1">
                        ⚠️ תשובה זו ניתנה על ידי בינה מלאכותית ועלולה לכלול טעויות.
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {msg.teacherResponse && (
                <div className="flex justify-start">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl rounded-tl-sm px-4 py-2 max-w-sm">
                    <div className="text-xs text-emerald-700 font-bold mb-1">מהמחנך/ת:</div>
                    <div className="text-sm">{msg.teacherResponse}</div>
                  </div>
                </div>
              )}

              {msg.status === "FORWARDED" && !msg.teacherResponse && (
                <div className="flex justify-start">
                  <div className="bg-stone-100 rounded-xl px-3 py-1 text-xs text-stone-500">
                    ההודעה הועברה למחנך/ת לטיפול.
                  </div>
                </div>
              )}
            </div>
          ))}

          {sending && !streamingText && <SilverBotThinking />}
          {streamingText && (
            <div className="flex justify-start items-start gap-2">
              <BotAvatar />
              <div className="bg-stone-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm">
                <div className="text-xs font-bold text-stone-500 mb-1">סילבר בוט</div>
                <div className="text-sm text-stone-800 whitespace-pre-wrap">{streamingText}<span className="inline-block w-0.5 h-3.5 bg-stone-400 animate-pulse ml-0.5 align-middle" /></div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-3 bg-white border-t border-stone-100 flex gap-2 flex-shrink-0">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="שאל/י שאלה..."
            className="flex-1 bg-stone-100 border-0 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-stone-300 text-stone-900 placeholder-stone-400"
            style={{ fontSize: "16px" }}
            disabled={sending}
            dir="rtl"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-stone-900 text-white rounded-full px-4 py-2.5 text-sm disabled:opacity-40 hover:bg-stone-800 btn-press interactive"
          >
            {sending ? "שולח..." : "שלח"}
          </button>
        </form>
      </div>
      </>}

      {mainTab === "טפסים ומידע" && (
        <ComingSoon
          icon="📄"
          title="טפסים ומידע"
          description="הורדת טפסים, אישורים, תשלומים ומידע חשוב מבית הספר — הכל במקום אחד."
          featureKey="parent-forms"
          accentColor="bg-stone-900"
          accentLight="bg-stone-100"
          accentText="text-stone-700"
        />
      )}
    </div>

    <BottomNav
      tabs={parentNavTabs}
      activeColor="text-stone-900"
      activeBg="bg-stone-100"
      activeTab={mainTab}
      onTabChange={setMainTab}
    />
    </div>
  )
}
