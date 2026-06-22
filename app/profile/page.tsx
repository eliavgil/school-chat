"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

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
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-md mx-auto">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1">
          ← חזרה
        </button>

        <h1 className="text-xl font-bold text-gray-800 mb-1">הגדרות כיתה</h1>
        <p className="text-sm text-gray-500 mb-6">השינויים יופיעו בכל גרסאות האפליקציה — מחנך, הורים ותלמידים.</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
              <input
                type="text"
                value={settings[key]}
                onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              />
            </div>
          ))}

          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saved ? "✓ נשמר" : saving ? "שומר..." : "שמור שינויים"}
          </button>
        </div>
      </div>
    </div>
  )
}
