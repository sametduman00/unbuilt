import { NextRequest, NextResponse } from "next/server";

const PH_API = "https://api.producthunt.com/v2/api/graphql";

/* ── GraphQL queries ─────────────────────────────────────────── */

const POSTS_BY_TOPIC = `
query PostsByTopic($topic: String!, $postedAfter: DateTime!) {
  posts(order: VOTES, topic: $topic, postedAfter: $postedAfter, first: 50) {
    edges {
      node {
        name
        tagline
        votesCount
        commentsCount
        url
        createdAt
        topics { edges { node { name slug } } }
      }
    }
  }
}
`;

const POSTS_ALL = `
query PostsAll($postedAfter: DateTime!) {
  posts(order: VOTES, postedAfter: $postedAfter, first: 50) {
    edges {
      node {
        name
        tagline
        votesCount
        commentsCount
        url
        createdAt
        topics { edges { node { name slug } } }
      }
    }
  }
}
`;

/* ── Topic slug mapping ──────────────────────────────────────── */
// Common query terms → PH topic slugs
const TOPIC_MAP: Record<string, string> = {
  ai: "artificial-intelligence",
  "artificial intelligence": "artificial-intelligence",
  ml: "machine-learning",
  "machine learning": "machine-learning",
  fitness: "fitness",
  health: "health",
  gaming: "gaming",
  games: "gaming",
  productivity: "productivity",
  developer: "developer-tools",
  "developer tools": "developer-tools",
  devtools: "developer-tools",
  design: "design-tools",
  "design tools": "design-tools",
  marketing: "marketing",
  fintech: "fintech",
  finance: "fintech",
  education: "education",
  saas: "saas",
  crypto: "crypto",
  web3: "web3",
  social: "social-media",
  "social media": "social-media",
  ecommerce: "e-commerce",
  "e-commerce": "e-commerce",
  analytics: "analytics",
  automation: "task-management",
  nocode: "no-code",
  "no-code": "no-code",
  "no code": "no-code",
  writing: "writing-tools",
  video: "video",
  photo: "photo-editing",
  music: "music",
  travel: "travel",
  food: "food-and-drink",
  hiring: "hiring-and-recruiting",
  recruiting: "hiring-and-recruiting",
  remote: "remote-work",
  "remote work": "remote-work",
};

function findTopicSlug(query: string): string | null {
  const q = query.toLowerCase().trim();
  if (TOPIC_MAP[q]) return TOPIC_MAP[q];
  // Try matching any key as a substring
  for (const [key, slug] of Object.entries(TOPIC_MAP)) {
    if (q.includes(key) || key.includes(q)) return slug;
  }
  return null;
}

/* ── Helpers ──────────────────────────────────────────────────── */

function phHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function mapPosts(edges: any[]) {
  return edges
    .map((e: any) => e.node)
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
}

/* ── GET /api/producthunt?q=... ──────────────────────────────── */

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Query parameter 'q' is required (min 2 chars)." }, { status: 400 });
  }

  const token = process.env.PRODUCTHUNT_API_KEY;
  if (!token) {
    return NextResponse.json({ error: "PRODUCTHUNT_API_KEY not configured" }, { status: 500 });
  }

  const topicSlug = findTopicSlug(query);
  console.log("PH: query:", query, "→ topic slug:", topicSlug ?? "(none, fetching all)");
  console.log("PH: using token:", token.slice(0, 10) + "...");

  try {
    const postedAfter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const gqlQuery = topicSlug ? POSTS_BY_TOPIC : POSTS_ALL;
    const variables: Record<string, string> = { postedAfter };
    if (topicSlug) variables.topic = topicSlug;

    const res = await fetch(PH_API, {
      method: "POST",
      headers: phHeaders(token),
      body: JSON.stringify({ query: gqlQuery, variables }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("PH API error:", {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body,
      });
      return NextResponse.json({ error: `Product Hunt API error: ${res.status} ${res.statusText}`, detail: body }, { status: res.status });
    }

    const data = await res.json();
    if (data.errors) {
      console.error("PH GraphQL errors:", JSON.stringify(data.errors));
    }

    const edges = data?.data?.posts?.edges ?? [];
    console.log("PH: total posts returned:", edges.length, topicSlug ? `(topic: ${topicSlug})` : "(all)");

    const posts = mapPosts(edges);

    return NextResponse.json({ posts, topic: topicSlug });
  } catch (err) {
    console.error("Product Hunt API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
