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

export async function unsubscribeUser(endpoint: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false }

  await prisma.pushSubscription.deleteMany({
    where: { userId: session.user.id, endpoint },
  })
  return { success: true }
}
