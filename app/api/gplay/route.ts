import { NextRequest } from "next/server";
import gplay from "google-play-scraper";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2)
    return Response.json({ error: "Missing query" }, { status: 400 });

  try {
    const results = await gplay.search({ term: q.trim(), num: 10 });
    const apps = results.slice(0, 5).map((r) => ({
      appId: r.appId,
      title: r.title,
      score: r.score ?? 0,
      ratings: 0,
      price: r.free ? "Free" : (r.priceText || "Paid"),
      description: (r.summary || "").slice(0, 200),
      genre: "",
      icon: r.icon || "",
      url: r.url || "",
    }));
    return Response.json({ results: apps, total: results.length });
  } catch (err) {
    console.error("[GPlay] search error:", err);
    return Response.json({ results: [], total: 0 });
  }
}
