import { rateLimit } from "@/app/api/_ratelimit";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import gplay from "google-play-scraper";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(userId, 30, 60000);
  if (!rl.ok) return Response.json({ error: "Too many requests." }, { status: 429 });
  
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
    return Response.json({ apps });
  } catch (e) {
    return Response.json({ apps: [], error: "Scrape failed" }, { status: 200 });
  }
}
