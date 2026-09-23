"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

interface DocT {
  id: string
  filename: string
  fileUrl: string
  extractedFacts: string
  note: string | null
  createdAt: string
}

interface LinkT {
  id: string
  label: string
  url: string
  whenToUse: string
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
  const [uploadNote, setUploadNote] = useState("")
  const [editing, setEditing] = useState<Record<string, { extractedFacts: string; note: string }>>({})
  const [sheetUrl, setSheetUrl] = useState("")
  const [sheetNote, setSheetNote] = useState("")
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetError, setSheetError] = useState<string | null>(null)
  const [pageUrl, setPageUrl] = useState("")
  const [pageNote, setPageNote] = useState("")
  const [pageLoading, setPageLoading] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [instructions, setInstructions] = useState("")
  const [instructionsLoading, setInstructionsLoading] = useState(true)
  const [instructionsSaving, setInstructionsSaving] = useState(false)
  const [instructionsSaved, setInstructionsSaved] = useState(false)
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({})
  const [dirLoading, setDirLoading] = useState(false)
  const [dirResult, setDirResult] = useState<{ updated: number; total: number; notFound: string[]; ambiguous: string[]; errors: string[] } | null>(null)
  const [dirError, setDirError] = useState<string | null>(null)
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [groupsResult, setGroupsResult] = useState<{ updated: number; total: number; notFound: string[]; ambiguous: string[]; errors: string[] } | null>(null)
  const [groupsError, setGroupsError] = useState<string | null>(null)
  const [groupsSheetUrl, setGroupsSheetUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dirInputRef = useRef<HTMLInputElement>(null)
  const groupsInputRef = useRef<HTMLInputElement>(null)

  const [links, setLinks] = useState<LinkT[]>([])
  const [linksLoading, setLinksLoading] = useState(true)
  const [newLinkLabel, setNewLinkLabel] = useState("")
  const [newLinkUrl, setNewLinkUrl] = useState("")
  const [newLinkWhen, setNewLinkWhen] = useState("")
  const [linkSaving, setLinkSaving] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [editingLink, setEditingLink] = useState<Record<string, { label: string; url: string; whenToUse: string }>>({})

  useEffect(() => { load(); loadInstructions(); loadLinks() }, [])

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

  async function loadLinks() {
    setLinksLoading(true)
    const d = await fetch("/api/admin/assistant-links").then(r => r.json()).catch(() => ({ links: [] }))
    setLinks(d.links ?? [])
    setLinksLoading(false)
  }

  async function addLink() {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return
    setLinkSaving(true)
    setLinkError(null)
    try {
      const res = await fetch("/api/admin/assistant-links", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLinkLabel.trim(), url: newLinkUrl.trim(), whenToUse: newLinkWhen.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "שגיאה")
      setNewLinkLabel(""); setNewLinkUrl(""); setNewLinkWhen("")
      loadLinks()
    } catch (e: any) {
      setLinkError(e?.message ?? "שגיאה")
    }
    setLinkSaving(false)
  }

  async function saveLinkEdit(id: string) {
    const draft = editingLink[id]
    if (!draft) return
    await fetch("/api/admin/assistant-links", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...draft }),
    })
    setLinks(prev => prev.map(l => l.id === id ? { ...l, ...draft } : l))
    setEditingLink(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  async function removeLink(id: string) {
    if (!confirm("למחוק קישור זה?")) return
    await fetch("/api/admin/assistant-links", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setLinks(prev => prev.filter(l => l.id !== id))
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
        if (uploadNote.trim()) fd.append("note", encodeURIComponent(uploadNote.trim()))
        const res = await fetch("/api/admin/school-knowledge", { method: "POST", body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "שגיאה")
        setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status: "done" } : u))
      } catch (e: any) {
        setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status: "error", error: e?.message } : u))
      }
    }

    setUploading(false)
    setUploadNote("")
    load()
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleDirectoryFile(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setDirLoading(true)
    setDirError(null)
    setDirResult(null)
    try {
      const bytes = await file.arrayBuffer()
      const cleanBlob = new Blob([bytes], { type: MIME_BY_EXT["xlsx"] })
      const fd = new FormData()
      fd.append("file", cleanBlob, "upload.xlsx")
      const res = await fetch("/api/admin/import-student-directory", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "שגיאה")
      setDirResult(data)
    } catch (e: any) {
      setDirError(e?.message ?? "שגיאה")
    }
    setDirLoading(false)
    if (dirInputRef.current) dirInputRef.current.value = ""
  }

  async function handleGroupsFile(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setGroupsLoading(true)
    setGroupsError(null)
    setGroupsResult(null)
    try {
      const bytes = await file.arrayBuffer()
      const cleanBlob = new Blob([bytes], { type: MIME_BY_EXT["xlsx"] })
      const fd = new FormData()
      fd.append("file", cleanBlob, "upload.xlsx")
      const res = await fetch("/api/admin/import-study-groups", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "שגיאה")
      setGroupsResult(data)
    } catch (e: any) {
      setGroupsError(e?.message ?? "שגיאה")
    }
    setGroupsLoading(false)
    if (groupsInputRef.current) groupsInputRef.current.value = ""
  }

  async function handleGroupsSheet() {
    if (!groupsSheetUrl.trim()) return
    setGroupsLoading(true)
    setGroupsError(null)
    setGroupsResult(null)
    try {
      const res = await fetch("/api/admin/import-study-groups", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl: groupsSheetUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "שגיאה")
      setGroupsResult(data)
    } catch (e: any) {
      setGroupsError(e?.message ?? "שגיאה")
    }
    setGroupsLoading(false)
  }

  async function addSheet() {
    if (!sheetUrl.trim()) return
    setSheetLoading(true)
    setSheetError(null)
    try {
      const res = await fetch("/api/admin/school-knowledge", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl: sheetUrl.trim(), note: sheetNote.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "שגיאה")
      setSheetUrl("")
      setSheetNote("")
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
        body: JSON.stringify({ pageUrl: pageUrl.trim(), note: pageNote.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "שגיאה")
      setPageUrl("")
      setPageNote("")
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
    const draft = editing[id]
    if (!draft) return
    await fetch("/api/admin/school-knowledge", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, extractedFacts: draft.extractedFacts, note: draft.note }),
    })
    setDocs(prev => prev.map(d => d.id === id ? { ...d, extractedFacts: draft.extractedFacts, note: draft.note || null } : d))
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
            <h2 className="text-white text-sm font-medium mb-1">ייבוא אלפון תלמידים</h2>
            <p className="text-white/40 text-xs leading-relaxed">
              קובץ אלפון (ייצוא ממשוב) — מייבא לכל תלמיד/ה בהתאמה: מגמה, יישוב מגורים, ושמות ההורים. מותאם בשמו לתלמיד קיים במערכת (ואז לפי ת.ז בהרצות חוזרות). שדות אחרים בקובץ (ת.ז הורים, טלפונים, כתובת מדויקת וכו׳) לא מיובאים בכלל — רק מה שהבוט צריך כדי להתייחס לתלמיד/ה עצמו/ה, לא יותר.
            </p>
          </div>
          <input ref={dirInputRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={e => handleDirectoryFile(e.target.files)} />
          <button onClick={() => dirInputRef.current?.click()} disabled={dirLoading}
            className="w-full bg-white/15 hover:bg-white/25 text-white text-sm font-medium py-2.5 rounded-xl interactive btn-press transition-colors disabled:opacity-40">
            {dirLoading ? "מייבא..." : "+ ייבוא קובץ אלפון"}
          </button>
          {dirError && <p className="text-red-400 text-xs">{dirError}</p>}
          {dirResult && (
            <div className="text-xs space-y-1">
              <p className="text-green-400">✓ עודכנו {dirResult.updated} מתוך {dirResult.total}</p>
              {dirResult.notFound.length > 0 && (
                <p className="text-white/40">לא נמצאו במערכת ({dirResult.notFound.length}): {dirResult.notFound.join(", ")}</p>
              )}
              {dirResult.ambiguous.length > 0 && (
                <p className="text-amber-400">שם כפול, לא הצלחתי להכריע ({dirResult.ambiguous.length}): {dirResult.ambiguous.join(", ")}</p>
              )}
              {dirResult.errors.length > 0 && (
                <p className="text-red-400">שגיאה בעדכון ({dirResult.errors.length}): {dirResult.errors.join(", ")}</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
          <div>
            <h2 className="text-white text-sm font-medium mb-1">ייבוא קבוצות לימוד</h2>
            <p className="text-white/40 text-xs leading-relaxed">
              קובץ "קבוצות לימוד" (ייצוא ממשוב) — מייבא לכל תלמיד/ה בהתאמה רק את הקבוצות שהוא/היא רשום/ה בהן (מקצוע + מורה), ומעדכן מגמה/יחידות לימוד כשזה ברור מהקבוצה. שוב — רק המידע של כל תלמיד/ה על עצמו/ה, לא רשימות שמות.
            </p>
          </div>
          <input ref={groupsInputRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={e => handleGroupsFile(e.target.files)} />
          <button onClick={() => groupsInputRef.current?.click()} disabled={groupsLoading}
            className="w-full bg-white/15 hover:bg-white/25 text-white text-sm font-medium py-2.5 rounded-xl interactive btn-press transition-colors disabled:opacity-40">
            {groupsLoading ? "מייבא..." : "+ ייבוא קובץ קבוצות לימוד"}
          </button>
          <div className="flex gap-2">
            <input value={groupsSheetUrl} onChange={e => setGroupsSheetUrl(e.target.value)} dir="ltr" placeholder="או קישור לגיליון Google Sheets..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <button onClick={handleGroupsSheet} disabled={groupsLoading || !groupsSheetUrl.trim()}
              className="bg-white/15 hover:bg-white/25 text-white text-sm px-4 py-2 rounded-xl interactive btn-press transition-colors disabled:opacity-40 flex-shrink-0">
              ייבוא
            </button>
          </div>
          {groupsError && <p className="text-red-400 text-xs">{groupsError}</p>}
          {groupsResult && (
            <div className="text-xs space-y-1">
              <p className="text-green-400">✓ עודכנו {groupsResult.updated} מתוך {groupsResult.total}</p>
              {groupsResult.notFound.length > 0 && (
                <p className="text-white/40">לא נמצאו במערכת ({groupsResult.notFound.length}): {groupsResult.notFound.join(", ")}</p>
              )}
              {groupsResult.ambiguous.length > 0 && (
                <p className="text-amber-400">שם כפול, לא הצלחתי להכריע ({groupsResult.ambiguous.length}): {groupsResult.ambiguous.join(", ")}</p>
              )}
              {groupsResult.errors.length > 0 && (
                <p className="text-red-400">שגיאה בעדכון ({groupsResult.errors.length}): {groupsResult.errors.join(", ")}</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
          <div>
            <h2 className="text-white text-sm font-medium mb-1">הוראות לבוט</h2>
            <p className="text-white/40 text-xs leading-relaxed">
              טון דיבור, מה לענות כשמשהו לא ידוע, ניסוחים שחשוב להשתמש/להימנע מהם וכד׳ — בנפרד מהעובדות עצמן. כמה חוקים תמיד קבועים ולא ניתנים לשינוי מכאן: הבוט לעולם לא מלמד, לא פותר תרגילים, לא נוגע בציונים, ולעולם לא חושף מידע אישי (כתובת/הורים/פרטים) על שום תלמיד/ה מלבד זה/זו שמדבר/ת איתו כרגע — גם אם ההוראות כאן יגידו אחרת.
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
          <div>
            <h2 className="text-white text-sm font-medium mb-1">קישורים</h2>
            <p className="text-white/40 text-xs leading-relaxed">
              קישורים שהבוט יכול לצרף לתשובות שלו — למשל טופס יציאה, דף הרשמה. תכתוב לכל אחד מתי הוא רלוונטי; הבוט יצרף אותו רק כשזה מתאים לשאלה.
            </p>
          </div>

          {!linksLoading && links.length > 0 && (
            <div className="space-y-1.5">
              {links.map(l => {
                const isEditingLink = l.id in editingLink
                return (
                  <div key={l.id} className="bg-white/6 rounded-lg p-2.5">
                    {isEditingLink ? (
                      <div className="space-y-1.5">
                        <input value={editingLink[l.id].label} onChange={e => setEditingLink(prev => ({ ...prev, [l.id]: { ...prev[l.id], label: e.target.value } }))}
                          placeholder="שם הקישור"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/30" />
                        <input value={editingLink[l.id].url} onChange={e => setEditingLink(prev => ({ ...prev, [l.id]: { ...prev[l.id], url: e.target.value } }))}
                          dir="ltr" placeholder="https://..."
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/30" />
                        <input value={editingLink[l.id].whenToUse} onChange={e => setEditingLink(prev => ({ ...prev, [l.id]: { ...prev[l.id], whenToUse: e.target.value } }))}
                          placeholder="מתי להשתמש בקישור הזה"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/30" />
                        <div className="flex gap-2">
                          <button onClick={() => saveLinkEdit(l.id)} className="text-[11px] text-white/80 hover:text-white interactive bg-white/15 px-2 py-1 rounded-lg">שמור</button>
                          <button onClick={() => setEditingLink(prev => { const next = { ...prev }; delete next[l.id]; return next })}
                            className="text-[11px] text-white/40 hover:text-white interactive px-2 py-1">ביטול</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-white/80 text-xs font-medium truncate">{l.label}</p>
                          {l.whenToUse && <p className="text-white/35 text-[11px] mt-0.5">{l.whenToUse}</p>}
                          <a href={l.url} target="_blank" rel="noopener noreferrer" dir="ltr" className="text-blue-300/70 hover:text-blue-300 text-[11px] underline truncate block mt-0.5">{l.url}</a>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setEditingLink(prev => ({ ...prev, [l.id]: { label: l.label, url: l.url, whenToUse: l.whenToUse } }))}
                            className="text-white/40 hover:text-white text-[11px] interactive px-1.5 py-0.5 rounded-lg bg-white/8">✎</button>
                          <button onClick={() => removeLink(l.id)} className="text-white/40 hover:text-red-400 text-[11px] interactive px-1.5 py-0.5 rounded-lg bg-white/8">מחק</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="space-y-1.5 pt-1 border-t border-white/5">
            <input value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)} placeholder="שם הקישור (לדוגמה: טופס יציאה לפעילות ערב)"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} dir="ltr" placeholder="https://..."
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <input value={newLinkWhen} onChange={e => setNewLinkWhen(e.target.value)} placeholder="מתי להשתמש בו (לדוגמה: כשתלמיד שואל על יציאה לפעילות ערב)"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-white/30" />
            <button onClick={addLink} disabled={linkSaving || !newLinkLabel.trim() || !newLinkUrl.trim()}
              className="w-full bg-white/15 hover:bg-white/25 text-white text-sm font-medium py-2 rounded-xl interactive btn-press transition-colors disabled:opacity-40">
              {linkSaving ? "מוסיף..." : "+ הוסף קישור"}
            </button>
            {linkError && <p className="text-red-400 text-xs">{linkError}</p>}
          </div>
        </div>

        <div className="bg-white/8 border border-white/15 rounded-2xl p-4 space-y-3">
          <p className="text-white/50 text-xs leading-relaxed">
            אפשר לזרוק כמה קבצים שרוצים בבת אחת — PDF, אקסל (xlsx/xls), תמונות (jpg/png) או טקסט (txt/md/csv). לכל קובץ, Claude יעבור עליו ויחלץ ממנו את העובדות הרלוונטיות אוטומטית; אפשר לערוך את מה שחולץ בהמשך אם צריך לתקן משהו. קבצי Word — יש להמיר קודם ל-PDF.
          </p>
          <input value={uploadNote} onChange={e => setUploadNote(e.target.value)}
            placeholder="הערה אופציונלית — איך להתייחס לקבצים האלה (חלה על כל הקבצים שתבחר כעת)"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-white/30" />
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
          <input value={sheetNote} onChange={e => setSheetNote(e.target.value)}
            placeholder="הערה אופציונלית — איך להתייחס לגיליון הזה"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-white/30" />
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
          <input value={pageNote} onChange={e => setPageNote(e.target.value)}
            placeholder="הערה אופציונלית — איך להתייחס לדף הזה"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-white/30" />
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
              const expanded = !!expandedDocs[d.id]
              const firstLine = d.extractedFacts.split("\n").find(l => l.trim()) ?? ""
              return (
                <div key={d.id} className="bg-white/8 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <button onClick={() => setExpandedDocs(prev => ({ ...prev, [d.id]: !prev[d.id] }))}
                      className="min-w-0 text-right interactive flex-1">
                      <span className="flex items-center gap-1.5">
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                          className={`flex-shrink-0 text-white/40 transition-transform ${expanded ? "rotate-180" : ""}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="text-white/85 text-sm font-medium truncate">{d.filename}</span>
                      </span>
                      <p className="text-white/30 text-[11px] mt-0.5">נוסף {fmtDate(d.createdAt)}</p>
                    </button>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="text-white/40 hover:text-white text-xs interactive px-2 py-1 rounded-lg bg-white/8" title="פתח את הקובץ המקורי">
                        ↗
                      </a>
                      {!isEditing && (
                        <button onClick={() => setEditing(prev => ({ ...prev, [d.id]: { extractedFacts: d.extractedFacts, note: d.note ?? "" } }))}
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
                      <div>
                        <label className="text-white/30 text-[10px] mb-1 block">הערה למחנך/ת (איך להתייחס לחומר הזה)</label>
                        <input value={editing[d.id].note} onChange={e => setEditing(prev => ({ ...prev, [d.id]: { ...prev[d.id], note: e.target.value } }))}
                          placeholder="לדוגמה: זה האלפון הרשמי של המורים — אפשר למסור טלפונים מכאן בחופשיות"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/30" />
                      </div>
                      <div>
                        <label className="text-white/30 text-[10px] mb-1 block">העובדות שחולצו</label>
                        <textarea value={editing[d.id].extractedFacts} onChange={e => setEditing(prev => ({ ...prev, [d.id]: { ...prev[d.id], extractedFacts: e.target.value } }))}
                          rows={6}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-white/30" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(d.id)} className="text-xs text-white/80 hover:text-white interactive bg-white/15 px-3 py-1.5 rounded-lg">שמור</button>
                        <button onClick={() => setEditing(prev => { const next = { ...prev }; delete next[d.id]; return next })}
                          className="text-xs text-white/40 hover:text-white interactive px-3 py-1.5">ביטול</button>
                      </div>
                    </div>
                  ) : expanded ? (
                    <>
                      {d.note && <p className="text-white/35 text-[11px] mb-1.5">💬 {d.note}</p>}
                      <p className="text-white/50 text-xs leading-relaxed whitespace-pre-wrap">{d.extractedFacts}</p>
                    </>
                  ) : (
                    <p className="text-white/40 text-xs leading-relaxed truncate">{firstLine}</p>
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
