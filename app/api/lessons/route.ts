import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = adminClient()
  const { data, error } = await sb
    .from("lessons")
    .select("id, title, created_at, class_id")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, class_id } = await req.json()
  if (!title || !class_id) return NextResponse.json({ error: "title + class_id required" }, { status: 400 })

  const defaultSlide: Slide = {
    id: "s1", order: 1, type: "intro",
    eyebrow: "פתיחה",
    title: "שיעור חדש",
    body: "כאן יבוא תוכן השיעור.",
  }

  const sb = adminClient()
  const { data, error } = await sb
    .from("lessons")
    .insert({ title, class_id, slides: [defaultSlide] })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
