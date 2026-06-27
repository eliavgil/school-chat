import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { sendPushToUser } from "@/lib/push"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true, classId: true },
  })

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: session.user.id },
    select: { id: true, endpoint: true, createdAt: true },
  })

  return NextResponse.json({ user, subscriptions: subs, count: subs.length })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    await sendPushToUser(session.user.id, {
      title: "בדיקה ✅",
      body: "אם אתה רואה את זה — Push עובד!",
      url: "/home",
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? String(err) })
  }
}
