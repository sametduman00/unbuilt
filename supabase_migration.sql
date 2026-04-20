-- ============================================
-- FREEMIUM MIGRATION: user_subscriptions + free_analysis_log
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free',
  monthly_analyses INTEGER NOT NULL DEFAULT 0,
  purchased_analyses INTEGER NOT NULL DEFAULT 0,
  paddle_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create free_analysis_log for rate limiting
CREATE TABLE IF NOT EXISTS free_analysis_log (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_free_analysis_log_ip_date ON free_analysis_log (ip, created_at);

-- 3. Migrate existing credits to purchased_analyses
INSERT INTO user_subscriptions (user_id, plan, monthly_analyses, purchased_analyses, created_at)
SELECT user_id, 'free', 0, credits, created_at
FROM user_credits
WHERE credits > 0
ON CONFLICT (user_id) DO UPDATE SET purchased_analyses = EXCLUDED.purchased_analyses;

-- 4. RPC: deduct_monthly_analysis (returns true if deducted)
CREATE OR REPLACE FUNCTION deduct_monthly_analysis(p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE user_subscriptions
  SET monthly_analyses = monthly_analyses - 1
  WHERE user_id = p_user_id AND monthly_analyses > 0;
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- 5. RPC: deduct_purchased_analysis (returns true if deducted)
CREATE OR REPLACE FUNCTION deduct_purchased_analysis(p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE user_subscriptions
  SET purchased_analyses = purchased_analyses - 1
  WHERE user_id = p_user_id AND purchased_analyses > 0;
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- 6. RPC: add_purchased_analyses
CREATE OR REPLACE FUNCTION add_purchased_analyses(p_user_id TEXT, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, plan, monthly_analyses, purchased_analyses)
  VALUES (p_user_id, 'free', 0, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET purchased_analyses = user_subscriptions.purchased_analyses + p_amount;
END;
$$ LANGUAGE plpgsql;
