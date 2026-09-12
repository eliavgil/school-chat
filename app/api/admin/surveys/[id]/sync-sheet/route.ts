import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import Papa from "papaparse"

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

  const csvUrl = survey.responseSheetUrl.replace(/\/edit.*$/, "/export?format=csv")
  const res = await fetch(csvUrl, { redirect: "follow" })
  if (!res.ok) return NextResponse.json({ error: "לא הצלחתי לקרוא את הגיליון — ודאו שהקישור נכון ושהוא משותף (\"כל מי שיש לו את הקישור\")" }, { status: 502 })

  const text = await res.text()
  const { data, meta } = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })
  const headers = meta.fields ?? []

  const classHeader = findHeader(headers, [/כיתה/])
  const idHeader = findHeader(headers, [/ת\.?\s?ז|תעודת זהות|מספר זהות/])
  const nameHeader = findHeader(headers, [/שם מלא/, /^שם$/, /שם התלמיד/, /שם פרטי ומשפחה/])
  const timeHeader = findHeader(headers, [/חותמת זמן/, /timestamp/i])

  if (!idHeader && !nameHeader) {
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
    const nameVal = nameHeader ? row[nameHeader]?.trim() : ""

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
