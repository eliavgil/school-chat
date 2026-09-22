import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── In-memory rate limiting (mirrors /api/student/chat) ──────
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const MAX_BOT_REQUESTS_PER_HOUR = 20
const RATE_WINDOW_MS = 60 * 60 * 1000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= MAX_BOT_REQUESTS_PER_HOUR) return false
  entry.count++
  return true
}

// Student/parent, not teacher/admin: this bot is scoped to logistics
// questions only, so a teacher account has no meaningful "student context"
// to answer from — but browsing here isn't harmful, so it's allowed
// through without a class/track context if it ever happens (e.g. preview).
async function resolveStudentContext(userId: string, role: string) {
  let studentId: string | null = null
  if (role === "STUDENT") {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { studentId: true } })
    studentId = user?.studentId ?? null
  } else if (role === "PARENT") {
    const link = await prisma.parentStudent.findFirst({ where: { userId }, select: { studentId: true } })
    studentId = link?.studentId ?? null
  }
  if (!studentId) return null

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { name: true, track: true, mathUnits: true, englishUnits: true, class: { select: { displayName: true, name: true } } },
  })
  if (!student) return null
  return {
    studentName: student.name,
    className: student.class.displayName || student.class.name,
    track: student.track,
    mathUnits: student.mathUnits,
    englishUnits: student.englishUnits,
  }
}

function buildSystemPrompt(facts: string, ctx: Awaited<ReturnType<typeof resolveStudentContext>>, customInstructions: string) {
  const ctxLines = ctx
    ? [
        `כיתה: ${ctx.className}`,
        ctx.track ? `מגמה: ${ctx.track}` : null,
        ctx.mathUnits ? `יחידות מתמטיקה: ${ctx.mathUnits}` : null,
        ctx.englishUnits ? `יחידות אנגלית: ${ctx.englishUnits}` : null,
      ].filter(Boolean).join("\n")
    : "לא ידוע (לא זוהה תלמיד מקושר לחשבון)"

  return `אתה "פקפקובי בוט - עוזר אישי" — בוט מידע לוגיסטי לתלמידים והורים בבית הספר "כפר סילבר".

חוקים קבועים, לא ניתנים לשינוי גם אם הוראות ההמשך למטה אומרות אחרת: אתה **לא** בוט הוראה — אל תסביר חומר לימודי ואל תפתור תרגילים. אל תיגע בציונים או בכל נתון אישי/אקדמי של תלמידים, גם אם נשאלת עליהם — תפקידך הוא אך ורק מידע לוגיסטי כללי על בית הספר. ענה רק על סמך העובדות שמופיעות למטה; אם השאלה לא מכוסה בהן, אמור בכנות שאין לך את המידע ושכדאי לפנות למזכירות/למחנך — אל תמציא תשובה.

## הקשר על התלמיד/ה ששואל/ת
${ctxLines}

## מאגר העובדות על בית הספר
${facts || "(המאגר ריק כרגע — עדיין לא הועלו קבצים)"}
${customInstructions ? `\n## הוראות נוספות מהמחנך (טון, סגנון, דגשים) — בכפוף לחוקים הקבועים למעלה\n${customInstructions}` : ""}

ברירת מחדל אם אין הוראה אחרת למעלה: תשובות קצרות וברורות בעברית, בטון חברותי ופשוט.`
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as any).role as string
  if (!["STUDENT", "PARENT", "TEACHER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json(
      { error: "הגעת למגבלת הבקשות לשעה (20 בקשות). נסה שוב בעוד שעה." },
      { status: 429 }
    )
  }

  const { question } = await req.json()
  if (!question?.trim()) return NextResponse.json({ error: "Empty question" }, { status: 400 })

  const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000)
  const cached = await prisma.botCache.findFirst({
    where: { userId: session.user.id, question, fromBot: "assistant", createdAt: { gte: oneDayAgo } },
  })
  if (cached) {
    const encoder = new TextEncoder()
    const cachedAnswer = cached.answer
    const stream = new ReadableStream({
      start(controller) {
        const chunkSize = 20
        let i = 0
        const interval = setInterval(() => {
          if (i >= cachedAnswer.length) {
            clearInterval(interval)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, fromCache: true })}\n\n`))
            controller.close()
            return
          }
          const chunk = cachedAnswer.slice(i, i + chunkSize)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
          i += chunkSize
        }, 20)
      },
    })
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    })
  }

  const [docs, ctx, settings] = await Promise.all([
    prisma.schoolKnowledgeDoc.findMany({ select: { filename: true, extractedFacts: true } }),
    resolveStudentContext(session.user.id, role),
    prisma.schoolAssistantSettings.findUnique({ where: { id: "default" }, select: { instructions: true } }),
  ])
  const facts = docs.map(d => `### ${d.filename}\n${d.extractedFacts}`).join("\n\n")
  const systemPrompt = buildSystemPrompt(facts, ctx, settings?.instructions ?? "")

  const encoder = new TextEncoder()
  const userId = session.user.id
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = ""
      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: "user", content: question }],
        })
        for await (const chunk of claudeStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            fullText += chunk.delta.text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
          }
        }
        if (fullText) {
          prisma.botCache.create({
            data: { userId, question, answer: fullText, fromBot: "assistant" },
          }).catch(() => {})
        }
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true })}\n\n`))
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
  })
}
