"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BackgroundPicker } from "@/app/components/BackgroundPicker"
import { getPersonalDisplayName, setPersonalDisplayName } from "@/app/components/personalStore"

export default function ParentEditPage() {
  const [name, setName] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => { setName(getPersonalDisplayName()) }, [])

  function saveName() {
    setPersonalDisplayName(name.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white">הגדרות אישיות</h1>
      </header>

      <div className="px-5 py-6 space-y-8 max-w-lg mx-auto">
        {/* Display name */}
        <section>
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-3">שם תצוגה</h2>
          <div className="bg-white/10 border border-white/15 rounded-2xl p-5">
            <p className="text-sm text-white/50 mb-3">השם שיוצג לך בעמוד הבית</p>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveName()}
                placeholder="שם תצוגה (אישי בלבד)"
                className="flex-1 bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <button onClick={saveName}
                className="bg-white/20 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-white/30 interactive btn-press transition-colors">
                {saved ? "✓ נשמר" : "שמור"}
              </button>
            </div>
          </div>
        </section>

        {/* Background */}
        <section>
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-3">רקע עמוד הבית</h2>
          <div className="bg-white/10 border border-white/15 rounded-2xl p-5">
            <p className="text-sm text-white/50 mb-4">בחר/י רקע שיופיע רק אצלך</p>
            <BackgroundPicker />
          </div>
        </section>
      </div>
    </div>
  )
}
