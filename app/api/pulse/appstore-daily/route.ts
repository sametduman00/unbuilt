import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

const TARGET_CATEGORIES = new Set([
  "Business","Productivity","Finance","Health & Fitness",
  "Education","Utilities","Developer Tools","Social Networking",
  "Medical","News","Reference","Travel","Food & Drink","Lifestyle",
]);

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch new apps from iTunes RSS
    const rss = await fetch(
      "https://itunes.apple.com/us/rss/newapplications/limit=200/json",
      { signal: AbortSignal.timeout(15_000) }
    );
    const rssData = await rss.json();
    const entries: any[] = rssData?.feed?.entry ?? [];

    const targetEntries = entries.filter((e) =>
      TARGET_CATEGORIES.has(e?.category?.attributes?.label ?? "")
    );

    console.log(`[APPSTORE-DAILY] RSS: ${entries.length} total, ${targetEntries.length} target`);

    if (targetEntries.length === 0) {
      return NextResponse.json({ ok: true, fetched: 0, saved: 0 });
    }

    // 2. iTunes Lookup for full details
    const ids = targetEntries
      .map((e) => e?.id?.attributes?.["im:id"])
      .filter(Boolean);

    const lookup = await fetch(
      `https://itunes.apple.com/lookup?id=${ids.join(",")}&country=us`,
      { signal: AbortSignal.timeout(15_000) }
    );
    const lookupData = await lookup.json();
    const apps: any[] = (lookupData.results ?? []).filter(
      (a: any) => a.wrapperType === "software"
    );

    // 3. Filter non-English apps
    const englishApps = apps.filter((a) => {
      const desc = a.description ?? "";
      const ratio = desc.replace(/[^\x00-\x7F]/g, "").length / (desc.length || 1);
      return ratio > 0.7 && desc.length > 50;
    });

    console.log(`[APPSTORE-DAILY] After filter: ${englishApps.length} apps`);

    // 4. Upsert into DB
    const sb = getSupabase();
    const rows = englishApps.map((a) => ({
      app_id: String(a.trackId),
      app_name: a.trackName,
      developer: a.artistName,
      category: a.primaryGenreName,
      description: a.description?.substring(0, 1000),
      icon_url: a.artworkUrl100,
      store_url: a.trackViewUrl,
      price: a.formattedPrice ?? "Free",
      release_date: a.releaseDate?.substring(0, 10),
      rating: a.averageUserRating ?? null,
      review_count: a.userRatingCount ?? 0,
      last_checked_at: new Date().toISOString(),
    }));

    const { error: upsertErr } = await sb
      .from("appstore_new_apps")
      .upsert(rows, { onConflict: "app_id", ignoreDuplicates: true });

    if (upsertErr) console.error("[APPSTORE-DAILY] Upsert error:", upsertErr.message);

    // 5. Claude analysis for unanalyzed apps
    const appIds = rows.map((r) => r.app_id);
    const { data: needsAnalysis } = await sb
      .from("appstore_new_apps")
      .select("app_id,app_name,description,category")
      .in("app_id", appIds)
      .is("claude_what", null)
      .limit(30);

    if (needsAnalysis && needsAnalysis.length > 0) {
      await analyzeApps(needsAnalysis, sb);
      console.log(`[APPSTORE-DAILY] Analyzed ${needsAnalysis.length} apps`);
    }

    // 6. Rebuild feed cache — last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: feedApps } = await sb
      .from("appstore_new_apps")
      .select("*")
      .gte("first_seen_at", ninetyDaysAgo)
      .order("first_seen_at", { ascending: false })
      .limit(500);

    if (feedApps && feedApps.length > 0) {
      await sb.from("appstore_feed_cache").insert({
        apps: feedApps,
        app_count: feedApps.length,
        generated_at: new Date().toISOString(),
      });
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      await sb.from("appstore_feed_cache").delete().lt("generated_at", cutoff);
    }

    console.log(`[APPSTORE-DAILY] DONE: ${rows.length} saved, feed: ${feedApps?.length ?? 0}`);

    return NextResponse.json({
      ok: true,
      fetched: apps.length,
      saved: rows.length,
      analyzed: needsAnalysis?.length ?? 0,
      feedTotal: feedApps?.length ?? 0,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[APPSTORE-DAILY] FAILED:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

async function analyzeApps(apps: any[], sb: any) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return;

  await Promise.all(
    apps.map(async (app) => {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 150,
            messages: [{
              role: "user",
              content: `App: ${app.app_name}\nCategory: ${app.category}\nDescription: ${app.description?.substring(0, 300)}\n\nRespond ONLY with JSON (max 10 words each):\n{"what":"what it does","different":"key differentiator","missing":"biggest gap"}`
            }],
          }),
          signal: AbortSignal.timeout(10_000),
        });
        const data = await res.json();
        const text = data?.content?.[0]?.text ?? "";
        const clean = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        await sb.from("appstore_new_apps").update({
          claude_what: parsed.what,
          claude_different: parsed.different,
          claude_missing: parsed.missing,
          claude_analyzed_at: new Date().toISOString(),
        }).eq("app_id", app.app_id);
      } catch (_) { /* skip */ }
    })
  );
}
