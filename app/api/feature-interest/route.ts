import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { feature } = await req.json()
  if (!feature) return NextResponse.json({ error: "Missing feature" }, { status: 400 })

  await prisma.featureInterest.upsert({
    where: { userId_feature: { userId: session.user.id, feature } },
    create: { userId: session.user.id, feature },
    update: {},
  })

  return NextResponse.json({ ok: true })
}
