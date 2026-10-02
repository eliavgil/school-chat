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
      const { sent, failed } = await sendPushToClassMembers(user.classId, {
        title: "בדיקה כיתה ✅",
        body: "הודעה שנשלחה לכל המורים בכיתה",
        url: "/home",
      }, ["TEACHER", "ADMIN"])
      // Not throwing is not the same as delivering — a stale/invalid
      // subscription fails "successfully" (a rejected promise, caught and
      // logged, not an exception here), so only report success once a push
      // actually went out to at least one subscription.
      return NextResponse.json({
        success: sent > 0, mode: "class", classId: user.classId, sent, failed,
        error: sent === 0 ? (failed > 0 ? `${failed} שליחות נכשלו, אף לא אחת הצליחה` : "אין מנוי Push פעיל לאף מורה בכיתה") : undefined,
      })
    } else {
      const { sent, failed } = await sendPushToUser(session.user.id, {
        title: "בדיקה ✅",
        body: "אם אתה רואה את זה — Push עובד!",
        url: "/home",
      })
      return NextResponse.json({
        success: sent > 0, mode: "direct", sent, failed,
        error: sent === 0 ? (failed > 0 ? `${failed} שליחות נכשלו — בדוק לוגים` : "אין מנוי Push פעיל למשתמש הזה") : undefined,
      })
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? String(err) })
  }
}
