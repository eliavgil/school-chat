import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// One-time: creates (or fixes the homeroom-teacher label on) class י7 and
// imports its real student roster, from the school's own Mashov אלפון
// export. Names only — no ת"ז / כתובת / פרטי הורים from that export, since
// nothing in this app uses more than a name for a Student row (idNumber
// on the model is optional and currently unused).
const TEACHER_NAME = "אירנה רחמן"
const CLASS_DISPLAY_NAME = "י7"
const SCHOOL_NAME = "כפר סילבר"

const STUDENTS = [
  "איבנוב יגור",
  "אלכסייב טימור",
  "בולחוב יגור",
  "גזולין סמואיל",
  "דמידוביץ ולדיסלב",
  "ווסקרסנסקי דמיד",
  "חורולסקי יקטרינה",
  "חיימובה בת שבע",
  "יוחוביץ ויקטוריה",
  "לובנסקי דוד",
  "לוין מארק",
  "סטפן טליאנה",
  "סטרוב זרינה",
  "סידקובה אווה",
  "קאבנובה אלכסנדרה",
  "קוזיצין סופיה",
  "קסלר אליסיי",
  "רצ'ולסקי דריה",
]

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let cls = await prisma.class.findFirst({
    where: { OR: [{ displayName: CLASS_DISPLAY_NAME }, { name: CLASS_DISPLAY_NAME }] },
  })
  if (!cls) {
    cls = await prisma.class.create({
      data: { name: CLASS_DISPLAY_NAME, displayName: CLASS_DISPLAY_NAME, teacherDisplayName: TEACHER_NAME, schoolName: SCHOOL_NAME },
    })
  } else if (cls.teacherDisplayName !== TEACHER_NAME) {
    cls = await prisma.class.update({ where: { id: cls.id }, data: { teacherDisplayName: TEACHER_NAME } })
  }

  const existing = await prisma.student.findMany({ where: { classId: cls.id }, select: { name: true } })
  const existingNames = new Set(existing.map(s => s.name))
  const toAdd = STUDENTS.filter(n => !existingNames.has(n))

  if (toAdd.length) {
    await prisma.student.createMany({ data: toAdd.map(name => ({ name, classId: cls!.id })) })
  }

  return NextResponse.json({
    ok: true,
    classId: cls.id,
    teacherDisplayName: cls.teacherDisplayName,
    added: toAdd,
    alreadyPresent: STUDENTS.filter(n => existingNames.has(n)),
  })
}
