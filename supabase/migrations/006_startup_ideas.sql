-- Startup Ideas — auto-generated every 10 min
create table if not exists startup_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category text not null default 'general',
  one_liner text not null,
  problem text,
  target_audience text,
  market_size text,
  competition_level text,
  difficulty text,
  why_now text,
  gap_reason text,
  status text not null default 'published',
  created_at timestamptz not null default now()
);

create index if not exists idx_startup_ideas_status on startup_ideas(status);
create index if not exists idx_startup_ideas_created on startup_ideas(created_at desc);
create index if not exists idx_startup_ideas_slug on startup_ideas(slug);
create index if not exists idx_startup_ideas_category on startup_ideas(category);

-- RLS
alter table startup_ideas enable row level security;
create policy "Public read" on startup_ideas for select using (status = 'published');
