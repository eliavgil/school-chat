import { prisma } from "@/lib/db/prisma"

const norm = (s: string) => s.trim().toLowerCase()

// Staff-task assignees are stored as free-text display names (most
// homeroom teachers don't have real accounts), linked to a real User only
// when one matches — used at task-creation time, at account-approval time,
// and by the reminder cron's self-heal pass. An exact, case-sensitive match
// silently drops the link (and with it, any reminder push) over nothing
// more than a trailing space or a capitalization difference, so this
// compares trimmed + lowercased instead.
export async function matchTeacherUsersByName(names: string[]): Promise<Map<string, string>> {
  const teachers = await prisma.user.findMany({
    where: { role: { in: ["TEACHER", "ADMIN"] }, name: { not: null } },
    select: { id: true, name: true },
  })
  const idByNormName = new Map(teachers.map(u => [norm(u.name!), u.id]))
  const result = new Map<string, string>()
  for (const label of names) {
    const id = idByNormName.get(norm(label))
    if (id) result.set(label, id)
  }
  return result
}
