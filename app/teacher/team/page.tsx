"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { StaffTasksTab } from "@/app/components/StaffTasksTab"

type Tab = "tasks" | "files" | "events" | "forum"

const TABS: [Tab, string][] = [
  ["tasks", "משימות"],
  ["files", "קבצים"],
  ["events", "אירועים"],
  ["forum", "פורום"],
]

export default function TeamPage() {
  const [tab, setTab] = useState<Tab>("tasks")

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white flex-1">צוות מחנכים</h1>
      </header>

      <div className="flex gap-2 px-4 pt-4 overflow-x-auto">
        {TABS.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium interactive btn-press transition-colors ${tab === t ? "bg-white/20 text-white" : "text-white/40 hover:text-white/70"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {tab === "tasks" && <StaffTasksTab />}
        {tab === "files" && <FilesTab />}
        {tab === "events" && <EventsTab />}
        {tab === "forum" && <ForumTab />}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   FILES — a manually-curated list of Drive links
   ══════════════════════════════════════════════════════════ */
interface TeamFileT { id: string; title: string; url: string; createdAt: string }

export function driveIconFor(url: string): string {
  if (/\/folders\//.test(url)) return "📁"
  if (/spreadsheets/.test(url)) return "📊"
  if (/document/.test(url)) return "📄"
  if (/presentation/.test(url)) return "📽️"
  if (/forms/.test(url)) return "📋"
  return "🔗"
}

function FilesTab() {
  const [files, setFiles] = useState<TeamFileT[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const d = await fetch("/api/team/files").then(r => r.json()).catch(() => ({ files: [] }))
    setFiles(d.files ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function add() {
    if (!title.trim() || !url.trim()) return
    setSaving(true)
    await fetch("/api/team/files", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), url: url.trim() }),
    })
    setTitle(""); setUrl(""); setShowAdd(false)
    await load()
    setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm("להסיר קובץ זה מהרשימה?")) return
    setDeletingId(id)
    await fetch("/api/team/files", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    await load()
    setDeletingId(null)
  }

  return (
    <div className="space-y-5">
      <button onClick={() => setShowAdd(v => !v)}
        className="w-full bg-white/15 hover:bg-white/25 text-white text-sm font-medium py-2.5 rounded-xl interactive btn-press transition-colors">
        {showAdd ? "ביטול" : "+ קובץ חדש"}
      </button>

      {showAdd && (
        <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="שם הקובץ *"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="קישור לגוגל דרייב *" dir="ltr"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
          <div className="flex gap-2">
            <button onClick={add} disabled={saving || !title.trim() || !url.trim()}
              className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-xl disabled:opacity-40 btn-press interactive transition-colors">
              {saving ? "שומר..." : "שמור"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-white/40 text-sm text-center py-8">טוען...</p>
      ) : files.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-white/30 text-4xl mb-3">📁</p>
          <p className="text-white/40 text-sm">אין עדיין קבצים</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(f => (
            <div key={f.id} className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 group">
              <span className="text-xl flex-shrink-0">{driveIconFor(f.url)}</span>
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 text-sm text-white/85 hover:text-white interactive truncate">
                {f.title}
              </a>
              <button onClick={() => remove(f.id)} disabled={deletingId === f.id}
                className="text-white/25 hover:text-red-400 interactive p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 disabled:opacity-40">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   EVENTS — the team's own small events list (meetings, internal
   deadlines) — separate from the school-wide calendar
   ══════════════════════════════════════════════════════════ */
interface TeamEventT { id: string; title: string; date: string; link: string | null }

function fmtEventDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "numeric" })
}

function EventsTab() {
  const [events, setEvents] = useState<TeamEventT[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [link, setLink] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const d = await fetch("/api/team/events").then(r => r.json()).catch(() => ({ events: [] }))
    setEvents(d.events ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function add() {
    if (!title.trim() || !date) return
    setSaving(true)
    await fetch("/api/team/events", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), date, link: link || null }),
    })
    setTitle(""); setDate(""); setLink(""); setShowAdd(false)
    await load()
    setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm("למחוק ארוע זה?")) return
    setDeletingId(id)
    await fetch("/api/team/events", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    await load()
    setDeletingId(null)
  }

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = events.filter(e => e.date.slice(0, 10) >= today)
  const past = events.filter(e => e.date.slice(0, 10) < today)

  return (
    <div className="space-y-5">
      <button onClick={() => setShowAdd(v => !v)}
        className="w-full bg-white/15 hover:bg-white/25 text-white text-sm font-medium py-2.5 rounded-xl interactive btn-press transition-colors">
        {showAdd ? "ביטול" : "+ ארוע חדש"}
      </button>

      {showAdd && (
        <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="כותרת הארוע *"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30" />
          <input value={link} onChange={e => setLink(e.target.value)} placeholder="קישור (אופציונלי)" dir="ltr"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
          <button onClick={add} disabled={saving || !title.trim() || !date}
            className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-xl disabled:opacity-40 btn-press interactive transition-colors">
            {saving ? "שומר..." : "שמור"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-white/40 text-sm text-center py-8">טוען...</p>
      ) : events.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-white/30 text-4xl mb-3">📅</p>
          <p className="text-white/40 text-sm">אין עדיין ארועי צוות</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <div className="space-y-2">
              {upcoming.map(e => <EventRow key={e.id} event={e} onDelete={remove} deleting={deletingId === e.id} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-2 opacity-40">
              <p className="text-white/30 text-[11px] font-semibold">עברו</p>
              {past.map(e => <EventRow key={e.id} event={e} onDelete={remove} deleting={deletingId === e.id} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EventRow({ event, onDelete, deleting }: { event: TeamEventT; onDelete: (id: string) => void; deleting: boolean }) {
  return (
    <div className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 group">
      <div className="text-white/50 text-xs flex-shrink-0 w-16">{fmtEventDate(event.date)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/85 truncate">{event.title}</p>
        {event.link && <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-blue-300/80 hover:text-blue-300 text-[11px] underline">🔗 קישור</a>}
      </div>
      <button onClick={() => onDelete(event.id)} disabled={deleting}
        className="text-white/25 hover:text-red-400 interactive p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 disabled:opacity-40">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   FORUM — flat announcements feed
   ══════════════════════════════════════════════════════════ */
interface TeamPostT { id: string; content: string; createdAt: string; authorId: string; authorName: string | null }

function fmtPostTime(iso: string) {
  return new Date(iso).toLocaleString("he-IL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })
}

function ForumTab() {
  const { data: session } = useSession()
  const myId = (session?.user as any)?.id as string | undefined
  const myRole = (session?.user as any)?.role as string | undefined

  const [posts, setPosts] = useState<TeamPostT[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const d = await fetch("/api/team/posts").then(r => r.json()).catch(() => ({ posts: [] }))
    setPosts(d.posts ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function post() {
    if (!content.trim()) return
    setSaving(true)
    await fetch("/api/team/posts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim() }),
    })
    setContent("")
    await load()
    setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm("למחוק הודעה זו?")) return
    setDeletingId(id)
    await fetch("/api/team/posts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    await load()
    setDeletingId(null)
  }

  return (
    <div className="space-y-5">
      <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="כתבו הודעה לצוות..." rows={3}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none" />
        <button onClick={post} disabled={saving || !content.trim()}
          className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-xl disabled:opacity-40 btn-press interactive transition-colors">
          {saving ? "מפרסם..." : "פרסם"}
        </button>
      </div>

      {loading ? (
        <p className="text-white/40 text-sm text-center py-8">טוען...</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-white/30 text-4xl mb-3">💬</p>
          <p className="text-white/40 text-sm">אין עדיין הודעות</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(p => {
            const canDelete = p.authorId === myId || myRole === "ADMIN"
            return (
              <div key={p.id} className="bg-white/8 border border-white/10 rounded-2xl p-4 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white/85 text-sm whitespace-pre-wrap break-words">{p.content}</p>
                    <p className="text-white/30 text-[11px] mt-1.5">{p.authorName ?? "מורה"} · {fmtPostTime(p.createdAt)}</p>
                  </div>
                  {canDelete && (
                    <button onClick={() => remove(p.id)} disabled={deletingId === p.id}
                      className="text-white/25 hover:text-red-400 interactive p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 disabled:opacity-40">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
