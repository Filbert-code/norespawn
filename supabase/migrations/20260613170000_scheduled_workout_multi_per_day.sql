-- ============================================================================
-- 12 — scheduled_workout: allow multiple workouts per day (revises D10)
--   The table was already a row-per-(user, date, workout) model; "one per day"
--   was only an artificial unique index + an upsert + a single-card UI. Drop the
--   index and add an intra-day `position` for stable, user-defined ordering.
--   Purely additive — existing rows backfill to position 0.
-- ============================================================================

drop index if exists scheduled_workout_user_date_uq;

alter table scheduled_workout
  add column if not exists position smallint not null default 0;

-- Ordered reads per day (also supersedes the old plain user/date index intent).
create index if not exists scheduled_workout_user_date_pos_idx
  on scheduled_workout (user_id, scheduled_date, position);

-- Atomic append: verify plan ownership, assign the next position within the
-- (user, date), and insert. Keeps "what scheduling means" server-side and
-- race-free now that multiple rows per day are allowed.
create or replace function schedule_workout(
  p_workout_id uuid,
  p_date       date,
  p_notes      text default null
)
returns scheduled_workout
language plpgsql
security invoker
as $$
declare
  v_user uuid := auth.uid();
  v_pos  smallint;
  v_row  scheduled_workout;
begin
  if v_user is null then
    raise exception 'not signed in';
  end if;

  if not exists (
    select 1 from workout where id = p_workout_id and user_id = v_user
  ) then
    raise exception 'workout not found or not owned by caller';
  end if;

  select coalesce(max(position) + 1, 0) into v_pos
  from   scheduled_workout
  where  user_id = v_user and scheduled_date = p_date;

  insert into scheduled_workout
    (user_id, workout_id, scheduled_date, status, notes, position)
  values
    (v_user, p_workout_id, p_date, 'scheduled', p_notes, v_pos)
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function schedule_workout(uuid, date, text) to authenticated;
