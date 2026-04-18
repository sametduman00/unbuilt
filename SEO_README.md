# Programmatic SEO System — unbuilt.me/ideas/

## Overview

5,000+ niche SEO pages targeting high-intent keywords like:
- "best habit tracker for solo founders"
- "Notion alternative for startups"  
- "is there an app for tracking freelance expenses"
- "how to build a SaaS boilerplate with no code"
- "freelancer invoicing market gap"

Each page shows: opportunity score, competitor count, key insight, market summary, and a CTA → Dig.

## Architecture

```
scripts/generate-keywords.js   → data/seo-keywords.json (5,698 keywords)
scripts/seed-keywords.js       → Supabase seo_pages table (draft rows)
scripts/generate-content.js    → Claude Haiku API → updates rows → published
app/ideas/[slug]/page.tsx      → Dynamic SSR page with SEO meta
app/ideas/page.tsx             → Index page with category filtering
app/sitemap.ts                 → Dynamic sitemap with all published slugs
app/api/seo/route.ts           → API for fetching page data
```

## Setup Steps

### 1. Run the Supabase migration

Go to Supabase Dashboard → SQL Editor → paste contents of:
```
supabase/migrations/005_seo_pages.sql
```

### 2. Generate keywords

```bash
node scripts/generate-keywords.js 2>/dev/null > data/seo-keywords.json
```

### 3. Seed keywords into Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=xxx \
SUPABASE_SERVICE_ROLE_KEY=yyy \
  node scripts/seed-keywords.js
```

### 4. Generate content with Claude Haiku

```bash
# Dry run first
NEXT_PUBLIC_SUPABASE_URL=xxx \
SUPABASE_SERVICE_ROLE_KEY=yyy \
ANTHROPIC_API_KEY=zzz \
  node scripts/generate-content.js --limit 10 --dry-run

# Then real run (50 at a time)
node scripts/generate-content.js --limit 50

# Or by category
node scripts/generate-content.js --limit 100 --category saas

# Full batch (5,698 pages, ~$10-12 with Haiku)
node scripts/generate-content.js --limit 6000
```

### 5. Verify

- Visit `/ideas` to see the index page
- Visit `/ideas/best-habit-tracker-for-solo-founders` (example)
- Check `/sitemap.xml` for all published URLs

## Cost

- Claude Haiku: ~$0.002/page → 5,698 pages ≈ **$11.40**
- Supabase: Free tier covers this
- Total one-time cost: **~$12**

## Patterns & Counts

| Pattern | Count | Example |
|---------|-------|---------|
| best_x_for_y | 1,596 | best habit tracker for freelancers |
| alternative_to | 570 | free Notion alternative |
| how_to_build | 1,197 | how to build a SaaS boilerplate with AI |
| top_x | 1,197 | top API testing tools 2026 |
| market_gap | 798 | meal planner market gap |
| is_there_app | 154 | is there an app for tracking pet vaccinations |
| comparison | 117 | Cursor vs Replit |
| long_tail | 69 | best micro SaaS ideas |

## Categories (25)

saas, ai_tools, developer_tools, productivity, marketing, automation,
content_creation, ecommerce, finance, freelancing, health, education,
community, design, analytics, hr_and_hiring, travel, real_estate,
food_and_restaurant, legal, pet, parenting, sustainability, tools, general
