import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

function isTeacher(session: any) {
  return session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "create_event",
    description: "יצירת ארוע חדש בלוח השנה",
    input_schema: {
      type: "object" as const,
      properties: {
        description: { type: "string", description: "תיאור הארוע" },
        date: { type: "string", description: "תאריך בפורמט YYYY-MM-DD" },
      },
      required: ["description", "date"],
    },
  },
  {
    name: "navigate",
    description: "ניווט לדף מסוים באפליקציה",
    input_schema: {
      type: "object" as const,
      properties: {
        page: {
          type: "string",
          enum: ["home", "schedule", "calendar", "dashboard"],
          description: "הדף לפתוח",
        },
      },
      required: ["page"],
    },
  },
]

const PAGE_ROUTES: Record<string, string> = {
  home: "/home",
  schedule: "/teacher/schedule",
  calendar: "/teacher/calendar",
  dashboard: "/dashboard",
}

const PAGE_NAMES: Record<string, string> = {
  home: "דף הבית",
  schedule: "מערכת שעות",
  calendar: "לוח שנה",
  dashboard: "הודעות",
}

async function getFollowUpReply(
  text: string,
  firstResponse: Anthropic.Message,
  toolUseId: string,
  fallback: string
): Promise<string> {
  const follow = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    messages: [
      { role: "user", content: text },
      { role: "assistant", content: firstResponse.content },
      { role: "user", content: [{ type: "tool_result", tool_use_id: toolUseId, content: "success" }] },
    ],
    tools: TOOLS,
  })
  return (follow.content.find(b => b.type === "text") as Anthropic.TextBlock | undefined)?.text ?? fallback
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: "No text" }, { status: 400 })

  const today = new Date().toISOString().slice(0, 10)

  let response: Anthropic.Message
  try {
    response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: `אתה עוזר קולי חכם לאפליקציית ניהול כיתה למחנכים.
תאריך היום: ${today}

כשמורה נותן פקודה קולית — הבן אותה, בצע את הפעולה המתאימה, והחזר תשובה קצרה וידידותית בעברית (משפט אחד-שניים) שמסבירה מה הבנת ומה ביצעת.

אם אינך בטוח מה המורה רצה — שאל שאלה קצרה.`,
      messages: [{ role: "user", content: text }],
      tools: TOOLS,
    })
  } catch (err: any) {
    const msg = err?.message ?? "שגיאה בשירות הבינה המלאכותית"
    console.error("[voice] Anthropic error:", err?.status, msg)
    return NextResponse.json({ reply: msg, action: null }, { status: 200 })
  }

  const toolUse = response.content.find(b => b.type === "tool_use") as Anthropic.ToolUseBlock | undefined
  const textBlock = response.content.find(b => b.type === "text") as Anthropic.TextBlock | undefined

  let actionResult: { type: string; route?: string; created?: any } | null = null
  let reply = textBlock?.text ?? ""

  if (toolUse) {
    const input = toolUse.input as any

    if (toolUse.name === "create_event") {
      const event = await prisma.calendarEvent.create({
        data: {
          date: new Date(input.date),
          description: input.description,
        },
      })
      actionResult = { type: "create_event", created: event }

      if (!reply) {
        reply = await getFollowUpReply(text, response, toolUse.id, `ארוע נוצר: ${input.description}`)
      }
    }

    if (toolUse.name === "navigate") {
      const route = PAGE_ROUTES[input.page] ?? "/home"
      actionResult = { type: "navigate", route }
      if (!reply) reply = `עובר ל${PAGE_NAMES[input.page] ?? "דף הבית"}...`
    }
  }

  if (!reply) reply = "לא הצלחתי להבין את הפקודה. נסה שוב."

  return NextResponse.json({ reply, action: actionResult })
}
