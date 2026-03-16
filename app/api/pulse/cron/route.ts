import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { fetchAppStore, fetchPlayStore, saveSnapshots, cleanupOldSnapshots } =
      await import("../shared");
    const [appRes, playRes] = await Promise.allSettled([
      fetchAppStore(),
      fetchPlayStore(),
    ]);
    const appSnaps = appRes.status === "fulfilled" ? appRes.value : [];
    const playSnaps = playRes.status === "fulfilled" ? playRes.value : [];
    console.log(`[CRON] AppStore: ${appSnaps.length}, PlayStore: ${playSnaps.length}`);
    const all = [...appSnaps, ...playSnaps];
    const saveResult = await saveSnapshots(all);
    cleanupOldSnapshots();
    return NextResponse.json({
      ok: true,
      saved: saveResult.count,
      appStore: appSnaps.length,
      playStore: playSnaps.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[CRON] FAILED:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
