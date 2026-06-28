import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { sendPushToClassMembers } from "@/lib/push"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { body, targets } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: "No body" }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { classId: true, name: true },
  })
  if (!user?.classId) return NextResponse.json({ error: "No class" }, { status: 400 })

  // targets: array of "PARENT" | "STUDENT", defaults to both
  const roles: ("PARENT" | "STUDENT")[] = Array.isArray(targets) && targets.length > 0
    ? targets
    : ["PARENT", "STUDENT"]

  await sendPushToClassMembers(user.classId, {
    title: `הודעה מ${user.name ?? "המורה"} 📢`,
    body: body.trim(),
    url: "/home",
  }, roles)

  return NextResponse.json({ success: true })
}
