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

// Animated Silver Bot thinking indicator
function SilverBotThinking() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-blue-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-3 max-w-xs">
        <div className="relative w-10 h-10 flex-shrink-0">
          {/* Bot face */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              {/* Eyes */}
              <circle cx="7" cy="9" r="2" fill="white" />
              <circle cx="15" cy="9" r="2" fill="white"/>
              {/* Antenna */}
              <line x1="11" y1="1" x2="11" y2="4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="11" cy="1" r="1" fill="white"/>
              {/* Mouth */}
              <rect x="6" y="13" width="10" height="2" rx="1" fill="white" opacity="0.8"/>
            </svg>
          </div>
          {/* Pulse ring */}
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

// Silver Bot avatar for responses
function BotAvatar() {
  return (
    <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow flex-shrink-0 mt-1">
      <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
        <circle cx="7" cy="9" r="2" fill="white" />
        <circle cx="15" cy="9" r="2" fill="white"/>
        <line x1="11" y1="1" x2="11" y2="4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="11" cy="1" r="1" fill="white"/>
        <rect x="6" y="13" width="10" height="2" rx="1" fill="white" opacity="0.8"/>
      </svg>
    </div>
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
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

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

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !student || sending) return
    const text = input
    setInput("")
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
    <div className="flex flex-col h-screen max-w-2xl mx-auto" dir="rtl">
      <header className="bg-blue-600 text-white p-4">
        <div className="font-bold text-lg">שאל/י את המחנך</div>
        <div className="text-sm opacity-80">תלמיד/ה: {student.name}</div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && !sending && (
          <p className="text-center text-gray-400 text-sm mt-8">
            שלח/י הודעה כדי להתחיל
          </p>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            {/* Parent message — right side */}
            <div className="flex justify-end">
              <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-xs">
                <div>{msg.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>

            {/* Bot response */}
            {msg.botResponse && (
              <div className="space-y-1">
                <div className="flex justify-start items-start gap-2">
                  <BotAvatar />
                  <div className="bg-white border border-blue-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs shadow-sm">
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

                {/* Flag question */}
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

            {/* Teacher response */}
            {msg.teacherResponse && (
              <div className="flex justify-start">
                <div className="bg-green-50 border border-green-300 rounded-2xl rounded-tl-sm px-4 py-2 max-w-xs shadow-sm">
                  <div className="text-xs text-green-600 font-bold mb-1">מהמחנך/ת:</div>
                  <div className="text-sm">{msg.teacherResponse}</div>
                </div>
              </div>
            )}

            {/* Forwarded */}
            {msg.status === "FORWARDED" && !msg.teacherResponse && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-xl px-3 py-1 text-xs text-gray-500">
                  ההודעה הועברה למחנך/ת לטיפול.
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Bot thinking animation */}
        {sending && <SilverBotThinking />}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="שאל/י שאלה..."
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={sending}
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
  )
}
