CREATE TABLE IF NOT EXISTS pulse_snapshots (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  app_id TEXT NOT NULL,
  app_name TEXT NOT NULL,
  rank INTEGER NOT NULL,
  review_count INTEGER,
  rating FLOAT,
  url TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON pulse_snapshots(source, category, captured_at);
CREATE INDEX ON pulse_snapshots(app_id, captured_at);
