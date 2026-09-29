import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { adminClient } from "@/lib/lessons/supabase"

// GET — every glossary term, in the order they're taught across all lessons,
// plus the actual practice-question text/tag for each lesson that has one
// (keyed by lessonSlug, not per-term — a lesson only ever has one practice
// slide, and it's shown once below that lesson's whole group of terms, not
// attached to the specific matching term, so the group doesn't give away
// which term is "the answer"). Any signed-in user (including students) can
// read this.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const terms = await prisma.glossaryTerm.findMany({ orderBy: { order: "asc" } })

  const slugs = [...new Set(terms.map(t => t.lessonSlug))]
  const sb = adminClient()
  const { data: lessons } = await sb.from("lessons").select("id, slug, slides").in("slug", slugs)
  const lessonBySlug = new Map((lessons ?? []).map((l: any) => [l.slug, l]))

  const practiceByLesson: Record<string, { tag: string | null; text: string } | null> = {}
  for (const slug of slugs) {
    const lesson = lessonBySlug.get(slug)
    const withSlide = terms.find(t => t.lessonSlug === slug && t.practiceSlideId)
    const slide = lesson?.slides?.find((s: any) => s.id === withSlide?.practiceSlideId)
    const q = slide?.questions?.[0]
    practiceByLesson[slug] = q ? { tag: q.tag ?? null, text: q.text ?? "" } : null
  }

  return NextResponse.json({ terms, practiceByLesson })
}
