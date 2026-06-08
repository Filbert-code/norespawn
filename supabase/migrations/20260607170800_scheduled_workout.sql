-- ============================================================================
-- 09 — scheduled_workout — the "Tracker": links a plan to a calendar date
--   Calendar reads a union of scheduled_workout (planned/future) and
--   workout_session (actual history). When a scheduled workout is started,
--   a workout_session is created and linked back via session_id.
-- ============================================================================

create table scheduled_workout (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  workout_id     uuid not null references workout(id) on delete cascade,
  scheduled_date date not null,
  status         text not null default 'scheduled',
  session_id     uuid references workout_session(id) on delete set null,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint scheduled_workout_status_check
    check (status in ('scheduled', 'completed', 'skipped'))
);
create index scheduled_workout_user_date_idx
  on scheduled_workout (user_id, scheduled_date);
create index scheduled_workout_workout_idx on scheduled_workout (workout_id);

create trigger scheduled_workout_set_updated_at
  before update on scheduled_workout
  for each row execute function set_updated_at();

alter table scheduled_workout enable row level security;
create policy "own scheduled_workout"
  on scheduled_workout for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
