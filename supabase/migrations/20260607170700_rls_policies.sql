-- ============================================================================
-- 08 — Row Level Security
--   * Catalog / taxonomy: readable by any authenticated user; writes only via
--     the service role (which bypasses RLS) or AI pipeline.
--   * User-owned data: visible/mutable only by its owner (auth.uid()).
--   * Child tables without a user_id are scoped through their parent.
--   * exercise_candidate: no policies -> service-role-only access.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Reference / catalog tables — read-only to authenticated users
-- ----------------------------------------------------------------------------
alter table body_group            enable row level security;
alter table body_sub_group        enable row level security;
alter table equipment             enable row level security;
alter table exercise              enable row level security;
alter table exercise_relationship enable row level security;
alter table exercise_candidate    enable row level security;

create policy "read body_group"
  on body_group for select to authenticated using (true);
create policy "read body_sub_group"
  on body_sub_group for select to authenticated using (true);
create policy "read equipment"
  on equipment for select to authenticated using (true);
create policy "read exercise"
  on exercise for select to authenticated using (true);
create policy "read exercise_relationship"
  on exercise_relationship for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- user_exercise_score — owner only (direct user_id)
-- ----------------------------------------------------------------------------
alter table user_exercise_score enable row level security;
create policy "own user_exercise_score"
  on user_exercise_score for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- workout — owner only (direct user_id)
-- ----------------------------------------------------------------------------
alter table workout enable row level security;
create policy "own workout"
  on workout for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- workout_exercise — scoped via parent workout
alter table workout_exercise enable row level security;
create policy "own workout_exercise"
  on workout_exercise for all to authenticated
  using (exists (
    select 1 from workout w
    where w.id = workout_exercise.workout_id and w.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from workout w
    where w.id = workout_exercise.workout_id and w.user_id = auth.uid()
  ));

-- workout_set — scoped via workout_exercise -> workout
alter table workout_set enable row level security;
create policy "own workout_set"
  on workout_set for all to authenticated
  using (exists (
    select 1 from workout_exercise we
    join workout w on w.id = we.workout_id
    where we.id = workout_set.workout_exercise_id and w.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from workout_exercise we
    join workout w on w.id = we.workout_id
    where we.id = workout_set.workout_exercise_id and w.user_id = auth.uid()
  ));

-- ----------------------------------------------------------------------------
-- workout_session — owner only (direct user_id)
-- ----------------------------------------------------------------------------
alter table workout_session enable row level security;
create policy "own workout_session"
  on workout_session for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- session_exercise — scoped via parent session
alter table session_exercise enable row level security;
create policy "own session_exercise"
  on session_exercise for all to authenticated
  using (exists (
    select 1 from workout_session s
    where s.id = session_exercise.session_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from workout_session s
    where s.id = session_exercise.session_id and s.user_id = auth.uid()
  ));

-- session_set — scoped via session_exercise -> session
alter table session_set enable row level security;
create policy "own session_set"
  on session_set for all to authenticated
  using (exists (
    select 1 from session_exercise se
    join workout_session s on s.id = se.session_id
    where se.id = session_set.session_exercise_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from session_exercise se
    join workout_session s on s.id = se.session_id
    where se.id = session_set.session_exercise_id and s.user_id = auth.uid()
  ));

-- session_event — owner only (direct user_id)
alter table session_event enable row level security;
create policy "own session_event"
  on session_event for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
