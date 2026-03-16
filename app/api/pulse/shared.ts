import { getSupabase } from "@/app/lib/supabase";

/* ── Types ────────────────────────────────────────────────────── */

export interface AppSnapshot {
  source: string;
  category: string;
  app_id: string;
  app_name: string;
  rank: number;
  review_count: number | null;
  rating: number | null;
  url: string;
}

/* ── iTunes Genre IDs ─────────────────────────────────────────── */

export const ITUNES_CATEGORIES: { name: string; genreId: number }[] = [
  { name: "Overall", genreId: 0 },
  { name: "Games", genreId: 6014 },
  { name: "Business", genreId: 6000 },
  { name: "Education", genreId: 6017 },
  { name: "Entertainment", genreId: 6016 },
  { name: "Finance", genreId: 6015 },
  { name: "Health & Fitness", genreId: 6013 },
  { name: "Productivity", genreId: 6007 },
  { name: "Social Networking", genreId: 6005 },
];

export const FETCH_HEADERS = { "User-Agent": "Mozilla/5.0" };

/* ── Fetch App Store via iTunes RSS feed ──────────────────────── */

async function fetchAppStoreCategory(cat: { name: string; genreId: number }): Promise<AppSnapshot[]> {
  try {
    // Overall = no genre param; others get /genre=ID/
    const url = cat.genreId === 0
      ? "https://itunes.apple.com/us/rss/topfreeapplications/limit=50/json"
      : `https://itunes.apple.com/us/rss/topfreeapplications/limit=50/genre=${cat.genreId}/json`;
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.log(`APPSTORE ${cat.name}: HTTP ${res.status} url=${url}`);
      return [];
    }
    const data = await res.json();
    const entries = data?.feed?.entry ?? [];
    console.log(`APPSTORE ${cat.name}: ${entries.length} apps (url=${url})`);

    return entries.map((entry: any, i: number): AppSnapshot => {
      const appId = entry.id?.attributes?.["im:id"] ?? entry["im:name"]?.label ?? `unknown-${i}`;
      const appName = entry["im:name"]?.label ?? "Unknown";
      const rating = parseFloat(entry["im:rating"]?.label) || null;
      const reviewCount = parseInt(entry["im:ratingCount"]?.label) || null;
      const appUrl = entry.link?.attributes?.href ?? "";

      return {
        source: "appstore",
        category: cat.name,
        app_id: String(appId),
        app_name: appName,
        rank: i + 1,
        review_count: reviewCount,
        rating,
        url: appUrl,
      };
    });
  } catch (err) {
    console.log(`APPSTORE ${cat.name}: ERROR ${err instanceof Error ? err.message : err}`);
    return [];
  }
}

export async function fetchAppStore(): Promise<AppSnapshot[]> {
  try {
    console.log("APP STORE: fetching", ITUNES_CATEGORIES.length, "categories via iTunes RSS");

    // Probe: fetch ONE category first and log raw response shape
    try {
      const probeUrl = "https://itunes.apple.com/us/rss/topfreeapplications/limit=50/json";
      const probeRes = await fetch(probeUrl, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(10000) });
      console.log("APP STORE PROBE: HTTP", probeRes.status, "url=", probeUrl);
      if (probeRes.ok) {
        const probeData = await probeRes.json();
        const probeEntries = probeData?.feed?.entry;
        console.log("APP STORE PROBE: feed.entry is", Array.isArray(probeEntries) ? `array[${probeEntries.length}]` : typeof probeEntries);
        if (Array.isArray(probeEntries) && probeEntries.length > 0) {
          const first = probeEntries[0];
          console.log("APP STORE PROBE: first entry keys:", Object.keys(first).join(", "));
          console.log("APP STORE PROBE: first app:", first["im:name"]?.label, "| id:", first.id?.attributes?.["im:id"]);
        }
      }
    } catch (probeErr) {
      console.log("APP STORE PROBE FAILED:", probeErr instanceof Error ? probeErr.message : probeErr);
    }

    const batch1 = ITUNES_CATEGORIES.slice(0, 9);
    const batch2 = ITUNES_CATEGORIES.slice(9);

    const results1 = await Promise.all(batch1.map(fetchAppStoreCategory));
    console.log("APP STORE: batch1 done,", results1.flat().length, "apps from", results1.filter(r => r.length > 0).length, "categories");
    const results2 = await Promise.all(batch2.map(fetchAppStoreCategory));
    console.log("APP STORE: batch2 done,", results2.flat().length, "apps from", results2.filter(r => r.length > 0).length, "categories");
    const results = [...results1, ...results2];

    const flat = results.flat();
    const successCount = results.filter((r) => r.length > 0).length;
    console.log("APP STORE: got", flat.length, "total apps from", successCount, "/", ITUNES_CATEGORIES.length, "categories");
    return flat;
  } catch (err) {
    console.log("APP STORE: top-level fetch FAILED:", err instanceof Error ? err.message : err);
    return [];
  }
}

/* ── Fetch Google Play (top 50 free) ──────────────────────────── */

export async function fetchPlayStore(): Promise<AppSnapshot[]> {
  try {
    const gplay = (await import("google-play-scraper")).default as any;
    const results = await gplay.list({
      collection: gplay.collection.TOP_FREE,
      num: 50,
      country: "us",
      lang: "en",
      fullDetail: false,
    });
    console.log(`[PULSE] Play Store: ${results.length} apps`);
    return results.map((app: any, i: number): AppSnapshot => ({
      source: "playstore",
      category: "Overall",
      app_id: app.appId,
      app_name: app.title,
      rank: i + 1,
      review_count: app.ratings ?? null,
      rating: app.score ?? null,
      url: app.url ?? `https://play.google.com/store/apps/details?id=${app.appId}`,
    }));
  } catch (err) {
    console.log(`[PULSE] Play Store FAILED:`, err instanceof Error ? err.message : err);
    return [];
  }
}

/* ── Save snapshots to Supabase ───────────────────────────────── */

export async function saveSnapshots(snapshots: AppSnapshot[]): Promise<{ ok: boolean; count: number }> {
  if (snapshots.length === 0) return { ok: false, count: 0 };
  const sb = getSupabase();
  const now = new Date().toISOString();
  let totalInserted = 0;

  for (let i = 0; i < snapshots.length; i += 500) {
    const batch = snapshots.slice(i, i + 500).map((s) => ({
      source: s.source,
      category: s.category,
      app_id: s.app_id,
      app_name: s.app_name,
      rank: s.rank,
      review_count: s.review_count,
      rating: s.rating,
      url: s.url,
      captured_at: now,
    }));
    const { error } = await sb.from("pulse_snapshots").insert(batch);
    if (error) {
      console.log("SUPABASE INSERT ERROR:", error.message, "| batch:", i, "-", i + batch.length);
      return { ok: false, count: totalInserted };
    }
    totalInserted += batch.length;
  }

  console.log(`[PULSE] Supabase: inserted ${totalInserted} snapshots`);
  return { ok: true, count: totalInserted };
}

/* ── Cleanup old snapshots (keep 6 months) ────────────────────── */

export async function cleanupOldSnapshots(): Promise<number> {
  try {
    const sb = getSupabase();
    const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - sixMonthsMs).toISOString();
    const { count } = await sb
      .from("pulse_snapshots")
      .delete({ count: "exact" })
      .lt("captured_at", cutoff);
    const deleted = count ?? 0;
    if (deleted > 0) console.log(`[PULSE] Cleaned up ${deleted} old snapshots`);
    return deleted;
  } catch {
    return 0;
  }
}

/* ── Load snapshots from Supabase at a given time offset ──────── */

/**
 * Load snapshots from approximately `offsetMs` ago.
 * Searches within ±windowMs of the target time for the closest batch.
 */
export async function loadSnapshotsAt(
  offsetMs: number,
  windowMs: number = 30 * 60 * 1000,
): Promise<AppSnapshot[] | null> {
  const sb = getSupabase();
  const targetTime = new Date(Date.now() - offsetMs);
  const searchStart = new Date(targetTime.getTime() - windowMs).toISOString();
  const searchEnd = new Date(targetTime.getTime() + windowMs).toISOString();

  // Find the closest snapshot batch to our target time
  const { data: latestRow } = await sb
    .from("pulse_snapshots")
    .select("captured_at")
    .gte("captured_at", searchStart)
    .lte("captured_at", searchEnd)
    .order("captured_at", { ascending: false })
    .limit(1);

  if (!latestRow || latestRow.length === 0) return null;

  const batchTime = latestRow[0].captured_at;
  const batchStart = new Date(new Date(batchTime).getTime() - 5 * 60 * 1000).toISOString();
  const batchEnd = new Date(new Date(batchTime).getTime() + 5 * 60 * 1000).toISOString();

  const { data } = await sb
    .from("pulse_snapshots")
    .select("*")
    .gte("captured_at", batchStart)
    .lte("captured_at", batchEnd)
    .order("rank", { ascending: true });

  if (!data || data.length === 0) return null;
  return data as AppSnapshot[];
}

/** Convenience: load snapshots from ~1 hour ago */
export async function loadPreviousSnapshots(): Promise<AppSnapshot[] | null> {
  return loadSnapshotsAt(60 * 60 * 1000, 30 * 60 * 1000);
}
