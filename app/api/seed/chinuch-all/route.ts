import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"
import type { Slide } from "@/lib/lessons/types"
import { preserveManualMedia } from "@/lib/lessons/seedHelpers"

import * as lesson1 from "../chinuch-lesson-1/route"
import * as lesson2 from "../chinuch-lesson-2/route"
import * as lesson3 from "../chinuch-lesson-3/route"
import * as lesson4 from "../chinuch-lesson-4/route"
import * as lesson5 from "../chinuch-lesson-5/route"

const LESSONS: { title: string; slug: string; slides: Slide[] }[] = [
  lesson1, lesson2, lesson3, lesson4, lesson5,
].map(m => ({ title: m.LESSON_TITLE, slug: m.SLUG, slides: m.slides }))

// Re-seeds every חינוך lesson in one request instead of hitting each
// /api/seed/chinuch-lesson-N URL separately — mirrors /api/seed/all.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = adminClient()
  const results: { slug: string; title: string; status: "updated" | "created"; error?: string }[] = []

  for (const { title, slug, slides } of LESSONS) {
    const { data: existing, error: existingError } = await sb
      .from("lessons")
      .select("id, slides")
      .eq("slug", slug)
      .maybeSingle()

    if (existingError) {
      results.push({ slug, title, status: "updated", error: existingError.message })
      continue
    }

    if (existing) {
      const mergedSlides = preserveManualMedia(slides, existing.slides)
      const { error: updateError } = await sb
        .from("lessons")
        .update({ title, slides: mergedSlides })
        .eq("id", existing.id)
      results.push({ slug, title, status: "updated", ...(updateError ? { error: updateError.message } : {}) })
    } else {
      const { error: insertError } = await sb
        .from("lessons")
        .insert({ title, subject: "חינוך", slug, slides })
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
