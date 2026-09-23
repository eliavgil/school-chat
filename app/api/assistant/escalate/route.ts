import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { resolveStudentContext } from "@/lib/assistantContext"

// POST — a student/parent confirms "yes, forward this to the coordinator"
// after either a [[NEEDS_HELP]] answer or flagging one as wrong. Resolves
// who's actually asking server-side (never trust a client-supplied name).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as any).role as string
  if (!["STUDENT", "PARENT", "TEACHER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { question, answer, reason } = await req.json()
  if (!question?.trim() || !answer?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  if (!["dont_know", "flagged_wrong"].includes(reason)) return NextResponse.json({ error: "Invalid reason" }, { status: 400 })

  const ctx = await resolveStudentContext(session.user.id, role)
  const askerName = ctx?.studentName ?? session.user.name ?? "לא ידוע"

  await prisma.schoolAssistantEscalation.create({
    data: {
      userId: session.user.id,
      askerName,
      askerRole: role,
      className: ctx?.className ?? null,
      question: question.trim(),
      answer: answer.trim(),
      reason,
    },
  })
  return NextResponse.json({ ok: true })
}
