"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  content: string
  status: string
  botResponse?: string
  teacherResponse?: string
  skipReason?: string
  dataAsOf?: string
  createdAt: string
  sender: { name: string; email: string }
  student: { name: string }
}

export default function TeacherDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [replying, setReplying] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/teacher/messages")
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
      }
    }
    if (session) load()
  }, [session])

  async function sendReply(messageId: string) {
    const res = await fetch(`/api/teacher/messages/${messageId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: replyText }),
    })
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, teacherResponse: replyText, status: "TEACHER_ANSWERED" }
            : m
        )
      )
      setReplying(null)
      setReplyText("")
    }
  }

  const statusLabel: Record<string, string> = {
    PENDING: "⏳ ממתינה",
    BOT_ANSWERED: "🤖 נענתה ע\"י בוט",
    TEACHER_ANSWERED: "✅ נענתה",
    FORWARDED: "📨 הועברה",
  }

  if (status === "loading") return <div className="p-8 text-center">טוען...</div>

  return (
    <div className="max-w-3xl mx-auto p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">לוח מחוון מחנך</h1>

      <div className="space-y-4">
        {messages.length === 0 && (
          <p className="text-gray-500">אין הודעות.</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-medium">{msg.sender.name}</span>
                <span className="text-gray-400 text-sm mx-2">←</span>
                <span className="text-gray-600 text-sm">{msg.student.name}</span>
              </div>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                {statusLabel[msg.status] ?? msg.status}
              </span>
            </div>

            <p className="text-gray-800 mb-2">{msg.content}</p>

            {msg.botResponse && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2 text-sm">
                <div className="text-yellow-700 font-medium mb-1">תשובת הבוט:</div>
                <div>{msg.botResponse}</div>
                {msg.dataAsOf && (
                  <div className="text-xs text-gray-400 mt-1">
                    נכון לתאריך {new Date(msg.dataAsOf).toLocaleDateString("he-IL")}
                  </div>
                )}
              </div>
            )}

            {msg.skipReason && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 mb-2 text-xs text-gray-500">
                הועבר כי: {msg.skipReason}
              </div>
            )}

            {msg.teacherResponse && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <div className="text-green-700 font-medium mb-1">תשובתך:</div>
                <div>{msg.teacherResponse}</div>
              </div>
            )}

            {!msg.teacherResponse && (
              <div className="mt-3">
                {replying === msg.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="כתוב/י תשובה..."
                      className="w-full border rounded-lg p-2 text-sm h-20 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    {msg.botResponse && (
                      <button
                        className="text-xs text-blue-500 underline"
                        onClick={() => setReplyText(msg.botResponse!)}
                      >
                        השתמש/י בתשובת הבוט כנקודת התחלה
                      </button>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => sendReply(msg.id)}
                        className="bg-blue-500 text-white rounded-lg px-4 py-1 text-sm"
                      >
                        שלח/י
                      </button>
                      <button
                        onClick={() => { setReplying(null); setReplyText("") }}
                        className="text-gray-500 text-sm"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setReplying(msg.id)
                      setReplyText(msg.botResponse ?? "")
                    }}
                    className="text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg px-3 py-1 hover:bg-blue-100"
                  >
                    {msg.botResponse ? "ערוך/י תשובת הבוט ושלח/י" : "כתוב/י תשובה"}
                  </button>
                )}
              </div>
            )}

            <div className="text-xs text-gray-300 mt-2">
              {new Date(msg.createdAt).toLocaleString("he-IL")}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
