"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { driveIconFor } from "@/lib/driveIcon"

interface MaterialT { id: string; title: string; url: string; createdAt: string }

export default function CivicsMaterialsPage() {
  const [materials, setMaterials] = useState<MaterialT[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const d = await fetch("/api/study-materials").then(r => r.json()).catch(() => ({ materials: [] }))
    setMaterials(d.materials ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function add() {
    if (!title.trim() || !url.trim()) return
    setSaving(true)
    await fetch("/api/study-materials", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), url: url.trim() }),
    })
    setTitle(""); setUrl(""); setShowAdd(false)
    await load()
    setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm("להסיר חומר זה מהרשימה?")) return
    setDeletingId(id)
    await fetch("/api/study-materials", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    await load()
    setDeletingId(null)
  }

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white flex-1">חומר לימודי — אזרחות</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <button onClick={() => setShowAdd(v => !v)}
          className="w-full bg-white/15 hover:bg-white/25 text-white text-sm font-medium py-2.5 rounded-xl interactive btn-press transition-colors">
          {showAdd ? "ביטול" : "+ חומר חדש"}
        </button>

        {showAdd && (
          <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="שם החומר *"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="קישור *" dir="ltr"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <button onClick={add} disabled={saving || !title.trim() || !url.trim()}
              className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-xl disabled:opacity-40 btn-press interactive transition-colors">
              {saving ? "שומר..." : "שמור"}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-white/40 text-sm text-center py-8">טוען...</p>
        ) : materials.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-white/30 text-4xl mb-3">📚</p>
            <p className="text-white/40 text-sm">אין עדיין חומרי לימוד</p>
          </div>
        ) : (
          <div className="space-y-2">
            {materials.map(m => (
              <div key={m.id} className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 group">
                <span className="text-xl flex-shrink-0">{driveIconFor(m.url)}</span>
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 text-sm text-white/85 hover:text-white interactive truncate">
                  {m.title}
                </a>
                <button onClick={() => remove(m.id)} disabled={deletingId === m.id}
                  className="text-white/25 hover:text-red-400 interactive p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 disabled:opacity-40">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
