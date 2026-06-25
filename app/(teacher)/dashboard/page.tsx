"use client"

import { useEffect, useState, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
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

const QUICK_REPLIES = [
  "יצרנו קשר עם ההורה",
  "הנושא בטיפול",
  "תודה על הפנייה, נחזור אליך",
  "אנא פנה ישירות לבית הספר",
]

type ConvFilter = "הכל" | "ממתין" | "נענה" | "משימות"

export default function TeacherDashboard() {
  const { data: session, status } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [convsLoading, setConvsLoading] = useState(true)
  const [msgsLoading, setMsgsLoading] = useState(false)
  const [totalTasks, setTotalTasks] = useState(0)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [selectedStudentName, setSelectedStudentName] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sending, setSending] = useState(false)
  const [innerTab, setInnerTab] = useState<"chat" | "tasks">("chat")
  const [globalTasks, setGlobalTasks] = useState<(Message & { studentName?: string })[]>([])
  const [messagesCache, setMessagesCache] = useState<Record<string, Message[]>>({})
  const [mainTab, setMainTab] = useState("שיחות")
  const [convFilter, setConvFilter] = useState<ConvFilter>("הכל")
  const [showSummary, setShowSummary] = useState(false)
  const [summaryText, setSummaryText] = useState("")
  const [summaryLoading, setSummaryLoading] = useState(false)
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
    setConvsLoading(true)
    const res = await fetch("/api/teacher/conversations")
    const data = await res.json()
    const convs: Conversation[] = data.conversations ?? []
    setConversations(convs)
    setTotalTasks(data.totalTasks ?? 0)
    setConvsLoading(false)
    // Preload first conversation in background so tapping it feels instant
    const first = convs[0]
    if (first) {
      fetch(`/api/teacher/messages?studentId=${first.studentId}`)
        .then(r => r.json())
        .then(d => {
          if (d.messages) setMessagesCache(prev => ({ ...prev, [first.studentId]: d.messages }))
        })
        .catch(() => {})
    }
  }

  async function selectConversation(studentId: string, studentName: string) {
    setSelectedStudent(studentId)
    setSelectedStudentName(studentName)
    setReplyingTo(null)
    setReplyText("")
    // Show cached messages instantly — no loading skeleton if already visited
    const cached = messagesCache[studentId]
    if (cached) {
      setMessages(cached)
      setMsgsLoading(false)
    } else {
      setMessages([])
      setMsgsLoading(true)
    }
    setConversations((prev) =>
      prev.map((c) => (c.studentId === studentId ? { ...c, unreadCount: 0 } : c))
    )
    const res = await fetch(`/api/teacher/messages?studentId=${studentId}`)
    const data = await res.json()
    const fresh = data.messages ?? []
    setMessages(fresh)
    setMessagesCache((prev) => ({ ...prev, [studentId]: fresh }))
    setMsgsLoading(false)
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
    const res = await fetch("/api/teacher/messages?tasks=true")
    const data = await res.json()
    setGlobalTasks(data.messages ?? [])
  }

  async function fetchWeeklySummary() {
    setSummaryLoading(true)
    setSummaryText("")
    setShowSummary(true)
    try {
      const res = await fetch("/api/teacher/summary")
      if (!res.body) { setSummaryLoading(false); return }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split("\n\n")
        buf = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const json = JSON.parse(line.slice(6))
            if (json.text) setSummaryText(prev => prev + json.text)
          } catch {}
        }
      }
    } catch {}
    setSummaryLoading(false)
  }

  const taskStudentIds = new Set(globalTasks.map(t => (t as any).student?.id).filter(Boolean))
  const filteredConversations = conversations.filter(c => {
    if (convFilter === "הכל") return true
    if (convFilter === "ממתין") return c.unreadCount > 0
    if (convFilter === "נענה") return c.unreadCount === 0
    if (convFilter === "משימות") return taskStudentIds.has(c.studentId)
    return true
  })

  const allTasks = globalTasks
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0)

  if (status === "loading") return null

  return (
    <div className="flex flex-col h-screen" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }} dir="rtl">

      {/* Top header */}
      <div className="flex-shrink-0 bg-black/30 backdrop-blur-md border-b border-white/10 px-4 header-pt pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/home" className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/70 hover:text-white interactive btn-press transition-colors">
              🏠
            </a>
            <div>
              <div className="font-semibold text-white text-sm">לוח מחנך</div>
              <div className="text-white/40 text-xs">{session?.user?.name}</div>
            </div>
          </div>
          {/* Main tabs */}
          <div className="flex gap-1">
            {["שיחות", "ניתוח", "עוזר"].map((label, i) => {
              const full = ["שיחות", "ניתוח נתונים", "עוזר אישי"][i]
              const isActive = mainTab === full
              return (
                <button key={label} onClick={() => setMainTab(full)}
                  className={`text-xs px-3 py-1.5 rounded-xl transition-all interactive btn-press ${isActive ? "bg-white/20 text-white font-medium" : "text-white/40 hover:text-white/70"}`}>
                  {label}
                  {label === "שיחות" && totalUnread > 0 && (
                    <span className="mr-1 bg-indigo-500 text-white text-[10px] rounded-full px-1">{totalUnread}</span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchWeeklySummary}
              className="glass rounded-xl px-3 py-1.5 text-white/60 hover:text-white text-xs interactive btn-press transition-colors">
              סיכום
            </button>
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-white/30 hover:text-white/70 text-xs interactive px-1">
              יציאה
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">

        {mainTab === "שיחות" && (
          <>
            {/* Sidebar */}
            <div className={`${selectedStudent ? "hidden md:flex" : "flex"} w-full md:w-80 flex-col flex-shrink-0 border-l border-white/10`}>
              {/* Inner tabs */}
              <div className="flex gap-1 px-3 pt-3 pb-2 flex-shrink-0">
                <button onClick={() => setInnerTab("chat")}
                  className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all interactive ${innerTab === "chat" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/60"}`}>
                  שיחות{totalUnread > 0 && <span className="bg-indigo-500 text-white rounded-full px-1.5 py-0.5 text-xs mr-1">{totalUnread}</span>}
                </button>
                <button onClick={() => { setInnerTab("tasks"); fetchGlobalTasks() }}
                  className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all interactive ${innerTab === "tasks" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/60"}`}>
                  משימות{totalTasks > 0 && <span className="text-white/40 text-xs mr-1">({totalTasks})</span>}
                </button>
              </div>

              {innerTab === "chat" && (
                <div className="flex-1 overflow-y-auto flex flex-col">
                  {/* Filter row */}
                  <div className="flex gap-1 px-3 pb-2 flex-shrink-0">
                    {(["הכל", "ממתין", "נענה", "משימות"] as ConvFilter[]).map(f => (
                      <button key={f} onClick={() => setConvFilter(f)}
                        className={`text-xs px-2.5 py-1 rounded-full transition-colors interactive ${convFilter === f ? "bg-white/20 text-white" : "text-white/30 hover:text-white/60"}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 space-y-1.5">
                    {convsLoading && conversations.length === 0 && (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="glass rounded-2xl px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/10" />
                            <div className="flex-1 space-y-2">
                              <div className="h-2.5 bg-white/15 rounded-full w-28" />
                              <div className="h-2 bg-white/10 rounded-full w-40" />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {filteredConversations.map((c) => {
                      const initials = c.studentName.slice(0, 2)
                      const isSelected = selectedStudent === c.studentId
                      return (
                        <button
                          key={c.studentId}
                          onClick={() => selectConversation(c.studentId, c.studentName)}
                          className={`w-full text-right rounded-2xl px-3 py-3 transition-all interactive btn-press ${isSelected ? "bg-white/20 shadow-lg" : "glass hover:bg-white/12"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-indigo-200 text-xs font-bold flex-shrink-0">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-sm text-white">{c.studentName}</div>
                                {c.unreadCount > 0 && (
                                  <span className="bg-indigo-500 text-white rounded-full px-2 py-0.5 text-xs">{c.unreadCount}</span>
                                )}
                              </div>
                              {c.parentLabels.length > 0 && (
                                <div className="text-xs text-white/40">{c.parentLabels.join(" · ")}</div>
                              )}
                              <div className="text-xs text-white/30 truncate mt-0.5">{c.lastMessage.content}</div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                    {!convsLoading && filteredConversations.length === 0 && (
                      <div className="text-center text-white/30 text-sm py-10">אין שיחות</div>
                    )}
                  </div>
                </div>
              )}

              {innerTab === "tasks" && (
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                  {allTasks.length === 0 ? (
                    <p className="text-white/30 text-sm text-center mt-8">אין משימות פתוחות</p>
                  ) : (
                    allTasks.map((m) => (
                      <div key={m.id} className="glass rounded-2xl p-3 border border-amber-400/20 bg-amber-500/10">
                        {(m as any).student && (
                          <button
                            onClick={() => { setInnerTab("chat"); selectConversation((m as any).student.id, (m as any).student.name) }}
                            className="text-xs font-semibold text-amber-300 hover:text-amber-100 interactive mb-1 block"
                          >
                            {(m as any).student.name} ←
                          </button>
                        )}
                        <p className="text-sm text-white/80">{m.content}</p>
                        <button onClick={() => toggleAction(m.id, "untask")} className="text-xs text-amber-400 mt-1.5 hover:underline interactive">
                          סמן כבוצע
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Chat area */}
            <div className={`${!selectedStudent ? "hidden md:flex" : "flex"} flex-1 flex-col overflow-hidden`}>
              {!selectedStudent ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 glass rounded-3xl flex items-center justify-center text-3xl mx-auto">💬</div>
                    <div className="text-white/40 text-sm">בחר שיחה מהרשימה</div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex-shrink-0 flex items-center gap-3">
                    <button onClick={() => setSelectedStudent(null)} className="md:hidden text-white/50 hover:text-white interactive p-1">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>
                    <div className="w-8 h-8 rounded-full bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-indigo-200 text-xs font-bold">
                      {selectedStudentName.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{selectedStudentName}</div>
                      <div className="text-xs text-white/40">{messages.length} הודעות</div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {msgsLoading && (
                      <div className="space-y-3">
                        {[1, 0, 1, 0, 1].map((right, i) => (
                          <div key={i} className={`flex ${right ? "justify-end" : "justify-start"}`}>
                            <div className={`glass rounded-2xl px-4 py-3 space-y-1.5 ${right ? "w-48" : "w-56"}`}>
                              <div className="h-2.5 bg-white/15 rounded-full w-full" />
                              <div className="h-2.5 bg-white/10 rounded-full w-3/4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {messages.map((msg) => (
                      <div key={msg.id} className="space-y-1">
                        {/* Parent message */}
                        <div className="flex justify-end">
                          <div className="max-w-sm">
                            <div className="bg-indigo-600/70 backdrop-blur-sm border border-indigo-500/30 text-white rounded-2xl rounded-tr-sm px-4 py-2">
                              <div className="text-xs text-indigo-300 mb-1">{msg.sender.name}</div>
                              <div className="text-sm">{msg.content}</div>
                              <div className="text-xs text-indigo-300/60 mt-1 text-left">
                                {new Date(msg.createdAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bot response */}
                        {msg.botResponse && (
                          <div className="flex justify-start">
                            <div className="max-w-sm">
                              <div className="glass rounded-2xl rounded-tl-sm px-4 py-2">
                                <div className="text-xs text-white/50 font-medium mb-1">✨ סילבר בוט</div>
                                <div className="text-sm text-white/85 whitespace-pre-wrap">{msg.botResponse}</div>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="text-xs text-white/25">
                                    {msg.botAnsweredAt && new Date(msg.botAnsweredAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => toggleAction(msg.id, msg.teacherApproved ? "unapprove" : "approve")}
                                      title={msg.teacherApproved ? "בטל אישור" : "אשר תשובה"}
                                      className={`text-sm px-2 py-0.5 rounded-full transition-colors ${msg.teacherApproved ? "bg-green-500/40 text-green-200 border border-green-400/30" : "bg-white/10 text-white/30 hover:bg-white/20"}`}
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => toggleAction(msg.id, msg.isTask ? "untask" : "task")}
                                      title={msg.isTask ? "הסר ממשימות" : "הוסף למשימות"}
                                      className={`text-sm px-2 py-0.5 rounded-full transition-colors ${msg.isTask ? "bg-amber-500/40 text-amber-200 border border-amber-400/30" : "bg-white/10 text-white/30 hover:bg-amber-500/20"}`}
                                    >
                                      ★
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {!msg.teacherResponse && (
                                <button onClick={() => setReplyingTo(msg.id)} className="text-xs text-white/30 mt-1 mr-2 hover:text-white/70 interactive">
                                  הגב
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Forwarded */}
                        {!msg.botResponse && msg.status === "FORWARDED" && (
                          <div className="flex justify-start">
                            <div className="glass rounded-2xl rounded-tl-sm px-4 py-2 text-xs text-white/50">
                              הועבר לטיפול ידני
                              {!msg.teacherResponse && (
                                <button onClick={() => setReplyingTo(msg.id)} className="mr-3 text-white/70 hover:underline interactive">
                                  הגב
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Teacher response */}
                        {msg.teacherResponse && (
                          <div className="flex justify-start">
                            <div className="max-w-sm glass rounded-2xl rounded-tl-sm px-4 py-2 border border-teal-400/20 bg-teal-500/10">
                              <div className="text-xs text-teal-300 font-medium mb-1">המחנך/ת</div>
                              <div className="text-sm text-white/80">{msg.teacherResponse}</div>
                            </div>
                          </div>
                        )}

                        {/* Reply input */}
                        {replyingTo === msg.id && (
                          <div className="flex justify-start mr-4">
                            <div className="w-full max-w-sm space-y-2">
                              <div className="flex flex-wrap gap-1">
                                {QUICK_REPLIES.map(r => (
                                  <button key={r} onClick={() => setReplyText(r)}
                                    className="text-xs glass hover:bg-white/15 text-white/60 rounded-full px-2.5 py-1 interactive transition-colors">
                                    {r}
                                  </button>
                                ))}
                              </div>
                              <div className="glass rounded-2xl px-3 py-2 flex gap-2 items-center border border-white/15">
                                <input
                                  autoFocus
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
                                  placeholder="כתוב תגובה..."
                                  className="flex-1 text-sm outline-none text-white placeholder-white/30 bg-transparent"
                                  style={{ fontSize: "16px" }}
                                />
                                <button
                                  onClick={sendReply}
                                  disabled={sending || !replyText.trim()}
                                  className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-40 btn-press interactive transition-colors"
                                >
                                  ➤
                                </button>
                              </div>
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
            accentColor="bg-indigo-600"
            accentLight="bg-indigo-500/20"
            accentText="text-indigo-300"
          />
        )}

        {mainTab === "עוזר אישי" && (
          <ComingSoon
            icon="🤖"
            title="עוזר אישי למחנך"
            description="ניהול משימות, תזכורות חכמות, הכנת מסמכים ודוחות — הכל בשיחה טבעית."
            featureKey="teacher-assistant"
            accentColor="bg-indigo-600"
            accentLight="bg-indigo-500/20"
            accentText="text-indigo-300"
          />
        )}

      </div>

      {/* Weekly summary modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSummary(false)}>
          <div className="glass rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col border border-white/15" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="font-semibold text-white">✨ סיכום שבועי</div>
              <button onClick={() => setShowSummary(false)} className="text-white/40 hover:text-white interactive text-xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {summaryLoading && !summaryText && (
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <span className="animate-spin">⟳</span> מכין סיכום...
                </div>
              )}
              {summaryText && (
                <div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                  {summaryText}
                  {summaryLoading && <span className="inline-block w-0.5 h-3.5 bg-white/40 animate-pulse ml-0.5 align-middle" />}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
