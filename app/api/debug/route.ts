import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? "NO SESSION"
  
  const links = await prisma.parentStudent.findMany({
    where: userId !== "NO SESSION" ? { userId } : {},
    include: { student: true },
  })

  return NextResponse.json({ userId, links })
}
