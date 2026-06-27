"use client"

import { useEffect, useState } from "react"
import { subscribeUser, unsubscribeUser } from "@/app/actions/push"

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export default function PushManager() {
  const [status, setStatus] = useState<"idle" | "subscribed" | "denied" | "unsupported">("idle")
  const [sub, setSub] = useState<PushSubscription | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported")
      return
    }
    if (Notification.permission === "denied") {
      setStatus("denied")
      return
    }
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(reg => reg.pushManager.getSubscription())
      .then(existing => {
        if (existing) { setSub(existing); setStatus("subscribed") }
      })
      .catch(() => {})
  }, [])

  async function subscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const pushSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })
      setSub(pushSub)
      const raw = pushSub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      await subscribeUser(raw)
      setStatus("subscribed")
    } catch (e: any) {
      if (e?.name === "NotAllowedError") setStatus("denied")
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    if (!sub) return
    setLoading(true)
    await sub.unsubscribe()
    await unsubscribeUser(sub.endpoint)
    setSub(null)
    setStatus("idle")
    setLoading(false)
  }

  if (status === "unsupported") return null
  if (status === "denied") {
    return (
      <p className="text-xs text-white/30 text-center">
        הודעות חסומות בהגדרות הדפדפן
      </p>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/70">
        {status === "subscribed" ? "הודעות פעילות" : "הודעות Push"}
      </span>
      <button
        onClick={status === "subscribed" ? unsubscribe : subscribe}
        disabled={loading}
        className={`text-xs px-3 py-1.5 rounded-full transition-all disabled:opacity-40 ${
          status === "subscribed"
            ? "bg-white/10 text-white/50 hover:bg-white/15"
            : "bg-white/20 text-white hover:bg-white/30"
        }`}
      >
        {loading ? "..." : status === "subscribed" ? "בטל" : "הפעל"}
      </button>
    </div>
  )
}
