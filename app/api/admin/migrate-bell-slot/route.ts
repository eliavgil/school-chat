import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// One-time fix: the BellSlot table (added in prisma/migrations/20260901204334_add_bell_slot)
// was never applied to production, since the build script only runs `prisma generate`,
// not `prisma migrate deploy`. This creates it directly via the app's own already-configured
// production connection, so no DB credentials ever need to change hands.
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "BellSlot" (
      "id" TEXT NOT NULL,
      "period" TEXT NOT NULL,
      "startTime" TEXT NOT NULL,
      "endTime" TEXT NOT NULL,
      "dayType" TEXT NOT NULL DEFAULT 'רגיל',
      "order" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "BellSlot_pkey" PRIMARY KEY ("id")
    );
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "BellSlot_dayType_order_idx" ON "BellSlot"("dayType", "order");
  `)

  // Diagnostic: which migrations Prisma's own bookkeeping table thinks are
  // applied, so we can tell whether wiring `prisma migrate deploy` into the
  // build is safe (vs. tables that exist without a matching migration row).
  let migrationHistory: unknown = null
  try {
    migrationHistory = await prisma.$queryRawUnsafe(
      `SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY started_at ASC`
    )
  } catch (err: any) {
    migrationHistory = { error: err?.message ?? String(err) }
  }

  return NextResponse.json({ ok: true, message: "BellSlot table is ready.", migrationHistory })
}
