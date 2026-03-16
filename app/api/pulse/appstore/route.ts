import { NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

export async function GET() {
  try {
    const sb = getSupabase();
    const { data: cache } = await sb
      .from("appstore_feed_cache")
      .select("apps, app_count, generated_at")
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();
    if (!cache) {
      return NextResponse.json({ apps: [], appCount: 0, generatedAt: null });
    }
    return NextResponse.json({
      apps: cache.apps,
      appCount: cache.app_count,
      generatedAt: cache.generated_at,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
