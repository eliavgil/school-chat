"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

interface DocT {
  id: string
  filename: string
  fileUrl: string
  extractedFacts: string
  createdAt: string
}

type UploadStatus = "pending" | "uploading" | "done" | "error"
interface UploadItem { name: string; status: UploadStatus; error?: string }

// A browser-reported File.type isn't guaranteed to be a well-formed MIME
// string — Safari validates the Blob() constructor's `type` option against
// strict MIME grammar and throws if it isn't, which some odd exports (e.g.
// a PDF saved out of another app) can trigger. Deriving it ourselves from
// the extension sidesteps that entirely.
const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp",
  txt: "text/plain", md: "text/markdown", csv: "text/csv",
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "2-digit" })
}

export default function SchoolAssistantAdminPage() {
  const [docs, setDocs] = useState<DocT[]>([])
  const [serviceAccountEmail, setServiceAccountEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [sheetUrl, setSheetUrl] = useState("")
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetError, setSheetError] = useState<string | null>(null)
  const [pageUrl, setPageUrl] = useState("")
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [instructions, setInstructions] = useState("")
  const [instructionsLoading, setInstructionsLoading] = useState(true)
  const [instructionsSaving, setInstructionsSaving] = useState(false)
  const [instructionsSaved, setInstructionsSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load(); loadInstructions() }, [])

  async function load() {
    setLoading(true)
    const d = await fetch("/api/admin/school-knowledge").then(r => r.json()).catch(() => ({ docs: [] }))
    setDocs(d.docs ?? [])
    setServiceAccountEmail(d.serviceAccountEmail ?? null)
    setLoading(false)
  }

  async function loadInstructions() {
    setInstructionsLoading(true)
    const d = await fetch("/api/admin/assistant-settings").then(r => r.json()).catch(() => ({ instructions: "" }))
    setInstructions(d.instructions ?? "")
    setInstructionsLoading(false)
  }

  async function saveInstructions() {
    setInstructionsSaving(true)
    await fetch("/api/admin/assistant-settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instructions }),
    })
    setInstructionsSaving(false)
    setInstructionsSaved(true)
    setTimeout(() => setInstructionsSaved(false), 2000)
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const list = Array.from(files)
    setUploads(list.map(f => ({ name: f.name, status: "pending" })))
    setUploading(true)

    for (let i = 0; i < list.length; i++) {
      const file = list[i]
      setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status: "uploading" } : u))
      try {
        // Some browsers throw building the multipart body when a File's own
        // .name has non-Latin characters (Hebrew filenames here) — even
        // overriding the append() filename wasn't enough on its own, so
        // this rebuilds the upload as a plain Blob from raw bytes, fully
        // detached from the original File's name/metadata, and sends the
        // real name separately as an encoded text field the server decodes.
        const bytes = await file.arrayBuffer()
        const ext = (file.name.split(".").pop() || "bin").toLowerCase()
        const cleanBlob = new Blob([bytes], { type: MIME_BY_EXT[ext] || "application/octet-stream" })
        const fd = new FormData()
        fd.append("file", cleanBlob, `upload.${ext}`)
        fd.append("filename", encodeURIComponent(file.name))
        const res = await fetch("/api/admin/school-knowledge", { method: "POST", body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "שגיאה")
        setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status: "done" } : u))
      } catch (e: any) {
        setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status: "error", error: e?.message } : u))
      }
    }

    setUploading(false)
    load()
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function addSheet() {
    if (!sheetUrl.trim()) return
    setSheetLoading(true)
    setSheetError(null)
    try {
      const res = await fetch("/api/admin/school-knowledge", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl: sheetUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "שגיאה")
      setSheetUrl("")
      load()
    } catch (e: any) {
      setSheetError(e?.message ?? "שגיאה")
    }
    setSheetLoading(false)
  }

  async function addPage() {
    if (!pageUrl.trim()) return
    setPageLoading(true)
    setPageError(null)
    try {
      const res = await fetch("/api/admin/school-knowledge", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageUrl: pageUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "שגיאה")
      setPageUrl("")
      load()
    } catch (e: any) {
      setPageError(e?.message ?? "שגיאה")
    }
    setPageLoading(false)
  }

  function copyEmail() {
    if (!serviceAccountEmail) return
    navigator.clipboard.writeText(serviceAccountEmail).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function saveEdit(id: string) {
    const extractedFacts = editing[id] ?? ""
    await fetch("/api/admin/school-knowledge", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, extractedFacts }),
    })
    setDocs(prev => prev.map(d => d.id === id ? { ...d, extractedFacts } : d))
    setEditing(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  async function remove(id: string) {
    if (!confirm("למחוק מסמך זה מהמאגר?")) return
    await fetch("/api/admin/school-knowledge", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <div className="flex-1">
          <h1 className="font-semibold text-lg text-white">פקפקובי בוט - עוזר אישי — מאגר ידע</h1>
          <p className="text-white/40 text-xs">קבצים שהבוט הלוגיסטי לתלמידים והורים עונה מתוכם</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-5">
        <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
          <div>
            <h2 className="text-white text-sm font-medium mb-1">הוראות לבוט</h2>
            <p className="text-white/40 text-xs leading-relaxed">
              טון דיבור, מה לענות כשמשהו לא ידוע, ניסוחים שחשוב להשתמש/להימנע מהם וכד׳ — בנפרד מהעובדות עצמן. כמה חוקים תמיד קבועים ולא ניתנים לשינוי מכאן: הבוט לעולם לא מלמד, לא פותר תרגילים, ולא נוגע בציונים או במידע אישי/אקדמי — גם אם ההוראות כאן יגידו אחרת.
            </p>
          </div>
          {instructionsLoading ? (
            <p className="text-white/30 text-xs">טוען...</p>
          ) : (
            <>
              <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={4}
                placeholder="לדוגמה: תענה בטון חם ולא רשמי. אם משהו לא ברור, תמיד תפנה ל-office@... ולא רק 'למזכירות'. אל תשתמש במילה 'תלמיד/ה' — תפנה בגוף שני."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 leading-relaxed focus:outline-none focus:ring-2 focus:ring-white/30" />
              <button onClick={saveInstructions} disabled={instructionsSaving}
                className="bg-white/15 hover:bg-white/25 text-white text-sm px-4 py-2 rounded-xl interactive btn-press transition-colors disabled:opacity-40">
                {instructionsSaved ? "✓ נשמר" : instructionsSaving ? "שומר..." : "שמור"}
              </button>
            </>
          )}
        </div>

        <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
          <p className="text-white/50 text-xs leading-relaxed">
            אפשר לזרוק כמה קבצים שרוצים בבת אחת — PDF, אקסל (xlsx/xls), תמונות (jpg/png) או טקסט (txt/md/csv). לכל קובץ, Claude יעבור עליו ויחלץ ממנו את העובדות הרלוונטיות אוטומטית; אפשר לערוך את מה שחולץ בהמשך אם צריך לתקן משהו. קבצי Word — יש להמיר קודם ל-PDF.
          </p>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.xlsx,.xls,image/*,.txt,.md,.csv" className="hidden"
            onChange={e => handleFiles(e.target.files)} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="w-full bg-white/15 hover:bg-white/25 text-white text-sm font-medium py-2.5 rounded-xl interactive btn-press transition-colors disabled:opacity-40">
            {uploading ? "מעבד..." : "+ הוסף קבצים"}
          </button>

          {uploads.length > 0 && (
            <div className="space-y-1 pt-1">
              {uploads.map((u, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-white/60 truncate">{u.name}</span>
                  <span className={
                    u.status === "done" ? "text-green-400" :
                    u.status === "error" ? "text-red-400" :
                    u.status === "uploading" ? "text-white/50" : "text-white/25"
                  }>
                    {u.status === "pending" && "ממתין"}
                    {u.status === "uploading" && "מעבד..."}
                    {u.status === "done" && "✓ נוסף"}
                    {u.status === "error" && (u.error || "שגיאה")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
          <p className="text-white/50 text-xs leading-relaxed">
            אפשר גם להדביק קישור לגיליון Google Sheets במקום להעלות קובץ — הבוט יקרא את כל הלשוניות שלו. הגיליון חייב להיות משותף עם חשבון השירות של האפליקציה:
          </p>
          {serviceAccountEmail && (
            <button onClick={copyEmail}
              className="w-full flex items-center justify-between gap-2 bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-xs interactive">
              <span dir="ltr" className="text-white/70 truncate">{serviceAccountEmail}</span>
              <span className="text-white/40 flex-shrink-0">{copied ? "✓ הועתק" : "העתק"}</span>
            </button>
          )}
          <div className="flex gap-2">
            <input value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} dir="ltr" placeholder="https://docs.google.com/spreadsheets/d/..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <button onClick={addSheet} disabled={sheetLoading || !sheetUrl.trim()}
              className="bg-white/15 hover:bg-white/25 text-white text-sm px-4 py-2 rounded-xl interactive btn-press transition-colors disabled:opacity-40 flex-shrink-0">
              {sheetLoading ? "מוסיף..." : "הוסף"}
            </button>
          </div>
          {sheetError && <p className="text-red-400 text-xs">{sheetError}</p>}
        </div>

        <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
          <p className="text-white/50 text-xs leading-relaxed">
            אפשר גם להדביק קישור לדף אינטרנט רגיל (למשל אתר שפורסם מ-Canva) — הבוט יקרא את הטקסט מהדף. עובד רק על דפים שהתוכן שלהם קיים ב-HTML עצמו, לא כאלה שנטענים לגמרי ב-JavaScript אחרי הטעינה.
          </p>
          <div className="flex gap-2">
            <input value={pageUrl} onChange={e => setPageUrl(e.target.value)} dir="ltr" placeholder="https://..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <button onClick={addPage} disabled={pageLoading || !pageUrl.trim()}
              className="bg-white/15 hover:bg-white/25 text-white text-sm px-4 py-2 rounded-xl interactive btn-press transition-colors disabled:opacity-40 flex-shrink-0">
              {pageLoading ? "מוסיף..." : "הוסף"}
            </button>
          </div>
          {pageError && <p className="text-red-400 text-xs">{pageError}</p>}
        </div>

        {loading && <p className="text-white/40 text-sm text-center py-8">טוען...</p>}

        {!loading && docs.length === 0 && (
          <div className="text-center py-10">
            <p className="text-white/30 text-4xl mb-3">📄</p>
            <p className="text-white/40 text-sm">עוד אין קבצים במאגר</p>
          </div>
        )}

        {docs.length > 0 && (
          <div className="space-y-2">
            {docs.map(d => {
              const isEditing = d.id in editing
              return (
                <div key={d.id} className="bg-white/8 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-white/85 text-sm font-medium hover:underline truncate block">
                        {d.filename}
                      </a>
                      <p className="text-white/30 text-[11px] mt-0.5">נוסף {fmtDate(d.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!isEditing && (
                        <button onClick={() => setEditing(prev => ({ ...prev, [d.id]: d.extractedFacts }))}
                          className="text-white/40 hover:text-white text-xs interactive px-2 py-1 rounded-lg bg-white/8">
                          ✎ ערוך
                        </button>
                      )}
                      <button onClick={() => remove(d.id)} className="text-white/40 hover:text-red-400 text-xs interactive px-2 py-1 rounded-lg bg-white/8">
                        מחק
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea value={editing[d.id]} onChange={e => setEditing(prev => ({ ...prev, [d.id]: e.target.value }))}
                        rows={6}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-white/30" />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(d.id)} className="text-xs text-white/80 hover:text-white interactive bg-white/15 px-3 py-1.5 rounded-lg">שמור</button>
                        <button onClick={() => setEditing(prev => { const next = { ...prev }; delete next[d.id]; return next })}
                          className="text-xs text-white/40 hover:text-white interactive px-3 py-1.5">ביטול</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white/50 text-xs leading-relaxed whitespace-pre-wrap">{d.extractedFacts}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
