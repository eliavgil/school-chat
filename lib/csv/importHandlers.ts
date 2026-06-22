import { SheetData, cellStr } from "./readExcel"
import { parseGradeCell, calcWeightedAverage, parseSubjectHeader } from "./parseGrades"
import { prisma } from "@/lib/db/prisma"

// ── אלפון מורים ────────────────────────────────────────────
export async function importTeachers(sheets: SheetData[]) {
  const rows = sheets[0]?.rows ?? []
  let imported = 0

  for (const row of rows) {
    const name = cellStr(row[1])
    if (!name || name === "שם מורה") continue // skip header

    await prisma.teacher.upsert({
      where: { id: `teacher-${name}` },
      update: {
        phone: cellStr(row[2]) || null,
        mobile: cellStr(row[3]) || null,
        city: cellStr(row[4]) || null,
        email: cellStr(row[6]) || null,
        subjects: cellStr(row[7]) || null,
        role: cellStr(row[8]) || null,
      },
      create: {
        id: `teacher-${name}`,
        name,
        phone: cellStr(row[2]) || null,
        mobile: cellStr(row[3]) || null,
        city: cellStr(row[4]) || null,
        email: cellStr(row[6]) || null,
        subjects: cellStr(row[7]) || null,
        role: cellStr(row[8]) || null,
      },
    })
    imported++
  }
  return imported
}

// ── ציונים שוטפים ──────────────────────────────────────────
export async function importGrades(sheets: SheetData[], classId: string) {
  const rows = sheets[0]?.rows ?? []
  if (rows.length < 3) return 0

  // Find the header row — the one that contains "ת.ז" in column 1
  const headerRowIdx = rows.findIndex((r) => cellStr(r[1]).includes("ת.ז"))
  if (headerRowIdx === -1) return 0

  const headerRow = rows[headerRowIdx] as (string | null)[]
  const subjectColumns: { col: number; subject: string; teacherName: string }[] = []

  for (let col = 5; col < headerRow.length; col++) {
    const header = cellStr(headerRow[col])
    if (!header) continue
    const { subject, teacherName } = parseSubjectHeader(header)
    if (subject) subjectColumns.push({ col, subject, teacherName })
  }

  // Parse all student rows first
  type GradeRow = { idNumber: string; name: string; grades: { subject: string; teacherName: string; components: any[]; weightedAverage: number | null }[] }
  const studentRows: GradeRow[] = []

  for (const row of rows.slice(headerRowIdx + 1)) {
    const idNumber = cellStr(row[1])
    const name = cellStr(row[2])
    if (!idNumber || !name || !/^\d+$/.test(idNumber)) continue

    const grades = []
    for (const { col, subject, teacherName } of subjectColumns) {
      const raw = cellStr(row[col])
      if (!raw) continue
      const components = parseGradeCell(raw)
      if (components.length === 0) continue
      grades.push({ subject, teacherName, components, weightedAverage: calcWeightedAverage(components) })
    }
    if (grades.length > 0) studentRows.push({ idNumber, name, grades })
  }

  if (studentRows.length === 0) return 0

  // Upsert all students in one transaction
  const existingStudents = await prisma.student.findMany({
    where: { idNumber: { in: studentRows.map((r) => r.idNumber) } },
  })
  const existingMap = new Map(existingStudents.map((s) => [s.idNumber!, s.id]))

  await prisma.$transaction(
    studentRows
      .filter((r) => !existingMap.has(r.idNumber))
      .map((r) =>
        prisma.student.create({ data: { name: r.name, idNumber: r.idNumber, classId } })
      )
  )

  // Refresh map
  const allStudents = await prisma.student.findMany({
    where: { idNumber: { in: studentRows.map((r) => r.idNumber) } },
  })
  const studentMap = new Map(allStudents.map((s) => [s.idNumber!, s.id]))

  // Delete existing grades for these students and re-insert in bulk
  const studentIds = allStudents.map((s) => s.id)
  await prisma.studentGrade.deleteMany({ where: { studentId: { in: studentIds } } })

  const gradeRecords = studentRows.flatMap((r) => {
    const studentId = studentMap.get(r.idNumber)
    if (!studentId) return []
    return r.grades.map((g) => ({
      studentId,
      subject: g.subject,
      teacherName: g.teacherName,
      gradeComponents: g.components as any,
      weightedAverage: g.weightedAverage,
    }))
  })

  await prisma.studentGrade.createMany({ data: gradeRecords })
  return gradeRecords.length
}

// ── מונה התנהגות ────────────────────────────────────────────
export async function importAttendance(sheets: SheetData[], classId: string) {
  const rows = sheets[0]?.rows ?? []
  let imported = 0

  for (const row of rows) {
    const idNumber = cellStr(row[1])
    const name = cellStr(row[2])
    if (!idNumber || !name || idNumber === "ת.ז. התלמיד") continue

    let student = await prisma.student.findFirst({ where: { idNumber } })
    if (!student) {
      student = await prisma.student.create({ data: { name, idNumber, classId } })
    }

    const totalLessons = parseInt(cellStr(row[5])) || 0
    const absences = parseInt(cellStr(row[6])) || 0
    const justifiedAbsences = parseInt(cellStr(row[7])) || 0
    const tardiness = parseInt(cellStr(row[8])) || 0
    const justifiedTardiness = parseInt(cellStr(row[9])) || 0

    await prisma.studentAttendance.upsert({
      where: { studentId: student.id },
      update: { totalLessons, absences, justifiedAbsences, tardiness, justifiedTardiness, updatedAt: new Date() },
      create: { studentId: student.id, totalLessons, absences, justifiedAbsences, tardiness, justifiedTardiness },
    })
    imported++
  }
  return imported
}

// ── מערכת כיתתית ────────────────────────────────────────────
export async function importSchedule(sheets: SheetData[], classId: string) {
  const rows = sheets[0]?.rows ?? []
  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"]

  // Delete existing schedule for this class
  await prisma.scheduleSlot.deleteMany({ where: { classId } })

  let imported = 0

  for (const row of rows) {
    const period = cellStr(row[0])
    if (!period || period === "שעה" || period.includes("מערכת")) continue

    for (let d = 0; d < days.length; d++) {
      const content = cellStr(row[d + 1])
      if (!content) continue

      await prisma.scheduleSlot.create({
        data: { classId, dayHeb: days[d], period, content },
      })
      imported++
    }
  }
  return imported
}

// ── לוח מבחנים / לוח פעילויות (CSV rows) ─────────────────
export async function importCalendarRows(
  rows: string[][],
  sourceFile: string,
  gradeFilter?: string // e.g. "שכבה י" — only import rows relevant to this grade
) {
  // Delete existing events from this source
  await prisma.calendarEvent.deleteMany({ where: { sourceFile } })

  let imported = 0
  let currentMonth = ""

  for (const row of rows) {
    if (cellStr(row[1])) currentMonth = cellStr(row[1])
    const day = cellStr(row[2])
    const dayOfWeek = cellStr(row[3])
    if (!day || !currentMonth) continue

    const dayNum = parseInt(day)
    if (isNaN(dayNum)) continue

    // Build approximate date (use current year as base)
    const monthMap: Record<string, number> = {
      "ספטמבר": 9, "אוקטובר": 10, "נובמבר": 11, "דצמבר": 12,
      "ינואר": 1, "פברואר": 2, "מרס": 3, "אפריל": 4,
      "מאי": 5, "יוני": 6, "יולי": 7, "אוגוסט": 8,
    }
    const monthNum = monthMap[currentMonth]
    if (!monthNum) continue

    const year = monthNum >= 9 ? 2025 : 2026
    const date = new Date(year, monthNum - 1, dayNum)

    // Columns: col1=month, col2=day, col3=dayOfWeek, col4=שכבה י, col5=שכבה יא, col6=שכבה יב
    const gradeColumns: { grade: string; colIdx: number }[] = [
      { grade: "שכבה י", colIdx: 4 },
      { grade: "שכבה יא", colIdx: 5 },
      { grade: "שכבה יב", colIdx: 6 },
    ]

    for (const { grade, colIdx } of gradeColumns) {
      const description = cellStr(row[colIdx])
      if (!description) continue
      if (gradeFilter && grade !== gradeFilter && grade !== "כללי") continue

      await prisma.calendarEvent.create({
        data: { date, month: currentMonth, dayOfWeek, grade, description, sourceFile },
      })
      imported++
    }
  }
  return imported
}
