CREATE TABLE IF NOT EXISTS opportunity_cache (
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  opportunities JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  app_count INTEGER DEFAULT 0,
  PRIMARY KEY (category, subcategory)
);

CREATE INDEX IF NOT EXISTS idx_opportunity_cache_generated_at
  ON opportunity_cache(generated_at);
