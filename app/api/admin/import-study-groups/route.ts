import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { colIndex, cellStr } from "@/lib/importHelpers"
import { extractSpreadsheetId, listSheetTabs, fetchSheetValues, getServiceAccountEmail } from "@/lib/sheets/client"
import * as XLSX from "xlsx"

// One-off (re-runnable) import of the school's "קבוצות לימוד" export — a
// wide matrix: one row per student, one column per subject-group ("אזרחות
// י1 גיל אליאב [259]"), an "X" marking which groups that student is
// actually enrolled in. For each student, collects only *their own*
// matched group names (subject + class range + teacher, bracket id
// stripped) into Student.studyGroups — never another student's, same
// principle as the אלפון import. Also back-fills track (מגמה) and, where
// unambiguous, math/English units straight from the group names
// themselves (e.g. "מתמטיקה 4 יח\"ל").

function isTeacherRole(role: string) {
  return role === "TEACHER" || role === "ADMIN"
}

const BRACKET_ID = /\s*\[\d+\]\s*$/

function parseUnambiguousUnits(groupHeader: string): { math?: number; english?: number } {
  const math = groupHeader.match(/^מתמטיקה\s+(\d)\s+יח/)
  if (math) return { math: Number(math[1]) }
  const eng = groupHeader.match(/^אנגלית\s+(\d)\s+יח/)
  if (eng) return { english: Number(eng[1]) }
  return {}
}

async function runImport(rows: unknown[][]) {
  const headerRowIdx = rows.findIndex(r => r.some(c => cellStr(c) === "שם התלמיד"))
  if (headerRowIdx === -1) throw new Error("לא מצאתי את עמודת 'שם התלמיד' בקובץ — ודא שזה קובץ קבוצות לימוד תקין")

  const header = rows[headerRowIdx].map(cellStr)
  const col = {
    idNumber: colIndex(header, "ת.ז"),
    name: colIndex(header, "שם התלמיד"),
    grade: colIndex(header, "שכבה"),
    parallel: colIndex(header, "כיתה") !== -1 ? colIndex(header, "כיתה") : colIndex(header, "מקבילה"),
    track: colIndex(header, "מגמה"),
    groupsCountIdx: colIndex(header, "מס קבוצות"),
  }
  if (col.name === -1) throw new Error("לא מצאתי עמודת שם תלמיד")
  if (col.groupsCountIdx === -1) throw new Error("לא מצאתי את עמודת 'מס קבוצות' — לא מצליח לזהות איפה מתחילות עמודות הקבוצות")

  const groupStart = col.groupsCountIdx + 1
  const groupHeaders = header.slice(groupStart).map(h => h.replace(BRACKET_ID, "").trim())

  const dataRows = rows.slice(headerRowIdx + 1).filter(r => cellStr(r[col.idNumber]))

  const updated: string[] = []
  const notFound: string[] = []
  const ambiguous: string[] = []
  const errors: string[] = []

  for (const row of dataRows) {
    const name = cellStr(row[col.name])
    if (!name) continue

    const idNumberRaw = col.idNumber !== -1 ? cellStr(row[col.idNumber]) : ""
    const idNumber = idNumberRaw ? idNumberRaw.replace(/\.0$/, "") : null
    const track = col.track !== -1 ? cellStr(row[col.track]) : ""
    const parallel = col.parallel !== -1 ? cellStr(row[col.parallel]).replace(/\.0$/, "") : ""
    const grade = col.grade !== -1 ? cellStr(row[col.grade]) : ""
    const expectedClassName = grade && parallel ? `${grade}${parallel}` : null

    const myGroups: string[] = []
    let mathUnits: number | undefined
    let englishUnits: number | undefined
    for (let i = 0; i < groupHeaders.length; i++) {
      if (cellStr(row[groupStart + i]) !== "X") continue
      const gh = groupHeaders[i]
      myGroups.push(gh)
      const units = parseUnambiguousUnits(gh)
      if (units.math) mathUnits = units.math
      if (units.english) englishUnits = units.english
    }

    let studentId: string | null = null
    if (idNumber) {
      const byId = await prisma.student.findUnique({ where: { idNumber }, select: { id: true } })
      if (byId) studentId = byId.id
    }
    if (!studentId) {
      const candidates = await prisma.student.findMany({
        where: { name },
        select: { id: true, class: { select: { displayName: true, name: true } } },
      })
      if (candidates.length === 1) {
        studentId = candidates[0].id
      } else if (candidates.length > 1) {
        const inClass = expectedClassName
          ? candidates.filter(c => c.class.displayName === expectedClassName || c.class.name === expectedClassName)
          : []
        if (inClass.length === 1) studentId = inClass[0].id
        else { ambiguous.push(name); continue }
      }
    }
    if (!studentId) { notFound.push(name); continue }

    try {
      // Only overwrite studyGroups when this file actually matched at
      // least one group for the student — a narrower/reduced export
      // (fewer subject-group columns) must not wipe out fuller data a
      // previous import already wrote for groups it doesn't cover.
      await prisma.student.update({
        where: { id: studentId },
        data: {
          ...(idNumber && { idNumber }),
          ...(track && { track }),
          ...(mathUnits && { mathUnits }),
          ...(englishUnits && { englishUnits }),
          ...(myGroups.length > 0 && { studyGroups: myGroups.join("\n") }),
        },
      })
      updated.push(name)
    } catch {
      errors.push(name)
    }
  }

  return { updated: updated.length, notFound, ambiguous, errors, total: dataRows.length }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !isTeacherRole(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const contentType = req.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    const { sheetUrl } = await req.json()
    const spreadsheetId = extractSpreadsheetId((sheetUrl || "").trim())
    if (!spreadsheetId) return NextResponse.json({ error: "לא זיהיתי קישור/מזהה תקין לגיליון" }, { status: 400 })

    let rows: unknown[][]
    try {
      const tabs = await listSheetTabs(spreadsheetId)
      let found: unknown[][] | null = null
      for (const t of tabs) {
        const values = await fetchSheetValues(spreadsheetId, t.title)
        if (values.some(r => r.some(c => cellStr(c) === "שם התלמיד"))) { found = values; break }
      }
      if (!found) return NextResponse.json({ error: "לא מצאתי לשונית עם עמודת 'שם התלמיד' בגיליון" }, { status: 400 })
      rows = found
    } catch (e: any) {
      const email = getServiceAccountEmail()
      if (e?.code === 403 || e?.code === 404) {
        return NextResponse.json({
          error: email
            ? `אין גישה לגיליון — יש לשתף אותו עם ${email}`
            : "אין גישה לגיליון — צריך לשתף אותו עם חשבון השירות של האפליקציה",
        }, { status: 403 })
      }
      return NextResponse.json({ error: `שגיאה בקריאת הגיליון: ${e?.message ?? "unknown"}` }, { status: 502 })
    }

    try {
      const result = await runImport(rows)
      return NextResponse.json(result)
    } catch (e: any) {
      return NextResponse.json({ error: e?.message ?? "שגיאה" }, { status: 400 })
    }
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }
  const file = formData.get("file")
  if (!(file instanceof Blob)) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  let rows: unknown[][]
  try {
    const wb = XLSX.read(buffer, { type: "buffer" })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][]
  } catch {
    return NextResponse.json({ error: "לא הצלחתי לקרוא את הקובץ — ודא שהוא xlsx תקין" }, { status: 400 })
  }

  try {
    const result = await runImport(rows)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "שגיאה" }, { status: 400 })
  }
}
