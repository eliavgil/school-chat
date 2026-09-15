import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { sendPushToUser } from "@/lib/push"
import { mashovLogin, mashovGet } from "@/lib/mashov/client"

// GET — runs on a schedule (see .github/workflows/mashov-absences.yml),
// pulls each grade-י class's behave log from Mashov, and pushes a
// notification to that class's homeroom teacher for every "חיסור"
// (absence) event not already seen. Guarded by CRON_SECRET, same pattern
// as /api/cron/task-reminders.
//
// Scoped to grade י (1–7) because that's what the connected Mashov account
// (see MASHOV_* env vars) actually has permission to read — confirmed via
// /api/admin/mashov-explore, whose rolePermissions only grant classCode "י".
const CLASSES: { code: string; num: number }[] = [1, 2, 3, 4, 5, 6, 7].map(num => ({ code: "י", num }))

const ABSENCE_ACHVA_CODE = 1 // "חיסור"

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const login = await mashovLogin()
  if (!login.ok) return NextResponse.json({ error: login.error, debug: login.debug }, { status: 502 })

  let totalEvents = 0
  let newEvents = 0
  let notified = 0
  const errors: { classCode: string; classNum: number; status: number }[] = []

  for (const { code, num } of CLASSES) {
    const { status, data } = await mashovGet(login.session, `classes/${code}/${num}/behave`)
    if (status !== 200 || !Array.isArray(data)) {
      if (status !== 200) errors.push({ classCode: code, classNum: num, status })
      continue
    }

    const absences = data.filter((item: any) => item?.achva?.code === ABSENCE_ACHVA_CODE)
    totalEvents += absences.length
    if (!absences.length) continue

    const cls = await prisma.class.findFirst({
      where: { OR: [{ displayName: `${code}${num}` }, { name: `${code}${num}` }] },
      select: { id: true },
    })
    const homeroomTeacher = cls
      ? await prisma.user.findFirst({ where: { classId: cls.id, role: "TEACHER" }, select: { id: true } })
      : null

    for (const item of absences) {
      const studentId = item?.achvaEvent?.studentId ?? item?.student?.studentId
      const lessonId = item?.lessonLog?.lessonID ?? item?.achvaEvent?.lessonid
      const eventCode = item?.achvaEvent?.eventCode
      if (studentId == null || lessonId == null || eventCode == null) continue

      const mashovKey = `${studentId}:${lessonId}:${eventCode}`
      const existing = await prisma.mashovAbsenceEvent.findUnique({ where: { mashovKey } })
      if (existing) continue

      const studentName = `${item.student?.privateName ?? ""} ${item.student?.familyName ?? ""}`.trim()
      const reportedAt = item.achvaEvent?.timestamp ? new Date(item.achvaEvent.timestamp) : new Date()
      const lessonDate = item.lessonLog?.lessonDate ? new Date(item.lessonLog.lessonDate) : reportedAt
      const justified = (item.achvaEvent?.justified ?? -1) > 0

      await prisma.mashovAbsenceEvent.create({
        data: {
          mashovKey,
          studentName: studentName || "תלמיד/ה",
          classCode: code,
          classNum: num,
          subjectName: item.subjectName ?? "",
          lessonDate,
          lessonNum: item.lessonLog?.lesson ?? 0,
          reportedAt,
          justified,
          notifiedAt: homeroomTeacher ? new Date() : null,
        },
      })
      newEvents++

      if (homeroomTeacher && !justified) {
        await sendPushToUser(homeroomTeacher.id, {
          title: "חיסור נרשם",
          body: `${studentName} — ${item.subjectName ?? ""} (${code}${num}, שיעור ${item.lessonLog?.lesson ?? "?"})`,
        })
        notified++
      }
    }
  }

  return NextResponse.json({ ok: true, totalEvents, newEvents, notified, errors })
}
