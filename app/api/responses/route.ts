import { NextResponse } from "next/server"
import { adminClient } from "@/lib/lessons/supabase"

export async function POST(req: Request) {
  const { session_id, student_id, slide_id, question_id, answer } = await req.json()
  if (!session_id || !slide_id || !question_id || answer === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const sb = adminClient()

  // Upsert with unique constraint enforcement
  const { data, error } = await sb
    .from("responses")
    .upsert(
      {
        session_id,
        student_id: student_id ?? "anonymous",
        slide_id,
        question_id,
        answer: String(answer),
      },
      { onConflict: "session_id,student_id,slide_id,question_id", ignoreDuplicates: false }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// Aggregate results for a given session + slide
export async function GET(req: Request) {
  const url = new URL(req.url)
  const session_id = url.searchParams.get("session_id")
  const slide_id   = url.searchParams.get("slide_id")

  if (!session_id || !slide_id) return NextResponse.json({ error: "session_id + slide_id required" }, { status: 400 })

  const sb = adminClient()
  const { data, error } = await sb
    .from("responses")
    .select("question_id, answer")
    .eq("session_id", session_id)
    .eq("slide_id", slide_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
