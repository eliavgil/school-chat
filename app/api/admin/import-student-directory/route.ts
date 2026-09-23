import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import * as XLSX from "xlsx"

// One-off (re-runnable) import of the school's "אלפון" (student directory)
// export into a deliberately narrow set of Student fields — see the
// comment on those fields in schema.prisma for why only this subset.
// Matches by idNumber first (so re-running after the first import is
// reliable), falling back to name — disambiguated by the class derived
// from שכבה+מקבילה when a name collides across more than one student.
// Nothing here is exposed to the assistant bot beyond what
// resolveStudentContext() in /api/assistant/chat already selects.

function isTeacherRole(role: string) {
  return role === "TEACHER" || role === "ADMIN"
}

function colIndex(header: string[], label: string): number {
  return header.findIndex(h => (h ?? "").toString().trim() === label)
}

function cellStr(v: unknown): string {
  if (v === null || v === undefined) return ""
  return String(v).trim()
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

  const buffer = Buffer.from(await file.arrayBuffer())
  let rows: unknown[][]
  try {
    const wb = XLSX.read(buffer, { type: "buffer" })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][]
  } catch {
    return NextResponse.json({ error: "לא הצלחתי לקרוא את הקובץ — ודא שהוא xlsx תקין" }, { status: 400 })
  }

  const headerRowIdx = rows.findIndex(r => r.some(c => cellStr(c) === "שם התלמיד"))
  if (headerRowIdx === -1) return NextResponse.json({ error: "לא מצאתי את עמודת 'שם התלמיד' בקובץ — ודא שזה קובץ אלפון תקין" }, { status: 400 })

  const header = rows[headerRowIdx].map(cellStr)
  const col = {
    idNumber: colIndex(header, "ת.ז"),
    name: colIndex(header, "שם התלמיד"),
    grade: colIndex(header, "שכבה"),
    parallel: colIndex(header, "מקבילה"),
    track: colIndex(header, "מגמה"),
    city: colIndex(header, "ישוב 1"),
    parent1: colIndex(header, "שם הורה 1"),
    parent2: colIndex(header, "שם הורה 2"),
    gender: colIndex(header, "מין"),
  }
  if (col.name === -1) return NextResponse.json({ error: "לא מצאתי עמודת שם תלמיד" }, { status: 400 })

  const dataRows = rows.slice(headerRowIdx + 1).filter(r => r.some(c => cellStr(c)))

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
    const city = col.city !== -1 ? cellStr(row[col.city]) : ""
    const parent1Name = col.parent1 !== -1 ? cellStr(row[col.parent1]) : ""
    const parent2Name = col.parent2 !== -1 ? cellStr(row[col.parent2]) : ""
    const gender = col.gender !== -1 ? cellStr(row[col.gender]) : ""
    const parallel = col.parallel !== -1 ? cellStr(row[col.parallel]).replace(/\.0$/, "") : ""
    const grade = col.grade !== -1 ? cellStr(row[col.grade]) : ""
    const expectedClassName = grade && parallel ? `${grade}${parallel}` : null

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
      await prisma.student.update({
        where: { id: studentId },
        data: {
          ...(idNumber && { idNumber }),
          ...(track && { track }),
          ...(city && { city }),
          ...(parent1Name && { parent1Name }),
          ...(parent2Name && { parent2Name }),
          ...(gender && { gender }),
        },
      })
      updated.push(name)
    } catch {
      // Most likely a duplicate ת.ז across rows colliding with the unique
      // constraint — report it instead of aborting the rest of the batch.
      errors.push(name)
    }
  }

  return NextResponse.json({ updated: updated.length, notFound, ambiguous, errors, total: dataRows.length })
}
