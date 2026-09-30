"use client"

import { useState } from "react"
import Link from "next/link"
import { StaffTasksTab } from "@/app/components/StaffTasksTab"
import { PersonalTasksTab } from "@/app/components/PersonalTasksTab"

export default function TasksPage() {
  const [tab, setTab] = useState<"personal" | "staff">("personal")

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white flex-1">משימות</h1>
      </header>

      <div className="flex gap-2 px-4 pt-4">
        <button onClick={() => setTab("personal")}
          className={`px-4 py-2 rounded-xl text-sm font-medium interactive btn-press transition-colors ${tab === "personal" ? "bg-white/20 text-white" : "text-white/40 hover:text-white/70"}`}>
          המשימות שלי
        </button>
        <button onClick={() => setTab("staff")}
          className={`px-4 py-2 rounded-xl text-sm font-medium interactive btn-press transition-colors ${tab === "staff" ? "bg-white/20 text-white" : "text-white/40 hover:text-white/70"}`}>
          משימות צוות
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {tab === "personal" ? <PersonalTasksTab /> : <StaffTasksTab />}
      </div>
    </div>
  )
}
