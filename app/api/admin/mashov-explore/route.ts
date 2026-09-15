import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { mashovLogin, mashovGet, mashovPost } from "@/lib/mashov/client"

// GET — logs into Mashov, then probes endpoint paths to discover what's
// available. Flat paths (attendance/grades/schedule/etc.) all 404 — Mashov
// scopes them per student/class/group, confirmed by the login response body
// (roles, educateClasses, teachingGroups, teachingStudents — all keyed by
// studentGuid / classCode+classNum / groupId). So this probes nested paths
// built from real ids pulled out of the login body and the classes/students
// list, instead of guessing blind.
const FLAT_CANDIDATES = [
  "teachers", "classes", "students", "groups",
  "attendance", "absences", "lesson/attendance",
  "grades", "marks", "gradeBook",
  "schedule", "lessons", "timetable",
  "events", "behaviors", "achievements",
  "subjects", "rooms", "parents", "contacts",
]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const login = await mashovLogin()
  if (!login.ok) return NextResponse.json({ error: login.error, debug: login.debug }, { status: 502 })

  const flatResults: { path: string; status: number; ok: boolean; itemCount: number | null }[] = []
  for (const path of FLAT_CANDIDATES) {
    const { status, data } = await mashovGet(login.session, path)
    flatResults.push({ path, status, ok: status === 200, itemCount: Array.isArray(data) ? data.length : null })
  }

  const loginBody = login.session.loginBody as any
  const accessToken = loginBody?.accessToken
  const teacherGuid: string | undefined = loginBody?.credential?.userId
  const studentGuid: string | undefined = accessToken?.teachingStudents?.[0]
  const educateClass = accessToken?.educateClasses?.[0]
  const groupId: number | undefined = accessToken?.teachingGroups?.[0]

  const ids = { teacherGuid, studentGuid, educateClass, groupId }

  const nestedPaths: string[] = []
  if (studentGuid) {
    nestedPaths.push(
      `students/${studentGuid}`,
      `students/${studentGuid}/behave/behaveEvents`,
      `students/${studentGuid}/behave/gradeEvents`,
      `students/${studentGuid}/lessons`,
      `students/${studentGuid}/timetable`,
      `students/${studentGuid}/journal`,
      `students/${studentGuid}/justificationRequests`,
      `students/${studentGuid}/maakav`,
    )
  }
  if (educateClass?.classCode !== undefined && educateClass?.classNum !== undefined) {
    const { classCode, classNum } = educateClass
    nestedPaths.push(
      `classes/${classCode}/${classNum}/students`,
      `classes/${classCode}/${classNum}/timetable`,
      `classes/${classCode}/${classNum}/lessons`,
      `classes/${classCode}/${classNum}/behave`,
      `classes/${classCode}/${classNum}/behave/behaveEvents`,
    )
  }
  if (groupId) {
    nestedPaths.push(
      `groups/${groupId}/students`,
      `groups/${groupId}/lessons`,
      `groups/${groupId}/timetable`,
    )
  }
  if (teacherGuid) {
    nestedPaths.push(
      `teachers/${teacherGuid}/timetable`,
      `teachers/${teacherGuid}/lessons`,
    )
  }

  const nestedResults: { path: string; status: number; ok: boolean; preview: unknown }[] = []
  for (const path of nestedPaths) {
    const { status, data } = await mashovGet(login.session, path)
    nestedResults.push({
      path,
      status,
      ok: status === 200,
      preview: status === 200 ? (Array.isArray(data) ? data.slice(0, 2) : data) : null,
    })
  }

  // "lessons" was 405 (wrong method) as a flat GET — try it as POST with a
  // plausible date-range + class filter body, same shape Mashov's own SPA
  // would send when loading a class's daily schedule.
  const postProbes: { path: string; body: unknown; status: number; ok: boolean; preview: unknown }[] = []
  if (educateClass?.classCode !== undefined && educateClass?.classNum !== undefined) {
    const body = {
      classCode: educateClass.classCode,
      classNum: educateClass.classNum,
      fromDate: todayIso(),
      toDate: todayIso(),
    }
    const { status, data } = await mashovPost(login.session, "lessons", body)
    postProbes.push({ path: "lessons", body, status, ok: status === 200, preview: status === 200 ? data : null })
  }

  return NextResponse.json({ ok: true, flatResults, ids, nestedResults, postProbes })
}
