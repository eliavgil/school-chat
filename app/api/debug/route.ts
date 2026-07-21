import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { adminClient } from "@/lib/lessons/supabase"

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? "NO SESSION"

  // Test Supabase connection
  let supabaseStatus: any = {}
  try {
    const sb = adminClient()
    const { data, error } = await sb.from("lessons").select("id").limit(1)
    supabaseStatus = { ok: !error, error: error?.message ?? null, count: data?.length ?? 0 }
  } catch (e: any) {
    supabaseStatus = { ok: false, thrown: e.message }
  }

  // Test live_sessions table
  let sessionsStatus: any = {}
  try {
    const sb = adminClient()
    const { data, error } = await sb.from("live_sessions").select("id,is_active").limit(1)
    sessionsStatus = { ok: !error, error: error?.message ?? null, count: data?.length ?? 0 }
  } catch (e: any) {
    sessionsStatus = { ok: false, thrown: e.message }
  }

  const links = await prisma.parentStudent.findMany({
    where: userId !== "NO SESSION" ? { userId } : {},
    include: { student: true },
  })

  return NextResponse.json({ userId, supabaseStatus, sessionsStatus, links })
}
