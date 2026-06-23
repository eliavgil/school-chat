"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ThemePicker from "@/app/components/ThemePicker"

interface Settings {
  displayName: string
  teacherDisplayName: string
  schoolName: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [settings, setSettings] = useState<Settings>({ displayName: "", teacherDisplayName: "", schoolName: "" })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/class-settings").then(r => r.json()).then(d => {
      if (d.settings) setSettings({
        displayName: d.settings.displayName ?? "",
        teacherDisplayName: d.settings.teacherDisplayName ?? "",
        schoolName: d.settings.schoolName ?? "",
      })
    })
  }, [])

  async function save() {
    setSaving(true)
    await fetch("/api/class-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const fields: { key: keyof Settings; label: string; placeholder: string }[] = [
    { key: "displayName",        label: "שם הכיתה",       placeholder: "י2 סילבר" },
    { key: "teacherDisplayName", label: "שם המחנך/ת",     placeholder: "אליאב גיל" },
    { key: "schoolName",         label: "שם בית הספר",    placeholder: "כפר סילבר" },
  ]

  return (
    <div className="min-h-screen bg-[#faf9f6] p-6" dir="rtl">
      <div className="max-w-md mx-auto">
        <button onClick={() => router.back()} className="text-sm text-stone-400 hover:text-stone-700 mb-6 flex items-center gap-1 interactive">
          ← חזרה
        </button>

        <h1 className="text-xl font-bold text-stone-900 mb-1">הגדרות</h1>
        <p className="text-sm text-stone-400 mb-6">השינויים יופיעו בכל גרסאות האפליקציה.</p>

        {/* Class settings */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-5 mb-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">פרטי הכיתה</p>
          {fields.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">{label}</label>
              <input
                type="text"
                value={settings[key]}
                onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-stone-100 border-0 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 transition"
              />
            </div>
          ))}

          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-stone-900 text-white rounded-xl py-3 text-sm font-semibold hover:bg-stone-800 disabled:opacity-50 btn-press interactive"
          >
            {saved ? "✓ נשמר" : saving ? "שומר..." : "שמור שינויים"}
          </button>
        </div>

        {/* Theme picker */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <ThemePicker />
        </div>
      </div>
    </div>
  )
}
