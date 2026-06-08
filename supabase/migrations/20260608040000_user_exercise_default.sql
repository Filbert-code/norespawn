-- ============================================================================
-- 11 — Smart planning defaults
--
-- When a user adds an exercise to a NEW plan, the Forge editor should seed
-- sets / reps / weight / duration from the user's OWN most-recent value for
-- that exercise — whichever is newer between:
--   (a) the last plan they built that included it (planned_* values), and
--   (b) the top (heaviest) working set of their most recent live session.
--
-- Rest timers are seeded separately from the user's most recently touched
-- plan line (the Forge UI treats rest as plan-level, not per-exercise).
--
-- Both views are `security_invoker` so base-table RLS (own data only) applies
-- to the calling user.
-- ============================================================================

-- Most-recent per-exercise prescription, merged across plans + sessions.
create view user_exercise_default
  with (security_invoker = true)
as
with plan_latest as (
  -- Newest plan line per (user, exercise). useUpdatePlan rewrites these rows
  -- on every save, so updated_at reliably reflects the last edit.
  select distinct on (w.user_id, we.exercise_slug)
         w.user_id,
         we.exercise_slug,
         we.planned_sets             as sets,
         we.planned_reps             as reps,
         we.planned_weight_lbs       as weight_lbs,
         we.planned_duration_seconds as duration_seconds,
         we.updated_at               as effective_at,
         'plan'::text                as source
  from   workout_exercise we
  join   workout w on w.id = we.workout_id
  order  by w.user_id, we.exercise_slug, we.updated_at desc
),
session_agg as (
  -- One row per (user, exercise, session): the TOP (heaviest) completed
  -- working set's numbers, plus the count of working sets performed.
  select ws.user_id,
         se.exercise_slug,
         ws.id          as session_id,
         ws.started_at  as effective_at,
         count(*)::int  as sets,
         (array_agg(ss.actual_reps
            order by ss.actual_weight_lbs desc nulls last,
                     ss.actual_reps desc nulls last))[1]              as reps,
         (array_agg(ss.actual_weight_lbs
            order by ss.actual_weight_lbs desc nulls last,
                     ss.actual_reps desc nulls last))[1]              as weight_lbs,
         (array_agg(ss.actual_duration_seconds
            order by ss.actual_duration_seconds desc nulls last))[1]  as duration_seconds
  from   session_set ss
  join   session_exercise se on se.id = ss.session_exercise_id
  join   workout_session  ws on ws.id = se.session_id
  where  ss.status = 'completed'
    and  ss.set_role = 'working'
  group  by ws.user_id, se.exercise_slug, ws.id, ws.started_at
),
session_latest as (
  -- Newest session per (user, exercise).
  select distinct on (user_id, exercise_slug)
         user_id,
         exercise_slug,
         sets,
         reps,
         weight_lbs,
         duration_seconds,
         effective_at,
         'session'::text as source
  from   session_agg
  order  by user_id, exercise_slug, effective_at desc
),
combined as (
  select user_id, exercise_slug, sets, reps, weight_lbs, duration_seconds, effective_at, source
  from   plan_latest
  union all
  select user_id, exercise_slug, sets, reps, weight_lbs, duration_seconds, effective_at, source
  from   session_latest
)
select distinct on (user_id, exercise_slug)
       user_id,
       exercise_slug,
       sets,
       reps,
       weight_lbs,
       duration_seconds,
       effective_at,
       source
from   combined
order  by user_id, exercise_slug, effective_at desc;

-- Rest timers from the user's most recently touched plan line (plan-level UX).
create view user_last_plan_rest
  with (security_invoker = true)
as
select distinct on (w.user_id)
       w.user_id,
       we.planned_set_rest_seconds as set_rest_seconds,
       we.planned_end_rest_seconds as end_rest_seconds,
       we.updated_at               as effective_at
from   workout_exercise we
join   workout w on w.id = we.workout_id
order  by w.user_id, we.updated_at desc;
