"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"

interface Term {
  id: string
  term: string
  shortDefinition: string
  extendedArticle: string | null
  practiceSlideId: string | null
  practiceUrl: string | null
  lessonSlug: string
  lessonTitle: string
  lessonOrder: number
  order: number
}

// Minimal renderer for the extended article's light markdown (**bold**,
// blank-line paragraphs) — matches the same convention used elsewhere in
// the app (e.g. the lesson print view's renderBody) without a new dependency.
function renderArticle(text: string) {
  return text.split(/\n\n+/).map((para, pi) => (
    <p key={pi} className="text-white/70 text-sm leading-relaxed mb-3 last:mb-0">
      {para.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={i} className="text-white/90">{part.slice(2, -2)}</strong>
          : part
      )}
    </p>
  ))
}

function TermCard({ t, canEdit, onSaved }: { t: Term; canEdit: boolean; onSaved: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    term: t.term, shortDefinition: t.shortDefinition,
    extendedArticle: t.extendedArticle ?? "", practiceSlideId: t.practiceSlideId ?? "",
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/glossary/${t.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then(r => r.json())
    setSaving(false)
    setEditing(false)
    // Refetch from the parent rather than merging locally — practiceUrl is
    // built server-side from the (possibly just-changed) practiceSlideId.
    if (res.term) onSaved()
  }

  if (editing) {
    return (
      <div className="glass rounded-2xl p-4 space-y-2.5">
        <input value={form.term} onChange={e => setForm({ ...form, term: e.target.value })}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm font-semibold" placeholder="מושג" />
        <textarea value={form.shortDefinition} onChange={e => setForm({ ...form, shortDefinition: e.target.value })}
          rows={2} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm resize-y" placeholder="הגדרה קצרה" />
        <textarea value={form.extendedArticle} onChange={e => setForm({ ...form, extendedArticle: e.target.value })}
          rows={8} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-xs leading-relaxed resize-y" placeholder="הרחבה" />
        <input value={form.practiceSlideId} onChange={e => setForm({ ...form, practiceSlideId: e.target.value })}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-xs" placeholder="מזהה שקף שאלת אירוע (למשל s12) — ריק אם אין" dir="ltr" />
        <div className="flex gap-2 pt-1">
          <button onClick={save} disabled={saving}
            className="flex-1 py-2 rounded-xl bg-white text-black text-sm font-semibold interactive btn-press disabled:opacity-50">
            {saving ? "שומר..." : "שמירה"}
          </button>
          <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl bg-white/10 text-white/70 text-sm interactive btn-press">ביטול</button>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-white font-semibold text-base">{t.term}</h3>
        {canEdit && (
          <button onClick={() => setEditing(true)} className="text-white/30 hover:text-white interactive px-1 flex-shrink-0" aria-label="עריכה">✎</button>
        )}
      </div>
      <p className="text-white/65 text-sm leading-relaxed mt-1.5">{t.shortDefinition}</p>

      <div className="flex items-center gap-4 mt-3">
        {t.extendedArticle && (
          <button onClick={() => setExpanded(!expanded)}
            className="text-white/50 hover:text-white text-xs font-medium interactive flex items-center gap-1">
            הרחבה {expanded ? "↑" : "←"}
          </button>
        )}
        {t.practiceUrl && (
          <a href={t.practiceUrl} target="_blank" rel="noopener noreferrer"
            className="text-amber-300/80 hover:text-amber-300 text-xs font-medium interactive flex items-center gap-1">
            שאלת אירוע ←
          </a>
        )}
      </div>

      {expanded && t.extendedArticle && (
        <div className="mt-3 pt-3 border-t border-white/10">
          {renderArticle(t.extendedArticle)}
        </div>
      )}
    </div>
  )
}

export default function GlossaryPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string | undefined
  const canEdit = role === "TEACHER" || role === "ADMIN"

  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  function refetch() {
    return fetch("/api/glossary").then(r => r.json()).then(d => setTerms(d.terms ?? []))
  }

  useEffect(() => { refetch().finally(() => setLoading(false)) }, [])

  const filtered = useMemo(() => {
    const q = query.trim()
    if (!q) return terms
    return terms.filter(t => t.term.includes(q) || t.shortDefinition.includes(q))
  }, [terms, query])

  // Group consecutively by lesson, preserving the already-sorted order.
  const groups: { lessonTitle: string; lessonSlug: string; items: Term[] }[] = []
  for (const t of filtered) {
    const last = groups[groups.length - 1]
    if (last && last.lessonSlug === t.lessonSlug) last.items.push(t)
    else groups.push({ lessonTitle: t.lessonTitle, lessonSlug: t.lessonSlug, items: [t] })
  }

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-2xl interactive leading-none">←</Link>
        <div>
          <h1 className="font-semibold text-lg text-white">מילון מושגים</h1>
          <p className="text-white/40 text-xs">כל המושגים מהשיעורים, לפי סדר הלימוד</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="חיפוש מושג..."
          className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30" />

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="glass rounded-2xl px-4 py-10 text-center">
            <p className="text-white/30 text-sm">לא נמצאו מושגים</p>
          </div>
        )}

        {!loading && groups.map(g => (
          <section key={g.lessonSlug}>
            <h2 className="text-white/50 text-xs font-semibold mb-2 px-1">{g.lessonTitle}</h2>
            <div className="space-y-2.5">
              {g.items.map(t => <TermCard key={t.id} t={t} canEdit={canEdit} onSaved={refetch} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
