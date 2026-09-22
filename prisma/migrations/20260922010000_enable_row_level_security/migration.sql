-- Every table in the public schema is auto-exposed by Supabase's PostgREST
-- API (readable/writable with the public NEXT_PUBLIC_SUPABASE_ANON_KEY,
-- which ships in the browser bundle) unless RLS is enabled on it — Supabase
-- flagged all of these as ERROR-level findings. Confirmed no legitimate
-- client-side code depends on this: the only browser-side Supabase usage in
-- this app (app/live/[roomCode]/page.tsx) is a Realtime *broadcast* channel,
-- which doesn't touch table data or RLS at all. Every real read/write goes
-- through Next.js API routes using either Prisma (a privileged DB
-- connection, unaffected by RLS) or the Supabase service-role key (which
-- always bypasses RLS by design) — so enabling RLS with no policies here is
-- a pure lockdown of the public API with zero effect on the app itself.
-- Most urgent: this was leaving Account.access_token/refresh_token and
-- VerificationToken.token — NextAuth's OAuth and login-link secrets —
-- openly readable by anyone with the anon key.

ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ParentStudent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "StudentRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "DataImport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Student" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Class" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "BotCache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Teacher" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ScheduleSlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "StudentGrade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "TeacherTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "StudentAccommodation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "StudentAttendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "TeacherRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "EmotionalNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "class_enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "FeatureInterest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "CalendarEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "MashovAbsenceEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "live_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "class_board" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "TeamPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "TeamFile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "TeamEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "BellSlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "LessonManualDone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Survey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "SurveyCompletion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "StaffTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "StaffTaskAssignee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "PersonalTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "StudyMaterial" ENABLE ROW LEVEL SECURITY;
