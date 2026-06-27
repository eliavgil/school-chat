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

export async function sendPushToUser(userId: string, payload: PushPayload) {
  ensureVapid()
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (!subs.length) return

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
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
