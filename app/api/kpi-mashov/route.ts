import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

function pct(n: number, total: number) {
  if (!total) return ""
  return `${Math.round((n / total) * 100)}%`
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { classId: true, role: true },
  })
  if (!user?.classId || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "No class" }, { status: 403 })
  }

  const classId = user.classId
  const totalStudents = await prisma.student.count({ where: { classId } })

  // ── Grades ────────────────────────────────────────────────────────────
  const grades = await prisma.studentGrade.findMany({
    where: { student: { classId } },
    include: { student: { select: { name: true } } },
  })

  // Per-student: average across all subjects
  const byStudent = new Map<string, { name: string; avgs: number[] }>()
  for (const g of grades) {
    if (!byStudent.has(g.studentId))
      byStudent.set(g.studentId, { name: g.student.name, avgs: [] })
    if (g.weightedAverage !== null)
      byStudent.get(g.studentId)!.avgs.push(g.weightedAverage)
  }

  const studentAvgs = [...byStudent.values()]
    .filter(s => s.avgs.length > 0)
    .map(s => ({ name: s.name, avg: s.avgs.reduce((a, b) => a + b, 0) / s.avgs.length }))

  const classAvg = studentAvgs.length
    ? studentAvgs.reduce((s, x) => s + x.avg, 0) / studentAvgs.length
    : null

  const failingStudents = studentAvgs.filter(s => s.avg < 55)

  // ── Attendance & tardiness (StudentAttendance) ────────────────────────
  const attendance = await prisma.studentAttendance.findMany({
    where: { student: { classId } },
    include: { student: { select: { name: true } } },
  })
  const tardinessFromAttendance = attendance
    .filter(a => a.tardiness > 0)
    .map(a => ({ name: a.student.name, count: a.tardiness }))

  // ── Behavior (TeacherRecord voice dictation) ──────────────────────────
  const [disruptionRecords, tardinessRecords] = await Promise.all([
    prisma.teacherRecord.findMany({
      where: { classId, category: "הפרעה" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teacherRecord.findMany({
      where: { classId, category: "איחור" },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // Tardiness: prefer StudentAttendance if available, else TeacherRecords
  const tardinessStudentNames =
    tardinessFromAttendance.length > 0
      ? tardinessFromAttendance.map(a => a.name)
      : [...new Set(tardinessRecords.map(r => r.studentName))]

  const disruptionStudentNames = [...new Set(disruptionRecords.map(r => r.studentName))]

  // ── Build domain ──────────────────────────────────────────────────────
  return NextResponse.json({
    name: "הישגים לימודיים",
    desc: 'נתונים מתעדכנים מהמשו"ב',
    tags: [],
    metrics: [
      {
        name: "ממוצע ציונים",
        mainValue: classAvg !== null ? `${Math.round(classAvg)}%` : "",
        target: ">80",
        period: "שוטף",
        graphInstr: "ממוצע ציונים בכל המקצועות",
        fillInstr: "",
        categories: ["ממוצע"],
        results: studentAvgs
          .sort((a, b) => a.avg - b.avg)
          .map(s => ({ label: s.name, values: [String(Math.round(s.avg))] })),
      },
      {
        name: "אחוז נכשלים",
        mainValue: pct(failingStudents.length, totalStudents),
        target: "<7%",
        period: "שוטף",
        graphInstr: "אחוז התלמידים עם ציון נכשל לפחות במקצוע אחד",
        fillInstr: "",
        categories: ["ממוצע"],
        results: failingStudents
          .sort((a, b) => a.avg - b.avg)
          .map(s => ({ label: s.name, values: [String(Math.round(s.avg))] })),
      },
      {
        name: "זכאות לבגרות",
        mainValue: "",
        target: ">90%",
        period: "שנתי",
        graphInstr: "אחוז התלמידים הזכאים לתעודת בגרות",
        fillInstr: "",
        categories: [],
        results: [],
      },
      {
        name: "איחורים",
        mainValue: pct(tardinessStudentNames.length, totalStudents),
        target: "<5%",
        period: "שוטף",
        graphInstr: "אחוז התלמידים עם איחורים",
        fillInstr: "",
        categories: ["שם תלמיד"],
        results: tardinessStudentNames.map(name => ({ label: name, values: [] })),
      },
      {
        name: "הפרעות",
        mainValue: pct(disruptionStudentNames.length, totalStudents),
        target: "<10%",
        period: "שוטף",
        graphInstr: "אחוז התלמידים עם רישום הפרעה",
        fillInstr: "",
        categories: ["שם תלמיד"],
        results: disruptionStudentNames.map(name => ({ label: name, values: [] })),
      },
      {
        name: "מעבר מגמות",
        mainValue: "",
        target: "",
        period: "שנתי",
        graphInstr: "תלמידים שעלו / ירדו מגמות",
        fillInstr: "",
        categories: [],
        results: [],
      },
    ],
  })
}
