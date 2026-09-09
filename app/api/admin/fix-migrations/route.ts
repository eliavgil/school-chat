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
//
// Each step runs independently and reports its own outcome, so a failure in
// one step never hides what happened in the others (or produces a blank
// response) — everything is visible in the JSON either way.
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const steps: { name: string; ok: boolean; error?: string }[] = []

  async function step(name: string, fn: () => Promise<unknown>) {
    try {
      await fn()
      steps.push({ name, ok: true })
    } catch (err: any) {
      steps.push({ name, ok: false, error: err?.message ?? String(err) })
    }
  }

  try {

  await step("create Survey table", () => prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Survey" (
      "id" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "classId" TEXT,
      "dueDate" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
    );
  `))
  await step("create SurveyCompletion table", () => prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SurveyCompletion" (
      "id" TEXT NOT NULL,
      "surveyId" TEXT NOT NULL,
      "studentId" TEXT NOT NULL,
      "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SurveyCompletion_pkey" PRIMARY KEY ("id")
    );
  `))
  await step("Survey_classId_idx", () => prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Survey_classId_idx" ON "Survey"("classId");`
  ))
  await step("SurveyCompletion_studentId_idx", () => prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "SurveyCompletion_studentId_idx" ON "SurveyCompletion"("studentId");`
  ))
  await step("SurveyCompletion unique index", () => prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "SurveyCompletion_surveyId_studentId_key" ON "SurveyCompletion"("surveyId", "studentId");`
  ))
  await step("SurveyCompletion -> Survey FK", () => prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "SurveyCompletion" ADD CONSTRAINT "SurveyCompletion_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `))
  await step("SurveyCompletion -> Student FK", () => prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "SurveyCompletion" ADD CONSTRAINT "SurveyCompletion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `))
  await step("StudentAttendance.disruptions column", () => prisma.$executeRawUnsafe(
    `ALTER TABLE "StudentAttendance" ADD COLUMN IF NOT EXISTS "disruptions" INTEGER NOT NULL DEFAULT 0;`
  ))
  await step("resolve stuck add_push_subscriptions row", () => prisma.$executeRawUnsafe(`
    UPDATE "_prisma_migrations"
    SET finished_at = now(), applied_steps_count = 1, logs = NULL, rolled_back_at = NULL
    WHERE migration_name = '20260627000000_add_push_subscriptions' AND finished_at IS NULL;
  `))

  // checksum = sha256 hex digest of each migration.sql file, matching exactly
  // what `prisma migrate deploy` computes and checks against on every future
  // run — a placeholder value here would make it flag these as "changed
  // since applied" and refuse to proceed.
  const toBackfill: { name: string; checksum: string }[] = [
    { name: "20260715000000_add_disruptions_to_attendance", checksum: "ec6936e60c2446a4b894da656d6490638ee272bbb790705305b57d825078329b" },
    { name: "20260829213352_add_surveys", checksum: "d4f84b626bd826a3ac1c0d97ebff3bb3b2cc40b2abc5f206787801a8e7c65f13" },
    { name: "20260901204334_add_bell_slot", checksum: "8c51f2e4788efaff3830d46f1ba61a38d59bfe7dddbf140a7b0782c0470c9596" },
  ]
  for (const { name, checksum } of toBackfill) {
    await step(`backfill history: ${name}`, () => prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at, applied_steps_count, logs)
      SELECT md5(random()::text || clock_timestamp()::text), ${checksum}, ${name}, now(), now(), 1, NULL
      WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = ${name});
    `)
  }

  let migrationRows: unknown = null
  try {
    migrationRows = await prisma.$queryRawUnsafe(
      `SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY started_at ASC;`
    )
  } catch (err: any) {
    migrationRows = { error: err?.message ?? String(err) }
  }

  const allOk = steps.every(s => s.ok)
  return NextResponse.json({ ok: allOk, steps, migrationRows }, { status: allOk ? 200 : 207 })

  } catch (err: any) {
    return NextResponse.json({ ok: false, steps, error: err?.message ?? String(err) }, { status: 500 })
  }
}
