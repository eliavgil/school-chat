import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { sendPushToUser } from "@/lib/push"
import { mashovLogin, mashovGet } from "@/lib/mashov/client"

// GET — runs on a schedule (see .github/workflows/mashov-absences.yml),
// pulls each grade-י class's behave log from Mashov, and pushes a
// notification to that class's homeroom teacher for every new "חיסור"
// (absence) event reported today. Guarded by CRON_SECRET, same pattern
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

  const todayStr = new Date().toISOString().slice(0, 10)
  let totalEvents = 0
  let newEvents = 0
  let notified = 0
  const errors: { classCode: string; classNum: number; status: number | string }[] = []

  for (const { code, num } of CLASSES) {
    let status: number, data: unknown
    try {
      ;({ status, data } = await mashovGet(login.session, `classes/${code}/${num}/behave`))
    } catch (err) {
      errors.push({ classCode: code, classNum: num, status: err instanceof Error ? err.name : "fetch error" })
      continue
    }
    if (status !== 200 || !Array.isArray(data)) {
      if (status !== 200) errors.push({ classCode: code, classNum: num, status })
      continue
    }

    const absences = data.filter((item: any) => item?.achva?.code === ABSENCE_ACHVA_CODE)
    totalEvents += absences.length
    if (!absences.length) continue

    type Parsed = {
      mashovKey: string; studentName: string; subjectName: string
      lessonDate: Date; lessonNum: number; reportedAt: Date; justified: boolean
    }
    const parsed: Parsed[] = []
    for (const item of absences as any[]) {
      const studentId = item?.achvaEvent?.studentId ?? item?.student?.studentId
      const lessonId = item?.lessonLog?.lessonID ?? item?.achvaEvent?.lessonid
      const eventCode = item?.achvaEvent?.eventCode
      if (studentId == null || lessonId == null || eventCode == null) continue

      const studentName = `${item.student?.privateName ?? ""} ${item.student?.familyName ?? ""}`.trim() || "תלמיד/ה"
      const reportedAt = item.achvaEvent?.timestamp ? new Date(item.achvaEvent.timestamp) : new Date()
      const lessonDate = item.lessonLog?.lessonDate ? new Date(item.lessonLog.lessonDate) : reportedAt
      const justified = (item.achvaEvent?.justified ?? -1) > 0

      parsed.push({
        mashovKey: `${studentId}:${lessonId}:${eventCode}`,
        studentName, subjectName: item.subjectName ?? "",
        lessonDate, lessonNum: item.lessonLog?.lesson ?? 0, reportedAt, justified,
      })
    }
    if (!parsed.length) continue

    // One dedup lookup + one batch insert per class, instead of a
    // per-event round trip — matters a lot on the first run, which
    // backfills the whole semester's history in one pass.
    const existingKeys = new Set(
      (await prisma.mashovAbsenceEvent.findMany({
        where: { mashovKey: { in: parsed.map(p => p.mashovKey) } },
        select: { mashovKey: true },
      })).map(r => r.mashovKey)
    )
    const fresh = parsed.filter(p => !existingKeys.has(p.mashovKey))
    if (!fresh.length) continue

    const cls = await prisma.class.findFirst({
      where: { OR: [{ displayName: `${code}${num}` }, { name: `${code}${num}` }] },
      select: { id: true },
    })
    const homeroomTeacher = cls
      ? await prisma.user.findFirst({ where: { classId: cls.id, role: "TEACHER" }, select: { id: true } })
      : null

    await prisma.mashovAbsenceEvent.createMany({
      data: fresh.map(p => ({
        mashovKey: p.mashovKey,
        studentName: p.studentName,
        classCode: code,
        classNum: num,
        subjectName: p.subjectName,
        lessonDate: p.lessonDate,
        lessonNum: p.lessonNum,
        reportedAt: p.reportedAt,
        justified: p.justified,
        notifiedAt: homeroomTeacher ? new Date() : null,
      })),
      skipDuplicates: true,
    })
    newEvents += fresh.length

    // Only push for events from today — a first-run backfill of the whole
    // semester shouldn't flood the teacher with historical notifications.
    if (homeroomTeacher) {
      for (const p of fresh) {
        if (p.justified) continue
        if (p.lessonDate.toISOString().slice(0, 10) !== todayStr) continue
        await sendPushToUser(homeroomTeacher.id, {
          title: "חיסור נרשם",
          body: `${p.studentName} — ${p.subjectName} (${code}${num}, שיעור ${p.lessonNum})`,
        })
        notified++
      }
    }
  }

  return NextResponse.json({ ok: true, totalEvents, newEvents, notified, errors })
}
