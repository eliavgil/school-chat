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
    <div className="min-h-screen flex flex-col bg-canvas" dir="rtl">

      {/* Top brand bar */}
      <div className="px-6 pt-8 pb-4 flex items-center gap-2.5 animate-fade-in">
        <img src="/icon-192.svg" alt="" className="w-8 h-8 rounded-xl shadow-sm" />
        <span className="text-stone-800 font-semibold text-sm tracking-tight">פַקפֵק</span>
      </div>

      {/* Hero area */}
      <div className="px-6 pt-4 pb-6">
        <h1 className="font-bold text-stone-900 leading-[0.95] tracking-tight animate-fade-in stagger-1"
          style={{ fontSize: "clamp(2.6rem, 11vw, 4.2rem)" }}>
          פַקפֵק
        </h1>

        <p className="text-stone-700 text-lg font-medium leading-snug mt-2 animate-fade-in stagger-2">
          אפליקציה כפר סילברית לייעול החוויה הבית ספרית
        </p>

        <p className="text-stone-500 text-sm leading-relaxed mt-4 max-w-sm animate-fade-in stagger-3">
          האפליקציה נועדה לסייע בניהול שגרת היום-יום בבית הספר. ישנן גרסאות שונות לתלמידים, מורים והורים.
        </p>
      </div>

      {/* Registration notes */}
      <div className="px-6 pb-4 space-y-2.5 animate-fade-in stagger-4">
        <div className="flex items-start gap-2.5 bg-stone-100 rounded-2xl px-4 py-3">
          <span className="text-base leading-none mt-0.5">👥</span>
          <p className="text-stone-600 text-sm leading-relaxed">הקפידו לציין בהרשמה לאיזו קבוצה אתם משתייכים.</p>
        </div>
        <div className="flex items-start gap-2.5 bg-stone-100 rounded-2xl px-4 py-3">
          <span className="text-base leading-none mt-0.5">⏳</span>
          <p className="text-stone-600 text-sm leading-relaxed">לאחר ההרשמה תתבקשו להמתין לאישור על ידי צוות האתר, ורק לאחר מכן תוכלו להיכנס.</p>
        </div>
      </div>

      {/* Important warnings */}
      <div className="px-6 pb-6 space-y-2.5 animate-fade-in stagger-5">
        <div className="bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3">
          <p className="text-amber-900 text-sm leading-relaxed">
            <strong>חשוב</strong> — אין להירשם עם מייל ארגוני, אלא מייל פרטי בלבד!
          </p>
        </div>
        <div className="bg-red-50 border border-red-300 rounded-2xl px-4 py-3 space-y-1.5">
          <p className="text-red-900 text-sm leading-relaxed">
            <strong>חשוב מאד</strong> — אפליקציה זו היא אפליקציה נסיונית, ואינה אפליקציה רשמית של משרד החינוך. ייתכן מאד ופרטים שמופיעים בה אינם מדויקים.
          </p>
          <p className="text-red-900 text-sm font-semibold leading-relaxed">
            אין להסתמך על המידע באפליקציה בלבד, מבלי לוודא אותו מול צוות בית הספר.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-12 space-y-3 animate-fade-in stagger-5">
        <button
          onClick={() => signIn("google", { callbackUrl: "/home" })}
          className="w-full bg-stone-900 text-white font-semibold py-4 rounded-2xl text-base hover:bg-stone-800 btn-press interactive flex items-center justify-center gap-3 shadow-sm"
        >
          <GoogleIcon />
          כניסה עם Google
        </button>
        <p className="text-center text-stone-500 text-xs">
          הכניסה מאובטחת · לתלמידים, הורים ומחנכים
        </p>
      </div>

    </div>
  )
}
