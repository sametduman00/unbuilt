import { NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

export async function GET() {
  try {
    const sb = getSupabase();

    // Cache'den en son feed'i oku
    const { data, error } = await sb
      .from("pulse_feed_cache")
      .select("signals, has_movement_data, sources, generated_at")
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Cache henüz yok — ilk kurulum mesajı
      return NextResponse.json({
        signals: [],
        count: 0,
        hasMovementData: false,
        generatedAt: null,
        cached: false,
      });
    }

    return NextResponse.json({
      signals: data.signals,
      count: (data.signals as any[]).length,
      hasMovementData: data.has_movement_data,
      generatedAt: data.generated_at,
      sources: data.sources,
      cached: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ signals: [], count: 0, hasMovementData: false, error: msg });
  }
}
