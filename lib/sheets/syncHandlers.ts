import { prisma } from "@/lib/db/prisma"
import { fetchSheet, cell, parseDateHe, parseBool } from "./client"

// ── יומן ארועים ────────────────────────────────────────────
// Columns: תאריך | תיאור | סוג | הערה | כל היומנים | יומן מחנך | יומן צוות שכבה | יומן תלמידים | יומן הורים
export async function syncEvents() {
  const rows = await fetchSheet("יומן ארועים")
  const data: any[] = []

  for (const row of rows.slice(1)) {
    const dateRaw = cell(row, 0)
    const description = cell(row, 1)
    if (!dateRaw || !description) continue
    const date = parseDateHe(dateRaw)
    if (!date) continue

    data.push({
      date,
      description,
      type:           cell(row, 2) || null,
      note:           cell(row, 3) || null,
      forAll:         parseBool(row[4]),
      forTeacher:     parseBool(row[5]),
      forGradeTeam:   parseBool(row[6]),
      forStudents:    parseBool(row[7]),
      forParents:     parseBool(row[8]),
    })
  }

  await prisma.$transaction(async (tx) => {
    await tx.calendarEvent.deleteMany()
    if (data.length) await tx.calendarEvent.createMany({ data })
  })
  return data.length
}

// ── לוח מבחנים ─────────────────────────────────────────────
// Columns: תאריך | תיאור | מקצוע | הערה | כל היומנים | יומן מחנך | יומן צוות שכבה | יומן תלמידים | יומן הורים
export async function syncExams() {
  const rows = await fetchSheet("לוח מבחנים")
  const data: any[] = []

  for (const row of rows.slice(1)) {
    const dateRaw = cell(row, 0)
    const description = cell(row, 1)
    if (!dateRaw || !description) continue
    const date = parseDateHe(dateRaw)
    if (!date) continue

    const subject = cell(row, 2)
    const fullDesc = subject ? `${description} — ${subject}` : description

    data.push({
      date,
      description: fullDesc,
      type:         "exam",
      note:         cell(row, 3) || null,
      forAll:       parseBool(row[4]),
      forTeacher:   parseBool(row[5]),
      forGradeTeam: parseBool(row[6]),
      forStudents:  parseBool(row[7]),
      forParents:   parseBool(row[8]),
    })
  }

  // Delete only exam-type events and re-insert
  await prisma.$transaction(async (tx) => {
    await tx.calendarEvent.deleteMany({ where: { type: "exam" } })
    if (data.length) await tx.calendarEvent.createMany({ data })
  })
  return data.length
}

// ── תלמידים - פרטים אישיים ─────────────────────────────────
// Columns: ת.ז | שם מלא | טלפון הורה | אימייל הורה | שם הורה | ...
export async function syncStudents(classId = "class-y") {
  const rows = await fetchSheet("תלמידים - פרטים אישיים")
  let count = 0

  for (const row of rows.slice(1)) {
    const idNumber = cell(row, 0)
    const name     = cell(row, 1)
    if (!idNumber || !name || !/^\d+$/.test(idNumber)) continue

    await prisma.student.upsert({
      where:  { idNumber },
      update: { name, classId },
      create: { name, idNumber, classId },
    })
    count++
  }
  return count
}

// ── מורים מקצועיים בכיתה ───────────────────────────────────
// Columns: שם מורה | מקצוע | טלפון | אימייל | הערות
export async function syncSubjectTeachers() {
  const rows = await fetchSheet("מורים מקצועיים בכיתה")
  let count = 0

  for (const row of rows.slice(1)) {
    const name     = cell(row, 0)
    const subjects = cell(row, 1)
    if (!name) continue

    await prisma.teacher.upsert({
      where:  { id: `teacher-${name}` },
      update: { subjects, mobile: cell(row, 2) || null, email: cell(row, 3) || null },
      create: {
        id:       `teacher-${name}`,
        name,
        subjects,
        mobile:   cell(row, 2) || null,
        email:    cell(row, 3) || null,
        role:     "מורה מקצועי",
      },
    })
    count++
  }
  return count
}

// ── מענים אישיים ───────────────────────────────────────────
// Columns: ת.ז תלמיד | שם תלמיד | סוג מענה | תיאור | ספק | הערות
export async function syncAccommodations() {
  const rows = await fetchSheet("מענים אישיים")
  let count = 0

  for (const row of rows.slice(1)) {
    const idNumber   = cell(row, 0)
    const studentName = cell(row, 1)
    const type       = cell(row, 2)
    const description = cell(row, 3)
    if (!idNumber || !type) continue

    // Find or create student
    let student = await prisma.student.findFirst({ where: { idNumber } })
    if (!student && studentName) {
      student = await prisma.student.create({
        data: { name: studentName, idNumber, classId: "class-y" },
      })
    }
    if (!student) continue

    const existing = await prisma.studentAccommodation.findFirst({
      where: { studentId: student.id, type },
    })
    if (existing) {
      await prisma.studentAccommodation.update({
        where: { id: existing.id },
        data:  { description, provider: cell(row, 4) || null, note: cell(row, 5) || null },
      })
    } else {
      await prisma.studentAccommodation.create({
        data: {
          studentId:   student.id,
          classId:     "class-y",
          type,
          description,
          provider:    cell(row, 4) || null,
          note:        cell(row, 5) || null,
        },
      })
    }
    count++
  }
  return count
}
