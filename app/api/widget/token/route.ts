import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import crypto from "crypto"

// GET — returns the signed-in user's widget token, generating one on first
// call. This token (not a session cookie) is what /api/widget/schedule
// authenticates with, since a home-screen widget (Scriptable, Shortcuts)
// fetches in the background with no browser session to carry.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { widgetToken: true } })
  if (user?.widgetToken) return NextResponse.json({ token: user.widgetToken })

  const token = crypto.randomBytes(24).toString("hex")
  await prisma.user.update({ where: { id: session.user.id }, data: { widgetToken: token } })
  return NextResponse.json({ token })
}

// POST — invalidates the current token and issues a new one (e.g. if it
// leaked or the widget needs to be reset).
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const token = crypto.randomBytes(24).toString("hex")
  await prisma.user.update({ where: { id: session.user.id }, data: { widgetToken: token } })
  return NextResponse.json({ token })
}
