import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import { prisma } from "@/lib/db/prisma"

function genCode() {
  return String(Math.floor(Math.random() * 100)).padStart(2, "0")
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { lesson_id, class_id: roster_class_id } = await req.json()
  if (!lesson_id) return NextResponse.json({ error: "lesson_id required" }, { status: 400 })

  const sb = adminClient()

  let resolved_class_id: string | null = null

  if (roster_class_id) {
    // class_id from the picker is a Prisma roster class id — find or create the
    // matching row in the Supabase lessons project's own "classes" table (live
    // sessions live there, separate from the roster). Errors surface to the
    // teacher instead of silently falling back, since a picker showing the
    // right class but failing to start a session for it should be visible.
    const rosterClass = await prisma.class.findUnique({
      where: { id: roster_class_id },
      select: { name: true, displayName: true },
    })
    if (!rosterClass) return NextResponse.json({ error: "כיתה לא נמצאה ברשימת הכיתות" }, { status: 400 })
    const className = rosterClass.displayName || rosterClass.name

    const { data: existingClass, error: findErr } = await sb
      .from("classes").select("id").eq("name", className).maybeSingle()
    if (findErr) return NextResponse.json({ error: `שגיאה באיתור כיתה: ${findErr.message}` }, { status: 500 })

    if (existingClass) {
      resolved_class_id = existingClass.id
    } else {
      const { data: newClass, error: insertErr } = await sb
        .from("classes").insert({ name: className }).select("id").single()
      if (insertErr) return NextResponse.json({ error: `יצירת כיתה נכשלה: ${insertErr.message}` }, { status: 500 })
      resolved_class_id = newClass?.id ?? null
    }
  }

  if (!resolved_class_id) {
    // Derive class_id from the lesson itself
    const { data: lessonRow } = await sb
      .from("lessons")
      .select("class_id")
      .eq("id", lesson_id)
      .single()
    resolved_class_id = lessonRow?.class_id ?? null
  }

  if (!resolved_class_id) {
    // Fall back to first existing Supabase class, or create one
    const { data: firstClass } = await sb.from("classes").select("id").order("name").limit(1).single()
    if (firstClass) {
      resolved_class_id = firstClass.id
    } else {
      const { data: newClass } = await sb
        .from("classes")
        .insert({ name: "י4" })
        .select("id")
        .single()
      resolved_class_id = newClass?.id ?? null
    }
  }
  if (!resolved_class_id) return NextResponse.json({ error: "Failed to resolve class" }, { status: 500 })

  // Mark any existing active sessions for this lesson as inactive
  await sb.from("live_sessions").update({ is_active: false }).eq("lesson_id", lesson_id).eq("is_active", true)

  let code = ""
  let tries = 0
  while (tries < 20) {
    code = genCode()
    const { data: existing } = await sb.from("live_sessions").select("id").eq("room_code", code).eq("is_active", true).maybeSingle()
    if (!existing) break
    tries++
  }

  const { data, error } = await sb
    .from("live_sessions")
    .insert({ lesson_id, class_id: resolved_class_id, room_code: code, current_slide_index: 0, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
