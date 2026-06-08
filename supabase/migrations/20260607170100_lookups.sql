-- ============================================================================
-- 02 — Lookup / taxonomy tables (reference data, world-readable)
-- ============================================================================

create table body_group (
  slug        text primary key,
  label       text not null,
  sort_order  int  not null default 0,
  icon        text,
  created_at  timestamptz not null default now()
);

create table body_sub_group (
  slug             text primary key,
  body_group_slug  text not null references body_group(slug) on delete cascade,
  label            text not null,
  sort_order       int  not null default 0,
  created_at       timestamptz not null default now()
);
create index body_sub_group_group_idx on body_sub_group (body_group_slug, sort_order);

create table equipment (
  slug        text primary key,
  label       text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);
