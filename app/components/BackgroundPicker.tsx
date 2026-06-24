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

// Thumbnail for animated options — rendered as a gradient preview div
function AnimThumb({ gradientCss }: { gradientCss?: string }) {
  return (
    <div className="w-full h-full" style={{
      background: gradientCss ?? "linear-gradient(135deg, #0a0a2e, #0d3b1e)",
      backgroundSize: "200% 200%",
    }} />
  )
}

// Thumbnail for solid options
function SolidThumb({ color }: { color?: string }) {
  return <div className="w-full h-full" style={{ background: color }} />
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
              {bg.type === "animated" && <AnimThumb gradientCss={bg.gradientCss} />}
              {bg.type === "solid"    && <SolidThumb color={bg.solidColor} />}

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
