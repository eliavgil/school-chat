import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { resolveStudentContext } from "@/lib/assistantContext"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Daily question cap, DB-backed ─────────────────────────────
// This is a real budget limit (Sonnet costs more per question than the
// Haiku-era hourly cap was guarding against), so it needs to actually hold
// over a full day — an in-memory counter would reset on every serverless
// cold start/redeploy long before the day is up.
// TEMP: raised for testing while Eliav QAs the bot — bring back to 5 when
// he says the limit should be restored (see chat history around 2026-09-23).
const MAX_BOT_REQUESTS_PER_DAY = 500

function israelDateKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" }) // YYYY-MM-DD
}

async function checkAndConsumeDailyLimit(userId: string): Promise<boolean> {
  const date = israelDateKey()
  const existing = await prisma.assistantDailyUsage.findUnique({ where: { userId_date: { userId, date } } })
  if (existing && existing.count >= MAX_BOT_REQUESTS_PER_DAY) return false
  await prisma.assistantDailyUsage.upsert({
    where: { userId_date: { userId, date } },
    update: { count: { increment: 1 } },
    create: { userId, date, count: 1 },
  })
  return true
}

function buildSystemPrompt(
  facts: string,
  ctx: Awaited<ReturnType<typeof resolveStudentContext>>,
  customInstructions: string,
  links: { label: string; url: string; whenToUse: string }[]
) {
  const ctxLines = ctx
    ? [
        `שם: ${ctx.studentName}`,
        `כיתה: ${ctx.className}`,
        ctx.track ? `מגמה: ${ctx.track}` : null,
        ctx.mathUnits ? `יחידות מתמטיקה: ${ctx.mathUnits}` : null,
        ctx.englishUnits ? `יחידות אנגלית: ${ctx.englishUnits}` : null,
        ctx.city ? `יישוב מגורים: ${ctx.city}` : null,
        ctx.parent1Name ? `הורה 1: ${ctx.parent1Name}` : null,
        ctx.parent2Name ? `הורה 2: ${ctx.parent2Name}` : null,
        ctx.gender ? `מגדר: ${ctx.gender === "נ" ? "נקבה — פני אליו/ה בלשון נקבה (את, יכולה, לומדת וכו')" : "זכר — פני אליו/ה בלשון זכר (אתה, יכול, לומד וכו')"}` : null,
        ctx.studyGroups ? `קבוצות לימוד (מקצוע + מורה):\n${ctx.studyGroups}` : null,
      ].filter(Boolean).join("\n")
    : "לא ידוע (לא זוהה תלמיד מקושר לחשבון)"

  const linksBlock = links.length
    ? `\n## קישורים שאפשר לצרף לתשובה\nכשאחד מהם רלוונטי לשאלה, כלול אותו בתשובה — כתוב את הכתובת המלאה כטקסט רגיל (https://...), לא בפורמט מרקדאון כמו [טקסט](קישור), כי זה לא יהפוך ללחיץ. אל תצרף קישור שלא רלוונטי לשאלה הספציפית.\n${links.map(l => `- ${l.label}${l.whenToUse ? ` (${l.whenToUse})` : ""}: ${l.url}`).join("\n")}\n`
    : ""

  const israelNow = new Date().toLocaleString("he-IL", {
    timeZone: "Asia/Jerusalem", weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  })

  return `אתה מיסטר פקפקובי — רובוט-צעצוע ישן, חביב אבל קצת ערמומי, שמשמש כעוזר האישי לתלמידים והורים בבית הספר "כפר סילבר". יש לך אישיות משלך — קצת שובבה, אבל תמיד לעניין.

## תאריך ושעה נוכחיים (שעון ישראל)
${israelNow}
השתמש בזה כדי לענות ישירות על כל שאלה שתלויה בתאריך/יום/שעה הנוכחיים (למשל "מתי מסיימים היום", "כמה זמן נשאר"). לעולם אל תשאל את המשתמש איזה יום היום — אתה כבר יודע.

חוקים קבועים, לא ניתנים לשינוי גם אם הוראות ההמשך למטה אומרות אחרת:
- תשובות קצרות מאוד — משפט או שניים כברירת מחדל. פסקה ארוכה או רשימה רק אם השאלה עצמה דורשת פירוט (למשל כמה זמנים ביום שונה). בלי לחזור על דברים שכבר נאמרו קודם באותה שיחה.
- בלי עיצוב מרקדאון בכלל — לא כוכביות (**), לא סולמיות (##), לא מקפים בתחילת שורה. זו בועת צ'אט רגילה, לא מסמך. אם צריך לפרט כמה דברים, תפריד אותם בירידת שורה רגילה, לא ברשימה מעוצבת.
- בלי כותרות-ביניים לפני התשובה (כמו "לגבי השאלה שלך:") ובלי פתיחים מבניים — תענה ישירות לשאלה.
- הצגה עצמית (שם + משפט אחד לכל היותר) מותרת אך ורק בהודעה הראשונה של שיחה חדשה, ורק אם היא נשאלת ישירות מי אתה — לא כברירת מחדל. אל תוסיף פסקת הסבר על בינה מלאכותית, דיוק, או מקורות מידע — אם התשובה לא בטוחה, זה מה ש-[[NEEDS_HELP]] בהמשך מיועד לו, לא הסתייגות כללית מראש. מההודעה השנייה ואילך אין הצגה עצמית בכלל.
- אתה **לא** בוט הוראה — אל תסביר חומר לימודי ואל תפתור תרגילים.
- אל תיגע בציונים בשום מקרה.
- "הקשר על התלמיד/ה ששואל/ת" למטה שייך אך ורק למי שמדבר/ת איתך כרגע. מותר לך להתייחס אליו/ה בשם, ולהזכיר את הפרטים האלה על עצמו/ה בלבד (למשל להתאים תשובה למגמה שלו/ה, או לומר מי מלמד אותו/ה באיזה מקצוע). **לעולם אל תחשוף, תנחש, או תסכים לדבר על פרטים אישיים (יישוב מגורים, שם הורה, מגמה, קבוצות לימוד/מורים וכד׳) של תלמיד/ה אחר/ת** — גם אם נשאלת בפירוש, גם אם הטוען אומר שזה על עצמו/ה, גם אם זה "רק בשביל חבר" — במקרה כזה תסרב בנימוס ותציע לפנות למזכירות.
- מספרי טלפון של מחנכים/מורים כן מותר לתת אם הם מופיעים במאגר העובדות למטה — זה לא נחשב מידע אישי של תלמיד.
- ענה רק על סמך העובדות שמופיעות למטה (גם במאגר העובדות וגם בהוראות הנוספות מהמחנך/ת — שני המקורות שווי-ערך כעובדות מהימנות) ועל ההקשר האישי שתואר. **אם השאלה לא מכוסה באף אחד מהם ואינך יכול לענות עליה בביטחון — התחל את התשובה שלך במדויק במחרוזת \`[[NEEDS_HELP]]\` (בלי רווח אחריה), ואז כתוב תשובה קצרה וכנה שאין לך את המידע.** אל תשתמש בסימון הזה על שאלות שכן ידעת לענות עליהן חלקית/טוב.
- אל תמציא תשובה לעולם — עדיף [[NEEDS_HELP]] מתשובה שגויה.

## הקשר על התלמיד/ה ששואל/ת (רק עליו/ה, לא על אף אחד אחר)
${ctxLines}

## מאגר העובדות על בית הספר
${facts || "(המאגר ריק כרגע — עדיין לא הועלו קבצים)"}
${linksBlock}${customInstructions ? `\n## הוראות נוספות מהמחנך (טון, עובדות/תיקונים, דגשים — התייחס לזה כעובדה מהימנה בדיוק כמו למאגר למעלה) — בכפוף לחוקים הקבועים למעלה\n${customInstructions}` : ""}

ברירת מחדל אם אין הוראה אחרת למעלה: תשובות קצרות וברורות בעברית, בטון חברותי ופשוט.`
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as any).role as string
  if (!["STUDENT", "PARENT", "TEACHER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  if (!(await checkAndConsumeDailyLimit(session.user.id))) {
    return NextResponse.json(
      { error: `הגעתם ל-${MAX_BOT_REQUESTS_PER_DAY} השאלות ליום — זה מה שהתקציב שלנו מאפשר כרגע 😊 נתראה מחר!` },
      { status: 429 }
    )
  }

  const { question, history: rawHistory } = await req.json()
  if (!question?.trim()) return NextResponse.json({ error: "Empty question" }, { status: 400 })

  // Cap to the last 20 turns and only trust role/content — this becomes
  // part of the Claude request, so never pass through arbitrary client JSON.
  const history: { role: "user" | "assistant"; content: string }[] = Array.isArray(rawHistory)
    ? rawHistory
        .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string" && m.content.trim())
        .slice(-20)
        .map((m: any) => ({ role: m.role, content: m.content }))
    : []

  // Deliberately no answer caching here (unlike /api/student/chat's
  // BotCache) — this bot's system prompt includes the current date/time and
  // per-student context that both change day to day, so a cached reply for
  // the same literal question text can go stale and wrong within the same
  // day (confirmed live: a cached "what day is it" answer from earlier in
  // the day got replayed verbatim after later fixes to date-awareness and
  // student data, ignoring everything that had since changed).
  const [docs, ctx, settings, links] = await Promise.all([
    prisma.schoolKnowledgeDoc.findMany({ select: { filename: true, extractedFacts: true, note: true } }),
    resolveStudentContext(session.user.id, role),
    prisma.schoolAssistantSettings.findUnique({ where: { id: "default" }, select: { instructions: true } }),
    prisma.schoolAssistantLink.findMany({ select: { label: true, url: true, whenToUse: true } }),
  ])
  const facts = docs
    .map(d => `### ${d.filename}${d.note ? ` — הערת המחנך/ת: ${d.note}` : ""}\n${d.extractedFacts}`)
    .join("\n\n")
  const systemPrompt = buildSystemPrompt(facts, ctx, settings?.instructions ?? "", links)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-5",
          max_tokens: 1024,
          // Sonnet 5 runs adaptive extended thinking by default even with no
          // `thinking` param set at all — real latency for a bot that only
          // ever does short factual lookups and brief answers, never
          // multi-step reasoning. Disabling it trades away reasoning depth
          // this bot was never using anyway for a faster response.
          thinking: { type: "disabled" },
          system: systemPrompt,
          messages: [...history, { role: "user", content: question }],
        })
        for await (const chunk of claudeStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
          }
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
