-- ============================================================================
-- 12 — Fix start_session RLS visibility (M5 follow-up)
--
-- The original `start_session` snapshotted session_exercise + session_set in a
-- single CTE. PostgreSQL evaluates data-modifying CTEs against one snapshot,
-- so the WITH CHECK on `session_set` (which re-queries `session_exercise`)
-- couldn't see the just-inserted parent rows and rejected the inserts as an
-- RLS violation. Splitting the snapshot into two statements lets the second
-- INSERT's RLS policy see the rows committed by the first.
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

  -- Step 1: snapshot exercises. We do NOT chain into session_set in the same
  -- statement because the RLS WITH CHECK on session_set re-reads
  -- session_exercise, and a data-modifying CTE's writes aren't visible to
  -- those reads in the same statement.
  insert into session_exercise (
    session_id, exercise_slug, source_workout_exercise_id, position, group_id,
    exercise_name_snapshot, tracking_type, laterality,
    planned_set_rest_seconds, planned_end_rest_seconds, status
  )
  select v_session.id,
         we.exercise_slug, we.id, we.position, we.group_id,
         e.name, we.tracking_type, e.laterality,
         we.planned_set_rest_seconds, we.planned_end_rest_seconds, 'pending'
  from   workout_exercise we
  join   exercise          e  on e.slug = we.exercise_slug
  where  we.workout_id = v_workout.id;

  -- Step 2: expand each freshly-inserted session_exercise into its planned
  -- session_set rows. By now those parent rows are visible to RLS.
  insert into session_set (
    session_exercise_id, set_number, set_role, status,
    planned_reps, planned_weight_lbs, planned_duration_seconds, planned_rest_seconds
  )
  select sx.id,
         gs                                  as set_number,
         'working'                           as set_role,
         'pending'                           as status,
         we.planned_reps,
         we.planned_weight_lbs,
         we.planned_duration_seconds,
         we.planned_set_rest_seconds
  from   session_exercise sx
  join   workout_exercise we on we.id = sx.source_workout_exercise_id
  cross  join lateral generate_series(1, we.planned_sets) as gs
  where  sx.session_id = v_session.id;

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
