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

    // ── STEP 1: Backfill screenshots for previous days ──────────────────
    const { data: prevRows } = await sb
      .from("appstore_daily_cache")
      .select("id, fetch_date, apps")
      .neq("fetch_date", today)
      .order("fetch_date", { ascending: false })
      .limit(6);

    if (prevRows && prevRows.length > 0) {
      for (const row of prevRows) {
        const apps = row.apps as any[];
        const missing = apps.filter(a => !a.screenshot_urls || a.screenshot_urls.length === 0);
        if (missing.length === 0) continue;

        console.log("[APPSTORE] Backfilling " + missing.length + " screenshots for " + row.fetch_date);
        const ids = missing.map(a => a.app_id).filter(Boolean).slice(0, 200);

        // Lookup in batches of 100
        const updated = new Map<string, string[]>();
        for (let i = 0; i < ids.length; i += 100) {
          const batch = ids.slice(i, i + 100);
          try {
            const r = await fetch(
              "https://itunes.apple.com/lookup?id=" + batch.join(",") + "&country=us",
              { signal: AbortSignal.timeout(15_000) }
            );
            const d = await r.json();
            for (const a of d.results ?? []) {
              if (a.screenshotUrls?.length > 0) {
                updated.set(String(a.trackId), a.screenshotUrls.slice(0, 5));
              }
            }
          } catch { /* skip failed batch */ }
        }

        if (updated.size > 0) {
          const patched = apps.map(a => {
            const ss = updated.get(a.app_id);
            return ss ? { ...a, screenshot_urls: ss } : a;
          });
          await sb.from("appstore_daily_cache").update({ apps: patched }).eq("id", row.id);
          console.log("[APPSTORE] Backfilled " + updated.size + " apps for " + row.fetch_date);
        }
      }
    }

    // ── STEP 2: Skip if already fetched today ────────────────────────────
    const { data: existing } = await sb
      .from("appstore_daily_cache")
      .select("id, app_count")
      .eq("fetch_date", today)
      .single();

    if (existing) {
      console.log("[APPSTORE] Already ran today, skipping fetch");
      return NextResponse.json({ ok: true, skipped: true, appCount: existing.app_count });
    }

    // ── STEP 3: Fetch today's new apps from iTunes RSS ───────────────────
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

    // ── STEP 4: Lookup full details + screenshots ────────────────────────
    const ids = entries.map(e => e?.id?.attributes?.["im:id"]).filter(Boolean);
    const lookup = await fetch(
      "https://itunes.apple.com/lookup?id=" + ids.join(",") + "&country=us",
      { signal: AbortSignal.timeout(20_000) }
    );
    const lookupData = await lookup.json();
    const apps: any[] = (lookupData.results ?? []).filter((a: any) => a.wrapperType === "software");

    // ── STEP 5: English filter ───────────────────────────────────────────
    const englishApps = apps.filter((a: any) => {
      const desc = a.description ?? "";
      const ratio = desc.replace(/[^\x00-\x7F]/g, "").length / (desc.length || 1);
      return ratio > 0.7 && desc.length > 100;
    });
    console.log("[APPSTORE] After English filter: " + englishApps.length + " apps");

    // ── STEP 6: Claude Vision analysis ──────────────────────────────────
    const analyzed = await analyzeAppsWithVision(englishApps);

    // ── STEP 7: Save ─────────────────────────────────────────────────────
    const { error } = await sb.from("appstore_daily_cache").insert({
      fetch_date: today,
      apps: analyzed,
      app_count: analyzed.length,
      generated_at: new Date().toISOString(),
    });
    if (error) console.error("[APPSTORE] Insert error:", error.message);

    // Keep only last 7 days
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
    for (const url of screenshots) {
      try {
        const imgRes = await fetch(url, { signal: AbortSignal.timeout(8_000) });
        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer();
          const b64 = Buffer.from(buffer).toString("base64");
          const ct = (imgRes.headers.get("content-type") || "image/jpeg").split(";")[0];
          content.push({ type: "image", source: { type: "base64", media_type: ct, data: b64 } });
        }
      } catch { /* skip */ }
    }
    content.push({
      type: "text",
      text: "App: " + app.trackName + "\nCategory: " + app.primaryGenreName + "\nPrice: " + (app.formattedPrice || "Free") + "\nDescription: " + (app.description?.substring(0, 400) ?? "") + "\n\nBased on the screenshots and description, answer in English (max 12 words each):\n{\"what\": \"what it does and who it's for\",\"different\": \"what genuinely sets it apart\",\"missing\": \"most obvious gap or missing feature\"}\n\nReturn ONLY the JSON object, no markdown."
    });
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 200, messages: [{ role: "user", content }] }),
      signal: AbortSignal.timeout(30_000),
    });
    const data = await res.json();
    const text = data?.content?.[0]?.text ?? "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return { ...base, claude_what: parsed.what ?? null, claude_different: parsed.different ?? null, claude_missing: parsed.missing ?? null, claude_analyzed_at: new Date().toISOString() };
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
    claude_what: null, claude_different: null, claude_missing: null, claude_analyzed_at: null,
  };
}
