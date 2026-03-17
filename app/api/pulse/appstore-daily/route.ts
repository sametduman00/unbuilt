import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().substring(0, 10);
    const sb = getSupabase();

    // Skip if already ran today
    const { data: existing } = await sb
      .from("appstore_daily_cache")
      .select("id, app_count")
      .eq("fetch_date", today)
      .single();
    if (existing) {
      console.log("[APPSTORE] Already ran today, skipping");
      return NextResponse.json({ ok: true, skipped: true, appCount: existing.app_count });
    }

    // 1. iTunes RSS — ALL new apps today (no category filter)
    const rss = await fetch(
      "https://itunes.apple.com/us/rss/newapplications/limit=200/json",
      { signal: AbortSignal.timeout(15_000) }
    );
    const rssData = await rss.json();
    const entries: any[] = rssData?.feed?.entry ?? [];
    console.log("[APPSTORE] RSS: " + entries.length + " new apps today");

    if (entries.length === 0) {
      return NextResponse.json({ ok: true, fetched: 0, saved: 0 });
    }

    // 2. Lookup API — full details + screenshots
    const ids = entries.map(e => e?.id?.attributes?.["im:id"]).filter(Boolean);
    const lookup = await fetch(
      "https://itunes.apple.com/lookup?id=" + ids.join(",") + "&country=us",
      { signal: AbortSignal.timeout(20_000) }
    );
    const lookupData = await lookup.json();
    const apps: any[] = (lookupData.results ?? []).filter((a: any) => a.wrapperType === "software");

    // 3. Filter: English only (description mostly ASCII, min 100 chars)
    const englishApps = apps.filter((a: any) => {
      const desc = a.description ?? "";
      const ratio = desc.replace(/[^\x00-\x7F]/g, "").length / (desc.length || 1);
      return ratio > 0.7 && desc.length > 100;
    });
    console.log("[APPSTORE] After English filter: " + englishApps.length + " apps");

    // 4. Analyze each app with Claude Vision (screenshots + description)
    const analyzed = await analyzeAppsWithVision(englishApps);

    // 5. Save to appstore_daily_cache
    const { error } = await sb.from("appstore_daily_cache").insert({
      fetch_date: today,
      apps: analyzed,
      app_count: analyzed.length,
      generated_at: new Date().toISOString(),
    });
    if (error) console.error("[APPSTORE] Insert error:", error.message);

    // 6. Keep only last 7 days
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    await sb.from("appstore_daily_cache").delete().lt("fetch_date", cutoff);

    console.log("[APPSTORE] DONE: " + analyzed.length + " apps saved for " + today);
    return NextResponse.json({ ok: true, fetched: apps.length, english: englishApps.length, saved: analyzed.length });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[APPSTORE] FAILED:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

async function analyzeAppsWithVision(apps: any[]): Promise<any[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return apps.map(formatApp);

  const results: any[] = [];

  // 5 parallel at a time
  for (let i = 0; i < apps.length; i += 5) {
    const batch = apps.slice(i, i + 5);
    const batchResults = await Promise.all(batch.map(app => analyzeOne(app, apiKey)));
    results.push(...batchResults);
    console.log("[APPSTORE VISION] batch " + (Math.floor(i / 5) + 1) + "/" + Math.ceil(apps.length / 5) + " done");
  }

  return results;
}

async function analyzeOne(app: any, apiKey: string): Promise<any> {
  const base = formatApp(app);

  try {
    const screenshots: string[] = (app.screenshotUrls ?? []).slice(0, 3);
    const content: any[] = [];

    // Fetch screenshots and encode as base64 for Vision
    for (const url of screenshots) {
      try {
        const imgRes = await fetch(url, { signal: AbortSignal.timeout(8_000) });
        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer();
          const b64 = Buffer.from(buffer).toString("base64");
          const ct = (imgRes.headers.get("content-type") || "image/jpeg").split(";")[0];
          content.push({ type: "image", source: { type: "base64", media_type: ct, data: b64 } });
        }
      } catch { /* skip failed image */ }
    }

    content.push({
      type: "text",
      text: "App: " + app.trackName +
        "\nCategory: " + app.primaryGenreName +
        "\nPrice: " + (app.formattedPrice || "Free") +
        "\nDescription: " + (app.description?.substring(0, 400) ?? "") +
        "\n\nBased on the screenshots and description, answer in English (max 12 words each):\n{\"what\": \"what it does and who it's for\",\"different\": \"what genuinely sets it apart\",\"missing\": \"most obvious gap or missing feature\"}\n\nReturn ONLY the JSON object, no markdown."
    });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content }],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    const data = await res.json();
    const text = data?.content?.[0]?.text ?? "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    return {
      ...base,
      claude_what: parsed.what ?? null,
      claude_different: parsed.different ?? null,
      claude_missing: parsed.missing ?? null,
      claude_analyzed_at: new Date().toISOString(),
    };
  } catch (e) {
    console.log("[APPSTORE VISION] " + app.trackName + " failed: " + (e instanceof Error ? e.message : String(e)));
    return base;
  }
}

function formatApp(app: any) {
  return {
    app_id: String(app.trackId),
    app_name: app.trackName,
    developer: app.artistName,
    category: app.primaryGenreName,
    price: app.formattedPrice ?? "Free",
    icon_url: app.artworkUrl512 || app.artworkUrl100,
    store_url: app.trackViewUrl,
    release_date: app.releaseDate?.substring(0, 10),
    description: app.description?.substring(0, 500),
    rating: app.averageUserRating ?? null,
    review_count: app.userRatingCount ?? 0,
    min_os: app.minimumOsVersion,
    age_rating: app.contentAdvisoryRating,
    languages: app.languageCodesISO2A ?? [],
    screenshot_urls: (app.screenshotUrls ?? []).slice(0, 5),
    file_size_mb: app.fileSizeBytes ? Math.round(parseInt(app.fileSizeBytes) / 1024 / 1024) : null,
    claude_what: null,
    claude_different: null,
    claude_missing: null,
    claude_analyzed_at: null,
  };
}
