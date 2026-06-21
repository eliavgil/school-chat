"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

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
      <div className="bg-white border border-blue-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-3 max-w-xs">
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
          <div className="absolute inset-0 rounded-xl border-2 border-blue-400 animate-ping opacity-30" />
        </div>
        <div>
          <div className="text-blue-700 font-bold text-sm">סילבר בוט</div>
          <div className="text-gray-500 text-xs flex items-center gap-1">
            סילבר בוט בודק
            <span className="flex gap-0.5">
              <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-sm text-gray-700 leading-relaxed">
        <p>שלום רב, כאן תוכלו לכתוב פניה למחנך בכל נושא.</p>
        <p className="mt-2">כלל הפניות מגיעות למחנך והוא עונה עליהן בשעות העבודה המוגדרות לו לכך.</p>
        <p className="mt-2">
          הפניות מגיעות תחילה ל<strong>סילבר בוט</strong>, בוט ייעודי שמוזן על ידי המחנך במידע הרלוונטי עבור תלמידי הכיתה.
          במידה וסילבר בוט משוכנע שהוא יודע לענות תשובה נכונה, הוא יענה. במידה ולא — הוא יעדכן שהמחנך יענה.
        </p>
        <p className="mt-2">בכל מקרה, גם כאשר הבוט עונה, המחנך עובר על כל ההודעות.</p>
        <button onClick={onDismiss} className="mt-3 text-xs text-blue-500 underline hover:text-blue-700">
          אל תראה הודעה זו יותר
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 shadow-sm">
        <p className="font-semibold text-blue-700 mb-2">פניות שסילבר בוט יודע לענות:</p>
        <ul className="space-y-3">
          {[
            { label: 'שאלות בנוגע לתאריכים ולו"ז', example: examples[0] },
            { label: "שאלות בנוגע לציונים, העדרויות, איחורים (מתעדכן תחילת כל שבוע)", example: examples[1] },
            { label: "אישורי הורים להעדרויות ופעילויות", example: examples[2] },
          ].map(({ label, example }) => (
            <li key={example}>
              <p className="text-gray-600">{label} — למשל:</p>
              <button onClick={() => onExample(example)} className="mt-1 text-blue-500 underline text-xs hover:text-blue-700">
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
    <aside className="w-60 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">שאלות ופעולות נפוצות</p>
      </div>
      <div className="flex-1 py-2">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.title} className="border-b border-gray-100 last:border-0">
            <button
              onClick={() => setOpenSection(openSection === section.title ? null : section.title)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-right hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </span>
              <span className="text-gray-400 text-xs">{openSection === section.title ? "▲" : "▼"}</span>
            </button>

            {openSection === section.title && (
              <div className="pb-2 px-2 space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item}
                    onClick={() => { if (!disabled) onSend(item) }}
                    disabled={disabled}
                    className="w-full text-right text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 rounded-lg px-3 py-2 transition-colors leading-snug"
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
  const [showWelcome, setShowWelcome] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
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
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, studentId: student.id }),
    })
    if (res.ok) {
      const data = await res.json()
      setMessages((prev) => [...prev, data.message])
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

  if (status === "loading") return <div className="p-8 text-center">טוען...</div>
  if (loadError) return <div className="p-8 text-center text-red-500">{loadError}</div>
  if (!student) return <div className="p-8 text-center text-gray-400">טוען נתוני תלמיד...</div>

  return (
    <div className="flex h-screen" dir="rtl">

      {/* Sidebar — right in RTL */}
      <Sidebar onSend={(text) => doSend(text)} disabled={sending} />

      {/* Chat — left */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="bg-blue-600 text-white p-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white/40">
            <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
              <circle cx="20" cy="20" r="20" fill="#60a5fa" />
              <circle cx="20" cy="15" r="7" fill="white" opacity="0.9" />
              <ellipse cx="20" cy="34" rx="12" ry="9" fill="white" opacity="0.9" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">פניות למחנך - אליאב גיל</div>
            <div className="text-xs opacity-80">תלמיד/ה: {student.name}</div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {showWelcome && (
            <WelcomeMessages
              onDismiss={dismissWelcome}
              onExample={(text) => { setInput(text); inputRef.current?.focus() }}
            />
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-sm">
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
                    <div className="bg-white border border-blue-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm shadow-sm">
                      <div className="text-xs font-bold text-blue-600 mb-1">סילבר בוט</div>
                      <div className="text-sm">{msg.botResponse}</div>
                      {msg.dataAsOf && (
                        <div className="text-xs text-gray-400 mt-1">
                          נכון לתאריך {new Date(msg.dataAsOf).toLocaleDateString("he-IL")}
                        </div>
                      )}
                      <div className="text-xs text-yellow-600 mt-2 border-t border-yellow-100 pt-1">
                        ⚠️ תשובה זו ניתנה על ידי בינה מלאכותית ועלולה לכלול טעויות.
                      </div>
                    </div>
                  </div>

                  {!flagDismissed[msg.id] && (
                    <div className="mr-9 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-gray-600">
                      <p className="mb-2">
                        מחנך הכיתה עובר בכל מקרה על כל ההודעות.<br />
                        האם לסמן למחנך כי יש חשש שנפלה טעות בתשובה של סילבר בוט?
                      </p>
                      {flagged[msg.id] ? (
                        <p className="text-blue-600 font-medium">✓ סומן למחנך/ת לבדיקה</p>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => { flagMessage(msg.id); setFlagDismissed(p => ({ ...p, [msg.id]: true })) }}
                            className="bg-blue-500 text-white rounded-lg px-3 py-1 hover:bg-blue-600"
                          >
                            1 - בהחלט
                          </button>
                          <button
                            onClick={() => setFlagDismissed(p => ({ ...p, [msg.id]: true }))}
                            className="bg-gray-200 text-gray-600 rounded-lg px-3 py-1 hover:bg-gray-300"
                          >
                            2 - לא, אין צורך
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {msg.teacherResponse && (
                <div className="flex justify-start">
                  <div className="bg-green-50 border border-green-300 rounded-2xl rounded-tl-sm px-4 py-2 max-w-sm shadow-sm">
                    <div className="text-xs text-green-600 font-bold mb-1">מהמחנך/ת:</div>
                    <div className="text-sm">{msg.teacherResponse}</div>
                  </div>
                </div>
              )}

              {msg.status === "FORWARDED" && !msg.teacherResponse && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-xl px-3 py-1 text-xs text-gray-500">
                    ההודעה הועברה למחנך/ת לטיפול.
                  </div>
                </div>
              )}
            </div>
          ))}

          {sending && <SilverBotThinking />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2 flex-shrink-0">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="שאל/י שאלה..."
            className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={sending}
            dir="rtl"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-blue-500 text-white rounded-full px-4 py-2 text-sm disabled:opacity-50"
          >
            {sending ? "שולח..." : "שלח"}
          </button>
        </form>
      </div>
    </div>
  )
}
