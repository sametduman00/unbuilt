import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

// GET /api/seo?slug=xxx  — fetch single page
// GET /api/seo?status=published&limit=100&offset=0 — list pages
// GET /api/seo?slugs=all — all published slugs (for sitemap)
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const slug = sp.get("slug");
  const slugsAll = sp.get("slugs");
  const status = sp.get("status") || "published";
  const limit = Math.min(parseInt(sp.get("limit") || "50"), 500);
  const offset = parseInt(sp.get("offset") || "0");
  const category = sp.get("category");

  const sb = getSupabase();

  // Single page by slug
  if (slug) {
    const { data, error } = await sb
      .from("seo_pages")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fetch related pages (same category, different slug)
    const { data: related } = await sb
      .from("seo_pages")
      .select("slug, keyword, title, opportunity_score, category")
      .eq("status", "published")
      .eq("category", data.category)
      .neq("slug", slug)
      .order("opportunity_score", { ascending: false })
      .limit(8);

    return NextResponse.json({ page: data, related: related || [] });
  }

  // All slugs for sitemap
  if (slugsAll === "all") {
    const { data, error } = await sb
      .from("seo_pages")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ slugs: data || [] });
  }

  // List pages
  let query = sb
    .from("seo_pages")
    .select("slug, keyword, title, category, pattern, opportunity_score, competitor_count, key_insight, tags", { count: "exact" })
    .eq("status", status)
    .order("opportunity_score", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pages: data || [], total: count || 0 });
}
