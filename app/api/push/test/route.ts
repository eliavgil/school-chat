import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { sendPushToUser, sendPushToClassMembers } from "@/lib/push"

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

  // Find who would receive a push if sent to this user's classId
  const classMembers = user?.classId ? await prisma.user.findMany({
    where: { classId: user.classId, role: { in: ["TEACHER", "ADMIN"] } },
    select: { id: true, name: true, role: true, pushSubscriptions: { select: { id: true } } },
  }) : []

  return NextResponse.json({ user, subscriptions: subs, subsCount: subs.length, teachersInClass: classMembers })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { mode } = await req.json().catch(() => ({ mode: "direct" }))

  try {
    if (mode === "class") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { classId: true },
      })
      if (!user?.classId) return NextResponse.json({ success: false, error: "No classId on user" })
      await sendPushToClassMembers(user.classId, {
        title: "בדיקה כיתה ✅",
        body: "הודעה שנשלחה לכל המורים בכיתה",
        url: "/home",
      }, ["TEACHER", "ADMIN"])
      return NextResponse.json({ success: true, mode: "class", classId: user.classId })
    } else {
      await sendPushToUser(session.user.id, {
        title: "בדיקה ✅",
        body: "אם אתה רואה את זה — Push עובד!",
        url: "/home",
      })
      return NextResponse.json({ success: true, mode: "direct" })
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? String(err) })
  }
}
