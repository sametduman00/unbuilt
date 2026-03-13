import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2)
    return Response.json({ error: "Missing query" }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey)
    return Response.json({ error: "YouTube API key not configured" }, { status: 500 });

  const maxResults = parseInt(req.nextUrl.searchParams.get("maxResults") || "8", 10);
  const daysBack = parseInt(req.nextUrl.searchParams.get("days") || "90", 10);
  const publishedAfter = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Step 1: Search for videos
    const searchParams = new URLSearchParams({
      part: "snippet",
      type: "video",
      order: "viewCount",
      q: q.trim(),
      maxResults: String(maxResults),
      publishedAfter,
      key: apiKey,
    });

    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${searchParams}`,
    );
    if (!searchRes.ok) {
      console.error("[YouTube] search error:", searchRes.status, await searchRes.text());
      return Response.json({ results: [], total: 0 });
    }
    const searchData = await searchRes.json();
    const items = searchData.items ?? [];
    if (items.length === 0) return Response.json({ results: [], total: 0 });

    // Step 2: Fetch statistics for all video IDs
    const videoIds = items.map((item: { id: { videoId: string } }) => item.id.videoId).join(",");
    const statsParams = new URLSearchParams({
      part: "statistics",
      id: videoIds,
      key: apiKey,
    });
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${statsParams}`,
    );
    const statsMap = new Map<string, { viewCount: number; likeCount: number; commentCount: number }>();
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      for (const v of statsData.items ?? []) {
        statsMap.set(v.id, {
          viewCount: parseInt(v.statistics?.viewCount || "0", 10),
          likeCount: parseInt(v.statistics?.likeCount || "0", 10),
          commentCount: parseInt(v.statistics?.commentCount || "0", 10),
        });
      }
    }

    // Step 3: Merge and return
    const results = items.map((item: { id: { videoId: string }; snippet: { title: string; channelTitle: string; publishedAt: string; thumbnails: { medium?: { url: string } } } }) => {
      const stats = statsMap.get(item.id.videoId) ?? { viewCount: 0, likeCount: 0, commentCount: 0 };
      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? "",
        viewCount: stats.viewCount,
        likeCount: stats.likeCount,
        commentCount: stats.commentCount,
      };
    });

    return Response.json({ results, total: searchData.pageInfo?.totalResults ?? results.length });
  } catch (err) {
    console.error("[YouTube] fetch error:", err);
    return Response.json({ results: [], total: 0 });
  }
}
