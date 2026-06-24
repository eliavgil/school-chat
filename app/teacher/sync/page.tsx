"use client"

import { useState } from "react"
import Link from "next/link"

interface SyncResult {
  results: Record<string, number | string>
  syncedAt: string
}

const TARGETS = [
  { id: "events",         label: "יומן ארועים",              emoji: "📅", desc: "כל האירועים והחופשות" },
  { id: "exams",          label: "לוח מבחנים",              emoji: "📝", desc: "מבחנים ומטלות" },
  { id: "students",       label: "תלמידים - פרטים אישיים",  emoji: "🧑‍🎓", desc: "רשימת תלמידים ופרטים" },
  { id: "teachers",       label: "מורים מקצועיים",          emoji: "👩‍🏫", desc: "מורי מקצוע בכיתה" },
  { id: "accommodations", label: "מענים אישיים",            emoji: "🧩", desc: "שיעורים פרטיים וטיפולים" },
]

function StatusBadge({ val }: { val: number | string | undefined }) {
  if (val === undefined) return null
  if (typeof val === "string" && val.startsWith("error:")) {
    return <span className="text-red-300 text-xs">שגיאה</span>
  }
  return <span className="text-green-300 text-xs font-mono">{val} שורות</span>
}

export default function SyncPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runSync(target: string) {
    setLoading(target)
    setError(null)
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "שגיאה")
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  const lastSync = result?.syncedAt
    ? new Date(result.syncedAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
    : null

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-2xl interactive leading-none">←</Link>
        <div>
          <h1 className="font-semibold text-lg text-white">סנכרון Google Sheets</h1>
          <p className="text-white/40 text-xs">משיכת נתונים מהגיליון לאפליקציה</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Sync all button */}
        <button
          onClick={() => runSync("all")}
          disabled={loading !== null}
          className="w-full glass rounded-2xl px-4 py-4 flex items-center gap-3 hover:bg-white/15 interactive btn-press transition-colors disabled:opacity-50"
        >
          <span className="text-2xl">{loading === "all" ? "⟳" : "🔄"}</span>
          <div className="flex-1 text-right">
            <div className="text-white font-semibold">סנכרן הכל</div>
            <div className="text-white/40 text-xs">משיכת כל הגיליונות בבת אחת</div>
          </div>
          {loading === "all" && (
            <span className="text-white/40 text-xs animate-pulse">טוען...</span>
          )}
        </button>

        {/* Individual sheet buttons */}
        <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
          {TARGETS.map(t => {
            const res = result?.results[t.id]
            const isErr = typeof res === "string" && res.startsWith("error:")
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl flex-shrink-0">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white/85 text-sm font-medium">{t.label}</p>
                  <p className="text-white/35 text-xs">{t.desc}</p>
                </div>
                {res !== undefined && (
                  <div className={`text-xs px-2 py-0.5 rounded-full ${isErr ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"}`}>
                    {isErr ? "שגיאה" : `${res} שורות`}
                  </div>
                )}
                <button
                  onClick={() => runSync(t.id)}
                  disabled={loading !== null}
                  className="flex-shrink-0 glass rounded-xl px-3 py-1.5 text-white/60 hover:text-white text-xs interactive btn-press transition-colors disabled:opacity-40"
                >
                  {loading === t.id ? "⟳" : "סנכרן"}
                </button>
              </div>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="glass rounded-2xl px-4 py-3 border border-red-500/30 bg-red-500/10">
            <p className="text-red-300 text-sm">❌ {error}</p>
            <p className="text-white/30 text-xs mt-1">ודא שהגיליון שיתף את כתובת הסרביס אקאונט</p>
          </div>
        )}

        {/* Success */}
        {result && !error && (
          <div className="glass rounded-2xl px-4 py-3 border border-green-500/30 bg-green-500/10">
            <p className="text-green-300 text-sm font-medium">✅ סנכרון הושלם</p>
            {lastSync && <p className="text-white/30 text-xs mt-0.5">בשעה {lastSync}</p>}
          </div>
        )}

        {/* Info */}
        <div className="glass rounded-2xl px-4 py-4 space-y-2">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">כיצד זה עובד</p>
          <p className="text-white/40 text-xs leading-relaxed">
            הנתונים נמשכים ישירות מגיליון Google Sheets. הגיליון הוא המקור — שינויים שם יחליפו את הנתונים באפליקציה.
            מידע שהמורה מזין באפליקציה (הערות, רשומות) לא יימחק.
          </p>
        </div>
      </div>
    </div>
  )
}
