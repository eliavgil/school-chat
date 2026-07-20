-- ================================================================
-- Live Lessons — Supabase Schema
-- Run this in the Supabase SQL Editor once.
-- ================================================================

-- Teachers (linked to Supabase Auth UIDs)
create table if not exists teachers (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique,
  name          text,
  created_at    timestamptz default now()
);

-- Classes
create table if not exists classes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz default now()
);

-- Students (linked to Supabase Auth after first login)
create table if not exists students (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid references classes(id),
  name         text not null,
  phone        text,
  auth_user_id uuid unique,
  email        text,
  created_at   timestamptz default now()
);

-- Class enrollments (many-to-many backup, optional if class_id on students is enough)
create table if not exists class_enrollments (
  student_id  uuid references students(id) on delete cascade,
  class_id    uuid references classes(id)  on delete cascade,
  primary key (student_id, class_id)
);

-- Lessons (slides stored as JSONB)
create table if not exists lessons (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid references classes(id),
  title       text not null,
  slides      jsonb not null default '[]'::jsonb,
  created_at  timestamptz default now()
);

-- Live sessions
create table if not exists live_sessions (
  id                    uuid primary key default gen_random_uuid(),
  lesson_id             uuid references lessons(id),
  class_id              uuid references classes(id),
  room_code             text unique not null,
  current_slide_index   int not null default 0,
  is_active             boolean not null default true,
  created_at            timestamptz default now()
);

-- Session participants
create table if not exists session_participants (
  session_id   uuid references live_sessions(id) on delete cascade,
  student_id   uuid,
  joined_at    timestamptz default now(),
  primary key (session_id, student_id)
);

-- Student responses (unique per student+session+slide+question)
create table if not exists responses (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references live_sessions(id) on delete cascade,
  student_id   text not null,
  slide_id     text not null,
  question_id  text not null,
  answer       text not null,
  created_at   timestamptz default now(),
  unique (session_id, student_id, slide_id, question_id)
);

-- Student activity log
create table if not exists student_activity (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid,
  session_id  uuid references live_sessions(id),
  type        text,
  data        jsonb,
  created_at  timestamptz default now()
);

-- Class board (announcements)
create table if not exists class_board (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid references classes(id),
  message     text not null,
  created_at  timestamptz default now()
);

-- ================================================================
-- RLS Policies
-- ================================================================

alter table lessons          enable row level security;
alter table live_sessions    enable row level security;
alter table responses        enable row level security;
alter table session_participants enable row level security;
alter table class_board      enable row level security;
alter table students         enable row level security;
alter table classes          enable row level security;

-- Allow service role (used in API routes) to bypass RLS — this is automatic.
-- The following policies allow authenticated reads for students.

-- Students can read their own class's lessons
create policy "students_read_lessons" on lessons
  for select using (
    class_id in (
      select class_id from students where auth_user_id = auth.uid()
    )
  );

-- Students can read active sessions for their class
create policy "students_read_sessions" on live_sessions
  for select using (
    class_id in (
      select class_id from students where auth_user_id = auth.uid()
    )
  );

-- Students can insert their own responses
create policy "students_insert_responses" on responses
  for insert with check (true); -- student_id checked at app layer

-- Students can read responses for their session (for feedback)
create policy "students_read_responses" on responses
  for select using (true); -- open for now; tighten later

-- Students can read their class's board
create policy "students_read_board" on class_board
  for select using (
    class_id in (
      select class_id from students where auth_user_id = auth.uid()
    )
  );

-- ================================================================
-- Realtime: enable broadcast for live sessions channel
-- ================================================================
-- In Supabase dashboard: Database → Replication → enable "responses" table
-- Also in Supabase dashboard: Realtime → enable for "responses" table
-- The broadcast channel "session:<ROOM_CODE>" is used for slide_change events.

-- ================================================================
-- Sample class (י4) — run separately after inserting real students
-- ================================================================
-- insert into classes (id, name) values ('your-class-uuid', 'י4');
-- Students should be imported separately with phone numbers.
