import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"

import * as lesson1 from "../civics-lesson-1/route"
import * as lesson2 from "../civics-lesson-2/route"
import * as lesson3 from "../civics-lesson-3/route"
import * as lesson4 from "../civics-lesson-4/route"
import * as lesson5 from "../civics-lesson-5/route"
import * as lesson6 from "../civics-lesson-6/route"
import * as lesson7 from "../civics-lesson-7/route"
import * as lesson8 from "../civics-lesson-8/route"
import * as lesson9 from "../civics-lesson-9/route"
import * as lesson10 from "../civics-lesson-10/route"
import * as lesson11 from "../civics-lesson-11/route"
import * as lesson12 from "../civics-lesson-12/route"

const LESSONS: { title: string; slug: string; slides: Slide[] }[] = [
  lesson1, lesson2, lesson3, lesson4, lesson5, lesson6,
  lesson7, lesson8, lesson9, lesson10, lesson11, lesson12,
].map(m => ({ title: m.LESSON_TITLE, slug: m.SLUG, slides: m.slides }))

// Re-seeds every lesson in one request instead of hitting each
// /api/seed/civics-lesson-N URL separately.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = adminClient()
  const results: { slug: string; title: string; status: "updated" | "created"; error?: string }[] = []

  for (const { title, slug, slides } of LESSONS) {
    const { data: existing, error: existingError } = await sb
      .from("lessons")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (existingError) {
      results.push({ slug, title, status: "updated", error: existingError.message })
      continue
    }

    if (existing) {
      const { error: updateError } = await sb
        .from("lessons")
        .update({ title, slides })
        .eq("id", existing.id)
      results.push({ slug, title, status: "updated", ...(updateError ? { error: updateError.message } : {}) })
    } else {
      const { error: insertError } = await sb
        .from("lessons")
        .insert({ title, subject: "אזרחות", slug, slides })
      results.push({ slug, title, status: "created", ...(insertError ? { error: insertError.message } : {}) })
    }
  }

  const failed = results.filter(r => r.error)
  return NextResponse.json({
    message: failed.length ? "Completed with errors" : "All lessons seeded",
    count: results.length,
    failed: failed.length,
    results,
  })
}
