import { NextResponse } from "next/server";

const PH_API = "https://api.producthunt.com/v2/api/graphql";

const TOPICS_QUERY = `
query {
  topics(first: 50, order: FOLLOWERS_COUNT) {
    edges {
      node {
        name
        slug
        description
        followersCount
      }
    }
  }
}
`;

export async function GET() {
  const token = process.env.PRODUCTHUNT_API_KEY;
  if (!token) {
    return NextResponse.json({ error: "PRODUCTHUNT_API_KEY not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(PH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: TOPICS_QUERY }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({ error: `Product Hunt API error: ${res.status}`, detail: body }, { status: res.status });
    }

    const data = await res.json();
    const edges = data?.data?.topics?.edges ?? [];

    const topics = edges.map((e: any) => ({
      name: e.node?.name ?? "",
      slug: e.node?.slug ?? "",
      description: e.node?.description ?? "",
      followersCount: e.node?.followersCount ?? 0,
    }));

    return NextResponse.json({ topics });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
