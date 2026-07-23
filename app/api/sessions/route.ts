import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import { prisma } from "@/lib/db/prisma"

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { lesson_id, class_id: provided_class_id } = await req.json()
  if (!lesson_id) return NextResponse.json({ error: "lesson_id required" }, { status: 400 })

  // Resolve class_id: use provided value → user.classId → first class where user is a teacher
  const teacherId = (session.user as any).id as string
  let class_id = provided_class_id ?? null
  if (!class_id) {
    const user = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { classId: true },
    })
    class_id = user?.classId ?? null
  }
  if (!class_id) {
    const cls = await prisma.class.findFirst({
      where: { teachers: { some: { id: teacherId } } },
      select: { id: true },
    })
    class_id = cls?.id ?? null
  }
  if (!class_id) return NextResponse.json({ error: "No class found for this teacher" }, { status: 400 })

  const sb = adminClient()

  // Mark any existing active sessions for this lesson as inactive
  await sb.from("live_sessions").update({ is_active: false }).eq("lesson_id", lesson_id).eq("is_active", true)

  let code = ""
  let tries = 0
  while (tries < 10) {
    code = genCode()
    const { data: existing } = await sb.from("live_sessions").select("id").eq("room_code", code).single()
    if (!existing) break
    tries++
  }

  const { data, error } = await sb
    .from("live_sessions")
    .insert({ lesson_id, class_id, room_code: code, current_slide_index: 0, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
