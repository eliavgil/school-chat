import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (user?.role !== "TEACHER" && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000)
  const messages = await prisma.message.findMany({
    where: { createdAt: { gte: weekAgo } },
    include: { student: { select: { name: true } }, sender: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  const summary = messages.map(m => ({
    student: m.student.name,
    content: m.content,
    status: m.status,
    botResponse: m.botResponse ? "✓ ענה הבוט" : "—",
    teacherResponse: m.teacherResponse ? "✓ ענה המחנך" : "—",
    isTask: m.isTask,
    date: m.createdAt.toLocaleDateString("he-IL"),
  }))

  const prompt = `אתה עוזר למחנכ/ת של כיתה י2 בבית ספר כפר סילבר.
להלן רשימת הפניות שהגיעו בשבוע האחרון (${messages.length} פניות סה"כ):

${JSON.stringify(summary, null, 2)}

צור סיכום שבועי קצר ומסודר בעברית הכולל:
1. כמה פניות הגיעו ומה חולקן (בוט / מחנך / טרם טופל)
2. הנושאים העיקריים שעלו
3. פניות שדורשות המשך טיפול (מסומנות כמשימה, או ללא תגובה)
4. המלצה קצרה לשבוע הבא

כתוב בצורה ברורה וממוקדת.`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
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
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
