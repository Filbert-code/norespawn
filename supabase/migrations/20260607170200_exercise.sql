-- ============================================================================
-- 03 — Exercise catalog, the relationship graph, and the AI staging table
-- ============================================================================

-- ----------------------------------------------------------------------------
-- exercise — global, de-duplicated catalog
-- ----------------------------------------------------------------------------
create table exercise (
  slug                      text primary key,
  name                      text not null,
  name_normalized           text not null unique,
  tracking_type             tracking_type not null default 'weight_reps',
  body_group_slug           text not null references body_group(slug),
  body_sub_group_slug       text references body_sub_group(slug),
  equipment_slug            text references equipment(slug),
  movement_pattern          movement_pattern,
  mechanic                  mechanic,
  force_type                force_type,
  laterality                laterality not null default 'bilateral',
  default_sets              int     not null default 3,
  default_reps              int,
  default_weight_lbs        numeric,
  weight_increment_lbs      numeric,
  default_duration_seconds  int,
  default_set_rest_seconds  int     not null default 45,
  default_end_rest_seconds  int     not null default 120,
  image_url                 text,
  instructions              text,
  embedding                 vector(1536),
  source                    text    not null default 'seed',
  ai_model                  text,
  is_verified               boolean not null default false,
  is_archived               boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint exercise_default_sets_positive check (default_sets > 0),
  constraint exercise_metric_by_tracking_type check (
    case tracking_type
      when 'weight_reps'     then default_reps is not null
      when 'bodyweight_reps' then default_reps is not null
      when 'timed'           then default_duration_seconds is not null
      when 'distance_time'   then default_duration_seconds is not null
    end
  )
);

create index exercise_body_group_idx     on exercise (body_group_slug);
create index exercise_body_sub_group_idx on exercise (body_sub_group_slug);
create index exercise_equipment_idx      on exercise (equipment_slug);
create index exercise_movement_idx       on exercise (movement_pattern);
create index exercise_tracking_idx       on exercise (tracking_type);
create index exercise_active_idx         on exercise (is_archived) where is_archived = false;
-- Semantic search / de-dup over embeddings (cosine distance)
create index exercise_embedding_idx on exercise using hnsw (embedding vector_cosine_ops);

create trigger exercise_set_updated_at
  before update on exercise
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- exercise_relationship — directed edges forming the knowledge graph
-- ----------------------------------------------------------------------------
create table exercise_relationship (
  from_slug   text not null references exercise(slug) on delete cascade,
  to_slug     text not null references exercise(slug) on delete cascade,
  type        relationship_type not null,
  note        text,
  created_at  timestamptz not null default now(),
  primary key (from_slug, to_slug, type),
  constraint exercise_relationship_no_self check (from_slug <> to_slug)
);
create index exercise_relationship_to_idx   on exercise_relationship (to_slug, type);
create index exercise_relationship_from_idx on exercise_relationship (from_slug, type);

-- ----------------------------------------------------------------------------
-- exercise_candidate — AI generation staging area (admin / service-role only)
-- ----------------------------------------------------------------------------
create table exercise_candidate (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  name_normalized        text not null,
  proposed               jsonb not null,
  embedding              vector(1536),
  ai_model               text,
  prompt                 text,
  status                 text not null default 'pending',
  matched_exercise_slug  text references exercise(slug) on delete set null,
  similarity             numeric,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint exercise_candidate_status_check
    check (status in ('pending', 'promoted', 'rejected_duplicate', 'rejected_invalid'))
);
create index exercise_candidate_status_idx on exercise_candidate (status);
create index exercise_candidate_embedding_idx
  on exercise_candidate using hnsw (embedding vector_cosine_ops);

create trigger exercise_candidate_set_updated_at
  before update on exercise_candidate
  for each row execute function set_updated_at();
