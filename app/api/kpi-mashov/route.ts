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

  // ── Attendance & tardiness (StudentAttendance from Mashov import) ──────
  const attendance = await prisma.studentAttendance.findMany({
    where: { student: { classId } },
    include: { student: { select: { name: true } } },
  })

  // Correct formula: incidents / total lesson slots
  const totalLessons       = attendance.reduce((s, a) => s + a.totalLessons, 0)

  const totalAbsences      = attendance.reduce((s, a) => s + a.absences, 0)
  const absenceRate        = totalLessons > 0 ? totalAbsences / totalLessons : null
  const absenceMainValue   = absenceRate !== null ? `${Math.round(absenceRate * 100)}%` : ""

  const totalTardiness     = attendance.reduce((s, a) => s + a.tardiness, 0)
  const tardinessRate      = totalLessons > 0 ? totalTardiness / totalLessons : null
  const tardinessMainValue = tardinessRate !== null ? `${Math.round(tardinessRate * 100)}%` : ""

  const absenceDetail = attendance
    .filter(a => a.absences > 0)
    .sort((a, b) => b.absences - a.absences)
    .map(a => ({ label: a.student.name, values: [String(a.absences)] }))

  const tardinessDetail = attendance
    .filter(a => a.tardiness > 0)
    .sort((a, b) => b.tardiness - a.tardiness)
    .map(a => ({ label: a.student.name, values: [String(a.tardiness)] }))

  // ── Disruptions (from Mashov attendance import — disruptions column) ──
  const studentsWithDisruptions = attendance.filter(a => a.disruptions > 0)
  const disruptionStudentCount = studentsWithDisruptions.length
  const disruptionMainValue = totalStudents > 0
    ? `${Math.round((disruptionStudentCount / totalStudents) * 100)}%`
    : ""
  const disruptionDetail = attendance
    .filter(a => a.disruptions > 0)
    .sort((a, b) => b.disruptions - a.disruptions)
    .map(a => ({ label: a.student.name, values: [String(a.disruptions)] }))


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
        name: "היעדרויות",
        mainValue: absenceMainValue,
        target: "<15%",
        period: "שוטף",
        graphInstr: "אחוז השיעורים שבהם תלמידים נעדרו (סך היעדרויות ÷ סך שיעורים)",
        fillInstr: "",
        categories: ["מספר היעדרויות"],
        results: absenceDetail,
      },
      {
        name: "איחורים",
        mainValue: tardinessMainValue,
        target: "<5%",
        period: "שוטף",
        graphInstr: "אחוז השיעורים שבהם תלמידים אחרו (סך איחורים ÷ סך שיעורים)",
        fillInstr: "",
        categories: ["מספר איחורים"],
        results: tardinessDetail,
      },
      {
        name: "הפרעות",
        mainValue: disruptionMainValue,
        target: "<10%",
        period: "שוטף",
        graphInstr: "אחוז התלמידים עם רישום הפרעה",
        fillInstr: "",
        categories: ["מספר הפרעות"],
        results: disruptionDetail,
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
