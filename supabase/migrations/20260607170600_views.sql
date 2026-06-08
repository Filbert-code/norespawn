-- ============================================================================
-- 07 — Derived views (security_invoker so base-table RLS applies to the caller)
-- ============================================================================

-- Latest score row per (user, exercise)
create view current_exercise_score
  with (security_invoker = true)
as
select distinct on (user_id, exercise_slug)
       user_id,
       exercise_slug,
       preference_score,
       intensity_score,
       effective_at
from   user_exercise_score
order  by user_id, exercise_slug, effective_at desc;

-- Most recent completed set per (user, exercise) — basis for smart defaults
create view user_exercise_last_performed
  with (security_invoker = true)
as
select distinct on (ws.user_id, se.exercise_slug)
       ws.user_id,
       se.exercise_slug,
       ss.actual_weight_lbs,
       ss.actual_reps,
       ss.actual_duration_seconds,
       ws.started_at as performed_at
from   session_set ss
join   session_exercise se on se.id = ss.session_exercise_id
join   workout_session  ws on ws.id = se.session_id
where  ss.status = 'completed'
order  by ws.user_id, se.exercise_slug, ws.started_at desc;
