import webpush from "web-push"
import { prisma } from "@/lib/db/prisma"

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

let vapidChecked = false

function ensureVapid() {
  // Fail loudly and once, instead of letting web-push throw a cryptic
  // "vapid public key should be 65 bytes long" deep inside sendNotification
  // the first time a key is missing/malformed — this is exactly the kind
  // of misconfiguration that otherwise looks identical to "push is just
  // broken" with nothing in the logs pointing at the actual cause.
  if (!vapidChecked) {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      throw new Error("Push not configured: NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY missing")
    }
    vapidChecked = true
  }
  webpush.setVapidDetails(
    "mailto:eliavgil@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}

// web-push's sendNotification has no built-in timeout — a stale/unreachable
// endpoint can hang the underlying request indefinitely, which would wedge
// any caller that awaits several of these in a loop (e.g. a catch-up route
// notifying many users in sequence). Race it against a hard cutoff so one
// bad subscription can only ever cost a few seconds, never the whole run.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("push send timed out")), ms)),
  ])
}

function pushServiceHost(endpoint: string): string {
  try { return new URL(endpoint).host } catch { return "?" }
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  ensureVapid()
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (!subs.length) return { sent: 0, failed: 0 }

  const results = await Promise.allSettled(
    subs.map(sub =>
      withTimeout(
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        ),
        10_000
      )
    )
  )

  let sent = 0, failed = 0
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === "fulfilled") { sent++; continue }
    failed++
    const reason = r.reason as any
    const statusCode = reason?.statusCode
    // 410 Gone and 404 Not Found both mean the push service considers this
    // subscription permanently dead (seen from both FCM and Mozilla's
    // autopush) — anything else (timeout, 400/401/403/5xx) is logged but
    // kept, since it could be transient (network blip, a momentary VAPID
    // clock-skew rejection) rather than proof the subscription is bad.
    console.error(
      `[push] send failed for user ${userId} via ${pushServiceHost(subs[i].endpoint)}:`,
      statusCode ? `HTTP ${statusCode}` : reason?.message ?? reason,
      reason?.body ? `— ${String(reason.body).slice(0, 200)}` : ""
    )
    if (statusCode === 410 || statusCode === 404) {
      await prisma.pushSubscription.delete({ where: { id: subs[i].id } }).catch(() => {})
    }
  }
  return { sent, failed }
}

export async function sendPushToClassMembers(
  classId: string,
  payload: PushPayload,
  roles: ("PARENT" | "STUDENT" | "TEACHER" | "ADMIN")[] = ["PARENT", "STUDENT"]
): Promise<{ sent: number; failed: number }> {
  const users = await prisma.user.findMany({
    where: { classId, role: { in: roles } },
    select: { id: true },
  })
  const results = await Promise.allSettled(users.map(u => sendPushToUser(u.id, payload)))
  let sent = 0, failed = 0
  for (const r of results) {
    if (r.status === "fulfilled") { sent += r.value.sent; failed += r.value.failed }
  }
  return { sent, failed }
}
