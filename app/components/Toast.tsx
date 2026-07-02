"use client"

import { useEffect } from "react"

export function Toast({ message, show, onHide }: { message: string; show: boolean; onHide: () => void }) {
  useEffect(() => {
    if (!show) return
    const t = setTimeout(onHide, 2000)
    return () => clearTimeout(t)
  }, [show, onHide])

  if (!show) return null

  return (
    <div
      className="fixed left-1/2 z-50 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm border border-white/20 shadow-xl pointer-events-none animate-fade-in"
      style={{ top: "env(safe-area-inset-top, 16px)", transform: "translateX(-50%) translateY(16px)" }}
    >
      {message}
    </div>
  )
}
