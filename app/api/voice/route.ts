import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { sendPushToClassMembers } from "@/lib/push"

const client = new Anthropic()

function isTeacher(session: any) {
  return session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"
}

async function getTeacherClassId(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { classId: true } })
  return user?.classId ?? "class-y"
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "create_event",
    description: "יצירת אירוע חדש בלוח השנה של הכיתה (מבחן, טיול, חגיגה, מפגש הורים וכו')",
    input_schema: {
      type: "object" as const,
      properties: {
        description: { type: "string", description: "תיאור האירוע" },
        date: { type: "string", description: "תאריך בפורמט YYYY-MM-DD" },
      },
      required: ["description", "date"],
    },
  },
  {
    name: "create_task",
    description: "יצירת משימה חדשה לרשימת המשימות של המורה (הגשה, טיפול בתלמיד, תיאום, וכו')",
    input_schema: {
      type: "object" as const,
      properties: {
        description: { type: "string", description: "תיאור המשימה" },
        responsible: { type: "string", description: "מי אחראי (אופציונלי)" },
        deadline: { type: "string", description: "תאריך יעד בפורמט YYYY-MM-DD (אופציונלי)" },
        note: { type: "string", description: "הערה נוספת (אופציונלי)" },
      },
      required: ["description"],
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
          enum: ["home", "schedule", "calendar", "tasks", "dashboard"],
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
  tasks: "/teacher/tasks",
  dashboard: "/dashboard",
}

const PAGE_NAMES: Record<string, string> = {
  home: "דף הבית",
  schedule: "מערכת שעות",
  calendar: "לוח שנה",
  tasks: "משימות",
  dashboard: "הודעות",
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { text, history } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: "No text" }, { status: 400 })

  const classId = await getTeacherClassId(session.user.id)
  const today = new Date().toISOString().slice(0, 10)

  // Build message history for multi-turn conversation
  const messages: Anthropic.MessageParam[] = history ?? []
  messages.push({ role: "user", content: text })

  let response: Anthropic.Message
  try {
    response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: `אתה עוזר קולי חכם לאפליקציית ניהול כיתה למחנכים.
תאריך היום: ${today}

כשמורה נותן פקודה — הבן אותה, בצע את הפעולה המתאימה, והחזר תשובה קצרה וידידותית בעברית (1-2 משפטים) שמסבירה מה הבנת ומה ביצעת.

אם אינך בטוח — שאל שאלה קצרה.`,
      messages,
      tools: TOOLS,
    })
  } catch (err: any) {
    const msg = err?.message ?? "שגיאה בשירות הבינה המלאכותית"
    console.error("[voice] Anthropic error:", err?.status, msg)
    return NextResponse.json({ reply: msg, action: null, history: messages }, { status: 200 })
  }

  const toolUse = response.content.find(b => b.type === "tool_use") as Anthropic.ToolUseBlock | undefined
  const textBlock = response.content.find(b => b.type === "text") as Anthropic.TextBlock | undefined

  let actionResult: { type: string; route?: string; created?: any } | null = null
  let reply = textBlock?.text ?? ""

  // Add assistant response to history
  messages.push({ role: "assistant", content: response.content })

  if (toolUse) {
    const input = toolUse.input as any
    let toolResultContent = "success"

    if (toolUse.name === "create_event") {
      const event = await prisma.calendarEvent.create({
        data: {
          date: new Date(input.date),
          description: input.description,
          forAll: true,
        },
      })
      actionResult = { type: "create_event", created: event }
      // Notify class members in background
      sendPushToClassMembers(classId, {
        title: "אירוע חדש בלוח 📅",
        body: `${input.description} — ${input.date}`,
        url: "/home",
      }).catch(() => {})
    }

    if (toolUse.name === "create_task") {
      const task = await prisma.teacherTask.create({
        data: {
          classId,
          description: input.description,
          responsible: input.responsible?.trim() || null,
          deadline: input.deadline ? new Date(input.deadline) : null,
          note: input.note?.trim() || null,
        },
      })
      actionResult = { type: "create_task", created: task }
    }

    if (toolUse.name === "navigate") {
      const route = PAGE_ROUTES[input.page] ?? "/home"
      actionResult = { type: "navigate", route }
      if (!reply) reply = `עובר ל${PAGE_NAMES[input.page] ?? "דף הבית"}...`
    }

    // Always add tool_result so history stays valid for future turns
    messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: toolResultContent }] })

    // Only make a follow-up call if Claude didn't already include a text reply
    if (!reply) {
      try {
        const follow = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 150,
          system: `אתה עוזר קולי חכם. ענה קצר בעברית.`,
          messages,
          tools: TOOLS,
        })
        reply = (follow.content.find(b => b.type === "text") as Anthropic.TextBlock | undefined)?.text ?? ""
        messages.push({ role: "assistant", content: follow.content })
      } catch {}
    }
  }

  if (!reply) reply = "לא הצלחתי להבין את הפקודה. נסה שוב."

  return NextResponse.json({ reply, action: actionResult, history: messages })
}
