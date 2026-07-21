"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface LessonItem { id: string; slug: string; title: string; subject: string; created_at: string }

export default function LessonsPage() {
  const router = useRouter()
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch("/api/lessons").then(r => r.json()).then(d => {
      setLessons(Array.isArray(d) ? d : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function createLesson() {
    setCreating(true)
    const res = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "שיעור חדש", subject: "אזרחות" }),
    })
    if (res.ok) {
      const lesson = await res.json()
      router.push(`/lessons/${lesson.id}/edit`)
    }
    setCreating(false)
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--paper, #F5F1E6)", fontFamily: "'Heebo', sans-serif", direction: "rtl" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700;900&family=Heebo:wght@300;400;500;700&display=swap');
        :root { --ink:#1B2A4A; --paper:#F5F1E6; --seal:#A23B2E; --gold:#B08D3F; --ok:#3F6B4F; }
      `}</style>

      {/* Header */}
      <header style={{ background: "var(--ink)", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ color: "var(--paper)", fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 700, fontSize: 18 }}>
          שיעורים חיים
        </div>
        <Link href="/home" style={{ color: "rgba(245,241,230,0.6)", fontSize: 13, textDecoration: "none" }}>← חזרה</Link>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif", color: "var(--ink)", fontSize: 26, margin: 0 }}>מאגר שיעורים</h1>
          <div style={{ display: "flex", gap: 8 }}>
          <Link href="/lessons/results"
            style={{ padding: "10px 16px", borderRadius: 8, border: "1.5px solid var(--ok)", color: "var(--ok)", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            📊 תוצאות
          </Link>
          <button
            onClick={createLesson}
            disabled={creating}
            style={{ background: "var(--seal)", color: "var(--paper)", border: "none", borderRadius: 8, padding: "10px 20px", fontFamily: "'Heebo'", fontWeight: 700, fontSize: 14, cursor: creating ? "default" : "pointer", opacity: creating ? 0.6 : 1 }}>
            {creating ? "יוצר..." : "+ שיעור חדש"}
          </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "var(--ink)", opacity: 0.4, padding: "60px 0" }}>טוען...</div>
        ) : lessons.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <p style={{ color: "var(--ink)", opacity: 0.5 }}>אין שיעורים עדיין. צרו שיעור ראשון!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...lessons].sort((a, b) => {
              const na = parseInt(a.title.match(/שיעור\s+(\d+)/)?.[1] ?? "9999")
              const nb = parseInt(b.title.match(/שיעור\s+(\d+)/)?.[1] ?? "9999")
              return na - nb
            }).map(l => (
              <div key={l.id} style={{ background: "#fff", border: "1px solid rgba(27,42,74,0.12)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 700, color: "var(--ink)", fontSize: 16 }}>{l.title}</div>
                  <div style={{ color: "rgba(27,42,74,0.45)", fontSize: 12, marginTop: 4 }}>
                    {new Date(l.created_at).toLocaleDateString("he-IL")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link href={`/lessons/${l.id}/edit`}
                    style={{ padding: "7px 14px", borderRadius: 7, border: "1.5px solid var(--ink)", color: "var(--ink)", fontSize: 13, fontWeight: 600, textDecoration: "none", background: "transparent" }}>
                    עריכה
                  </Link>
                  <Link href={`/lessons/${l.id}/present`}
                    style={{ padding: "7px 14px", borderRadius: 7, background: "var(--ink)", color: "var(--paper)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                    הצג
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
