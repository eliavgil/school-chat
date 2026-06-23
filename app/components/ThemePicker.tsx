"use client"

import { useEffect, useState } from "react"

const THEMES = [
  { id: "stone",  label: "חם",    color: "#f0eeeb", text: "#1c1917" },
  { id: "dark",   label: "כהה",   color: "#1a1a1a", text: "#f5f5f4" },
  { id: "indigo", label: "כחול",  color: "#eceeff", text: "#1e1b4b" },
  { id: "green",  label: "ירוק",  color: "#dcfce7", text: "#14532d" },
]

export function useTheme() {
  const [theme, setThemeState] = useState("stone")

  useEffect(() => {
    const saved = localStorage.getItem("app-theme") ?? "stone"
    setThemeState(saved)
    document.documentElement.setAttribute("data-theme", saved === "stone" ? "" : saved)
  }, [])

  function setTheme(id: string) {
    setThemeState(id)
    localStorage.setItem("app-theme", id)
    document.documentElement.setAttribute("data-theme", id === "stone" ? "" : id)
  }

  return { theme, setTheme }
}

export default function ThemePicker({ onClose }: { onClose?: () => void }) {
  const { theme, setTheme } = useTheme()

  return (
    <div className="p-4" dir="rtl">
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">סגנון עיצוב</p>
      <div className="grid grid-cols-2 gap-2">
        {THEMES.map(t => (
          <button
            key={t.id}
            onClick={() => { setTheme(t.id); onClose?.() }}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all interactive btn-press ${
              theme === t.id ? "border-stone-900 shadow-sm" : "border-stone-200 hover:border-stone-300"
            }`}
            style={{ background: t.color }}
          >
            <div className="w-4 h-4 rounded-full border-2 border-current flex-shrink-0" style={{ color: t.text }}>
              {theme === t.id && <div className="w-full h-full rounded-full scale-50" style={{ background: t.text }} />}
            </div>
            <span className="text-sm font-medium" style={{ color: t.text }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
