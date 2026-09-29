import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

import lesson1 from "@/lib/glossary/data/lesson-1.json"
import lesson2 from "@/lib/glossary/data/lesson-2.json"
import lesson3 from "@/lib/glossary/data/lesson-3.json"
import lesson4 from "@/lib/glossary/data/lesson-4.json"
import lesson5 from "@/lib/glossary/data/lesson-5.json"
import lesson6 from "@/lib/glossary/data/lesson-6.json"
import lesson7 from "@/lib/glossary/data/lesson-7.json"
import lesson8 from "@/lib/glossary/data/lesson-8.json"
import lesson9 from "@/lib/glossary/data/lesson-9.json"
import lesson10 from "@/lib/glossary/data/lesson-10.json"
import lesson11 from "@/lib/glossary/data/lesson-11.json"
import lesson12 from "@/lib/glossary/data/lesson-12.json"
import lesson13 from "@/lib/glossary/data/lesson-13.json"
import lesson14 from "@/lib/glossary/data/lesson-14.json"
import lesson15 from "@/lib/glossary/data/lesson-15.json"
import lesson16 from "@/lib/glossary/data/lesson-16.json"
import lesson17 from "@/lib/glossary/data/lesson-17.json"
import lesson18 from "@/lib/glossary/data/lesson-18.json"

interface TermSeed {
  key: string; term: string; shortDefinition: string; extendedArticle: string
  practiceSlideId: string | null; lessonSlug: string; lessonTitle: string
  lessonOrder: number; order: number
}

const ALL_TERMS: TermSeed[] = [
  ...lesson1, ...lesson2, ...lesson3, ...lesson4, ...lesson5, ...lesson6,
  ...lesson7, ...lesson8, ...lesson9, ...lesson10, ...lesson11, ...lesson12,
  ...lesson13, ...lesson14, ...lesson15, ...lesson16, ...lesson17, ...lesson18,
] as TermSeed[]

// Re-seeds the glossary from the extracted lesson data. Upserts by `key`
// (lessonSlug+slideId+termId) so re-running after editing lib/glossary/data
// updates existing rows instead of duplicating them — but never overwrites
// a term a teacher has since edited by hand in the app (only fields still
// blank/default are filled in on an update).
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const results: { key: string; term: string; status: "created" | "updated" | "skipped" }[] = []

  for (const t of ALL_TERMS) {
    const existing = await prisma.glossaryTerm.findUnique({ where: { key: t.key } })
    if (!existing) {
      await prisma.glossaryTerm.create({ data: t })
      results.push({ key: t.key, term: t.term, status: "created" })
      continue
    }
    // Preserve any manual teacher edits — only fill in fields still empty.
    const data: Record<string, unknown> = {
      lessonTitle: t.lessonTitle, lessonOrder: t.lessonOrder, order: t.order,
    }
    if (!existing.extendedArticle) data.extendedArticle = t.extendedArticle
    if (!existing.practiceSlideId) data.practiceSlideId = t.practiceSlideId
    await prisma.glossaryTerm.update({ where: { key: t.key }, data })
    results.push({ key: t.key, term: t.term, status: "updated" })
  }

  return NextResponse.json({
    message: "Glossary seeded",
    count: results.length,
    created: results.filter(r => r.status === "created").length,
    updated: results.filter(r => r.status === "updated").length,
  })
}
