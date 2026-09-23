import { prisma } from "@/lib/db/prisma"

// Shared by /api/assistant/chat and /api/assistant/escalate — resolves the
// requesting student's own (and only their own) context. Student/parent,
// not teacher/admin: this bot is scoped to logistics questions only, so a
// teacher account has no meaningful "student context" to answer from —
// but browsing here isn't harmful, so it's allowed through without a
// class/track context if it ever happens (e.g. preview).
export async function resolveStudentContext(userId: string, role: string) {
  let studentId: string | null = null
  if (role === "STUDENT") {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { studentId: true } })
    studentId = user?.studentId ?? null
  } else if (role === "PARENT") {
    const link = await prisma.parentStudent.findFirst({ where: { userId }, select: { studentId: true } })
    studentId = link?.studentId ?? null
  }
  if (!studentId) return null

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      name: true, track: true, mathUnits: true, englishUnits: true,
      city: true, parent1Name: true, parent2Name: true, gender: true, studyGroups: true,
      class: { select: { displayName: true, name: true } },
    },
  })
  if (!student) return null
  return {
    studentName: student.name,
    className: student.class.displayName || student.class.name,
    track: student.track,
    mathUnits: student.mathUnits,
    englishUnits: student.englishUnits,
    city: student.city,
    parent1Name: student.parent1Name,
    parent2Name: student.parent2Name,
    gender: student.gender,
    studyGroups: student.studyGroups,
  }
}
