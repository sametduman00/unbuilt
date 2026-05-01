import { MetadataRoute } from "next";
import { COMPARISONS } from "./compare/comparisons";
import { createClient } from "@supabase/supabase-js";

// We can't use the singleton from app/lib/supabase here because
// sitemap.ts runs at build time and env vars might differ.
function getSb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.unbuilt.me";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/use-cases`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/help`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/ideas`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    // Comparison pages — high priority because they own "Unbuilt vs X"
    // and "X alternative" queries that AI assistants search for live
    // when users ask comparison questions in ChatGPT / Perplexity / Claude.
    { url: `${base}/compare`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    ...COMPARISONS.map(c => ({
      url: `${base}/compare/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];

  // Dynamic SEO pages from Supabase (paginated to bypass 1000 row limit)
  const sb = getSb();
  if (!sb) return staticPages;

  const allRows: { slug: string; updated_at: string }[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;
  while (true) {
    const { data } = await sb
      .from("seo_pages")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("created_at", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const ideaPages: MetadataRoute.Sitemap = allRows.map(
    (row) => ({
      url: `${base}/ideas/${row.slug}`,
      lastModified: new Date(row.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })
  );

  return [...staticPages, ...ideaPages];
}
