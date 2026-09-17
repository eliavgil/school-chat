import webpush from "web-push"
import { prisma } from "@/lib/db/prisma"

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

function ensureVapid() {
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

export async function sendPushToUser(userId: string, payload: PushPayload) {
  ensureVapid()
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (!subs.length) return

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
  // Remove expired subscriptions
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === "rejected" && (r.reason as any)?.statusCode === 410) {
      await prisma.pushSubscription.delete({ where: { id: subs[i].id } }).catch(() => {})
    }
  }
}

export async function sendPushToClassMembers(
  classId: string,
  payload: PushPayload,
  roles: ("PARENT" | "STUDENT" | "TEACHER" | "ADMIN")[] = ["PARENT", "STUDENT"]
) {
  const users = await prisma.user.findMany({
    where: { classId, role: { in: roles } },
    select: { id: true },
  })
  await Promise.allSettled(users.map(u => sendPushToUser(u.id, payload)))
}
