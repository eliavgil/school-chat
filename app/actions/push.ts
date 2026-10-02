"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function subscribeUser(sub: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false }

  await prisma.pushSubscription.upsert({
    where: { userId_endpoint: { userId: session.user.id, endpoint: sub.endpoint } },
    update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    create: {
      userId: session.user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  })
  return { success: true }
}

// The browser's own pushManager.getSubscription() can keep returning an
// endpoint the server no longer has a row for — e.g. the DB row was never
// created (a subscribe() call that failed server-side after the browser
// already had the subscription), or was removed as "expired" by an earlier,
// looser cleanup rule. PushManager calls this on mount so that case
// self-heals (re-upserts the row) instead of silently showing "active" in
// the UI while the server has nothing to push to.
export async function hasSubscriptionRow(endpoint: string): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return false

  const row = await prisma.pushSubscription.findUnique({
    where: { userId_endpoint: { userId: session.user.id, endpoint } },
    select: { id: true },
  })
  return !!row
}

export async function unsubscribeUser(endpoint: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false }

  await prisma.pushSubscription.deleteMany({
    where: { userId: session.user.id, endpoint },
  })
  return { success: true }
}
