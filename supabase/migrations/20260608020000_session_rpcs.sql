-- ============================================================================
-- 11 — start_session / finalize_session RPCs (M5)
--
-- Atomic multi-table writes for the live workout flow:
--   start_session(workout_id, scheduled_workout_id?)
--     -> insert workout_session
--     -> snapshot workout_exercise into session_exercise
--     -> expand planned_sets into session_set
--     -> link scheduled_workout.session_id (if given)
--   finalize_session(session_id, perceived_effort?, notes?)
--     -> mark session completed; stamp ended_at + total times
--     -> upsert per-exercise post-session user_exercise_score rows
--       (preference and/or intensity, when provided)
--
-- Both run with `security invoker`. RLS on the underlying tables decides
-- whether the caller can read/write. Each function checks `auth.uid()`
-- defensively so a misconfigured client can't snapshot a plan it doesn't
-- own.
-- ============================================================================

create or replace function start_session(
  p_workout_id uuid,
  p_scheduled_workout_id uuid default null
)
returns workout_session
language plpgsql
security invoker
as $$
declare
  v_user    uuid := auth.uid();
  v_workout workout;
  v_session workout_session;
begin
  if v_user is null then
    raise exception 'not signed in';
  end if;

  select * into v_workout
  from   workout
  where  id = p_workout_id and user_id = v_user;
  if not found then
    raise exception 'workout not found or not owned by caller';
  end if;

  insert into workout_session (user_id, workout_id, workout_name_snapshot, status)
  values (v_user, v_workout.id, v_workout.name, 'in_progress')
  returning * into v_session;

  with src as (
    select we.*,
           e.name        as exercise_name,
           e.laterality  as exercise_laterality
    from   workout_exercise we
    join   exercise         e  on e.slug = we.exercise_slug
    where  we.workout_id = v_workout.id
    order  by we.position
  ),
  sx as (
    insert into session_exercise (
      session_id, exercise_slug, source_workout_exercise_id, position, group_id,
      exercise_name_snapshot, tracking_type, laterality,
      planned_set_rest_seconds, planned_end_rest_seconds, status
    )
    select v_session.id,
           src.exercise_slug, src.id, src.position, src.group_id,
           src.exercise_name, src.tracking_type, src.exercise_laterality,
           src.planned_set_rest_seconds, src.planned_end_rest_seconds, 'pending'
    from   src
    returning id, source_workout_exercise_id
  )
  insert into session_set (
    session_exercise_id, set_number, set_role, status,
    planned_reps, planned_weight_lbs, planned_duration_seconds, planned_rest_seconds
  )
  select sx.id,
         gs                                  as set_number,
         'working'                           as set_role,
         'pending'                           as status,
         src.planned_reps,
         src.planned_weight_lbs,
         src.planned_duration_seconds,
         src.planned_set_rest_seconds
  from   sx
  join   workout_exercise src on src.id = sx.source_workout_exercise_id
  cross  join lateral generate_series(1, src.planned_sets) as gs;

  if p_scheduled_workout_id is not null then
    update scheduled_workout
       set session_id = v_session.id,
           status     = 'in_progress'
     where id = p_scheduled_workout_id
       and user_id = v_user;
  end if;

  return v_session;
end;
$$;

grant execute on function start_session(uuid, uuid) to authenticated;

-- ----------------------------------------------------------------------------

create or replace function finalize_session(
  p_session_id        uuid,
  p_perceived_effort  int   default null,
  p_total_active_seconds int default null,
  p_total_rest_seconds   int default null,
  p_notes             text  default null,
  p_exercise_scores   jsonb default '[]'::jsonb
)
returns workout_session
language plpgsql
security invoker
as $$
declare
  v_user    uuid := auth.uid();
  v_session workout_session;
  v_row     jsonb;
  v_slug    text;
  v_pref    int;
  v_int     int;
begin
  if v_user is null then
    raise exception 'not signed in';
  end if;

  update workout_session
     set status              = 'completed',
         ended_at            = coalesce(ended_at, now()),
         perceived_effort    = coalesce(p_perceived_effort, perceived_effort),
         total_active_seconds = coalesce(p_total_active_seconds, total_active_seconds),
         total_rest_seconds   = coalesce(p_total_rest_seconds, total_rest_seconds),
         notes               = coalesce(p_notes, notes)
   where id = p_session_id
     and user_id = v_user
  returning * into v_session;
  if not found then
    raise exception 'session not found or not owned by caller';
  end if;

  -- Bubble the schedule row to completed too (if any).
  update scheduled_workout
     set status = 'completed'
   where session_id = v_session.id
     and user_id    = v_user;

  -- Append per-exercise scores (D2/D3). Each element is
  -- { "exercise_slug": "...", "preference_score": int?, "intensity_score": int? }
  -- and we only insert rows that carry at least one non-null score.
  for v_row in select * from jsonb_array_elements(coalesce(p_exercise_scores, '[]'::jsonb))
  loop
    v_slug := v_row->>'exercise_slug';
    v_pref := nullif(v_row->>'preference_score','')::int;
    v_int  := nullif(v_row->>'intensity_score','')::int;
    if v_slug is null then continue; end if;
    if v_pref is null and v_int is null then continue; end if;
    insert into user_exercise_score (
      user_id, exercise_slug, preference_score, intensity_score,
      source, session_id
    )
    values (v_user, v_slug, v_pref, v_int, 'post_session', v_session.id);
  end loop;

  return v_session;
end;
$$;

grant execute on function finalize_session(uuid, int, int, int, text, jsonb) to authenticated;
