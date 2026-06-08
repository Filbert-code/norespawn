-- ============================================================================
-- 10 — scheduled_workout: enforce one workout per day (decision D10)
--   The calendar day-detail surfaces a single workout per day, so guarantee it
--   at the database level. The unique index also supersedes the plain
--   (user_id, scheduled_date) index created in the original table migration.
-- ============================================================================

drop index if exists scheduled_workout_user_date_idx;

create unique index scheduled_workout_user_date_uq
  on scheduled_workout (user_id, scheduled_date);
