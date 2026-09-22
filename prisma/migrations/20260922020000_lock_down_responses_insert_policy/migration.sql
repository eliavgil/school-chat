-- The lessons-feature tables (supabase-lessons-schema.sql) were originally
-- applied by hand via the Supabase SQL editor, but live in the same
-- physical database this migration flow manages, so this is the right
-- place to fix them now that Supabase's linter caught a leftover issue.
--
-- `responses` had an INSERT policy (observed live as "anon insert
-- responses" — a variant of the "students_insert_responses" policy
-- checked into supabase-lessons-schema.sql, itself `with check (true)`)
-- letting anyone holding the public anon key insert arbitrary rows with no
-- restriction at all. Confirmed via the codebase that nothing writes to
-- `responses` from the browser — the only write path is
-- app/api/responses/route.ts, using the Supabase service-role key
-- (adminClient()), which always bypasses RLS regardless of policies. So
-- this policy has no legitimate use; drop it under either name it may
-- exist under.
DROP POLICY IF EXISTS "anon insert responses" ON "responses";
DROP POLICY IF EXISTS "students_insert_responses" ON "responses";
