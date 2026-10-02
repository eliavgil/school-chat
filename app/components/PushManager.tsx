"use client"

import { useEffect, useState } from "react"
import { subscribeUser, unsubscribeUser, hasSubscriptionRow } from "@/app/actions/push"

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

function TestPushButton() {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle")
  const [errMsg, setErrMsg] = useState("")

  async function test() {
    setState("sending")
    try {
      const res = await fetch("/api/push/test", { method: "POST" })
      const data = await res.json()
      if (data.success) setState("ok")
      else { setErrMsg(data.error ?? "שגיאה"); setState("err") }
    } catch (e: any) {
      setErrMsg(e?.message ?? "שגיאה"); setState("err")
    }
    setTimeout(() => setState("idle"), 4000)
  }

  return (
    <div>
      <button
        onClick={test}
        disabled={state === "sending"}
        className="text-xs text-white/40 hover:text-white/60 underline underline-offset-2 disabled:opacity-40 transition-colors"
      >
        {state === "sending" ? "שולח..." : state === "ok" ? "✓ נשלח — בדוק בטלפון" : state === "err" ? `שגיאה: ${errMsg}` : "שלח הודעת בדיקה"}
      </button>
    </div>
  )
}

export default function PushManager() {
  const [status, setStatus] = useState<"idle" | "subscribed" | "denied" | "unsupported" | "ios-needs-install">("idle")
  const [sub, setSub] = useState<PushSubscription | null>(null)
  const [loading, setLoading] = useState(false)
  const [subscribeError, setSubscribeError] = useState("")

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      // iOS Safari only exposes the Push API to a site launched from its
      // home-screen icon (standalone) — in a plain browser tab PushManager
      // doesn't exist at all, with no error to catch. Without this check
      // it just silently renders nothing, which looks identical to "push
      // isn't supported here" and gives no clue that adding the site to
      // the home screen would fix it.
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true
      setStatus(isIOS && !isStandalone ? "ios-needs-install" : "unsupported")
      return
    }
    if (Notification.permission === "denied") {
      setStatus("denied")
      return
    }
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(reg => reg.pushManager.getSubscription())
      .then(async existing => {
        if (!existing) return
        setSub(existing)
        setStatus("subscribed")
        // The browser can keep reporting an "active" subscription the
        // server has no matching row for (e.g. a subscribe() that never
        // made it to the DB) — the UI would then show "הודעות פעילות"
        // while sendPushToUser silently finds nothing to send to. Re-sync
        // it here instead of leaving that desync to surface only as "push
        // just doesn't work" with no visible cause.
        const raw = existing.toJSON() as { endpoint: string; keys?: { p256dh: string; auth: string } }
        if (!raw.keys) return
        const exists = await hasSubscriptionRow(raw.endpoint).catch(() => true)
        if (!exists) await subscribeUser({ endpoint: raw.endpoint, keys: raw.keys }).catch(() => {})
      })
      .catch(() => {})
  }, [])

  async function subscribe() {
    setLoading(true)
    setSubscribeError("")
    try {
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        throw new Error("מפתח Push לא מוגדר באתר")
      }
      const reg = await navigator.serviceWorker.ready
      const pushSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      })
      setSub(pushSub)
      const raw = pushSub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      const result = await subscribeUser(raw)
      if (!result.success) throw new Error("השרת לא שמר את המנוי")
      setStatus("subscribed")
    } catch (e: any) {
      // Any failure here used to just revert the button to "הפעל" with no
      // trace of what went wrong — a bad/missing VAPID key, the server
      // action failing, anything but a permission denial was silently
      // swallowed. Surface it instead of pretending nothing happened.
      if (e?.name === "NotAllowedError") setStatus("denied")
      else setSubscribeError(e?.message ?? "שגיאה בהפעלת ההתראות")
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
  if (status === "ios-needs-install") {
    return (
      <p className="text-xs text-white/30 text-center leading-relaxed">
        להפעלת התראות באייפון: הוסף את האתר למסך הבית (שיתוף ← הוסף למסך הבית) ופתח אותו משם — התראות לא נתמכות מתוך הדפדפן עצמו
      </p>
    )
  }
  if (status === "denied") {
    return (
      <p className="text-xs text-white/30 text-center">
        הודעות חסומות בהגדרות הדפדפן
      </p>
    )
  }

  return (
    <div className="space-y-2">
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
      {subscribeError && <p className="text-xs text-red-400/80 text-right">{subscribeError}</p>}
      {status === "subscribed" && <TestPushButton />}
    </div>
  )
}
