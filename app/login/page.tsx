"use client"

import { signIn } from "next-auth/react"

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas overflow-hidden" dir="rtl">

      {/* Top brand bar */}
      <div className="px-6 pt-8 pb-4 flex items-center gap-2.5 animate-fade-in">
        <div className="w-8 h-8 bg-stone-900 rounded-xl flex items-center justify-center shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span className="text-stone-800 font-semibold text-sm tracking-tight">כפר סילבר</span>
      </div>

      {/* Hero area — takes most of screen */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-4">

        {/* Pill announcement — Duna style */}
        <div className="inline-flex items-center gap-2 bg-stone-900/85 text-white text-xs rounded-full px-3.5 py-1.5 w-fit mb-8 animate-fade-in stagger-1">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
          כיתה י4 סילבר · שנה"ל תשפ"ו
        </div>

        {/* Big editorial headline */}
        <h1 className="font-bold text-stone-900 leading-[0.92] tracking-tight animate-fade-in stagger-2"
          style={{ fontSize: "clamp(3.2rem, 14vw, 6rem)" }}>
          האפליקציה<br />של הכיתה<br />שלך
        </h1>

        <p className="text-stone-500 text-base leading-relaxed mt-5 max-w-[18rem] animate-fade-in stagger-3">
          תקשורת עם המחנך, ציונים, מערכת שעות ולוח שנה — במקום אחד.
        </p>

        {/* Stats row — Duna numbers section */}
        <div className="flex gap-6 mt-8 animate-fade-in stagger-4">
          {[
            { val: "3", label: "דרכי גישה" },
            { val: "100%", label: "מאובטח" },
            { val: "24/7", label: "זמין" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-stone-900 nums">{s.val}</div>
              <div className="text-xs text-stone-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA — pinned */}
      <div className="px-6 pb-12 space-y-3 animate-fade-in stagger-5">
        <button
          onClick={() => signIn("google", { callbackUrl: "/home" })}
          className="w-full bg-stone-900 text-white font-semibold py-4 rounded-2xl text-base hover:bg-stone-800 btn-press interactive flex items-center justify-center gap-3 shadow-sm"
        >
          <GoogleIcon />
          כניסה עם Google
        </button>
        <p className="text-center text-stone-400 text-xs">
          הכניסה מאובטחת · לתלמידים, הורים ומחנכים
        </p>
      </div>

    </div>
  )
}
