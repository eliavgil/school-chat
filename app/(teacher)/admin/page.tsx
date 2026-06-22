"use client"

import { useState, useEffect } from "react"

// ── Types ─────────────────────────────────────────────────
interface ImportJob { type: string; label: string; accept?: string; isUrl?: boolean }
interface PendingParent { id: string; name: string | null; email: string | null; phone: string | null; requestedChildName: string | null; parentType: string | null; createdAt: string }
interface PendingStudent { id: string; name: string | null; email: string | null; requestedChildName: string | null; createdAt: string }
interface ParentUser { id: string; name: string | null; email: string | null; phone: string | null; parentStudents: { student: { id: string; name: string } }[] }
interface StudentUser { id: string; name: string | null; email: string | null; studentRecord: { id: string; name: string } | null }
interface Student { id: string; name: string }

const IMPORT_JOBS: ImportJob[] = [
  { type: "teachers",          label: "אלפון מורים",                   accept: ".xlsx,.xls" },
  { type: "grades",            label: "ציונים שוטפים",                accept: ".xlsx,.xls" },
  { type: "attendance",        label: "מונה התנהגות",                 accept: ".xlsx,.xls" },
  { type: "schedule",          label: "מערכת כיתתית",                 accept: ".xlsx,.xls" },
  { type: "calendar-url",      label: "לוח מבחנים (Google Sheets)",   isUrl: true },
  { type: "calendar-url-events", label: "לוח אירועים (Google Sheets)", isUrl: true },
]

// ── Shared sub-components ─────────────────────────────────
function ApproveWithLink({
  label, students, onApprove, onDeny, onCancel, loading,
}: {
  label: string; students: Student[]; loading: boolean
  onApprove: (studentId?: string) => void; onDeny: () => void; onCancel: () => void
}) {
  const [sel, setSel] = useState("")
  return (
    <div className="mt-2 space-y-2">
      <select value={sel} onChange={e => setSel(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
        <option value="">קשר לתלמיד/ה (אופציונלי)</option>
        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <div className="flex gap-2">
        <button onClick={() => onApprove(sel || undefined)} disabled={loading}
          className="flex-1 bg-stone-900 text-white rounded-lg py-1.5 text-xs font-medium hover:bg-stone-800 disabled:opacity-50">
          {label}
        </button>
        <button onClick={onDeny} disabled={loading}
          className="border border-red-300 text-red-500 rounded-lg px-3 py-1.5 text-xs hover:bg-red-50 disabled:opacity-50">
          דחה
        </button>
        <button onClick={onCancel} className="text-stone-400 text-xs hover:text-stone-600 px-2">ביטול</button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState<"import" | "users">("import")

  // Import state
  const [results, setResults]       = useState<Record<string, string>>({})
  const [loading, setLoading]       = useState<Record<string, boolean>>({})
  const [urlValues, setUrlValues]   = useState<Record<string, string>>({})
  const [classId, setClassId]       = useState("class-y")

  // Users state
  const [pendingParents, setPendingParents]   = useState<PendingParent[]>([])
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([])
  const [approvedParents, setApprovedParents] = useState<ParentUser[]>([])
  const [approvedStudents, setApprovedStudents] = useState<StudentUser[]>([])
  const [students, setStudents]               = useState<Student[]>([])
  const [usersLoading, setUsersLoading]       = useState(false)
  const [actionLoading, setActionLoading]     = useState<string | null>(null)
  const [expandedId, setExpandedId]           = useState<string | null>(null)
  const [linkingStudentId, setLinkingStudentId] = useState<string | null>(null)
  const [linkSel, setLinkSel]                 = useState<Record<string, string>>({})

  // Pre-register student
  const [preEmail, setPreEmail]       = useState("")
  const [preStudentId, setPreStudentId] = useState("")
  const [preLoading, setPreLoading]   = useState(false)
  const [preMsg, setPreMsg]           = useState("")

  useEffect(() => { if (tab === "users") fetchUsers() }, [tab])

  async function fetchUsers() {
    setUsersLoading(true)
    const d = await fetch("/api/admin/users").then(r => r.json())
    setPendingParents(d.pendingParents ?? [])
    setPendingStudents(d.pendingStudents ?? [])
    setApprovedParents(d.approvedParents ?? [])
    setApprovedStudents(d.approvedStudents ?? [])
    setStudents(d.students ?? [])
    setUsersLoading(false)
  }

  async function action(userId: string, type: string, studentId?: string) {
    setActionLoading(userId)
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: type, studentId }),
    })
    setExpandedId(null)
    await fetchUsers()
    setActionLoading(null)
  }

  async function preRegister() {
    if (!preEmail.trim() || !preStudentId) return
    setPreLoading(true)
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: preEmail.trim(), studentId: preStudentId }),
    })
    setPreLoading(false)
    if (res.ok) {
      setPreMsg("✓ נשמר — התלמיד/ה יוכל/תוכל להיכנס עם כתובת המייל הזו")
      setPreEmail(""); setPreStudentId("")
      await fetchUsers()
    } else {
      setPreMsg("שגיאה — בדוק את הפרטים")
    }
  }

  async function runImport(job: ImportJob, file: File | null, sheetUrl?: string) {
    setLoading(l => ({ ...l, [job.type]: true }))
    setResults(r => ({ ...r, [job.type]: "" }))
    try {
      const fd = new FormData()
      fd.append("type", job.type); fd.append("classId", classId)
      if (file) fd.append("file", file)
      if (sheetUrl) fd.append("sheetUrl", sheetUrl)
      const d = await fetch("/api/admin/import", { method: "POST", body: fd }).then(r => r.json())
      setResults(r => ({ ...r, [job.type]: d.ok ? `✓ יובאו ${d.count} רשומות` : `✗ ${d.error}` }))
    } catch { setResults(r => ({ ...r, [job.type]: "✗ שגיאת רשת" })) }
    finally { setLoading(l => ({ ...l, [job.type]: false })) }
  }

  const totalPending = pendingParents.length + pendingStudents.length

  return (
    <div className="flex flex-col h-screen bg-[#faf9f6]" dir="rtl">
      {/* Tabs header */}
      <div className="bg-white border-b border-stone-200 px-6 pt-5 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-bold text-stone-900 mb-4">פאנל ניהול</h1>
          <div className="flex gap-6 text-sm font-medium">
            {(["import", "users"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`pb-3 border-b-2 transition-colors interactive ${tab === t ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-700"}`}>
                {t === "import" ? "ייבוא נתונים" : <>
                  ניהול משתמשים{totalPending > 0 && <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs mr-1">{totalPending}</span>}
                </>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ── Import tab ── */}
          {tab === "import" && <>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-stone-700">מזהה כיתה:</label>
              <input value={classId} onChange={e => setClassId(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-36" />
            </div>
            <div className="space-y-3">
              {IMPORT_JOBS.map(job => (
                <div key={job.type} className="bg-white border border-stone-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-stone-800 text-sm">{job.label}</span>
                    {results[job.type] && <span className={`text-sm ${results[job.type].startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{results[job.type]}</span>}
                  </div>
                  {job.isUrl ? (
                    <div className="flex gap-2">
                      <input type="url" placeholder="https://docs.google.com/spreadsheets/..."
                        value={urlValues[job.type] || ""} onChange={e => setUrlValues(v => ({ ...v, [job.type]: e.target.value }))}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" dir="ltr" />
                      <button onClick={() => runImport(job, null, urlValues[job.type])}
                        disabled={loading[job.type] || !urlValues[job.type]}
                        className="bg-stone-900 text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-50 hover:bg-stone-800">
                        {loading[job.type] ? "מייבא..." : "ייבא"}
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="border-2 border-dashed border-stone-300 rounded-lg p-4 text-center hover:border-stone-400 hover:bg-stone-50 transition-colors">
                        {loading[job.type] ? <span className="text-stone-500 text-sm">מייבא...</span> : <>
                          <span className="text-stone-500 text-sm">גרור קובץ לכאן או </span>
                          <span className="text-stone-700 text-sm font-medium">בחר קובץ</span>
                          <p className="text-stone-400 text-xs mt-1">{job.accept}</p>
                        </>}
                      </div>
                      <input type="file" accept={job.accept} className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) { runImport(job, f); e.target.value = "" } }}
                        disabled={loading[job.type]} />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </>}

          {/* ── Users tab ── */}
          {tab === "users" && (usersLoading ? <p className="text-stone-400 text-sm">טוען...</p> : <>

            {/* Pre-register student */}
            <section className="bg-stone-50 border border-stone-200 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-stone-800 mb-3">🎒 הוספת תלמיד/ה מראש</h2>
              <p className="text-xs text-stone-600 mb-3">הזן את כתובת המייל של התלמיד/ה וקשר לרשימת הכיתה. בכניסה הראשונה עם אותו מייל, הגישה תאושר אוטומטית.</p>
              <div className="flex gap-2 flex-wrap">
                <input type="email" placeholder="מייל התלמיד/ה" value={preEmail} onChange={e => setPreEmail(e.target.value)}
                  className="flex-1 min-w-48 border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white" dir="ltr" />
                <select value={preStudentId} onChange={e => setPreStudentId(e.target.value)}
                  className="flex-1 min-w-40 border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">בחר תלמיד/ה מהרשימה</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button onClick={preRegister} disabled={preLoading || !preEmail.trim() || !preStudentId}
                  className="bg-stone-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-800 disabled:opacity-50">
                  {preLoading ? "שומר..." : "הוסף"}
                </button>
              </div>
              {preMsg && <p className={`text-xs mt-2 ${preMsg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{preMsg}</p>}
            </section>

            {/* Pending parents */}
            {pendingParents.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-stone-700 mb-3">👨‍👩‍👧 בקשות הורים ממתינות ({pendingParents.length})</h2>
                <div className="space-y-2">
                  {pendingParents.map(u => (
                    <div key={u.id} className="bg-white border border-yellow-200 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div className="text-sm space-y-0.5">
                          <div className="font-medium text-stone-800">{u.name ?? "—"}</div>
                          <div className="text-stone-500 text-xs">{u.email}</div>
                          {u.phone && <div className="text-stone-400 text-xs" dir="ltr">{u.phone}</div>}
                          {u.requestedChildName && <div className="text-stone-700 text-xs font-medium mt-1">{u.parentType ?? "הורה"} של: {u.requestedChildName}</div>}
                        </div>
                        <button onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                          className="bg-stone-100 text-stone-700 border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-stone-200">
                          {expandedId === u.id ? "ביטול" : "אשר גישה"}
                        </button>
                      </div>
                      {expandedId === u.id && (
                        <ApproveWithLink students={students} loading={actionLoading === u.id}
                          onApprove={sid => action(u.id, "approve-parent", sid)}
                          onDeny={() => action(u.id, "deny")}
                          onCancel={() => setExpandedId(null)}
                          label="אשר הורה" />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pending students */}
            {pendingStudents.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-stone-700 mb-3">🎒 בקשות תלמידים ממתינות ({pendingStudents.length})</h2>
                <div className="space-y-2">
                  {pendingStudents.map(u => (
                    <div key={u.id} className="bg-white border border-stone-200 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div className="text-sm space-y-0.5">
                          <div className="font-medium text-stone-800">{u.name ?? "—"}</div>
                          <div className="text-stone-500 text-xs">{u.email}</div>
                          {u.requestedChildName && <div className="text-stone-600 text-xs font-medium mt-1">שם שהוזן: {u.requestedChildName}</div>}
                        </div>
                        <button onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                          className="bg-stone-100 text-stone-700 border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-stone-200">
                          {expandedId === u.id ? "ביטול" : "אשר"}
                        </button>
                      </div>
                      {expandedId === u.id && (
                        <ApproveWithLink students={students} loading={actionLoading === u.id}
                          onApprove={sid => action(u.id, "approve-student", sid)}
                          onDeny={() => action(u.id, "deny")}
                          onCancel={() => setExpandedId(null)}
                          label="אשר תלמיד/ה" />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {totalPending === 0 && (
              <p className="text-stone-400 text-sm text-center py-2">אין בקשות ממתינות</p>
            )}

            {/* Approved parents */}
            <section>
              <h2 className="text-sm font-semibold text-stone-700 mb-3">👨‍👩‍👧 הורים מאושרים ({approvedParents.length})</h2>
              {approvedParents.length === 0 ? <p className="text-stone-400 text-xs">אין</p> : (
                <div className="bg-white border border-stone-200 rounded-xl divide-y divide-gray-100">
                  {approvedParents.map(p => (
                    <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-4">
                      <div className="text-sm">
                        <div className="font-medium text-stone-800">{p.name ?? "—"}</div>
                        <div className="text-stone-400 text-xs">{p.email}</div>
                        {p.phone && <div className="text-stone-400 text-xs" dir="ltr">{p.phone}</div>}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.parentStudents.map(({ student }) => (
                            <span key={student.id} className="bg-stone-100 text-stone-600 text-xs rounded-full px-2 py-0.5 flex items-center gap-1">
                              {student.name}
                              <button onClick={() => action(p.id, "unlink-parent", student.id)} className="text-stone-400 hover:text-red-500" title="הסר">×</button>
                            </span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => action(p.id, "deny")} className="text-xs text-red-400 hover:text-red-600 whitespace-nowrap">בטל גישה</button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Approved students */}
            <section>
              <h2 className="text-sm font-semibold text-stone-700 mb-3">🎒 תלמידים מאושרים ({approvedStudents.length})</h2>
              {approvedStudents.length === 0 ? <p className="text-stone-400 text-xs">אין</p> : (
                <div className="bg-white border border-stone-200 rounded-xl divide-y divide-gray-100">
                  {approvedStudents.map(s => (
                    <div key={s.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm">
                          <div className="font-medium text-stone-800">{s.name ?? "—"}</div>
                          <div className="text-stone-400 text-xs">{s.email}</div>
                          {s.studentRecord ? (
                            <span className="bg-stone-100 text-stone-600 text-xs rounded-full px-2 py-0.5 mt-1 inline-flex items-center gap-1">
                              {s.studentRecord.name}
                              <button onClick={() => action(s.id, "unlink-student")} className="text-stone-400 hover:text-red-500">×</button>
                            </span>
                          ) : (
                            <span className="text-red-400 text-xs mt-1 inline-block">⚠️ לא מקושר לרשימת כיתה</span>
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                          <button onClick={() => setLinkingStudentId(linkingStudentId === s.id ? null : s.id)}
                            className="text-xs text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg px-2 py-1 bg-stone-50">
                            {linkingStudentId === s.id ? "ביטול" : (s.studentRecord ? "שנה קישור" : "קשר")}
                          </button>
                          <button onClick={() => action(s.id, "deny")} className="text-xs text-red-400 hover:text-red-600 whitespace-nowrap">בטל גישה</button>
                        </div>
                      </div>
                      {linkingStudentId === s.id && (
                        <div className="mt-2 flex gap-2">
                          <select value={linkSel[s.id] ?? ""} onChange={e => setLinkSel(prev => ({ ...prev, [s.id]: e.target.value }))}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                            <option value="">בחר תלמיד/ה מהרשימה</option>
                            {students.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                          </select>
                          <button
                            disabled={!linkSel[s.id] || actionLoading === s.id}
                            onClick={async () => {
                              await action(s.id, "link-student", linkSel[s.id])
                              setLinkingStudentId(null)
                              setLinkSel(prev => ({ ...prev, [s.id]: "" }))
                            }}
                            className="bg-stone-900 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-stone-800 disabled:opacity-50">
                            {actionLoading === s.id ? "..." : "קשר"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

          </>)}
        </div>
      </div>
    </div>
  )
}
