create table if not exists pulse_feed_cache (
  id bigint generated always as identity primary key,
  signals jsonb not null,
  has_movement_data boolean not null default false,
  sources jsonb,
  generated_at timestamptz not null default now()
);

-- Sadece son 48 saati tut
create index if not exists pulse_feed_cache_generated_at
  on pulse_feed_cache (generated_at desc);
