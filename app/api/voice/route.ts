import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { israelLocalToUtc } from "@/lib/israel-time"
import Anthropic from "@anthropic-ai/sdk"
import { sendPushToClassMembers } from "@/lib/push"

const client = new Anthropic()

// בוטטר — a voice assistant for site actions, eliavgil-only while it's
// being trialed (not role-gated like the rest of the app; a hard email
// check, same pattern used for the glossary nav gate).
function isOwner(session: any) {
  return session?.user?.email === "eliavgil@gmail.com"
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "create_personal_task",
    description: "ברירת המחדל ליצירת משימה: משימה אישית (\"משימות לראש הפרטי\") — רק למשתמש עצמו, לא לצוות. השתמש בזה תמיד אלא אם נאמר במפורש 'משימת צוות' או 'משימה צוותית'.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "תיאור המשימה" },
        deadline: { type: "string", description: "תאריך יעד בפורמט YYYY-MM-DD (אופציונלי)" },
        reminderAt: { type: "string", description: "זמן תזכורת בפורמט YYYY-MM-DDTHH:MM, שעון ישראל (אופציונלי)" },
        importance: { type: "string", enum: ["RED", "YELLOW", "BLUE"], description: "רמת דחיפות (אופציונלי, ברירת מחדל BLUE)" },
      },
      required: ["title"],
    },
  },
  {
    name: "create_team_task",
    description: "יצירת משימת צוות — רק כשנאמר במפורש 'משימת צוות' או 'משימה צוותית', עם ציון למי לשייך אותה.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "תיאור המשימה" },
        assignees: { type: "array", items: { type: "string" }, description: "שם/שמות המורים שהמשימה משויכת אליהם" },
        deadline: { type: "string", description: "תאריך יעד בפורמט YYYY-MM-DD (אופציונלי)" },
        reminderAt: { type: "string", description: "זמן תזכורת בפורמט YYYY-MM-DDTHH:MM, שעון ישראל, לכל המשויכים שצוינו (אופציונלי)" },
        importance: { type: "string", enum: ["RED", "YELLOW", "BLUE"], description: "רמת דחיפות (אופציונלי, ברירת מחדל BLUE)" },
      },
      required: ["title", "assignees"],
    },
  },
  {
    name: "create_event",
    description: "יצירת אירוע חדש בלוח השנה של בית הספר (מבחן, טיול, חגיגה, מפגש הורים וכו')",
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
    name: "navigate",
    description: "ניווט לדף מסוים באפליקציה",
    input_schema: {
      type: "object" as const,
      properties: {
        page: {
          type: "string",
          enum: [
            "home", "lessons", "surveys", "team", "accommodations", "emotional", "kpi",
            "subject", "grade_hub", "seating_chart", "glossary", "assistant",
            "school_assistant", "manage", "schedule", "calendar", "tasks", "dashboard",
          ],
          description: "הדף לפתוח",
        },
      },
      required: ["page"],
    },
  },
]

const PAGE_ROUTES: Record<string, string> = {
  home: "/home",
  lessons: "/lessons",
  surveys: "/teacher/surveys",
  team: "/teacher/team",
  accommodations: "/teacher/accommodations",
  emotional: "/teacher/emotional",
  kpi: "/kpi",
  subject: "/teacher/subject",
  grade_hub: "/teacher/grade-hub",
  seating_chart: "/teacher/seating-chart",
  glossary: "/glossary",
  assistant: "/assistant",
  school_assistant: "/teacher/school-assistant",
  manage: "/manage",
  schedule: "/teacher/schedule",
  calendar: "/teacher/calendar",
  tasks: "/teacher/tasks",
  dashboard: "/dashboard",
}

const PAGE_NAMES: Record<string, string> = {
  home: "דף הבית",
  lessons: "אזרחות מלאכותית",
  surveys: "שאלונים",
  team: "צוות מחנכים",
  accommodations: "מענים אישיים",
  emotional: "מעקב רגשי-חברתי",
  kpi: "לוח KPI",
  subject: "מורה מקצועי",
  grade_hub: "ניהול שכבה",
  seating_chart: "סידור ישיבה",
  glossary: "מילון מושגים",
  assistant: "מיסטר פקפקובי",
  school_assistant: "ניהול מאגר ידע",
  manage: "הגדרות",
  schedule: "מערכת שעות",
  calendar: "לוח שנה",
  tasks: "משימות",
  dashboard: "הודעות",
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isOwner(session))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { text, history } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: "No text" }, { status: 400 })

  const classId = await prisma.user.findUnique({ where: { id: session.user.id }, select: { classId: true } })
    .then(u => u?.classId ?? "class-y")
  const nowIL = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "full", timeStyle: "short" })
  const today = new Date().toISOString().slice(0, 10)

  const messages: Anthropic.MessageParam[] = history ?? []
  messages.push({ role: "user", content: text })

  let response: Anthropic.Message
  try {
    response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: `אתה בוטטר — עוזר קולי אישי לביצוע פעולות באתר, בשימוש פרטי בלבד.
עכשיו: ${nowIL} (שעון ישראל). תאריך היום: ${today}.

כשהמשתמש מבקש לפתוח משימה — ברירת המחדל היא תמיד משימה אישית (create_personal_task), גם אם לא נאמר "אישית" במפורש. עבור ל-create_team_task רק כשנאמר במפורש "משימת צוות" או "משימה צוותית", ואז יש לוודא שצוין למי לשייך אותה (אם לא צוין — שאל).

כשמבקשים תזכורת — פרש ביטויי זמן טבעיים ("מחר ב-8", "בעוד שעה", "ביום ראשון בצהריים") יחסית לזמן הנוכחי שצוין למעלה, והמר לפורמט YYYY-MM-DDTHH:MM.

הבן פקודה, בצע את הפעולה המתאימה, והחזר תשובה קצרה וידידותית בעברית (1-2 משפטים) שמסבירה מה הבנת ומה ביצעת. אם חסר פרט הכרחי (למשל למי לשייך משימת צוות) — שאל שאלה קצרה במקום לנחש.`,
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

  messages.push({ role: "assistant", content: response.content })

  if (toolUse) {
    const input = toolUse.input as any
    let toolResultContent = "success"

    if (toolUse.name === "create_personal_task") {
      const task = await prisma.personalTask.create({
        data: {
          userId: session.user.id,
          title: input.title.trim(),
          deadline: input.deadline ? new Date(input.deadline) : null,
          importance: input.importance ?? "BLUE",
          reminderAt: input.reminderAt ? israelLocalToUtc(input.reminderAt) : null,
        },
      })
      actionResult = { type: "create_personal_task", created: task }
    }

    if (toolUse.name === "create_team_task") {
      const names: string[] = Array.isArray(input.assignees) ? input.assignees.map((n: string) => n.trim()).filter(Boolean) : []
      if (names.length === 0) {
        toolResultContent = "error: no assignees given"
      } else {
        const reminderDate = input.reminderAt ? israelLocalToUtc(input.reminderAt) : null
        const existingTeachers = await prisma.user.findMany({
          where: { name: { in: names }, role: { in: ["TEACHER", "ADMIN"] } },
          select: { id: true, name: true },
        })
        const userIdByName = new Map(existingTeachers.map(u => [u.name, u.id]))
        const task = await prisma.staffTask.create({
          data: {
            createdById: session.user.id,
            title: input.title.trim(),
            deadline: input.deadline ? new Date(input.deadline) : null,
            importance: input.importance ?? "BLUE",
            assignees: {
              create: names.map(teacherLabel => ({
                teacherLabel,
                userId: userIdByName.get(teacherLabel) ?? null,
                reminderAt: reminderDate,
              })),
            },
          },
          include: { assignees: true },
        })
        actionResult = { type: "create_team_task", created: task }
      }
    }

    if (toolUse.name === "create_event") {
      const event = await prisma.calendarEvent.create({
        data: {
          date: new Date(input.date),
          description: input.description,
          forAll: true,
        },
      })
      actionResult = { type: "create_event", created: event }
      sendPushToClassMembers(classId, {
        title: "אירוע חדש בלוח 📅",
        body: `${input.description} — ${input.date}`,
        url: "/home",
      }).catch(() => {})
    }

    if (toolUse.name === "navigate") {
      const route = PAGE_ROUTES[input.page] ?? "/home"
      actionResult = { type: "navigate", route }
      if (!reply) reply = `עובר ל${PAGE_NAMES[input.page] ?? "דף הבית"}...`
    }

    messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: toolResultContent }] })

    if (!reply) {
      try {
        const follow = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 150,
          system: `אתה בוטטר, עוזר קולי. ענה קצר בעברית.`,
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
