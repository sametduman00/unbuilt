import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(sp.get("limit") || "50"), 100);
  const offset = parseInt(sp.get("offset") || "0");
  const category = sp.get("category");

  const sb = getSupabase();

  let query = sb
    .from("startup_ideas")
    .select("id, title, slug, category, one_liner, problem, target_audience, market_size, competition_level, difficulty, why_now, gap_reason, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ideas: data || [] });
}
