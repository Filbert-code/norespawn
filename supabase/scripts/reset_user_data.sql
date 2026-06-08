-- ============================================================================
-- reset_user_data.sql
--
-- Wipes ALL user-generated data (plans, live sessions, schedule, scores) while
-- preserving the seed/catalog data the app ships with (exercises, body groups,
-- sub-groups, equipment, lookups, exercise relationships/candidates).
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> paste -> Run.
--   (Runs as a privileged role, so RLS is bypassed and every row is removed.)
--
-- This is DESTRUCTIVE and cannot be undone. There is no per-user filter — it
-- clears the tables entirely, which is what you want for a personal reset.
--
-- TRUNCATE ... CASCADE handles FK ordering automatically (notably
-- workout_session.workout_id is ON DELETE RESTRICT, so a naive DELETE of
-- `workout` first would fail).
-- ============================================================================

begin;

truncate table
  session_event,        -- in-session timeline
  session_set,          -- performed sets
  session_exercise,     -- performed exercise line items
  workout_session,      -- live/completed/abandoned sessions
  scheduled_workout,    -- calendar schedule entries
  workout_set,          -- optional per-set plan targets
  workout_exercise,     -- plan exercise line items
  workout,              -- plans (headers)
  user_exercise_score   -- preference / intensity history
restart identity cascade;

commit;

-- ----------------------------------------------------------------------------
-- Tables intentionally NOT touched (seed / catalog):
--   exercise, exercise_relationship, exercise_candidate,
--   body_group, body_sub_group, equipment, and any lookup tables.
-- ----------------------------------------------------------------------------
