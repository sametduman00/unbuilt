# Unbuilt - Project Status (March 2026)

## What is this?
AI market intelligence platform for developers and entrepreneurs. URL: unbuilt.me (not yet deployed)

## Tech Stack
Next.js 16, Supabase (not yet integrated), Stripe (not yet integrated), Claude API (Sonnet), Vercel (not yet deployed)

## Working Tools
1. **Trend Feed** - GitHub + HN + Claude AI analysis. Space Temperature score 0-100.
2. **Gap Analysis** - Claude AI + App Store (iTunes) + Google Play. Market Opportunity score, competitor cards, pain points, SWOT, market gaps.
3. **Stack Advisor** - Claude AI + data/stacks.json (150+ tools, March 2026 pricing). Phase 0/1/2 recommendations, cost breakdown, build order.
4. **Competitor Radar** - exists but not tested/improved yet
5. **I'm already building** - HIDDEN (too complex for MVP)

## API Keys in .env.local
- ANTHROPIC_API_KEY
- GITHUB_TOKEN
- SEARCHAPI_KEY (removed - Google Trends deleted)

## Data Files
- data/stacks.json - 150+ developer tools with March 2026 pricing, sourced from free-for-dev repo

## GitHub
https://github.com/sametduman00/unbuilt

## Pending / Next Steps
1. Deploy to Vercel + connect unbuilt.me domain
2. Test and improve Competitor Radar
3. Add Stripe + freemium paywall
4. Add user auth (Clerk)
5. Weekly stacks.json update process

## Key Decisions Made
- Google Trends removed (rate limits, unreliable)
- "I'm already building" tool hidden (needs more design thinking)
- Stack Advisor uses manual JSON database updated weekly (not web search)
- iTunes + Google Play merged into one deduplicated list in Gap Analysis
- All tools use Claude Sonnet with thinking enabled (10k budget tokens)
