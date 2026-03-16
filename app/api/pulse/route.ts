import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

// GET — read latest feed from cache
export async function GET() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("pulse_feed_cache")
      .select("signals, has_movement_data, sources, generated_at")
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.log("[PULSE GET] cache read error:", error?.message, "| data:", !!data);
      return NextResponse.json({
        signals: [], count: 0, hasMovementData: false,
        generatedAt: null, cached: false, debug: error?.message ?? "no data",
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

// PATCH — merge claudeGap analyses into the latest cache row
// Called by the frontend after analyze-ph completes, so next visitor gets analyses instantly
export async function PATCH(req: NextRequest) {
  try {
    const { updates } = await req.json() as {
      updates: { name: string; claudeGap: string }[];
    };
    if (!updates || updates.length === 0) {
      return NextResponse.json({ ok: false, reason: "no updates" });
    }

    const sb = getSupabase();

    // Read the latest cache row
    const { data, error } = await sb
      .from("pulse_feed_cache")
      .select("id, signals")
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ ok: false, reason: "no cache row" });
    }

    // Build a lookup map (lowercased name → claudeGap)
    const gapMap = new Map<string, string>();
    for (const u of updates) {
      gapMap.set(u.name.trim().toLowerCase(), u.claudeGap);
    }

    // Merge into signals array
    let mergedCount = 0;
    const updatedSignals = (data.signals as any[]).map((s: any) => {
      if (s.source !== "producthunt" || s.claudeGap) return s;
      const gap = gapMap.get(s.title?.trim().toLowerCase());
      if (!gap) return s;
      mergedCount++;
      return { ...s, claudeGap: gap };
    });

    // Write back
    const { error: updateError } = await sb
      .from("pulse_feed_cache")
      .update({ signals: updatedSignals })
      .eq("id", data.id);

    if (updateError) {
      console.log("[PULSE PATCH] update error:", updateError.message);
      return NextResponse.json({ ok: false, reason: updateError.message });
    }

    console.log(`[PULSE PATCH] merged ${mergedCount} analyses into cache row ${data.id}`);
    return NextResponse.json({ ok: true, merged: mergedCount });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PULSE PATCH] FAILED:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
