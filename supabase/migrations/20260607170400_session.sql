-- ============================================================================
-- 05 — Session (live workout) log layer — fully snapshotted from the plan
-- ============================================================================

-- ----------------------------------------------------------------------------
-- workout_session — one performed instance of a plan
-- ----------------------------------------------------------------------------
create table workout_session (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  workout_id            uuid not null references workout(id) on delete restrict,
  workout_name_snapshot text not null,
  status                session_status not null default 'in_progress',
  started_at            timestamptz not null default now(),
  ended_at              timestamptz,
  total_active_seconds  int,
  total_rest_seconds    int,
  perceived_effort      int,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint workout_session_effort_range
    check (perceived_effort is null or perceived_effort between 1 and 10)
);
create index workout_session_user_idx       on workout_session (user_id);
create index workout_session_workout_idx    on workout_session (workout_id);
create index workout_session_user_start_idx on workout_session (user_id, started_at desc);

create trigger workout_session_set_updated_at
  before update on workout_session
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- session_exercise — performed exercise line item (snapshot)
-- ----------------------------------------------------------------------------
create table session_exercise (
  id                         uuid primary key default gen_random_uuid(),
  session_id                 uuid not null references workout_session(id) on delete cascade,
  exercise_slug              text not null references exercise(slug),
  source_workout_exercise_id uuid references workout_exercise(id) on delete set null,
  position                   int  not null,
  group_id                   uuid,
  exercise_name_snapshot     text not null,
  tracking_type              tracking_type not null,
  laterality                 laterality not null,
  planned_set_rest_seconds   int  not null,
  planned_end_rest_seconds   int  not null,
  status                     set_status not null default 'pending',
  started_at                 timestamptz,
  ended_at                   timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  constraint session_exercise_unique_position unique (session_id, position)
);
create index session_exercise_session_idx  on session_exercise (session_id);
create index session_exercise_exercise_idx on session_exercise (exercise_slug);

create trigger session_exercise_set_updated_at
  before update on session_exercise
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- session_set — the unit of truth for performed work
-- For unilateral exercises a single row represents the set performed on BOTH
-- sides (reps/weight are per-side); analytics multiply by 2 for total volume.
-- ----------------------------------------------------------------------------
create table session_set (
  id                       uuid primary key default gen_random_uuid(),
  session_exercise_id      uuid not null references session_exercise(id) on delete cascade,
  set_number               int  not null,
  set_role                 set_role not null default 'working',
  status                   set_status not null default 'pending',
  planned_reps             int,
  planned_weight_lbs       numeric,
  planned_duration_seconds int,
  planned_rest_seconds     int  not null,
  actual_reps              int,
  actual_weight_lbs        numeric,
  actual_duration_seconds  int,
  actual_rest_seconds      int,
  actual_rpe               int,
  started_at               timestamptz,
  completed_at             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint session_set_unique_number unique (session_exercise_id, set_number),
  constraint session_set_rpe_range check (actual_rpe is null or actual_rpe between 1 and 10)
);
create index session_set_exercise_idx on session_set (session_exercise_id);
create index session_set_status_idx   on session_set (status);

create trigger session_set_set_updated_at
  before update on session_set
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- session_event — lightweight, append-only in-session event log
-- ----------------------------------------------------------------------------
create table session_event (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references workout_session(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  session_exercise_id uuid references session_exercise(id) on delete set null,
  session_set_id      uuid references session_set(id) on delete set null,
  event_type          event_type not null,
  occurred_at         timestamptz not null default now(),
  payload             jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);
create index session_event_session_idx on session_event (session_id, occurred_at);
create index session_event_user_idx    on session_event (user_id);
