"use client"

import { useRouter } from "next/navigation"
import AssistantChat from "@/app/components/AssistantChat"
import RobotMascot from "@/app/components/RobotMascot"

export default function AssistantPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col h-screen bg-[#faf9f6]" dir="rtl">
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex-shrink-0 safe-top">
        <div className="flex items-center gap-2.5">
          <button onClick={() => router.back()} className="text-stone-500 hover:text-stone-700 interactive text-xl px-1">←</button>
          <div className="w-9 h-9 -my-1">
            <RobotMascot state="idle" size={36} />
          </div>
          <div>
            <div className="font-semibold text-stone-900 text-sm">מיסטר פקפקובי</div>
            <div className="text-xs text-stone-500">העוזר האישי — מידע לוגיסטי על בית הספר</div>
          </div>
        </div>
      </header>
      <AssistantChat />
    </div>
  )
}
