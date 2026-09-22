import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { adminClient } from "@/lib/lessons/supabase"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const BUCKET = "school-knowledge-docs"
const MAX_BYTES = 15 * 1024 * 1024 // 15 MB — Claude's own document/image limit

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const TEXT_TYPES = ["text/plain", "text/markdown", "text/csv"]

function isTeacherRole(role: string) {
  return role === "TEACHER" || role === "ADMIN"
}

const EXTRACTION_PROMPT = `אתה עוזר שמכין מאגר עובדות עבור בוט לוגיסטי לתלמידים והורים בבית ספר תיכון.
קרא את הקובץ המצורף וחלץ ממנו כל עובדה קונקרטית ושימושית שיכולה לענות על שאלה לוגיסטית — תאריכים, מיקומים, טפסים, נהלים, אנשי קשר, קישורים, מגמות ותנאים.
התעלם מרעש (כותרות עמוד, עיצוב, חתימות). אל תוסיף פרשנות או מידע שלא מופיע בקובץ.
כתוב את התשובה כרשימת נקודות תמציתית בעברית, מוכנה להזרקה ישירה למאגר ידע של בוט.
אם אין בקובץ שום עובדה שימושית, כתוב "לא נמצא מידע רלוונטי" בלבד.`

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const docs = await prisma.schoolKnowledgeDoc.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json({ docs })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file")
  if (!(file instanceof Blob)) return NextResponse.json({ error: "No file provided" }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "הקובץ גדול מדי (מקסימום 15MB)" }, { status: 413 })

  const filename = (formData.get("filename") as string) || "קובץ"
  const mimeType = file.type
  const buffer = Buffer.from(await file.arrayBuffer())

  let contentBlock: Anthropic.Messages.ContentBlockParam
  if (mimeType === "application/pdf") {
    contentBlock = { type: "document", source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") } }
  } else if (IMAGE_TYPES.includes(mimeType)) {
    contentBlock = { type: "image", source: { type: "base64", media_type: mimeType as any, data: buffer.toString("base64") } }
  } else if (TEXT_TYPES.includes(mimeType) || /\.(txt|md|csv)$/i.test(filename)) {
    contentBlock = { type: "text", text: buffer.toString("utf-8") }
  } else {
    return NextResponse.json({
      error: "סוג קובץ לא נתמך כרגע — אפשר PDF, תמונה (jpg/png), או טקסט (txt/md/csv). קבצי Word/Excel — המר קודם ל-PDF.",
    }, { status: 415 })
  }

  let extractedFacts: string
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: [contentBlock, { type: "text", text: EXTRACTION_PROMPT }] }],
    })
    const textBlock = msg.content.find((b): b is Anthropic.TextBlock => b.type === "text")
    extractedFacts = textBlock?.text?.trim() || "לא נמצא מידע רלוונטי"
  } catch (e: any) {
    return NextResponse.json({ error: `שגיאה בעיבוד הקובץ: ${e?.message ?? "unknown"}` }, { status: 502 })
  }

  const sb = adminClient()
  await sb.storage.createBucket(BUCKET, { public: true }).catch(() => {})
  const ext = filename.split(".").pop() || "bin"
  const path = `docs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error: uploadError } = await sb.storage.from(BUCKET).upload(path, buffer, { contentType: mimeType, upsert: false })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })
  const { data: { publicUrl } } = sb.storage.from(BUCKET).getPublicUrl(path)

  const doc = await prisma.schoolKnowledgeDoc.create({
    data: { filename, fileUrl: publicUrl, extractedFacts, uploadedById: session.user.id },
  })
  return NextResponse.json({ doc })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, extractedFacts } = await req.json()
  if (!id || extractedFacts === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const doc = await prisma.schoolKnowledgeDoc.update({ where: { id }, data: { extractedFacts } })
  return NextResponse.json({ doc })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  await prisma.schoolKnowledgeDoc.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
