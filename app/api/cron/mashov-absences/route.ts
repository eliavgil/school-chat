import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { sendPushToUser } from "@/lib/push"
import { mashovLogin, mashovGet } from "@/lib/mashov/client"

// GET — runs on a schedule (see .github/workflows/mashov-absences.yml and
// cron-job.org), pulls each grade-י class's behave log from Mashov, and
// pushes a notification for every new tracked behave event reported
// today (see TRACKED below) to the grade coordinator (the account this
// Mashov integration was set up for). Guarded by CRON_SECRET, same
// pattern as /api/cron/task-reminders.
//
// Route path kept as "mashov-absences" (this started absence-only) even
// though it now also tracks discipline/positive-note events, since the
// URL is already wired into cron-job.org and the GitHub Action — renaming
// it would mean reconfiguring both for no functional benefit.
//
// Scoped to grade י (1–7) because that's what the connected Mashov account
// (see MASHOV_* env vars) actually has permission to read — confirmed via
// /api/admin/mashov-explore, whose rolePermissions only grant classCode "י".
const CLASSES: { code: string; num: number }[] = [1, 2, 3, 4, 5, 6, 7].map(num => ({ code: "י", num }))

// achva codes discovered via /api/cron/mashov-achva-types. requireUnjustified
// only makes sense for חיסור — "justified" isn't a meaningful concept for a
// discipline note or a positive note, so those always push.
const TRACKED: Record<number, { name: string; pushTitle: string; requireUnjustified: boolean }> = {
  1:   { name: "חיסור",       pushTitle: "חיסור נרשם",        requireUnjustified: true },
  101: { name: "הפרת משמעת",  pushTitle: "הפרת משמעת נרשמה",  requireUnjustified: false },
  105: { name: "הערה חיובית", pushTitle: "הערה חיובית נרשמה", requireUnjustified: false },
}
const GRADE_COORDINATOR_EMAIL = "eliavgil@gmail.com"

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const login = await mashovLogin()
  if (!login.ok) return NextResponse.json({ error: login.error, debug: login.debug }, { status: 502 })

  const coordinator = await prisma.user.findUnique({
    where: { email: GRADE_COORDINATOR_EMAIL },
    select: { id: true },
  })

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

    const tracked = data.filter((item: any) => item?.achva?.code in TRACKED)
    totalEvents += tracked.length
    if (!tracked.length) continue

    type Parsed = {
      mashovKey: string; studentId: number; achvaCode: number; achvaName: string
      studentName: string; subjectName: string
      lessonDate: Date; lessonNum: number; reportedAt: Date; justified: boolean
    }
    const parsed: Parsed[] = []
    for (const item of tracked as any[]) {
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
        studentId, achvaCode: item.achva.code, achvaName: item.achva.name ?? TRACKED[item.achva.code].name,
        studentName, subjectName: item.subjectName ?? "",
        lessonDate, lessonNum: item.lessonLog?.lesson ?? 0, reportedAt, justified,
      })
    }
    if (!parsed.length) continue

    // One dedup lookup + one batch insert per class, instead of a
    // per-event round trip — matters a lot on the first run, which
    // backfills the whole semester's history in one pass.
    const existingKeys = new Set(
      (await prisma.mashovBehaveEvent.findMany({
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

    await prisma.mashovBehaveEvent.createMany({
      data: fresh.map(p => ({
        mashovKey: p.mashovKey,
        achvaCode: p.achvaCode,
        achvaName: p.achvaName,
        studentName: p.studentName,
        classCode: code,
        classNum: num,
        subjectName: p.subjectName,
        lessonDate: p.lessonDate,
        lessonNum: p.lessonNum,
        reportedAt: p.reportedAt,
        justified: p.justified,
        notifiedAt: (homeroomTeacher || coordinator) ? new Date() : null,
      })),
      skipDuplicates: true,
    })
    newEvents += fresh.length

    // Only push for events from today — a first-run backfill of the whole
    // semester shouldn't flood anyone with historical notifications.
    //
    // Push goes to the coordinator only for now, not each class's homeroom
    // teacher — per explicit request, until per-teacher notifications are
    // actually wanted. homeroomTeacher is still looked up (used for
    // notifiedAt) so re-enabling this later is a one-line change.
    const uniqueRecipients = Array.from(new Set([coordinator?.id].filter((id): id is string => !!id)))
    if (uniqueRecipients.length) {
      for (const p of fresh) {
        const cfg = TRACKED[p.achvaCode]
        if (cfg.requireUnjustified && p.justified) continue
        if (p.lessonDate.toISOString().slice(0, 10) !== todayStr) continue
        // Total events of THIS SAME TYPE this student has had since the
        // start of the year — the studentId is recoverable from any
        // event's mashovKey (its "studentId:lessonId:eventCode" prefix).
        const yearTotal = await prisma.mashovBehaveEvent.count({
          where: { achvaCode: p.achvaCode, mashovKey: { startsWith: `${p.studentId}:` } },
        })
        for (const userId of uniqueRecipients) {
          await sendPushToUser(userId, {
            title: cfg.pushTitle,
            body: `${p.studentName} — ${p.subjectName} (${code}${num}, שיעור ${p.lessonNum}) · סה״כ ${yearTotal} ${cfg.name} השנה`,
          })
          notified++
        }
      }
    }
  }

  return NextResponse.json({ ok: true, totalEvents, newEvents, notified, errors })
}
