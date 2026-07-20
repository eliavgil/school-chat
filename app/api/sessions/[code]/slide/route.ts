import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await params
  const { index } = await req.json()
  if (typeof index !== "number") return NextResponse.json({ error: "index required" }, { status: 400 })

  const sb = adminClient()
  const { data, error } = await sb
    .from("live_sessions")
    .update({ current_slide_index: index })
    .eq("room_code", code.toUpperCase())
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Broadcast to Realtime channel
  await sb.channel(`session:${code.toUpperCase()}`).send({
    type: "broadcast",
    event: "slide_change",
    payload: { index },
  })

  return NextResponse.json({ ok: true, id: data.id })
}
