import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { fetchSheetValues, listSheetTabs, getServiceAccountEmail } from "@/lib/sheets/client"

function isTeacher(session: any) {
  return session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"
}

// Loose match for how a class name gets typed into a form's free-text
// answer — "י4", "י'4", "י 4", "י-4" all collapse to the same key.
function normClass(s: string): string {
  return s.normalize("NFKC").replace(/["'׳״\-\s]/g, "").trim()
}

// Response-sheet names and our own Student.name aren't necessarily in the
// same word order (e.g. "כהן אלמוג" vs "אלמוג כהן"), so compare as a
// sorted bag of words rather than an exact string.
function nameKey(s: string): string {
  return s.normalize("NFKC").trim().split(/\s+/).filter(Boolean).sort().join(" ")
}

function findHeader(headers: string[], patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const hit = headers.find(h => p.test(h))
    if (hit) return hit
  }
  return null
}

// POST — pull real submissions from the Google Sheet the survey's Form
// writes to, and mark the matching students' completion as verified.
// Never un-marks a completion that's already there (a failed match here —
// wrong class column, a name typo — must never look like "didn't answer"
// for someone who actually did, whether that came from self-report or an
// earlier sync).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !isTeacher(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const survey = await prisma.survey.findUnique({
    where: { id },
    select: { id: true, classId: true, responseSheetUrl: true },
  })
  if (!survey) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!survey.responseSheetUrl) return NextResponse.json({ error: "אין קישור לגיליון תשובות" }, { status: 400 })

  let targetClassKey: string | null = null
  if (survey.classId) {
    const cls = await prisma.class.findUnique({ where: { id: survey.classId }, select: { displayName: true, name: true } })
    if (cls) targetClassKey = normClass(cls.displayName || cls.name)
  }

  const students = await prisma.student.findMany({
    where: survey.classId ? { classId: survey.classId } : {},
    select: { id: true, name: true, idNumber: true },
  })
  const byIdNumber = new Map(students.filter(s => s.idNumber).map(s => [s.idNumber as string, s]))
  const byNameKey = new Map(students.map(s => [nameKey(s.name), s]))

  // Reads via the app's own Google service account (same one other sheet
  // syncs use), not a public CSV-export fetch — so a teacher can restrict
  // the sheet to just that one account instead of "anyone with the link".
  const idMatch = survey.responseSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
  const spreadsheetId = idMatch?.[1]
  if (!spreadsheetId) return NextResponse.json({ error: "קישור לא תקין לגיליון" }, { status: 400 })

  let rows2D: string[][]
  try {
    const tabs = await listSheetTabs(spreadsheetId)
    const firstTab = tabs[0]?.title
    if (!firstTab) return NextResponse.json({ error: "לא נמצא טאב בגיליון" }, { status: 400 })
    rows2D = await fetchSheetValues(spreadsheetId, firstTab)
  } catch (e: any) {
    const email = getServiceAccountEmail()
    const hint = email ? ` — שתפו את הגיליון עם ${email} (או הפכו אותו לנגיש לכל מי שיש לו את הקישור)` : ""
    return NextResponse.json({ error: `לא הצלחתי לקרוא את הגיליון${hint}` }, { status: 502 })
  }

  const [headerRow, ...dataRows] = rows2D
  if (!headerRow) return NextResponse.json({ error: "הגיליון ריק" }, { status: 400 })
  const headers = headerRow.map(h => (h ?? "").trim())
  const data: Record<string, string>[] = dataRows.map(r => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = (r[i] ?? "").trim() })
    return obj
  })

  const classHeader = findHeader(headers, [/כיתה/])
  const idHeader = findHeader(headers, [/ת\.?\s?ז|תעודת זהות|מספר זהות/])
  // A separate first/last-name pair (e.g. "1. שם משפחה" + "שם פרטי") is at
  // least as common as one combined "שם מלא" column — check for the split
  // form first and only fall back to a single-column name.
  const lastNameHeader = findHeader(headers, [/שם משפחה/])
  const firstNameHeader = findHeader(headers, [/שם פרטי/])
  const fullNameHeader = (!lastNameHeader || !firstNameHeader)
    ? findHeader(headers, [/שם מלא/, /^שם$/, /שם התלמיד/])
    : null
  const timeHeader = findHeader(headers, [/חותמת זמן/, /timestamp/i])

  if (!idHeader && !fullNameHeader && !(lastNameHeader && firstNameHeader)) {
    return NextResponse.json({ error: "לא מצאתי בגיליון עמודת שם או ת.ז. של התלמיד — אי אפשר להצליב תשובות מול רשימת התלמידים" }, { status: 400 })
  }

  let matched = 0
  const unmatched: string[] = []

  for (const row of data) {
    if (targetClassKey && classHeader) {
      const rowClass = row[classHeader]
      if (!rowClass || normClass(rowClass) !== targetClassKey) continue
    }

    const idVal = idHeader ? row[idHeader]?.trim() : ""
    const nameVal = (lastNameHeader && firstNameHeader)
      ? `${row[lastNameHeader]?.trim() ?? ""} ${row[firstNameHeader]?.trim() ?? ""}`.trim()
      : fullNameHeader ? (row[fullNameHeader]?.trim() ?? "") : ""

    const student = (idVal && byIdNumber.get(idVal))
      ?? (nameVal && byNameKey.get(nameKey(nameVal)))
      ?? null

    if (!student) {
      const label = nameVal || idVal
      if (label) unmatched.push(label)
      continue
    }

    const completedAt = timeHeader ? new Date(row[timeHeader]) : new Date()
    await prisma.surveyCompletion.upsert({
      where: { surveyId_studentId: { surveyId: id, studentId: student.id } },
      create: { surveyId: id, studentId: student.id, verified: true, completedAt: isNaN(+completedAt) ? new Date() : completedAt },
      update: { verified: true },
    })
    matched++
  }

  await prisma.survey.update({ where: { id }, data: { lastSyncedAt: new Date() } })

  return NextResponse.json({ ok: true, matched, totalRows: data.length, unmatched })
}
