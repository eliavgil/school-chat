import { NextResponse } from "next/server"
import { adminClient } from "@/lib/lessons/supabase"

export async function GET() {
  const sb = adminClient()

  // 1. Try to select from responses to check if table exists and what columns it has
  const { data: sample, error: selectError } = await sb
    .from("responses")
    .select("*")
    .limit(1)

  if (selectError) {
    return NextResponse.json({ step: "select", error: selectError.message, code: selectError.code })
  }

  // 2. Try a test insert with dummy data
  const { error: insertError } = await sb
    .from("responses")
    .insert({
      session_id: "test-session-debug",
      student_id: "test-student",
      slide_id: "test-slide",
      question_id: "test-question",
      answer: "0",
    })

  if (insertError) {
    return NextResponse.json({
      step: "insert",
      error: insertError.message,
      code: insertError.code,
      existingColumns: sample ? Object.keys(sample[0] ?? {}) : [],
    })
  }

  // 3. Clean up test row
  await sb.from("responses").delete().eq("session_id", "test-session-debug")

  return NextResponse.json({
    ok: true,
    existingColumns: sample ? Object.keys(sample[0] ?? {}) : [],
    message: "responses table works correctly",
  })
}
