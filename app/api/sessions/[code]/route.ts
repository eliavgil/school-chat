import { NextResponse } from "next/server"
import { adminClient } from "@/lib/lessons/supabase"

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const sb = adminClient()

  const { data: sessionData, error } = await sb
    .from("live_sessions")
    .select("*, lesson:lessons(id, title, slides)")
    .eq("room_code", code.toUpperCase())
    .eq("is_active", true)
    .single()

  if (error || !sessionData) return NextResponse.json({ error: "Session not found" }, { status: 404 })
  return NextResponse.json(sessionData)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const body = await req.json()
  const sb = adminClient()

  const { data, error } = await sb
    .from("live_sessions")
    .update(body)
    .eq("room_code", code.toUpperCase())
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
