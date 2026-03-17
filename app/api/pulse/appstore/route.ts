import { NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

export async function GET() {
  try {
    const sb = getSupabase();
    const today = new Date().toISOString().substring(0, 10);

    const { data: rows } = await sb
      .from("appstore_daily_cache")
      .select("fetch_date, apps, app_count, generated_at")
      .order("fetch_date", { ascending: false })
      .limit(7);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ days: [], totalApps: 0 });
    }

    const days = rows.map(row => ({
      date: row.fetch_date,
      isToday: row.fetch_date === today,
      apps: (row.apps as any[]).map(app => ({ ...app, isToday: row.fetch_date === today })),
      appCount: row.app_count,
      generatedAt: row.generated_at,
    }));

    return NextResponse.json({
      days,
      totalApps: days.reduce((s, d) => s + d.appCount, 0),
      todayCount: days.find(d => d.isToday)?.appCount ?? 0,
      generatedAt: rows[0].generated_at,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
