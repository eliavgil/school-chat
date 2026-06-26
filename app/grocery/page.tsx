"use client"

import { useState, useRef } from "react"
import type { CompareResponse, SupermarketResult } from "@/lib/grocery/types"

const SM_STYLE: Record<string, { badge: string; ring: string }> = {
  shufersal:     { badge: "bg-red-100 text-red-700",    ring: "ring-red-200" },
  "rami-levy":   { badge: "bg-blue-100 text-blue-700",  ring: "ring-blue-200" },
  victory:       { badge: "bg-orange-100 text-orange-700", ring: "ring-orange-200" },
  "yeinot-bitan":{ badge: "bg-purple-100 text-purple-700", ring: "ring-purple-200" },
}

function ShoppingCartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )
}

function SupermarketCard({ sm, isCheapest, totalItems }: {
  sm: SupermarketResult
  isCheapest: boolean
  totalItems: number
}) {
  const [expanded, setExpanded] = useState(false)
  const style = SM_STYLE[sm.id] ?? { badge: "bg-stone-100 text-stone-700", ring: "ring-stone-200" }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-shadow ${
      isCheapest
        ? "border-emerald-300 ring-2 ring-emerald-100 shadow-md"
        : "border-stone-200"
    }`}>
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${style.badge}`}>
            {sm.name}
          </span>
          {isCheapest && (
            <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full shrink-0">
              הכי זול
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {sm.foundCount > 0 ? (
            <span className="text-lg font-bold text-stone-900 nums">
              ₪{sm.total.toFixed(2)}
            </span>
          ) : (
            <span className="text-sm text-stone-400">לא זמין</span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-stone-400 hover:text-stone-700 text-xs font-medium"
          >
            {expanded ? "סגור ▲" : "פירוט ▼"}
          </button>
        </div>
      </div>

      {/* Coverage bar */}
      {sm.foundCount > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-stone-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${isCheapest ? "bg-emerald-500" : "bg-stone-400"}`}
                style={{ width: `${(sm.foundCount / totalItems) * 100}%` }}
              />
            </div>
            <span className="text-xs text-stone-400 nums shrink-0">
              {sm.foundCount}/{totalItems}
            </span>
          </div>
        </div>
      )}

      {/* Expanded product breakdown */}
      {expanded && (
        <div className="border-t border-stone-100 divide-y divide-stone-50">
          {sm.products.map((p, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-stone-700 truncate ml-4">{p.query}</span>
              {p.found ? (
                <span className="text-stone-900 font-medium nums shrink-0">
                  ₪{p.found.price.toFixed(2)}
                  {p.found.unit && <span className="text-stone-400 text-xs mr-1">/ {p.found.unit}</span>}
                </span>
              ) : (
                <span className="text-stone-300 text-xs shrink-0">לא נמצא</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Open supermarket button */}
      {sm.foundCount > 0 && (
        <div className="border-t border-stone-100 px-4 py-3">
          <a
            href={sm.searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`block text-center text-sm font-semibold py-2 rounded-xl transition-colors ${
              isCheapest
                ? "bg-emerald-700 text-white hover:bg-emerald-800"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            פתח {sm.name}
          </a>
        </div>
      )}
    </div>
  )
}

function LoadingCard({ name, badge }: { name: string; badge: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 px-4 py-4">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge}`}>{name}</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {[80, 60, 70].map((w, i) => (
          <div key={i} className="skeleton h-3 rounded-full" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}

const LOADING_SMs = [
  { id: "shufersal", name: "שופרסל", badge: "bg-red-100 text-red-700" },
  { id: "rami-levy", name: "רמי לוי", badge: "bg-blue-100 text-blue-700" },
  { id: "victory", name: "ויקטורי", badge: "bg-orange-100 text-orange-700" },
  { id: "yeinot-bitan", name: "יינות ביתן", badge: "bg-purple-100 text-purple-700" },
]

export default function GroceryPage() {
  const [items, setItems] = useState<string[]>([""])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CompareResponse | null>(null)
  const [error, setError] = useState("")
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const lastInputRef = useRef<HTMLInputElement>(null)

  function addItem() {
    setItems((prev) => [...prev, ""])
    setTimeout(() => lastInputRef.current?.focus(), 50)
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, value: string) {
    setItems((prev) => prev.map((item, i) => (i === idx ? value : item)))
  }

  function applyPaste() {
    const lines = pasteText
      .split(/[\n,،]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (lines.length) setItems(lines)
    setPasteMode(false)
    setPasteText("")
  }

  async function compare() {
    const products = items.map((s) => s.trim()).filter(Boolean)
    if (!products.length) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/grocery/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      })
      if (!res.ok) throw new Error("שגיאה בשרת")
      const data: CompareResponse = await res.json()
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "שגיאה")
    } finally {
      setLoading(false)
    }
  }

  const validItems = items.map((s) => s.trim()).filter(Boolean)
  const cheapest = result?.supermarkets.find((s) => s.id === result.cheapestId)
  const sorted = result
    ? [...result.supermarkets].sort((a, b) => {
        if (!a.foundCount && !b.foundCount) return 0
        if (!a.foundCount) return 1
        if (!b.foundCount) return -1
        return a.total - b.total
      })
    : []

  const anyDataFound = result?.supermarkets.some((s) => s.foundCount > 0)

  return (
    <div className="min-h-screen bg-stone-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center text-white shrink-0">
            <ShoppingCartIcon />
          </div>
          <div>
            <h1 className="text-base font-bold text-stone-900 leading-tight">השוואת מחירי סופר</h1>
            <p className="text-xs text-stone-400">הכנס מוצרים · מצא את הסופר הכי זול</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4">

        {/* Product list card */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <h2 className="font-semibold text-stone-800 text-sm">
              רשימת קניות
              {validItems.length > 0 && (
                <span className="mr-2 text-xs font-normal text-stone-400 nums">
                  {validItems.length} מוצרים
                </span>
              )}
            </h2>
            <button
              onClick={() => setPasteMode(!pasteMode)}
              className="text-xs text-stone-500 hover:text-stone-800 border border-stone-200 rounded-lg px-2.5 py-1 interactive"
            >
              הדבק רשימה
            </button>
          </div>

          {pasteMode ? (
            <div className="p-4 space-y-3">
              <textarea
                autoFocus
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"חלב\nלחם\nגבינה צהובה\nביצים..."}
                rows={6}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={applyPaste}
                  disabled={!pasteText.trim()}
                  className="flex-1 bg-stone-900 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-40 hover:bg-stone-800 btn-press"
                >
                  יבא רשימה
                </button>
                <button
                  onClick={() => { setPasteMode(false); setPasteText("") }}
                  className="px-4 text-stone-500 text-sm border border-stone-200 rounded-xl hover:bg-stone-50"
                >
                  ביטול
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs text-stone-300 w-5 text-left shrink-0 nums">{i + 1}</span>
                  <input
                    ref={i === items.length - 1 ? lastInputRef : undefined}
                    value={item}
                    onChange={(e) => updateItem(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addItem() }
                    }}
                    placeholder={i === 0 ? 'חלב 3%, לחם, ביצים L...' : 'מוצר נוסף...'}
                    className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                  />
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(i)}
                      className="text-stone-300 hover:text-red-400 text-xl leading-none shrink-0 w-7 text-center interactive"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addItem}
                className="mt-1 text-sm text-stone-400 hover:text-stone-700 flex items-center gap-1.5 interactive"
              >
                <span className="text-base font-bold">+</span>
                <span>הוסף מוצר</span>
              </button>
            </div>
          )}
        </div>

        {/* Compare CTA */}
        <button
          onClick={compare}
          disabled={loading || !validItems.length}
          className="w-full bg-stone-900 text-white font-bold py-4 rounded-2xl text-base disabled:opacity-40 hover:bg-stone-800 btn-press interactive shadow-sm"
        >
          {loading
            ? "מחפש מחירים..."
            : validItems.length
            ? `השווה מחירים · ${validItems.length} מוצרים`
            : "השווה מחירים"}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            <p className="text-center text-sm text-stone-400 animate-pulse">
              בודק מחירים ב-4 סופרים...
            </p>
            {LOADING_SMs.map((sm) => (
              <LoadingCard key={sm.id} name={sm.name} badge={sm.badge} />
            ))}
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-3 animate-fade-in">
            {/* Winner */}
            {cheapest && (
              <div className="bg-gradient-to-l from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-4">
                <div className="text-xs text-emerald-600 font-bold mb-0.5">הכי זול מבין הסופרים שנבדקו</div>
                <div className="text-2xl font-black text-emerald-900">{cheapest.name}</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-emerald-800 nums">₪{cheapest.total.toFixed(2)}</span>
                  <span className="text-sm text-emerald-600">
                    ({cheapest.foundCount} מתוך {validItems.length} מוצרים)
                  </span>
                </div>
              </div>
            )}

            {/* No data at all */}
            {!anyDataFound && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-center space-y-1">
                <p className="font-semibold">לא הצלחנו לאחזר מחירים בזמן אמת</p>
                <p className="text-amber-600 text-xs">
                  אתרי הסופרמרקטים עשויים לחסום גישה אוטומטית. נסה שוב מאוחר יותר.
                </p>
              </div>
            )}

            {/* All supermarkets */}
            <div className="space-y-3">
              {sorted.map((sm) => (
                <SupermarketCard
                  key={sm.id}
                  sm={sm}
                  isCheapest={sm.id === result.cheapestId}
                  totalItems={validItems.length}
                />
              ))}
            </div>

            <p className="text-center text-xs text-stone-300 pb-4">
              המחירים נאספים בזמן אמת מאתרי הסופרמרקטים · עשויים להשתנות
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
