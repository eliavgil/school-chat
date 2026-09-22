"use client"

import { useRouter } from "next/navigation"
import AssistantChat from "@/app/components/AssistantChat"

export default function AssistantPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col h-screen bg-[#faf9f6]" dir="rtl">
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex-shrink-0 safe-top">
        <div className="flex items-center gap-2.5">
          <button onClick={() => router.back()} className="text-stone-500 hover:text-stone-700 interactive text-xl px-1">←</button>
          <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <div className="font-semibold text-stone-900 text-sm">פקפקובי בוט - עוזר אישי</div>
            <div className="text-xs text-stone-500">מידע לוגיסטי על בית הספר</div>
          </div>
        </div>
      </header>
      <AssistantChat />
    </div>
  )
}
