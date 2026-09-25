"use client"

import { useRouter } from "next/navigation"
import AssistantChat from "@/app/components/AssistantChat"

export default function AssistantPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col h-screen bg-[#faf9f6]" dir="rtl">
      {/* Name + tagline already show once, big, in the chat's own empty-state
          landing view below — repeating them here just duplicated the same
          two lines at the top of the screen for no reason. */}
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex-shrink-0 safe-top">
        <button onClick={() => router.back()} className="text-stone-500 hover:text-stone-700 interactive text-xl px-1">←</button>
      </header>
      <AssistantChat />
    </div>
  )
}
