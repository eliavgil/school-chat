import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import Papa from "papaparse"

// Expected CSV columns (from Mashov export):
// student_id, student_name, class, date, record_type, details

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only teachers/admins can import
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const text = await file.text()
  const { data, errors } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })

  if (errors.length > 0) {
    return NextResponse.json({ error: "CSV parse error", errors }, { status: 400 })
  }

  // Create import record
  const dataImport = await prisma.dataImport.create({
    data: { filename: file.name, recordCount: data.length },
  })

  let inserted = 0
  const skipped: string[] = []

  for (const row of data) {
    const studentId = row["student_id"]?.trim()
    const dateStr = row["date"]?.trim()
    const recordType = normalizeRecordType(row["record_type"]?.trim())
    const details = row["details"]?.trim()

    if (!studentId || !dateStr || !details) {
      skipped.push(`שורה חסרה: ${JSON.stringify(row)}`)
      continue
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) {
      skipped.push(`תלמיד לא נמצא: ${studentId}`)
      continue
    }

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      skipped.push(`תאריך לא תקין: ${dateStr}`)
      continue
    }

    await prisma.studentRecord.create({
      data: { studentId, date, recordType, details, importId: dataImport.id },
    })
    inserted++
  }

  return NextResponse.json({
    success: true,
    imported: inserted,
    skipped: skipped.length,
    skippedDetails: skipped,
    importId: dataImport.id,
  })
}

function normalizeRecordType(type: string | undefined) {
  const t = (type ?? "").toLowerCase()
  if (t.includes("נוכחות") || t.includes("attendance")) return "ATTENDANCE" as const
  if (t.includes("ציון") || t.includes("grade")) return "GRADE" as const
  if (t.includes("מערכת") || t.includes("schedule")) return "SCHEDULE" as const
  return "OTHER" as const
}
