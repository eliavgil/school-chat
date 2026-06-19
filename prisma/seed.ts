import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Find the first user in the database (that's you, after logging in)
  const user = await prisma.user.findFirst()
  if (!user) {
    console.log("No users found. Please log in first, then run this script again.")
    return
  }
  console.log("Found user:", user.email)

  // Create a test class
  const cls = await prisma.class.upsert({
    where: { id: "test-class-1" },
    update: {},
    create: { id: "test-class-1", name: "ה-2" },
  })

  // Create a test student
  const student = await prisma.student.upsert({
    where: { id: "test-student-1" },
    update: {},
    create: { id: "test-student-1", name: "יונתן כהן", classId: cls.id },
  })

  // Link the user to the student
  await prisma.parentStudent.upsert({
    where: { userId_studentId: { userId: user.id, studentId: student.id } },
    update: {},
    create: { userId: user.id, studentId: student.id },
  })

  // Add some test records (attendance + grade)
  const dataImport = await prisma.dataImport.create({
    data: { filename: "test-data.csv", recordCount: 3 },
  })

  await prisma.studentRecord.createMany({
    data: [
      {
        studentId: student.id,
        date: new Date("2026-06-15"),
        recordType: "ATTENDANCE",
        details: "נעדר - אישור מחלה",
        importId: dataImport.id,
      },
      {
        studentId: student.id,
        date: new Date("2026-06-10"),
        recordType: "GRADE",
        details: "מתמטיקה: 92",
        importId: dataImport.id,
      },
      {
        studentId: student.id,
        date: new Date("2026-06-12"),
        recordType: "ATTENDANCE",
        details: "נכח",
        importId: dataImport.id,
      },
    ],
  })

  console.log("Seed complete!")
  console.log("Student:", student.name)
  console.log("Records: attendance x2, grade x1")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
