import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [pendingParents, pendingStudents, approvedParents, approvedStudents, students] = await Promise.all([
    prisma.user.findMany({
      where: { role: "PARENT", accessStatus: "PENDING" },
      select: { id: true, name: true, email: true, phone: true, requestedChildName: true, parentType: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT", accessStatus: "PENDING" },
      select: { id: true, name: true, email: true, requestedChildName: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "PARENT", accessStatus: "APPROVED" },
      select: {
        id: true, name: true, email: true, phone: true, accessStatus: true,
        parentStudents: { select: { student: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT", accessStatus: "APPROVED" },
      select: { id: true, name: true, email: true, accessStatus: true, studentRecord: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.student.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return NextResponse.json({ pendingParents, pendingStudents, approvedParents, approvedStudents, students })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Pre-register a student by email
  const { email, studentId } = await req.json()
  if (!email?.trim() || !studentId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const normalizedEmail = email.trim().toLowerCase()

  // Upsert the user: if they already exist by email, update; otherwise create
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })

  if (existing) {
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { role: "STUDENT", accessStatus: "APPROVED", studentId },
    })
  } else {
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        role: "STUDENT",
        accessStatus: "APPROVED",
        studentId,
        classId: "class-y",
      },
    })
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { userId, action, studentId } = await req.json()

  if (action === "approve-parent") {
    await prisma.user.update({ where: { id: userId }, data: { accessStatus: "APPROVED" } })
    if (studentId) {
      await prisma.parentStudent.upsert({
        where: { userId_studentId: { userId, studentId } },
        create: { userId, studentId },
        update: {},
      })
    }
  } else if (action === "approve-student") {
    await prisma.user.update({
      where: { id: userId },
      data: { accessStatus: "APPROVED", ...(studentId ? { studentId } : {}) },
    })
  } else if (action === "deny") {
    await prisma.user.update({ where: { id: userId }, data: { accessStatus: "DENIED" } })
  } else if (action === "unlink-parent" && studentId) {
    await prisma.parentStudent.delete({ where: { userId_studentId: { userId, studentId } } })
  } else if (action === "link-student") {
    await prisma.user.update({ where: { id: userId }, data: { studentId: studentId ?? null } })
  } else if (action === "unlink-student") {
    await prisma.user.update({ where: { id: userId }, data: { studentId: null } })
  }

  return NextResponse.json({ ok: true })
}
