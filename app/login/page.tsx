"use client"

import { signIn } from "next-auth/react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center" dir="rtl">
        <h1 className="text-2xl font-bold mb-2">ברוכים הבאים</h1>
        <p className="text-gray-500 mb-8 text-sm">
          מערכת תקשורת הורים-מחנך
        </p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/chat" })}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
        >
          כניסה עם Google
        </button>
      </div>
    </div>
  )
}
