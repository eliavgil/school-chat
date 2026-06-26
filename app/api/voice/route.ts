import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

function isTeacher(session: any) {
  return session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"
}

async function getClassId(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { classId: true } })
  return user?.classId ?? "class-y"
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "create_task",
    description: "יצירת משימה חדשה ברשימת המשימות של המחנך",
    input_schema: {
      type: "object" as const,
      properties: {
        description: { type: "string", description: "תיאור המשימה" },
        responsible: { type: "string", description: "שם האחראי (אופציונלי)" },
        deadline: { type: "string", description: "תאריך יעד בפורמט YYYY-MM-DD (אופציונלי)" },
        note: { type: "string", description: "הערה נוספת (אופציונלי)" },
      },
      required: ["description"],
    },
  },
  {
    name: "create_event",
    description: "יצירת ארוע חדש בלוח השנה",
    input_schema: {
      type: "object" as const,
      properties: {
        description: { type: "string", description: "תיאור הארוע" },
        date: { type: "string", description: "תאריך בפורמט YYYY-MM-DD" },
        type: {
          type: "string",
          enum: ["event", "meeting", "exam", "trip", "holiday"],
          description: "סוג הארוע",
        },
        note: { type: "string", description: "הערה (אופציונלי)" },
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
  tasks: "/home",
  dashboard: "/dashboard",
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: "No text" }, { status: 400 })

  const today = new Date().toISOString().slice(0, 10)

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: `אתה עוזר קולי חכם לאפליקציית ניהול כיתה למחנכים.
תאריך היום: ${today}

כשמורה נותן פקודה קולית — הבן אותה, בצע את הפעולה המתאימה, והחזר תשובה קצרה וידידותית בעברית (משפט אחד-שניים) שמסבירה מה הבנת ומה ביצעת.

אם אינך בטוח מה המורה רצה — שאל שאלה קצרה.`,
    messages: [{ role: "user", content: text }],
    tools: TOOLS,
  })

  // Find tool use block
  const toolUse = response.content.find(b => b.type === "tool_use") as Anthropic.ToolUseBlock | undefined
  const textBlock = response.content.find(b => b.type === "text") as Anthropic.TextBlock | undefined

  let actionResult: { type: string; route?: string; created?: any } | null = null
  let reply = textBlock?.text ?? ""

  if (toolUse) {
    const input = toolUse.input as any

    if (toolUse.name === "create_task") {
      const classId = await getClassId(session.user.id)
      const task = await prisma.teacherTask.create({
        data: {
          classId,
          description: input.description,
          responsible: input.responsible ?? null,
          deadline: input.deadline ? new Date(input.deadline) : null,
          note: input.note ?? null,
        },
      })
      actionResult = { type: "create_task", created: task }

      // Get Claude's reply with context of what was done
      if (!reply) {
        const follow = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 150,
          messages: [
            { role: "user", content: text },
            { role: "assistant", content: response.content },
            {
              role: "user",
              content: [{ type: "tool_result", tool_use_id: toolUse.id, content: "success" }],
            },
          ],
          tools: TOOLS,
        })
        reply = (follow.content.find(b => b.type === "text") as Anthropic.TextBlock | undefined)?.text ?? `משימה נוצרה: ${input.description}`
      }
    }

    if (toolUse.name === "create_event") {
      const event = await prisma.calendarEvent.create({
        data: {
          date: new Date(input.date),
          description: input.description,
          type: input.type ?? null,
          note: input.note ?? null,
          forTeacher: true,
          forStudents: false,
          forParents: false,
          forAll: false,
        },
      })
      actionResult = { type: "create_event", created: event }

      if (!reply) {
        const follow = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 150,
          messages: [
            { role: "user", content: text },
            { role: "assistant", content: response.content },
            {
              role: "user",
              content: [{ type: "tool_result", tool_use_id: toolUse.id, content: "success" }],
            },
          ],
          tools: TOOLS,
        })
        reply = (follow.content.find(b => b.type === "text") as Anthropic.TextBlock | undefined)?.text ?? `ארוע נוצר: ${input.description}`
      }
    }

    if (toolUse.name === "navigate") {
      const route = PAGE_ROUTES[input.page] ?? "/home"
      actionResult = { type: "navigate", route }
      if (!reply) reply = `עובר ל${input.page === "schedule" ? "מערכת שעות" : input.page === "calendar" ? "לוח שנה" : "דף הבית"}...`
    }
  }

  if (!reply) reply = "לא הצלחתי להבין את הפקודה. נסה שוב."

  return NextResponse.json({ reply, action: actionResult })
}
