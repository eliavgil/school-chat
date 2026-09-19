"use client"

import { useState } from "react"

export default function WidgetSetup() {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function reveal() {
    setLoading(true)
    try {
      const res = await fetch("/api/widget/token")
      const d = await res.json()
      if (d.token) setUrl(`${window.location.origin}/api/widget/schedule?token=${d.token}`)
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">וידג׳ט מערכת שעות (iPhone)</span>
        {!url && (
          <button onClick={reveal} disabled={loading}
            className="text-xs px-3 py-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all disabled:opacity-40">
            {loading ? "..." : "הצג קישור"}
          </button>
        )}
      </div>
      {url && (
        <div className="bg-white/8 border border-white/15 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <code dir="ltr" className="flex-1 text-[11px] text-white/70 break-all">{url}</code>
            <button onClick={copy}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/15 text-white hover:bg-white/25 flex-shrink-0">
              {copied ? "✓ הועתק" : "העתק"}
            </button>
          </div>
          <p className="text-[11px] text-white/40 leading-relaxed">
            קישור אישי — אל תשתף אותו. תדביק אותו בתוך הסקריפט שקיבלת ב-Scriptable, בתור ערך WIDGET_URL.
          </p>
        </div>
      )}
    </div>
  )
}
