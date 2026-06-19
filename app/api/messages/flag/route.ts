import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { messageId } = await req.json()

  await prisma.message.update({
    where: { id: messageId, senderId: session.user.id },
    data: { flaggedByParent: true },
  })

  return NextResponse.json({ ok: true })
}
