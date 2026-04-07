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

    const { data: prevRows } = await sb
      .from("appstore_daily_cache")
      .select("id, fetch_date, apps")
      .neq("fetch_date", today)
      .order("fetch_date", { ascending: false })
      .limit(2); // only look back 2 days for screenshot backfill

    if (prevRows && prevRows.length > 0) {
      for (const row of prevRows) {
        const apps = row.apps as any[];
        const missing = apps.filter((a: any) => !a.screenshot_urls || a.screenshot_urls.length === 0);
        if (missing.length === 0) continue;
        const ids = missing.map((a: any) => a.app_id).filter(Boolean).slice(0, 200);
        const updated = new Map<string, string[]>();
        for (let i = 0; i < ids.length; i += 100) {
          const batch = ids.slice(i, i + 100);
          try {
            const r = await fetch("https://itunes.apple.com/lookup?id=" + batch.join(",") + "&country=us", { signal: AbortSignal.timeout(15000) });
            const d = await r.json();
            for (const a of d.results ?? []) {
              if (a.screenshotUrls?.length > 0) updated.set(String(a.trackId), a.screenshotUrls.slice(0, 5));
            }
          } catch {}
        }
        if (updated.size > 0) {
          const patched = apps.map((a: any) => { const ss = updated.get(a.app_id); return ss ? { ...a, screenshot_urls: ss } : a; });
          await sb.from("appstore_daily_cache").update({ apps: patched }).eq("id", row.id);
        }
      }
    }

    const { data: existing } = await sb.from("appstore_daily_cache").select("id, app_count").eq("fetch_date", today).single();
    if (existing) return NextResponse.json({ ok: true, skipped: true, appCount: existing.app_count });

    const rss = await fetch("https://itunes.apple.com/us/rss/newapplications/limit=200/json", { signal: AbortSignal.timeout(15000) });
    const rssData = await rss.json();
    const entries: any[] = rssData?.feed?.entry ?? [];
    if (entries.length === 0) return NextResponse.json({ ok: true, fetched: 0, saved: 0 });

    const ids = entries.map(e => e?.id?.attributes?.["im:id"]).filter(Boolean);
    const lookup = await fetch("https://itunes.apple.com/lookup?id=" + ids.join(",") + "&country=us", { signal: AbortSignal.timeout(20000) });
    const lookupData = await lookup.json();
    const apps: any[] = (lookupData.results ?? []).filter((a: any) => a.wrapperType === "software");

    const englishApps = apps.filter((a: any) => {
      const desc = a.description ?? "";
      const ratio = desc.replace(/[^\x00-\x7F]/g, "").length / (desc.length || 1);
      return ratio > 0.7 && desc.length > 100;
    });

    const analyzed = await analyzeAppsWithVision(englishApps);
    const { error } = await sb.from("appstore_daily_cache").insert({ fetch_date: today, apps: analyzed, app_count: analyzed.length, generated_at: new Date().toISOString() });
    if (error) console.error("[APPSTORE] Insert error:", error.message);
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10); // keep 3 days
    await sb.from("appstore_daily_cache").delete().lt("fetch_date", cutoff);
    return NextResponse.json({ ok: true, fetched: apps.length, english: englishApps.length, saved: analyzed.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
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
        const imgRes = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer();
          const b64 = Buffer.from(buffer).toString("base64");
          const ct = (imgRes.headers.get("content-type") || "image/jpeg").split(";")[0];
          content.push({ type: "image", source: { type: "base64", media_type: ct, data: b64 } });
        }
      } catch {}
    }
    content.push({ type: "text", text: `App: ${app.trackName}\nCategory: ${app.primaryGenreName}\nPrice: ${app.formattedPrice || "Free"}\nDescription: ${(app.description?.substring(0, 400) ?? "")}\n\nAnalyze this app. Return ONLY a JSON object:\n{"what": "1-2 sentences: what it does and who it's for.","difficulty": "simple|medium|hard","difficulty_note": "max 5 words","competitors": ["App1","App2"],"build_with": [{"name": "Tool","role": "role"}]}\nRules: simple=weekend build; medium=needs backend/payments; hard=AI/hardware. competitors MUST be apps confirmed available on the Apple App Store ONLY — do NOT include apps only on Google Play or other platforms. build_with ONLY from: Lovable,Cursor,Bolt,Replit,Expo,Supabase,Neon,Clerk,Auth0,Stripe,Paddle,Vercel,Railway,Fly.io,OpenAI,Anthropic,Replicate,Cloudflare,Upstash,Resend,n8n,Make,Zapier` });
    const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 400, messages: [{ role: "user", content }] }), signal: AbortSignal.timeout(30000) });
    const data = await res.json();
    const text = data?.content?.[0]?.text ?? "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return { ...base, claude_what: parsed.what ?? null, claude_difficulty: parsed.difficulty ?? null, claude_difficulty_note: parsed.difficulty_note ?? null, claude_competitors: Array.isArray(parsed.competitors) ? parsed.competitors.slice(0, 4) : null, claude_build_with: Array.isArray(parsed.build_with) ? parsed.build_with.slice(0, 5) : null, claude_analyzed_at: new Date().toISOString() };
  } catch (e) { return base; }
}

function formatApp(app: any) {
  return { app_id: String(app.trackId), app_name: app.trackName, developer: app.artistName, category: app.primaryGenreName, price: app.formattedPrice ?? "Free", icon_url: app.artworkUrl512 || app.artworkUrl100, store_url: app.trackViewUrl, release_date: app.releaseDate?.substring(0, 10), description: app.description?.substring(0, 500), rating: app.averageUserRating ?? null, review_count: app.userRatingCount ?? 0, min_os: app.minimumOsVersion, age_rating: app.contentAdvisoryRating, languages: app.languageCodesISO2A ?? [], screenshot_urls: (app.screenshotUrls ?? []).slice(0, 5), file_size_mb: app.fileSizeBytes ? Math.round(parseInt(app.fileSizeBytes) / 1024 / 1024) : null, claude_what: null, claude_difficulty: null as "simple"|"medium"|"hard"|null, claude_difficulty_note: null as string|null, claude_competitors: null as string[]|null, claude_build_with: null as {name:string;role:string}[]|null, claude_analyzed_at: null };
}
