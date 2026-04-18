-- Programmatic SEO pages table
create table if not exists seo_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  keyword text not null,
  pattern text not null,           -- 'best_x_for_y', 'alternative_to', 'is_there_app', 'how_to_build', 'top_x'
  category text not null,          -- 'productivity', 'finance', 'health', etc.
  title text not null,
  meta_description text not null,
  h1 text not null,
  intro text,                      -- 2-3 sentence hook
  market_summary text,             -- AI-generated market overview
  opportunity_score integer,       -- 0-100 estimated score
  competitor_count integer,        -- rough estimate
  key_insight text,                -- one-liner insight
  tags text[] default '{}',
  status text default 'draft',     -- 'draft', 'published', 'archived'
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  indexed_at timestamptz           -- when Google first indexed
);

-- Indexes for fast lookups
create index if not exists idx_seo_pages_slug on seo_pages (slug);
create index if not exists idx_seo_pages_status on seo_pages (status);
create index if not exists idx_seo_pages_category on seo_pages (category);
create index if not exists idx_seo_pages_pattern on seo_pages (pattern);
create index if not exists idx_seo_pages_tags on seo_pages using gin (tags);

-- RLS
alter table seo_pages enable row level security;

-- Public read for published pages (these are SEO pages, everyone can see them)
drop policy if exists "public_read_seo_pages" on seo_pages;
create policy "public_read_seo_pages" on seo_pages
  for select using (status = 'published');

-- Service role can do everything
drop policy if exists "service_all_seo_pages" on seo_pages;
create policy "service_all_seo_pages" on seo_pages
  for all to service_role using (true);

-- Related pages junction table for internal linking
create table if not exists seo_page_links (
  source_id uuid references seo_pages(id) on delete cascade,
  target_id uuid references seo_pages(id) on delete cascade,
  relevance_score float default 0.5,
  primary key (source_id, target_id)
);

alter table seo_page_links enable row level security;
drop policy if exists "public_read_seo_links" on seo_page_links;
create policy "public_read_seo_links" on seo_page_links for select using (true);
drop policy if exists "service_all_seo_links" on seo_page_links;
create policy "service_all_seo_links" on seo_page_links for all to service_role using (true);
