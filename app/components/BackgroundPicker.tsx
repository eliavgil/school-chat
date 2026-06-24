"use client"

import { useEffect, useRef, useState } from "react"
import { BG_OPTIONS } from "./NatureBackground"
import { getPersonalBackground, setPersonalBackground, getCustomBgUrl, setCustomBgUrl } from "./personalStore"

const CATEGORIES = [
  { key: "photo",    label: "תמונות" },
  { key: "animated", label: "אנימציה" },
  { key: "solid",    label: "צבע" },
  { key: "custom",   label: "שלי" },
]

// Thumbnail for animated landscape scenes
const LANDSCAPE_THUMBS: Record<string, string> = {
  "beach-sunset":   "linear-gradient(180deg, #0d0824 0%, #7b1055 40%, #d94f1b 70%, #f7b733 85%, #0a4b6e 100%)",
  "beach-night":    "linear-gradient(180deg, #010409 0%, #050d1a 45%, #0e2044 75%, #05080f 100%)",
  "beach-tropical": "linear-gradient(180deg, #052e16 0%, #065f46 40%, #059669 70%, #0d9488 100%)",
}
function AnimThumb({ id }: { id: string }) {
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: LANDSCAPE_THUMBS[id] ?? "#0a0a2e" }}>
      {/* Simplified wave hint */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 opacity-40"
        style={{ background: "linear-gradient(180deg, transparent, rgba(10,75,110,0.8))" }} />
    </div>
  )
}

// Thumbnail for solid / gradient options
function SolidThumb({ bg }: { bg: any }) {
  const style = bg.gradientCss
    ? { background: bg.gradientCss, backgroundSize: "200% 200%" }
    : { background: bg.solidColor }
  return <div className="w-full h-full" style={style} />
}

export function BackgroundPicker() {
  const [selected, setSelected]   = useState("")
  const [customUrl, setCustomUrl] = useState("")
  const [category, setCategory]   = useState("photo")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSelected(getPersonalBackground())
    setCustomUrl(getCustomBgUrl())
  }, [])

  function pick(id: string) {
    setSelected(id)
    setPersonalBackground(id)
    window.dispatchEvent(new CustomEvent("bg-changed", { detail: id }))
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      setCustomUrl(url)
      setCustomBgUrl(url)
      pick("custom")
    }
    reader.readAsDataURL(file)
  }

  const visibleOptions = BG_OPTIONS.filter(bg => bg.type === category)

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex gap-1">
        {CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setCategory(cat.key)}
            className={`flex-1 py-2 text-sm rounded-xl transition-all interactive ${
              category === cat.key ? "bg-white/20 text-white font-medium" : "text-white/40 hover:text-white/70"
            }`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Custom upload tab */}
      {category === "custom" && (
        <div className="space-y-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full glass rounded-2xl py-4 flex flex-col items-center gap-2 text-white/60 hover:text-white interactive btn-press border border-dashed border-white/20 transition-colors"
          >
            <span className="text-2xl">📷</span>
            <span className="text-sm">העלה תמונה מהמכשיר</span>
            <span className="text-xs text-white/30">JPG, PNG, WEBP</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

          {customUrl && (
            <button
              onClick={() => pick("custom")}
              className={`relative w-full rounded-2xl overflow-hidden aspect-video interactive btn-press transition-all ${
                selected === "custom" ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-[1.02]" : "opacity-80 hover:opacity-100"
              }`}
            >
              <img src={customUrl} alt="תמונה אישית" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-2 right-2 text-white text-xs font-medium">התמונה שלי</div>
              {selected === "custom" && (
                <div className="absolute top-2 left-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#1c1917" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          )}
        </div>
      )}

      {/* Grid of options */}
      {category !== "custom" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visibleOptions.map(bg => (
            <button
              key={bg.id}
              onClick={() => pick(bg.id)}
              className={`relative rounded-2xl overflow-hidden aspect-video text-right interactive btn-press transition-all ${
                selected === bg.id ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-[1.03]" : "opacity-75 hover:opacity-100"
              }`}
            >
              {/* Thumbnail */}
              {bg.type === "photo" && bg.thumbUrl && (
                <img src={bg.thumbUrl} alt={bg.label} className="w-full h-full object-cover" />
              )}
              {bg.type === "animated" && <AnimThumb id={bg.id} />}
              {bg.type === "solid"    && <SolidThumb bg={bg} />}

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
      )}
    </div>
  )
}
