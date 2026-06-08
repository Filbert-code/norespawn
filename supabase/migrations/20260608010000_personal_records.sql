-- ============================================================================
-- 10 — personal_records view (D11)
--
-- Per (user, exercise): best heaviest set, est. 1RM (Epley), best set volume,
-- best rep count. Computed on-read from completed `session_set` rows so the
-- live session never has to write PR snapshots.
--
-- Uses `security_invoker` so base-table RLS (own sessions only) is honoured.
-- ============================================================================

create view personal_records
  with (security_invoker = true)
as
with completed as (
  select ws.user_id,
         se.exercise_slug,
         ss.actual_reps,
         ss.actual_weight_lbs,
         ws.started_at
  from   session_set ss
  join   session_exercise se on se.id = ss.session_exercise_id
  join   workout_session  ws on ws.id = se.session_id
  where  ss.status = 'completed'
    and  ss.actual_reps    is not null
    and  ss.actual_weight_lbs is not null
),
best_weight as (
  -- heaviest single completed set; ties broken by reps then date
  select distinct on (user_id, exercise_slug)
         user_id, exercise_slug,
         actual_weight_lbs as best_weight_lbs,
         actual_reps        as best_weight_reps,
         started_at         as best_weight_at
  from   completed
  order  by user_id, exercise_slug,
            actual_weight_lbs desc, actual_reps desc, started_at desc
),
best_one_rm as (
  -- Epley: 1RM = weight * (1 + reps/30)
  select distinct on (user_id, exercise_slug)
         user_id, exercise_slug,
         actual_weight_lbs * (1 + actual_reps::numeric / 30) as est_one_rm_lbs,
         actual_weight_lbs as one_rm_weight_lbs,
         actual_reps        as one_rm_reps,
         started_at         as one_rm_at
  from   completed
  order  by user_id, exercise_slug,
            actual_weight_lbs * (1 + actual_reps::numeric / 30) desc, started_at desc
),
best_volume as (
  -- single-set volume PR
  select distinct on (user_id, exercise_slug)
         user_id, exercise_slug,
         actual_weight_lbs * actual_reps as best_set_volume_lbs,
         actual_weight_lbs as set_volume_weight_lbs,
         actual_reps        as set_volume_reps,
         started_at         as set_volume_at
  from   completed
  order  by user_id, exercise_slug,
            actual_weight_lbs * actual_reps desc, started_at desc
),
best_reps as (
  select distinct on (user_id, exercise_slug)
         user_id, exercise_slug,
         actual_reps  as rep_pr_reps,
         actual_weight_lbs as rep_pr_weight_lbs,
         started_at         as rep_pr_at
  from   completed
  order  by user_id, exercise_slug, actual_reps desc, actual_weight_lbs desc, started_at desc
)
select bw.user_id,
       bw.exercise_slug,
       bw.best_weight_lbs,
       bw.best_weight_reps,
       bw.best_weight_at,
       bo.est_one_rm_lbs,
       bo.one_rm_weight_lbs,
       bo.one_rm_reps,
       bo.one_rm_at,
       bv.best_set_volume_lbs,
       bv.set_volume_weight_lbs,
       bv.set_volume_reps,
       bv.set_volume_at,
       br.rep_pr_reps,
       br.rep_pr_weight_lbs,
       br.rep_pr_at
from   best_weight bw
join   best_one_rm bo using (user_id, exercise_slug)
join   best_volume bv using (user_id, exercise_slug)
join   best_reps   br using (user_id, exercise_slug);
