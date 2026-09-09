import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// One-time repair: sync `_prisma_migrations` bookkeeping with what's actually
// in the production database, so `prisma migrate deploy` can be safely wired
// into the build going forward. db-diag turned up four migrations out of sync:
//  - add_push_subscriptions: table already existed (created some other way),
//    so the migration failed on CREATE TABLE and left a "started but never
//    finished" row — this blocks every later migration from ever running.
//  - add_disruptions_to_attendance: column already existed, never recorded.
//  - add_surveys: genuinely never applied — Survey/SurveyCompletion tables
//    are missing, which is why the surveys feature has quietly never worked
//    (the API call 500s and the UI silently falls back to "no active surveys").
//  - add_bell_slot: table just created by hand via /api/admin/migrate-bell-slot,
//    never recorded.
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const log: string[] = []

  // Actually create the missing Survey tables — this one is a real gap, not just bookkeeping.
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Survey" (
      "id" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "classId" TEXT,
      "dueDate" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
    );
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SurveyCompletion" (
      "id" TEXT NOT NULL,
      "surveyId" TEXT NOT NULL,
      "studentId" TEXT NOT NULL,
      "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SurveyCompletion_pkey" PRIMARY KEY ("id")
    );
  `)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Survey_classId_idx" ON "Survey"("classId");`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SurveyCompletion_studentId_idx" ON "SurveyCompletion"("studentId");`)
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "SurveyCompletion_surveyId_studentId_key" ON "SurveyCompletion"("surveyId", "studentId");`)
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "SurveyCompletion" ADD CONSTRAINT "SurveyCompletion_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "SurveyCompletion" ADD CONSTRAINT "SurveyCompletion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)
  log.push("Survey / SurveyCompletion tables ensured")

  // Column that already existed but was never recorded — no-op if already present.
  await prisma.$executeRawUnsafe(`ALTER TABLE "StudentAttendance" ADD COLUMN IF NOT EXISTS "disruptions" INTEGER NOT NULL DEFAULT 0;`)
  log.push("StudentAttendance.disruptions ensured")

  // Resolve the failed push_subscriptions migration (table already existed).
  await prisma.$executeRawUnsafe(`
    UPDATE "_prisma_migrations"
    SET finished_at = now(), applied_steps_count = 1, logs = NULL, rolled_back_at = NULL
    WHERE migration_name = '20260627000000_add_push_subscriptions' AND finished_at IS NULL;
  `)
  log.push("add_push_subscriptions resolved")

  // Backfill history rows for migrations that are now genuinely applied but never had one.
  const toBackfill = [
    "20260715000000_add_disruptions_to_attendance",
    "20260829213352_add_surveys",
    "20260901204334_add_bell_slot",
  ]
  for (const name of toBackfill) {
    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" (id, migration_name, started_at, finished_at, applied_steps_count, logs)
      SELECT md5(random()::text || clock_timestamp()::text), ${name}, now(), now(), 1, NULL
      WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = ${name});
    `
  }
  log.push("migration history backfilled")

  const migrationRows = await prisma.$queryRawUnsafe(`
    SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY started_at ASC;
  `)

  return NextResponse.json({ ok: true, log, migrationRows })
}
