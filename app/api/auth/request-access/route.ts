import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { userType } = body

  if (userType === "student") {
    const { studentName } = body
    if (!studentName?.trim()) return NextResponse.json({ error: "Missing name" }, { status: 400 })
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role: "STUDENT",
        requestedChildName: studentName.trim(),
        accessStatus: "PENDING",
      },
    })
  } else if (userType === "teacher") {
    const { teacherName, classId } = body
    if (!teacherName?.trim() || !classId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    // Role is set right away (same as student/parent below) — accessStatus
    // stays PENDING until an admin approves, so claiming "I'm a teacher"
    // here grants nothing by itself; middleware blocks every PENDING user
    // regardless of role.
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role: "TEACHER",
        name: teacherName.trim(),
        classId,
        accessStatus: "PENDING",
      },
    })
  } else {
    const { childName, phone, parentType } = body
    if (!childName?.trim() || !phone?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role: "PARENT",
        requestedChildName: childName.trim(),
        phone: phone.trim(),
        parentType: parentType ?? null,
        accessStatus: "PENDING",
      },
    })
  }

  return NextResponse.json({ ok: true })
}
