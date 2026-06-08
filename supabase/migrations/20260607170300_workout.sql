-- ============================================================================
-- 04 — Workout plan layer (reusable plans)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- workout — the plan header
-- ----------------------------------------------------------------------------
create table workout (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  notes       text,
  is_archived boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index workout_user_idx on workout (user_id) where is_archived = false;

create trigger workout_set_updated_at
  before update on workout
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- workout_exercise — ordered exercise line items (numbers snapshotted from catalog)
-- ----------------------------------------------------------------------------
create table workout_exercise (
  id                        uuid primary key default gen_random_uuid(),
  workout_id                uuid not null references workout(id) on delete cascade,
  exercise_slug             text not null references exercise(slug),
  position                  int  not null,
  group_id                  uuid,
  tracking_type             tracking_type not null,
  planned_sets              int  not null,
  planned_reps              int,
  planned_weight_lbs        numeric,
  planned_duration_seconds  int,
  planned_set_rest_seconds  int  not null,
  planned_end_rest_seconds  int  not null,
  notes                     text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint workout_exercise_unique_position unique (workout_id, position),
  constraint workout_exercise_planned_sets_positive check (planned_sets > 0)
);
create index workout_exercise_workout_idx  on workout_exercise (workout_id);
create index workout_exercise_exercise_idx on workout_exercise (exercise_slug);
create index workout_exercise_group_idx    on workout_exercise (group_id);

create trigger workout_exercise_set_updated_at
  before update on workout_exercise
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- workout_set — optional per-set plan (pyramids, warmups)
-- ----------------------------------------------------------------------------
create table workout_set (
  id                       uuid primary key default gen_random_uuid(),
  workout_exercise_id      uuid not null references workout_exercise(id) on delete cascade,
  set_number               int  not null,
  set_role                 set_role not null default 'working',
  target_reps              int,
  target_weight_lbs        numeric,
  target_duration_seconds  int,
  set_rest_seconds         int,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint workout_set_unique_number unique (workout_exercise_id, set_number),
  constraint workout_set_number_positive check (set_number > 0)
);
create index workout_set_exercise_idx on workout_set (workout_exercise_id);

create trigger workout_set_set_updated_at
  before update on workout_set
  for each row execute function set_updated_at();
