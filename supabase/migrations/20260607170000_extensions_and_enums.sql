-- ============================================================================
-- 01 — Extensions, enum types, and shared helpers
-- ============================================================================

-- gen_random_uuid() and crypto helpers
create extension if not exists pgcrypto;
-- pgvector — semantic de-dup & search on exercise embeddings
create extension if not exists vector;

-- ----------------------------------------------------------------------------
-- Enum types (fixed, code-coupled value sets)
-- ----------------------------------------------------------------------------
create type tracking_type as enum (
  'weight_reps', 'bodyweight_reps', 'timed', 'distance_time'
);

create type movement_pattern as enum (
  'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull',
  'hinge', 'squat', 'lunge', 'carry', 'core', 'isolation'
);

create type mechanic as enum ('compound', 'isolation');

create type force_type as enum ('push', 'pull', 'static');

create type laterality as enum ('bilateral', 'unilateral', 'alternating');

create type relationship_type as enum (
  'progression', 'regression', 'substitute', 'variation_of', 'antagonist'
);

create type session_status as enum ('in_progress', 'completed', 'abandoned');

create type set_status as enum ('pending', 'completed', 'skipped');

create type set_role as enum ('working', 'warmup', 'cooldown');

create type event_type as enum (
  'weight_changed', 'reps_changed', 'rest_changed',
  'set_added', 'set_removed', 'exercise_skipped',
  'set_completed', 'paused', 'resumed'
);

-- ----------------------------------------------------------------------------
-- Shared trigger function: keep updated_at fresh on UPDATE
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
