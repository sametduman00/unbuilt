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
  { name: "Overall", genreId: 36 },
  { name: "Games", genreId: 6014 },
  { name: "Business", genreId: 6000 },
  { name: "Education", genreId: 6017 },
  { name: "Entertainment", genreId: 6016 },
  { name: "Finance", genreId: 6015 },
  { name: "Food & Drink", genreId: 6023 },
  { name: "Health & Fitness", genreId: 6013 },
  { name: "Lifestyle", genreId: 6012 },
  { name: "Music", genreId: 6011 },
  { name: "News", genreId: 6009 },
  { name: "Photo & Video", genreId: 6008 },
  { name: "Productivity", genreId: 6007 },
  { name: "Shopping", genreId: 6024 },
  { name: "Social Networking", genreId: 6005 },
  { name: "Sports", genreId: 6004 },
  { name: "Travel", genreId: 6003 },
  { name: "Utilities", genreId: 6002 },
];

export const FETCH_HEADERS = { "User-Agent": "Mozilla/5.0" };

/* ── Fetch App Store via iTunes RSS feed ──────────────────────── */

async function fetchAppStoreCategory(cat: { name: string; genreId: number }): Promise<AppSnapshot[]> {
  try {
    const url = `https://itunes.apple.com/us/rss/topfreeapplications/limit=50/genre=${cat.genreId}/json`;
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.log(`APPSTORE ${cat.name}: HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    const entries = data?.feed?.entry ?? [];
    console.log(`APPSTORE ${cat.name}: ${entries.length} apps`);

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
    const res = await fetch(
      "https://play.google.com/store/apps/collection/topselling_free?hl=en&gl=US",
      {
        headers: { "Accept": "text/html", ...FETCH_HEADERS },
        signal: AbortSignal.timeout(15000),
      },
    );
    console.log(`[PULSE] Play Store HTML: HTTP ${res.status}`);
    if (!res.ok) {
      console.log(`[PULSE] Play Store: HTTP error, skipping`);
      return [];
    }

    const html = await res.text();
    console.log(`[PULSE] Play Store HTML length: ${html.length} chars`);

    const snapshots: AppSnapshot[] = [];
    const appMatches = html.matchAll(/\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/g);
    const seen = new Set<string>();
    let rank = 0;

    for (const match of appMatches) {
      const appId = match[1];
      if (seen.has(appId)) continue;
      seen.add(appId);
      rank++;
      if (rank > 50) break;

      const idx = match.index ?? 0;
      const context = html.slice(idx, idx + 500);
      const nameMatch = context.match(/aria-label="([^"]+)"/);
      const appName = nameMatch?.[1] ?? appId.split(".").pop() ?? appId;

      snapshots.push({
        source: "playstore",
        category: "Overall",
        app_id: appId,
        app_name: appName,
        rank,
        review_count: null,
        rating: null,
        url: `https://play.google.com/store/apps/details?id=${appId}`,
      });
    }

    console.log(`[PULSE] Play Store parsed: ${snapshots.length} apps`);
    return snapshots;
  } catch (err) {
    console.log(`[PULSE] Play Store scrape failed:`, err instanceof Error ? err.message : err);
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
