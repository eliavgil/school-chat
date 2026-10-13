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

// Absence pushes (achvaCode 1) are scoped down further, per explicit
// request — everything still gets *recorded* (the daily list stays
// complete for the whole grade), only which absences trigger an instant
// push is narrower:
//   - י4: every unjustified absence, same as before.
//   - every other grade-י class: only when the student skipped a specific
//     lesson but was otherwise at school that day ("הבריזו משיעור"), not
//     when they were out the whole day. Approximated by comparing today's
//     absence count for that student against how many of the class's
//     lessons have *already ended* by the time this cron runs (not the
//     whole day's lesson count — this cron fires throughout the day, so
//     right after period 1 there's only ever one absence either way; that
//     was the original bug here, flagged by the "still getting pushed for
//     a single first-period absence" report). Only once a lesson has
//     actually concluded without a matching absence is there real evidence
//     the student was at school. If today's schedule can't be parsed at
//     all (not uploaded, or no row has an embedded time range), falls back
//     to pushing anyway rather than going silent.
const ALWAYS_PUSH_CLASS_NUM = 4
const DAY_TO_HEB = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]

// ScheduleSlot.period embeds its own time range as raw text, e.g.
// "1, 08:45 - 09:30" (same convention/regex as parsePeriodStr in
// app/home/page.tsx, duplicated here since that file is a client page).
function periodEndTime(period: string): string | null {
  const m = period.match(/^(\d+),\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/)
  return m ? m[3] : null
}

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

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const todayHeb = DAY_TO_HEB[now.getDay()]
  const nowHHMM = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" })
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
    // How many of today's lessons have already ended, by clock time — not
    // the day's total lesson count (see the comment on ALWAYS_PUSH_CLASS_NUM
    // above for why that was wrong). -1 means "couldn't determine" (no
    // schedule uploaded, or no row has a parseable time range) — treated
    // as "push anyway" below, not as "zero lessons elapsed."
    let lessonsElapsedSoFar = -1
    if (cls) {
      const slots = await prisma.scheduleSlot.findMany({ where: { classId: cls.id, dayHeb: todayHeb }, select: { period: true } })
      const endTimes = slots.map(s => periodEndTime(s.period)).filter((t): t is string => t !== null)
      if (endTimes.length > 0) lessonsElapsedSoFar = endTimes.filter(t => t <= nowHHMM).length
    }

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

        // Absence-specific scoping: see the ALWAYS_PUSH_CLASS_NUM comment
        // above. Discipline/positive notes (101/105) are unaffected.
        let skippedOneLesson = false
        if (p.achvaCode === 1 && num !== ALWAYS_PUSH_CLASS_NUM) {
          if (lessonsElapsedSoFar >= 0) {
            const absencesTodayForStudent = parsed.filter(x =>
              x.achvaCode === 1 && x.studentId === p.studentId
              && x.lessonDate.toISOString().slice(0, 10) === todayStr
            ).length
            // Not yet real evidence they attended anything else today —
            // every lesson that's happened so far has an absence recorded.
            if (absencesTodayForStudent >= lessonsElapsedSoFar) continue
            skippedOneLesson = true
          }
          // lessonsElapsedSoFar === -1 (no schedule data) — can't tell, push anyway.
        }

        // Total events of THIS SAME TYPE this student has had since the
        // start of the year — the studentId is recoverable from any
        // event's mashovKey (its "studentId:lessonId:eventCode" prefix).
        const yearTotal = await prisma.mashovBehaveEvent.count({
          where: { achvaCode: p.achvaCode, mashovKey: { startsWith: `${p.studentId}:` } },
        })
        for (const userId of uniqueRecipients) {
          await sendPushToUser(userId, {
            title: cfg.pushTitle,
            body: `${p.studentName} — ${p.subjectName} (${code}${num}, שיעור ${p.lessonNum})${skippedOneLesson ? " · הגיע/ה לבי״ס אך הבריז/ה משיעור" : ""} · סה״כ ${yearTotal} ${cfg.name} השנה`,
          })
          notified++
        }
      }
    }
  }

  return NextResponse.json({ ok: true, totalEvents, newEvents, notified, errors })
}
