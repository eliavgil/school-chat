import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { adminClient } from "@/lib/lessons/supabase"
import { fetchSheetValues, listSheetTabs, getSheetsClient, getServiceAccountEmail } from "@/lib/sheets/client"
import Anthropic from "@anthropic-ai/sdk"
import * as XLSX from "xlsx"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const BUCKET = "school-knowledge-docs"
const MAX_BYTES = 15 * 1024 * 1024 // 15 MB — Claude's own document/image limit

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const TEXT_TYPES = ["text/plain", "text/markdown", "text/csv"]
const EXCEL_TYPES = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

function isTeacherRole(role: string) {
  return role === "TEACHER" || role === "ADMIN"
}

const EXTRACTION_PROMPT = `אתה עוזר שמכין מאגר עובדות עבור בוט לוגיסטי לתלמידים והורים בבית ספר תיכון.
קרא את החומר המצורף וחלץ ממנו כל עובדה קונקרטית ושימושית שיכולה לענות על שאלה לוגיסטית — תאריכים, מיקומים, טפסים, נהלים, אנשי קשר, קישורים, מגמות ותנאים.
התעלם מרעש (כותרות עמוד, עיצוב, חתימות, שורות/עמודות ריקות). אל תוסיף פרשנות או מידע שלא מופיע בחומר.
כתוב את התשובה כרשימת נקודות תמציתית בעברית, מוכנה להזרקה ישירה למאגר ידע של בוט.
אם אין בחומר שום עובדה שימושית, כתוב "לא נמצא מידע רלוונטי" בלבד.`

async function extractFacts(contentBlock: Anthropic.Messages.ContentBlockParam): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: [contentBlock, { type: "text", text: EXTRACTION_PROMPT }] }],
  })
  const textBlock = msg.content.find((b): b is Anthropic.TextBlock => b.type === "text")
  return textBlock?.text?.trim() || "לא נמצא מידע רלוונטי"
}

// Every sheet tab, dumped as CSV-ish text — small enough for a school's
// spreadsheets that this needs no smarter chunking.
function workbookToText(wb: XLSX.WorkBook): string {
  return wb.SheetNames.map(name => `## ${name}\n${XLSX.utils.sheet_to_csv(wb.Sheets[name])}`).join("\n\n")
}

function extractSpreadsheetId(url: string): string | null {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return m ? m[1] : (/^[a-zA-Z0-9-_]{20,}$/.test(url.trim()) ? url.trim() : null)
}

// Rough HTML → text: drop script/style entirely, strip remaining tags,
// unescape the handful of entities that actually show up in body copy.
// Good enough for a static published page (e.g. a Canva site) — no need
// for a full DOM parser dependency for this.
function stripHtml(html: string): string {
  const withoutJunk = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
  const text = withoutJunk
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  return text.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim()
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return m ? m[1].trim() : null
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const docs = await prisma.schoolKnowledgeDoc.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json({ docs, serviceAccountEmail: getServiceAccountEmail() })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const contentType = req.headers.get("content-type") || ""

  // ── Google Sheets link, instead of an uploaded file ──────
  if (contentType.includes("application/json")) {
    const body = await req.json()

    // ── A regular webpage link (e.g. a published Canva site) ──
    if (body.pageUrl) {
      const pageUrl = String(body.pageUrl).trim()
      if (!/^https?:\/\//i.test(pageUrl)) return NextResponse.json({ error: "כתובת לא תקינה — צריכה להתחיל ב-http(s)://" }, { status: 400 })

      let res: Response
      try {
        res = await fetch(pageUrl, { headers: { "User-Agent": "Mozilla/5.0 (compatible; SchoolAssistantBot/1.0)" } })
      } catch (e: any) {
        return NextResponse.json({ error: `לא הצלחתי לגשת לכתובת: ${e?.message ?? "unknown"}` }, { status: 502 })
      }
      if (!res.ok) return NextResponse.json({ error: `הדף החזיר שגיאה (${res.status})` }, { status: 502 })

      const pageContentType = res.headers.get("content-type") || ""
      let contentBlock: Anthropic.Messages.ContentBlockParam
      let title = pageUrl
      if (pageContentType.includes("application/pdf")) {
        const buffer = Buffer.from(await res.arrayBuffer())
        if (buffer.length > MAX_BYTES) return NextResponse.json({ error: "הקובץ בכתובת גדול מדי (מקסימום 15MB)" }, { status: 413 })
        contentBlock = { type: "document", source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") } }
      } else {
        const html = await res.text()
        title = extractTitle(html) || title
        const text = stripHtml(html)
        if (!text) return NextResponse.json({ error: "לא הצלחתי לחלץ טקסט מהדף — ייתכן שהוא נטען כולו ב-JavaScript" }, { status: 422 })
        contentBlock = { type: "text", text }
      }

      let extractedFacts: string
      try {
        extractedFacts = await extractFacts(contentBlock)
      } catch (e: any) {
        return NextResponse.json({ error: `שגיאה בעיבוד: ${e?.message ?? "unknown"}` }, { status: 502 })
      }

      const doc = await prisma.schoolKnowledgeDoc.create({
        data: { filename: title, fileUrl: pageUrl, extractedFacts, uploadedById: session.user.id },
      })
      return NextResponse.json({ doc })
    }

    const { sheetUrl } = body
    const spreadsheetId = extractSpreadsheetId((sheetUrl || "").trim())
    if (!spreadsheetId) return NextResponse.json({ error: "לא זיהיתי קישור/מזהה תקין לגיליון" }, { status: 400 })

    let title = spreadsheetId
    let text: string
    try {
      const sheets = getSheetsClient()
      const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: "properties.title" })
      title = meta.data.properties?.title || title
      const tabs = await listSheetTabs(spreadsheetId)
      const parts = await Promise.all(tabs.map(async t => {
        const values = await fetchSheetValues(spreadsheetId, t.title)
        return `## ${t.title}\n${values.map(row => row.join(",")).join("\n")}`
      }))
      text = parts.join("\n\n")
    } catch (e: any) {
      const email = getServiceAccountEmail()
      if (e?.code === 403 || e?.code === 404) {
        return NextResponse.json({
          error: email
            ? `אין גישה לגיליון — יש לשתף אותו עם ${email} (כמו כל גיליון שהאפליקציה קוראת)`
            : "אין גישה לגיליון — צריך לשתף אותו עם חשבון השירות של האפליקציה",
        }, { status: 403 })
      }
      return NextResponse.json({ error: `שגיאה בקריאת הגיליון: ${e?.message ?? "unknown"}` }, { status: 502 })
    }

    let extractedFacts: string
    try {
      extractedFacts = await extractFacts({ type: "text", text })
    } catch (e: any) {
      return NextResponse.json({ error: `שגיאה בעיבוד: ${e?.message ?? "unknown"}` }, { status: 502 })
    }

    const doc = await prisma.schoolKnowledgeDoc.create({
      data: { filename: title, fileUrl: sheetUrl, extractedFacts, uploadedById: session.user.id },
    })
    return NextResponse.json({ doc })
  }

  // ── Uploaded file ─────────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file")
  if (!(file instanceof Blob)) return NextResponse.json({ error: "No file provided" }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "הקובץ גדול מדי (מקסימום 15MB)" }, { status: 413 })

  const rawFilename = formData.get("filename") as string | null
  const filename = rawFilename ? decodeURIComponent(rawFilename) : "קובץ"
  const mimeType = file.type
  const buffer = Buffer.from(await file.arrayBuffer())

  let contentBlock: Anthropic.Messages.ContentBlockParam
  if (mimeType === "application/pdf") {
    contentBlock = { type: "document", source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") } }
  } else if (IMAGE_TYPES.includes(mimeType)) {
    contentBlock = { type: "image", source: { type: "base64", media_type: mimeType as any, data: buffer.toString("base64") } }
  } else if (EXCEL_TYPES.includes(mimeType) || /\.(xlsx|xls)$/i.test(filename)) {
    try {
      const wb = XLSX.read(buffer, { type: "buffer" })
      contentBlock = { type: "text", text: workbookToText(wb) }
    } catch {
      return NextResponse.json({ error: "לא הצלחתי לקרוא את קובץ האקסל — ודא שהוא לא פגום" }, { status: 400 })
    }
  } else if (TEXT_TYPES.includes(mimeType) || /\.(txt|md|csv)$/i.test(filename)) {
    contentBlock = { type: "text", text: buffer.toString("utf-8") }
  } else {
    return NextResponse.json({
      error: "סוג קובץ לא נתמך כרגע — אפשר PDF, אקסל (xlsx/xls), תמונה (jpg/png), או טקסט (txt/md/csv). קבצי Word — המר קודם ל-PDF.",
    }, { status: 415 })
  }

  let extractedFacts: string
  try {
    extractedFacts = await extractFacts(contentBlock)
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
