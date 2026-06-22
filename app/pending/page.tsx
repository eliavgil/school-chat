"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"

type UserType = "parent" | "student" | null

function StepDot({ n, active }: { n: number; active: boolean }) {
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
      active ? "bg-stone-900 text-white" : "bg-stone-200 text-stone-400"
    }`}>{n}</div>
  )
}

function Input({ label, value, onChange, placeholder, type = "text", dir }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; dir?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full bg-stone-100 border-0 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/20 transition-all"
      />
    </div>
  )
}

export default function PendingPage() {
  const { data: session } = useSession()
  const [userType, setUserType] = useState<UserType>(null)
  const [childName, setChildName]   = useState("")
  const [phone, setPhone]           = useState("")
  const [parentType, setParentType] = useState<"אבא" | "אמא" | "">("")
  const [studentName, setStudentName] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(false)

  async function submit() {
    setLoading(true)
    await fetch("/api/auth/request-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        userType === "parent"
          ? { userType: "parent", childName, phone, parentType }
          : { userType: "student", studentName }
      ),
    })
    setSubmitted(true)
    setLoading(false)
  }

  const canSubmit = userType === "parent"
    ? childName.trim() && phone.trim() && parentType
    : userType === "student" ? studentName.trim() : false

  if (submitted) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 text-center" dir="rtl">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 animate-scale-in">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2 animate-fade-in">הבקשה נשלחה!</h1>
        <p className="text-stone-500 text-sm leading-relaxed max-w-xs animate-fade-in stagger-1">
          המחנך/ת יאשר את גישתך בקרוב. ניתן לסגור את הדף.
        </p>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-8 text-stone-400 text-xs hover:text-stone-600 interactive animate-fade-in stagger-2">
          יציאה מהחשבון
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col" dir="rtl">

      {/* Header */}
      <div className="px-6 pt-10 pb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <StepDot n={1} active={!userType} />
            <div className="w-6 h-0.5 bg-stone-200" />
            <StepDot n={2} active={!!userType} />
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs text-stone-400 hover:text-stone-600 interactive">
            יציאה
          </button>
        </div>

        <p className="text-stone-500 text-sm mb-1">
          נכנסת בתור <span className="text-stone-700 font-medium">{session?.user?.email}</span>
        </p>
        <h1 className="text-3xl font-bold text-stone-900 leading-tight">
          {!userType ? "מי אתה/את?" : userType === "parent" ? "פרטי ההורה" : "פרטי התלמיד/ה"}
        </h1>
      </div>

      {/* Step 1: role selection */}
      {!userType && (
        <div className="px-6 space-y-3 animate-scale-in">
          {[
            { type: "parent" as const,  icon: "👨‍👩‍👧", title: "הורה",    sub: "הורה לתלמיד/ה בכיתה",  accent: "hover:border-emerald-400" },
            { type: "student" as const, icon: "🎒",       title: "תלמיד/ה", sub: "תלמיד/ה בכיתה",         accent: "hover:border-orange-400" },
          ].map(opt => (
            <button key={opt.type} onClick={() => setUserType(opt.type)}
              className={`w-full bg-white border border-stone-200 ${opt.accent} rounded-2xl p-5 text-right interactive btn-press group`}>
              <div className="flex items-center gap-4">
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <div className="font-semibold text-stone-900">{opt.title}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{opt.sub}</div>
                </div>
                <span className="mr-auto text-stone-300 group-hover:text-stone-500 transition-colors">←</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: parent form */}
      {userType === "parent" && (
        <div className="px-6 space-y-5 animate-fade-in">
          <button onClick={() => setUserType(null)} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 interactive mb-1">
            <span>→</span> חזרה
          </button>

          {/* Parent type pills */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">את/ה</label>
            <div className="flex gap-2">
              {(["אמא", "אבא"] as const).map(t => (
                <button key={t} onClick={() => setParentType(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold btn-press interactive ${
                    parentType === t
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Input label="שם הילד/ה" value={childName} onChange={setChildName} placeholder="שם מלא כפי שמופיע ברשימה" />
          <Input label="טלפון" value={phone} onChange={setPhone} placeholder="050-0000000" type="tel" dir="ltr" />

          <button onClick={submit} disabled={loading || !canSubmit}
            className="w-full bg-stone-900 text-white font-semibold py-4 rounded-2xl text-base hover:bg-stone-800 disabled:opacity-40 btn-press interactive mt-2">
            {loading ? "שולח..." : "שלח בקשת גישה"}
          </button>
        </div>
      )}

      {/* Step 2: student form */}
      {userType === "student" && (
        <div className="px-6 space-y-5 animate-fade-in">
          <button onClick={() => setUserType(null)} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 interactive mb-1">
            <span>→</span> חזרה
          </button>

          <Input label="שם מלא" value={studentName} onChange={setStudentName} placeholder="כפי שמופיע ברשימת הכיתה" />

          <p className="text-xs text-stone-400 leading-relaxed">
            המחנך/ת יזהה אותך לפי השם ויאשר את גישתך לאפליקציה.
          </p>

          <button onClick={submit} disabled={loading || !canSubmit}
            className="w-full bg-stone-900 text-white font-semibold py-4 rounded-2xl text-base hover:bg-stone-800 disabled:opacity-40 btn-press interactive">
            {loading ? "שולח..." : "שלח בקשת גישה"}
          </button>
        </div>
      )}
    </div>
  )
}
