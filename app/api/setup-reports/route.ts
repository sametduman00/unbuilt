import { NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

export async function GET() {
  const supabase = getSupabase();
  // Create table if not exists via raw SQL
  const { error } = await supabase.rpc("exec_sql", {
    sql: `
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
    `
  });

  if (error) {
    // Try direct insert as table might already exist
    return NextResponse.json({ status: "Table may already exist", error: error.message });
  }
  return NextResponse.json({ status: "ok" });
}
