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
    .select("id, slug, title, subject, created_at")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, subject } = await req.json()
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 })

  const defaultSlide: Slide = {
    id: "s1", order: 1, type: "intro",
    eyebrow: "פתיחה",
    title: "שיעור חדש",
    body: "כאן יבוא תוכן השיעור.",
  }

  const slug = `lesson-${Date.now()}`
  const sb = adminClient()
  const { data, error } = await sb
    .from("lessons")
    .insert({ title, subject: subject ?? "כללי", slug, slides: [defaultSlide] })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
