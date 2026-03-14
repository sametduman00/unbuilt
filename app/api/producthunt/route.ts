import { NextRequest, NextResponse } from "next/server";

const PH_API = "https://api.producthunt.com/v2/api/graphql";

const QUERY = `
query SearchPosts($postedAfter: DateTime!) {
  posts(order: VOTES, postedAfter: $postedAfter, first: 50) {
    edges {
      node {
        name
        tagline
        votesCount
        commentsCount
        url
        createdAt
        topics {
          edges {
            node {
              name
            }
          }
        }
      }
    }
  }
}
`;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Query parameter 'q' is required (min 2 chars)." }, { status: 400 });
  }

  const token = process.env.PRODUCTHUNT_API_KEY;
  if (!token) {
    return NextResponse.json({ error: "PRODUCTHUNT_API_KEY not configured" }, { status: 500 });
  }

  try {
    const postedAfter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const res = await fetch(PH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: QUERY, variables: { postedAfter } }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Product Hunt API error" }, { status: res.status });
    }

    const data = await res.json();
    const edges = data?.data?.posts?.edges ?? [];

    const terms = query.toLowerCase().split(/\s+/);

    const posts = edges
      .map((e: any) => e.node)
      .filter((post: any) => {
        const text = `${post.name ?? ""} ${post.tagline ?? ""}`.toLowerCase();
        return terms.some((t: string) => text.includes(t));
      })
      .slice(0, 10)
      .map((post: any) => ({
        name: post.name ?? "",
        tagline: post.tagline ?? "",
        votesCount: post.votesCount ?? 0,
        commentsCount: post.commentsCount ?? 0,
        url: post.url ?? "",
        createdAt: post.createdAt ?? "",
        topics: (post.topics?.edges ?? []).map((te: any) => te.node?.name ?? ""),
      }));

    return NextResponse.json({ posts });
  } catch (err) {
    console.error("Product Hunt API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
