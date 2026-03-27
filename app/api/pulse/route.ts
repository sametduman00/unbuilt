import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";
import { validatePulsePatchBody, checkPayloadSize, errorResponse } from "@/app/lib/validate";

// GET — public, no auth needed (Pulse feed is global/public data)
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
      return NextResponse.json({
        signals: [], count: 0, hasMovementData: false,
        generatedAt: null, cached: false, debug: error?.message ?? "no data",
      });
    }

    return NextResponse.json({
      signals: data.signals,
      count: (data.signals as unknown[]).length,
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

// PATCH — merge claudeGap analyses into cache
// Requires: authenticated user (Clerk) OR internal COCKPIT_API_KEY
// Protects against anonymous manipulation of the global Pulse feed
export async function PATCH(req: NextRequest) {
  // Auth: accept either a logged-in user or an internal service key
  const cockpitKey = req.headers.get("x-cockpit-key");
  const isServiceCall = cockpitKey && cockpitKey === process.env.COCKPIT_API_KEY;

  if (!isServiceCall) {
    // Require Clerk session for user-facing calls
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    if (!checkPayloadSize(req)) return new Response(JSON.stringify({ error: "Request payload too large." }), { status: 413, headers: { "Content-Type": "application/json" } });
    let rawBody: unknown;
    try { rawBody = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
    const validation = validatePulsePatchBody(rawBody);
    if (!validation.ok) return errorResponse(validation);
    const { updates } = validation.data;

    const sb = getSupabase();

    const { data, error } = await sb
      .from("pulse_feed_cache")
      .select("id, signals")
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ ok: false, reason: "no cache row" });
    }

    const gapMap = new Map<string, string>();
    for (const u of updates) {
      gapMap.set(u.name.trim().toLowerCase(), u.claudeGap);
    }

    let mergedCount = 0;
    const updatedSignals = (data.signals as unknown[]).map((s: unknown) => {
      const signal = s as Record<string, unknown>;
      if (signal.source !== "producthunt" || signal.claudeGap) return signal;
      const gap = gapMap.get(String(signal.title ?? "").trim().toLowerCase());
      if (!gap) return signal;
      mergedCount++;
      return { ...signal, claudeGap: gap };
    });

    const { error: updateError } = await sb
      .from("pulse_feed_cache")
      .update({ signals: updatedSignals })
      .eq("id", data.id);

    if (updateError) {
      return NextResponse.json({ ok: false, reason: updateError.message });
    }

    return NextResponse.json({ ok: true, merged: mergedCount });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
