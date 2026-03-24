-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tool TEXT NOT NULL CHECK (tool IN ('gap-analysis', 'stack-advisor')),
  idea TEXT NOT NULL,
  json_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_reports_user_id ON user_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON user_reports(created_at DESC);

-- Row Level Security (optional but recommended)
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
