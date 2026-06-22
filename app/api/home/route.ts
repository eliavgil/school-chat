import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

const DAY_TO_HEB = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]

function nextSchoolDay(jsDay: number): number {
  // If Friday (5) → Sunday (0), Saturday (6) → Sunday (0)
  if (jsDay === 5) return 0
  if (jsDay === 6) return 0
  return (jsDay + 1) % 7
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { classId: true, role: true, studentId: true, parentStudents: { select: { studentId: true } } },
  })

  const classId = user?.classId
    ?? (user?.parentStudents?.[0]?.studentId
      ? (await prisma.student.findFirst({
          where: { id: user?.parentStudents?.[0]?.studentId },
          select: { classId: true },
        }))?.classId
      : null)
    ?? "class-y"

  const isStudent = user?.role === "STUDENT"
  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN"

  const todayJS = new Date().getDay()
  const todayHeb = DAY_TO_HEB[todayJS]
  const tomorrowHeb = DAY_TO_HEB[nextSchoolDay(todayJS)]

  const EXAM_KEYWORDS = ["מבחן", "בוחן", "בגרות"]
  const now30 = new Date(Date.now() + 30 * 24 * 3600 * 1000)

  const [classProfile, upcomingEvents, openTasks, recentMessages, todaySchedule, tomorrowSchedule, upcomingExams, attendance] = await Promise.all([
    prisma.class.findUnique({
      where: { id: classId },
      select: { displayName: true, teacherDisplayName: true, schoolName: true },
    }),
    prisma.calendarEvent.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 5,
    }),
    isTeacher
      ? prisma.message.count({ where: { isTask: true } })
      : Promise.resolve(0),
    isTeacher
      ? prisma.message.findMany({
          where: { teacherSeenAt: null },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true, content: true, createdAt: true,
            sender: { select: { name: true } },
            student: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    isStudent
      ? prisma.scheduleSlot.findMany({
          where: { classId, dayHeb: todayHeb },
          orderBy: { period: "asc" },
          select: { period: true, content: true },
        })
      : Promise.resolve([]),
    isStudent
      ? prisma.scheduleSlot.findMany({
          where: { classId, dayHeb: tomorrowHeb },
          orderBy: { period: "asc" },
          select: { period: true, content: true },
        })
      : Promise.resolve([]),
    isStudent
      ? prisma.calendarEvent.findMany({
          where: {
            date: { gte: new Date(), lte: now30 },
            OR: EXAM_KEYWORDS.map(k => ({ description: { contains: k } })),
          },
          orderBy: { date: "asc" },
          take: 10,
        })
      : Promise.resolve([]),
    isStudent && user?.studentId
      ? prisma.studentAttendance.findUnique({
          where: { studentId: user.studentId },
          select: { totalLessons: true, absences: true, justifiedAbsences: true },
        })
      : Promise.resolve(null),
  ])

  return NextResponse.json({
    classProfile,
    upcomingEvents,
    openTasks,
    recentMessages,
    todaySchedule,
    tomorrowSchedule,
    todayHeb,
    tomorrowHeb,
    upcomingExams,
    attendance,
  })
}
