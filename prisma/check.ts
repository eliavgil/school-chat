import { PrismaClient } from "@prisma/client"

const p = new PrismaClient()

async function main() {
  const links = await p.parentStudent.findMany({ include: { user: true, student: true } })
  console.log("ParentStudent links:", JSON.stringify(links, null, 2))

  const users = await p.user.findMany()
  console.log("Users:", users.map(u => ({ id: u.id, email: u.email })))
}

main().finally(() => p.$disconnect())
