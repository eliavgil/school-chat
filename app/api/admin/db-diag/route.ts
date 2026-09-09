import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// One-time diagnostic: figure out whether it's safe to wire `prisma migrate
// deploy` into the build. The BellSlot migration turned out to have never
// been applied to production despite existing in the repo, and the
// _prisma_migrations bookkeeping shows a migration with finished_at = null
// (add_push_subscriptions) — this checks whether the actual tables/columns
// for the migrations Prisma doesn't think finished already exist anyway.
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `)

  const disruptionsColumn = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudentAttendance' AND column_name = 'disruptions';
  `)

  const migrationRows = await prisma.$queryRawUnsafe(`
    SELECT id, migration_name, started_at, finished_at, applied_steps_count, rolled_back_at, logs
    FROM "_prisma_migrations" ORDER BY started_at ASC;
  `)

  return NextResponse.json({ ok: true, tables, disruptionsColumn, migrationRows }, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  })
}
