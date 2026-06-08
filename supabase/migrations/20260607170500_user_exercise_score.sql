-- ============================================================================
-- 06 — user_exercise_score — append-only per-user preference / intensity history
-- ============================================================================

create table user_exercise_score (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  exercise_slug    text not null references exercise(slug) on delete cascade,
  preference_score int,
  intensity_score  int,
  effective_at     timestamptz not null default now(),
  source           text not null default 'manual',
  session_id       uuid references workout_session(id) on delete set null,
  note             text,
  created_at       timestamptz not null default now(),
  constraint user_exercise_score_preference_range
    check (preference_score is null or preference_score between 1 and 10),
  constraint user_exercise_score_intensity_range
    check (intensity_score is null or intensity_score between 1 and 10),
  constraint user_exercise_score_has_value
    check (preference_score is not null or intensity_score is not null)
);
create index user_exercise_score_lookup_idx
  on user_exercise_score (user_id, exercise_slug, effective_at desc);
