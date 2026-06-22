"use client"

import { useState } from "react"

interface ComingSoonProps {
  icon: string
  title: string
  description: string
  featureKey: string
  accentColor: string // tailwind bg class e.g. "bg-blue-600"
  accentLight: string // e.g. "bg-blue-50"
  accentText: string  // e.g. "text-blue-600"
}

export default function ComingSoon({
  icon,
  title,
  description,
  featureKey,
  accentColor,
  accentLight,
  accentText,
}: ComingSoonProps) {
  const [registered, setRegistered] = useState(false)
  const [loading, setLoading] = useState(false)

  async function register() {
    setLoading(true)
    await fetch("/api/feature-interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature: featureKey }),
    })
    setRegistered(true)
    setLoading(false)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" dir="rtl">
      <div className={`w-20 h-20 ${accentLight} rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-sm`}>
        {icon}
      </div>

      <span className={`inline-block ${accentLight} ${accentText} text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide`}>
        בקרוב
      </span>

      <h2 className="text-xl font-bold text-gray-800 mb-3">{title}</h2>
      <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-8">{description}</p>

      {registered ? (
        <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="9" fill="#16A34A" />
            <path d="M5 9l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          נרשמת! נעדכן אותך כשיהיה מוכן
        </div>
      ) : (
        <button
          onClick={register}
          disabled={loading}
          className={`${accentColor} text-white px-6 py-3 rounded-xl font-medium text-sm shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50`}
        >
          {loading ? "..." : "עדכן אותי כשיהיה מוכן"}
        </button>
      )}
    </div>
  )
}
