import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { adminClient } from "@/lib/lessons/supabase"

// GET — every glossary term, in the order they're taught across all lessons.
// Any signed-in user (including students) can read it. practiceUrl is built
// here rather than stored, since it depends on the *current* lesson row id
// in Supabase (lessons are keyed by slug in GlossaryTerm, not a fixed id).
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const terms = await prisma.glossaryTerm.findMany({ orderBy: { order: "asc" } })

  const slugs = [...new Set(terms.map(t => t.lessonSlug))]
  const sb = adminClient()
  const { data: lessons } = await sb.from("lessons").select("id, slug").in("slug", slugs)
  const idBySlug = new Map((lessons ?? []).map((l: any) => [l.slug, l.id]))

  const withLinks = terms.map(t => {
    const lessonId = idBySlug.get(t.lessonSlug)
    return {
      ...t,
      practiceUrl: t.practiceSlideId && lessonId ? `/lessons/${lessonId}/print#${t.practiceSlideId}` : null,
    }
  })

  return NextResponse.json({ terms: withLinks })
}
