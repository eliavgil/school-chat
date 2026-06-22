"use client"

import { useEffect, useState, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import BottomNav from "@/app/components/BottomNav"
import ComingSoon from "@/app/components/ComingSoon"

interface Message {
  id: string
  content: string
  status: string
  botResponse?: string
  botAnsweredAt?: string
  teacherResponse?: string
  teacherApproved: boolean
  isTask: boolean
  teacherSeenAt?: string
  skipReason?: string
  createdAt: string
  sender: { name: string; email: string }
}

interface Conversation {
  studentId: string
  studentName: string
  parentLabels: string[]
  lastMessage: { content: string; createdAt: string; status: string }
  unreadCount: number
  totalMessages: number
}

// SVG icons
const IconChat = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)
const IconSettings = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const IconAnalytics = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)
const IconAssistant = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

export default function TeacherDashboard() {
  const { data: session, status } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [totalTasks, setTotalTasks] = useState(0)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [selectedStudentName, setSelectedStudentName] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sending, setSending] = useState(false)
  const [innerTab, setInnerTab] = useState<"chat" | "tasks">("chat")
  const [globalTasks, setGlobalTasks] = useState<(Message & { studentName?: string })[]>([])
  const [mainTab, setMainTab] = useState("שיחות")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === "authenticated") {
      fetchConversations()
      fetchGlobalTasks()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function fetchConversations() {
    const res = await fetch("/api/teacher/conversations")
    const data = await res.json()
    setConversations(data.conversations ?? [])
    setTotalTasks(data.totalTasks ?? 0)
  }

  async function selectConversation(studentId: string, studentName: string) {
    // Optimistic: switch immediately, clear old messages
    setSelectedStudent(studentId)
    setSelectedStudentName(studentName)
    setReplyingTo(null)
    setReplyText("")
    setMessages([])
    // Mark unread as 0 instantly
    setConversations((prev) =>
      prev.map((c) => (c.studentId === studentId ? { ...c, unreadCount: 0 } : c))
    )
    const res = await fetch(`/api/teacher/messages?studentId=${studentId}`)
    const data = await res.json()
    setMessages(data.messages ?? [])
  }

  async function sendReply() {
    if (!replyingTo || !replyText.trim()) return
    setSending(true)
    await fetch("/api/teacher/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: replyingTo, response: replyText }),
    })
    setReplyText("")
    setReplyingTo(null)
    if (selectedStudent) await selectConversation(selectedStudent, selectedStudentName)
    setSending(false)
  }

  async function toggleAction(messageId: string, action: string) {
    // Optimistic: update local state immediately
    const isTask = action === "task"
    const isUntask = action === "untask"
    const isApprove = action === "approve"
    const isUnapprove = action === "unapprove"
    if (isTask || isUntask) {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isTask: isTask } : m))
      setGlobalTasks(prev => isUntask ? prev.filter(m => m.id !== messageId) : prev)
    }
    if (isApprove || isUnapprove) {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, teacherApproved: isApprove } : m))
    }
    // Fire API calls in parallel
    await fetch("/api/teacher/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, action }),
    })
    // Refresh in background without blocking
    Promise.all([
      fetchConversations(),
      innerTab === "tasks" ? fetchGlobalTasks() : Promise.resolve(),
    ])
  }

  async function fetchGlobalTasks() {
    const res = await fetch("/api/teacher/messages")
    const data = await res.json()
    const tasks = (data.messages ?? []).filter((m: any) => m.isTask)
    setGlobalTasks(tasks)
  }

  const allTasks = globalTasks
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0)

  const IconHome = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )

  const navTabs = [
    { label: "בית",          href: "/home",      icon: <IconHome /> },
    { label: "שיחות",        href: "/dashboard", icon: <IconChat />, badge: totalUnread },
    { label: "ניהול",        href: "/admin",     icon: <IconSettings /> },
    { label: "ניתוח",        icon: <IconAnalytics />, comingSoon: true },
    { label: "עוזר",         icon: <IconAssistant />, comingSoon: true },
  ]

  if (status === "loading") return null

  return (
    <div className="flex flex-col h-screen bg-[#faf9f6]" dir="rtl">

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">

        {mainTab === "שיחות" && (
          <>
            {/* Sidebar */}
            <div className="w-80 bg-white border-l border-stone-200 flex flex-col flex-shrink-0">
              {/* Header */}
              <div className="bg-white border-b border-stone-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4338ca" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-stone-900 text-sm">לוח מחנך</div>
                      <div className="text-xs text-stone-400">{session?.user?.name}</div>
                    </div>
                  </div>
                  <button onClick={() => signOut({ callbackUrl: "/login" })}
                    className="text-xs text-stone-400 hover:text-stone-700 interactive px-2 py-1">
                    יציאה
                  </button>
                </div>
              </div>

              {/* Inner tabs */}
              <div className="flex border-b border-stone-200">
                <button
                  onClick={() => setInnerTab("chat")}
                  className={`flex-1 py-2.5 text-sm font-medium interactive ${innerTab === "chat" ? "border-b-2 border-stone-900 text-stone-900" : "text-stone-400"}`}
                >
                  שיחות{totalUnread > 0 && <span className="bg-stone-900 text-white rounded-full px-1.5 py-0.5 text-xs mr-1">({totalUnread})</span>}
                </button>
                <button
                  onClick={() => { setInnerTab("tasks"); fetchGlobalTasks() }}
                  className={`flex-1 py-2.5 text-sm font-medium interactive ${innerTab === "tasks" ? "border-b-2 border-stone-900 text-stone-900" : "text-stone-400"}`}
                >
                  משימות{totalTasks > 0 && <span className="text-stone-400 text-xs mr-1">({totalTasks})</span>}
                </button>
              </div>

              {innerTab === "chat" && (
                <div className="flex-1 overflow-y-auto">
                  {conversations.map((c) => (
                    <button
                      key={c.studentId}
                      onClick={() => selectConversation(c.studentId, c.studentName)}
                      className={`w-full text-right px-4 py-3 border-b border-stone-100 hover:bg-stone-50 transition-colors ${selectedStudent === c.studentId ? "bg-stone-100" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          {c.parentLabels.length > 0 && (
                            <div className="text-xs text-stone-400">{c.parentLabels.join(" · ")}</div>
                          )}
                          <div className="font-medium text-sm text-stone-800">{c.studentName}</div>
                        </div>
                        {c.unreadCount > 0 && (
                          <span className="bg-stone-900 text-white rounded-full px-2 py-0.5 text-xs mt-0.5">{c.unreadCount}</span>
                        )}
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5 truncate">{c.lastMessage.content}</div>
                      <div className="text-xs text-stone-300 mt-0.5">
                        {new Date(c.lastMessage.createdAt).toLocaleDateString("he-IL")}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {innerTab === "tasks" && (
                <div className="flex-1 overflow-y-auto p-3">
                  {allTasks.length === 0 ? (
                    <p className="text-stone-400 text-sm text-center mt-8">אין משימות פתוחות</p>
                  ) : (
                    allTasks.map((m) => (
                      <div key={m.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
                        {(m as any).student && (
                          <button
                            onClick={() => { setInnerTab("chat"); selectConversation((m as any).student.id, (m as any).student.name) }}
                            className="text-xs font-semibold text-stone-600 hover:text-stone-900 interactive mb-1 block"
                          >
                            {(m as any).student.name} ←
                          </button>
                        )}
                        <p className="text-sm text-stone-800">{m.content}</p>
                        <button onClick={() => toggleAction(m.id, "untask")} className="text-xs text-amber-600 mt-1.5 hover:underline interactive">
                          סמן כבוצע
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {!selectedStudent ? (
                <div className="flex-1 flex items-center justify-center text-stone-400">
                  <div className="text-center">
                    <div className="text-4xl mb-3">💬</div>
                    <div>בחר שיחה מהרשימה</div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white border-b border-stone-200 px-6 py-3 flex-shrink-0">
                    <div className="font-semibold text-stone-800">{selectedStudentName}</div>
                    <div className="text-xs text-stone-400">{messages.length} הודעות</div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#faf9f6]">
                    {messages.map((msg) => (
                      <div key={msg.id} className="space-y-1">
                        {/* Parent message */}
                        <div className="flex justify-end">
                          <div className="max-w-sm">
                            <div className="bg-stone-900 text-white rounded-2xl rounded-tr-sm px-4 py-2">
                              <div className="text-xs text-stone-400 mb-1">{msg.sender.name}</div>
                              <div className="text-sm">{msg.content}</div>
                              <div className="text-xs text-stone-500 mt-1 text-left">
                                {new Date(msg.createdAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bot response */}
                        {msg.botResponse && (
                          <div className="flex justify-start">
                            <div className="max-w-sm">
                              <div className="bg-stone-100 rounded-2xl rounded-tl-sm px-4 py-2">
                                <div className="text-xs text-stone-500 font-medium mb-1">סילבר בוט</div>
                                <div className="text-sm text-stone-800 whitespace-pre-wrap">{msg.botResponse}</div>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="text-xs text-stone-300">
                                    {msg.botAnsweredAt && new Date(msg.botAnsweredAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => toggleAction(msg.id, msg.teacherApproved ? "unapprove" : "approve")}
                                      title={msg.teacherApproved ? "בטל אישור" : "אשר תשובה"}
                                      className={`text-sm px-2 py-0.5 rounded-full transition-colors ${msg.teacherApproved ? "bg-stone-900 text-white" : "bg-stone-200 text-stone-400 hover:bg-stone-300"}`}
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => toggleAction(msg.id, msg.isTask ? "untask" : "task")}
                                      title={msg.isTask ? "הסר ממשימות" : "הוסף למשימות"}
                                      className={`text-sm px-2 py-0.5 rounded-full transition-colors ${msg.isTask ? "bg-amber-400 text-white" : "bg-stone-200 text-stone-400 hover:bg-amber-100"}`}
                                    >
                                      ★
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {!msg.teacherResponse && (
                                <button onClick={() => setReplyingTo(msg.id)} className="text-xs text-stone-400 mt-1 mr-2 hover:text-stone-700 interactive">
                                  הגב
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Forwarded */}
                        {!msg.botResponse && msg.status === "FORWARDED" && (
                          <div className="flex justify-start">
                            <div className="bg-stone-100 rounded-2xl rounded-tl-sm px-4 py-2 text-xs text-stone-500">
                              הועבר לטיפול ידני
                              {!msg.teacherResponse && (
                                <button onClick={() => setReplyingTo(msg.id)} className="mr-3 text-stone-700 hover:underline interactive">
                                  הגב
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Teacher response */}
                        {msg.teacherResponse && (
                          <div className="flex justify-start">
                            <div className="max-w-sm bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-2">
                              <div className="text-xs text-indigo-600 font-medium mb-1">המחנך/ת</div>
                              <div className="text-sm text-stone-800">{msg.teacherResponse}</div>
                            </div>
                          </div>
                        )}

                        {/* Reply input */}
                        {replyingTo === msg.id && (
                          <div className="flex justify-start mr-4">
                            <div className="bg-white border border-stone-200 rounded-2xl px-3 py-2 flex gap-2 items-center w-80">
                              <input
                                autoFocus
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
                                placeholder="כתוב תגובה..."
                                className="flex-1 text-sm outline-none text-stone-900 placeholder-stone-400"
                              />
                              <button
                                onClick={sendReply}
                                disabled={sending || !replyText.trim()}
                                className="bg-stone-900 text-white rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-50 hover:bg-stone-800 btn-press interactive"
                              >
                                ➤
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {mainTab === "ניתוח נתונים" && (
          <ComingSoon
            icon="📊"
            title="ניתוח נתוני תלמידים"
            description="ניתוח לימודי, חברתי ורגשי של תלמידי הכיתה. זיהוי דפוסים, התראות מוקדמות ותובנות מבוססות AI."
            featureKey="teacher-analytics"
            accentColor="bg-stone-900"
            accentLight="bg-stone-100"
            accentText="text-stone-700"
          />
        )}

        {mainTab === "עוזר אישי" && (
          <ComingSoon
            icon="🤖"
            title="עוזר אישי למחנך"
            description="ניהול משימות, תזכורות חכמות, הכנת מסמכים ודוחות — הכל בשיחה טבעית."
            featureKey="teacher-assistant"
            accentColor="bg-stone-900"
            accentLight="bg-stone-100"
            accentText="text-stone-700"
          />
        )}

      </div>

      {/* Bottom navigation */}
      <BottomNav
        tabs={navTabs}
        activeColor="text-stone-900"
        activeBg="bg-stone-100"
        activeTab={mainTab}
        onTabChange={(label) => {
          if (label === "שיחות" || label === "ניתוח נתונים" || label === "עוזר אישי") {
            setMainTab(label)
          }
        }}
      />
    </div>
  )
}
