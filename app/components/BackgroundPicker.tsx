"use client"

import { useEffect, useState } from "react"
import { BG_OPTIONS } from "./NatureBackground"
import { getPersonalBackground, setPersonalBackground } from "./personalStore"

export function BackgroundPicker() {
  const [selected, setSelected] = useState("")

  useEffect(() => { setSelected(getPersonalBackground()) }, [])

  function pick(id: string) {
    setSelected(id)
    setPersonalBackground(id)
    // Dispatch event so home page updates if open in same tab
    window.dispatchEvent(new CustomEvent("bg-changed", { detail: id }))
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {BG_OPTIONS.map(bg => (
        <button
          key={bg.id}
          onClick={() => pick(bg.id)}
          className={`relative rounded-2xl overflow-hidden aspect-video text-right interactive btn-press transition-all ${
            selected === bg.id ? "ring-3 ring-white ring-offset-2 ring-offset-stone-900 scale-[1.03]" : "opacity-80 hover:opacity-100"
          }`}
        >
          <img src={bg.thumbUrl} alt={bg.label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-2 right-2 left-2 flex items-center gap-1.5">
            <span className="text-base leading-none">{bg.emoji}</span>
            <span className="text-white text-xs font-medium leading-tight">{bg.label}</span>
          </div>
          {selected === bg.id && (
            <div className="absolute top-2 left-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#1c1917" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
