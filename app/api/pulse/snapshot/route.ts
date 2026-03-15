import { NextRequest, NextResponse } from "next/server";
import {
  fetchAppStore,
  fetchPlayStore,
  saveSnapshots,
  cleanupOldSnapshots,
} from "../shared";

export async function POST(req: NextRequest) {
  // Auth check
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[SNAPSHOT] Starting hourly snapshot collection");

    // 1. Fetch all app data in parallel
    const [appStoreSnaps, playStoreSnaps] = await Promise.all([
      fetchAppStore(),
      fetchPlayStore(),
    ]);

    const allSnapshots = [...appStoreSnaps, ...playStoreSnaps];
    const categories = new Set(allSnapshots.map((s) => `${s.source}:${s.category}`));

    console.log(`[SNAPSHOT] Fetched ${allSnapshots.length} apps from ${categories.size} categories`);

    // 2. Save to Supabase
    const { ok, count } = await saveSnapshots(allSnapshots);
    if (!ok && count === 0) {
      return NextResponse.json(
        { error: "Failed to save snapshots to Supabase" },
        { status: 500 },
      );
    }

    // 3. Cleanup old snapshots
    const deleted = await cleanupOldSnapshots();

    const timestamp = new Date().toISOString();
    console.log(`[SNAPSHOT] Done: saved=${count}, categories=${categories.size}, deleted=${deleted}, at=${timestamp}`);

    return NextResponse.json({
      saved: count,
      categories: categories.size,
      deleted,
      timestamp,
    });
  } catch (err) {
    console.error("[SNAPSHOT] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
