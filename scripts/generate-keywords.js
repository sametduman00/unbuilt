#!/usr/bin/env node
/**
 * generate-keywords.js
 * Generates 5,000+ niche SEO keywords for unbuilt.me/ideas/[slug]
 * Patterns: "best X for Y", "alternative to Z", "is there an app for W", "how to build X", "top X tools"
 * 
 * Usage: node scripts/generate-keywords.js > data/seo-keywords.json
 */

// ── Niche categories with sub-niches ──
const NICHES = {
  freelancing: [
    "freelancer invoicing", "freelance contract management", "freelance time tracking",
    "freelance project management", "freelance client portal", "freelance proposal tool",
    "freelance tax calculator", "freelance expense tracker", "freelance portfolio builder",
    "freelance rate calculator", "freelance CRM", "freelance milestone tracker",
    "freelance payment gateway", "freelance retainer management", "freelance scope creep tracker",
    "freelance availability calendar", "freelance NDA generator", "freelance testimonial collector"
  ],
  saas: [
    "micro SaaS", "SaaS boilerplate", "SaaS landing page", "SaaS onboarding flow",
    "SaaS churn prediction", "SaaS usage analytics", "SaaS pricing page",
    "SaaS feature flag tool", "SaaS customer feedback", "SaaS changelog",
    "SaaS status page", "SaaS billing management", "SaaS trial conversion",
    "SaaS referral program", "SaaS affiliate tracking", "SaaS dunning management",
    "SaaS seat management", "SaaS white-label solution", "SaaS marketplace"
  ],
  productivity: [
    "habit tracker", "todo app", "pomodoro timer", "daily planner",
    "goal setting app", "note taking app", "bookmark manager", "read later app",
    "personal knowledge base", "second brain tool", "weekly review app",
    "focus timer", "distraction blocker", "morning routine app",
    "journaling app", "gratitude journal", "mood tracker", "energy tracker",
    "decision journal", "time blocking app", "deep work tracker",
    "personal dashboard", "life OS template", "accountability partner app"
  ],
  finance: [
    "budget tracker", "expense splitter", "subscription tracker",
    "personal finance dashboard", "crypto portfolio tracker", "stock watchlist",
    "savings goal tracker", "debt payoff calculator", "net worth tracker",
    "invoice generator", "receipt scanner", "tax prep tool",
    "financial goal planner", "spending analyzer", "cashflow forecaster",
    "multi-currency wallet", "freelance income tracker", "side hustle income tracker",
    "investment portfolio analyzer", "dividend tracker", "FIRE calculator"
  ],
  health: [
    "workout tracker", "meal planner", "calorie counter",
    "water intake tracker", "sleep tracker", "meditation app",
    "mental health journal", "symptom tracker", "medication reminder",
    "fitness challenge app", "yoga app", "stretching app",
    "running tracker", "home workout app", "gym workout planner",
    "macro tracker", "fasting tracker", "weight loss tracker",
    "body measurement tracker", "posture reminder", "eye strain reminder",
    "standing desk timer", "breathing exercise app", "stress tracker"
  ],
  education: [
    "flashcard app", "language learning app", "math practice app",
    "vocabulary builder", "speed reading app", "online course platform",
    "study planner", "spaced repetition tool", "quiz maker",
    "coding practice platform", "typing tutor", "handwriting practice app",
    "music theory app", "science experiment app", "history timeline tool",
    "exam prep tool", "homework organizer", "tutoring marketplace",
    "skill tracking app", "learning path builder", "book summary app"
  ],
  developer_tools: [
    "API testing tool", "database GUI", "code snippet manager",
    "regex tester", "JSON formatter", "color palette generator",
    "CSS generator", "icon library", "font pairing tool",
    "wireframe tool", "mockup generator", "screenshot tool",
    "changelog generator", "documentation tool", "error tracking tool",
    "performance monitoring", "uptime monitor", "log viewer",
    "environment variable manager", "secret manager", "deployment tool",
    "CI CD pipeline builder", "code review tool", "git GUI client",
    "terminal emulator", "SSH client", "Docker GUI"
  ],
  content_creation: [
    "blog writing tool", "social media scheduler", "video editing app",
    "podcast hosting", "newsletter tool", "content calendar",
    "SEO writing assistant", "headline analyzer", "thumbnail maker",
    "video thumbnail generator", "caption generator", "hashtag generator",
    "content repurposing tool", "blog to tweet converter", "AI content detector",
    "plagiarism checker", "grammar checker", "readability scorer",
    "content brief generator", "editorial calendar", "content analytics"
  ],
  ecommerce: [
    "dropshipping tool", "product research tool", "price comparison engine",
    "inventory management", "order tracking", "shipping calculator",
    "product photography app", "review management tool", "abandoned cart recovery",
    "upsell tool", "cross-sell engine", "loyalty program builder",
    "coupon code manager", "product feed optimizer", "marketplace integration",
    "return management", "size chart builder", "product configurator"
  ],
  community: [
    "community platform", "forum builder", "Discord bot builder",
    "membership site builder", "event management tool", "virtual event platform",
    "feedback board", "feature request tracker", "user voting tool",
    "ambassador program", "newsletter community", "paid community tool",
    "community analytics", "member directory", "group chat app",
    "community moderation tool", "onboarding sequence builder"
  ],
  real_estate: [
    "rental property management", "tenant screening tool", "rent payment platform",
    "property listing app", "real estate CRM", "home inspection app",
    "mortgage calculator", "property valuation tool", "virtual tour creator",
    "lease agreement generator", "maintenance request tracker", "rental income tracker",
    "property investment analyzer", "co-living management tool"
  ],
  food_and_restaurant: [
    "restaurant POS system", "menu builder", "food delivery app",
    "recipe management app", "meal kit service builder", "food cost calculator",
    "restaurant reservation system", "kitchen inventory manager", "food waste tracker",
    "tip calculator", "restaurant review aggregator", "ghost kitchen management",
    "catering management tool", "food truck location tracker", "dietary restriction filter"
  ],
  travel: [
    "trip planner", "travel itinerary builder", "flight price tracker",
    "hotel booking comparison", "packing list app", "travel expense tracker",
    "digital nomad tool", "coworking space finder", "visa requirement checker",
    "language phrase book app", "currency converter", "travel journal",
    "group trip planner", "road trip planner", "travel insurance comparison"
  ],
  hr_and_hiring: [
    "applicant tracking system", "resume builder", "job board",
    "employee onboarding tool", "performance review tool", "employee survey tool",
    "time off management", "payroll calculator", "org chart builder",
    "employee recognition tool", "remote team management", "meeting scheduler",
    "1-on-1 meeting tool", "OKR tracking tool", "compensation benchmarking"
  ],
  ai_tools: [
    "AI image generator", "AI writing assistant", "AI chatbot builder",
    "AI voice generator", "AI video generator", "AI presentation maker",
    "AI code assistant", "AI data analyzer", "AI email writer",
    "AI meeting summarizer", "AI transcription tool", "AI translation tool",
    "AI customer support bot", "AI sales assistant", "AI content moderator",
    "AI resume screener", "AI logo maker", "AI music generator"
  ],
  marketing: [
    "email marketing tool", "landing page builder", "A/B testing tool",
    "heatmap tool", "conversion rate optimizer", "pop-up builder",
    "lead magnet creator", "webinar platform", "influencer marketing tool",
    "social proof widget", "testimonial collector", "referral marketing tool",
    "link shortener", "QR code generator", "UTM builder",
    "marketing attribution tool", "competitor monitoring tool", "brand monitoring tool"
  ],
  automation: [
    "workflow automation tool", "zapier alternative", "no-code automation",
    "email automation", "social media automation", "data scraping tool",
    "web scraping tool", "spreadsheet automation", "form builder",
    "survey tool", "chatbot builder", "notification system builder",
    "webhook manager", "cron job manager", "task automation tool"
  ],
  design: [
    "UI design tool", "prototyping tool", "design system builder",
    "icon maker", "illustration tool", "3D design tool",
    "animation tool", "video editor", "photo editor",
    "background remover", "image compressor", "SVG editor",
    "brand kit builder", "style guide generator", "design handoff tool",
    "design token manager", "component library builder"
  ],
  legal: [
    "contract generator", "NDA generator", "terms of service generator",
    "privacy policy generator", "legal document management", "e-signature tool",
    "trademark search tool", "patent search tool", "compliance checker",
    "GDPR compliance tool", "cookie consent manager", "legal billing tool"
  ],
  analytics: [
    "web analytics tool", "product analytics", "user behavior analytics",
    "session recording tool", "funnel analytics", "cohort analysis tool",
    "revenue analytics", "social media analytics", "SEO analytics tool",
    "keyword tracking tool", "rank tracker", "backlink checker",
    "site audit tool", "page speed analyzer", "accessibility checker"
  ],
  pet: [
    "pet health tracker", "dog walking app", "pet sitting marketplace",
    "vet appointment scheduler", "pet food delivery", "pet adoption platform",
    "pet training app", "pet GPS tracker app", "pet expense tracker",
    "pet social media app", "pet grooming scheduler"
  ],
  parenting: [
    "baby milestone tracker", "family calendar app", "chore chart app",
    "allowance tracker", "family photo sharing", "school communication app",
    "child screen time manager", "family meal planner", "kids activity finder",
    "baby sleep tracker", "breastfeeding tracker", "pregnancy tracker"
  ],
  sustainability: [
    "carbon footprint tracker", "sustainable shopping app", "food waste reducer",
    "energy consumption tracker", "water usage monitor", "eco-friendly product finder",
    "recycling guide app", "sustainable fashion marketplace", "green commute planner",
    "plant care app", "garden planner", "composting guide app"
  ]
};

// ── Target audiences for "best X for Y" ──
const AUDIENCES = [
  "solo founders", "indie hackers", "vibe coders", "freelancers",
  "small teams", "startups", "remote teams", "solopreneurs",
  "content creators", "designers", "developers", "marketers",
  "students", "teachers", "coaches", "consultants",
  "agencies", "side hustlers", "bootstrapped startups", "non-technical founders",
  "digital nomads", "product managers", "data analysts", "e-commerce sellers"
];

// ── Well-known tools for "alternative to" ──
const POPULAR_TOOLS = [
  "Notion", "Trello", "Asana", "Monday.com", "ClickUp", "Jira",
  "Slack", "Discord", "Microsoft Teams", "Zoom",
  "Figma", "Canva", "Adobe Photoshop", "Adobe Illustrator",
  "Stripe", "PayPal", "Square", "Gumroad", "Lemonsqueezy",
  "Mailchimp", "ConvertKit", "Beehiiv", "Substack",
  "Google Analytics", "Mixpanel", "Amplitude", "Hotjar",
  "Shopify", "WooCommerce", "BigCommerce", "Etsy",
  "WordPress", "Webflow", "Squarespace", "Wix", "Framer",
  "Airtable", "Google Sheets", "Excel", "Coda",
  "Zapier", "Make.com", "n8n", "IFTTT",
  "ChatGPT", "Jasper", "Copy.ai", "Writesonic",
  "Vercel", "Netlify", "Railway", "Render", "Fly.io",
  "Supabase", "Firebase", "PlanetScale", "Neon",
  "GitHub", "GitLab", "Bitbucket",
  "Linear", "Shortcut", "Height",
  "Loom", "Tella", "Screen Studio",
  "Typeform", "Tally", "Google Forms",
  "Calendly", "Cal.com", "SavvyCal",
  "Intercom", "Crisp", "Drift", "Zendesk",
  "Retool", "Appsmith", "Budibase",
  "Bubble", "Glide", "Adalo", "FlutterFlow",
  "Cursor", "Replit", "Bolt", "Lovable", "v0",
  "Product Hunt", "Indie Hackers", "Hacker News",
  "Twilio", "SendGrid", "Postmark", "Resend",
  "Cloudflare", "AWS", "Google Cloud", "DigitalOcean",
  "1Password", "LastPass", "Bitwarden",
  "Todoist", "Things 3", "TickTick", "Any.do",
  "Obsidian", "Roam Research", "Logseq", "Bear",
  "Miro", "FigJam", "Whimsical", "Excalidraw"
];

// ── Patterns ──

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function generateKeywords() {
  const keywords = [];
  const slugSet = new Set();

  function add(keyword, pattern, category, tags = []) {
    const slug = slugify(keyword);
    if (slugSet.has(slug) || slug.length < 5 || slug.length > 120) return;
    slugSet.add(slug);
    keywords.push({ keyword, slug, pattern, category, tags });
  }

  // ─── Pattern 1: "best X for Y" ───
  for (const [category, niches] of Object.entries(NICHES)) {
    for (const niche of niches) {
      // Pick 3-4 audiences per niche
      const audiences = pickRandom(AUDIENCES, 4);
      for (const audience of audiences) {
        add(`best ${niche} for ${audience}`, 'best_x_for_y', category, [audience]);
      }
    }
  }

  // ─── Pattern 2: "alternative to Z" ───
  for (const tool of POPULAR_TOOLS) {
    const slug_tool = slugify(tool);
    add(`${tool} alternative`, 'alternative_to', 'tools', [tool.toLowerCase()]);
    add(`free ${tool} alternative`, 'alternative_to', 'tools', [tool.toLowerCase(), 'free']);
    add(`open source ${tool} alternative`, 'alternative_to', 'tools', [tool.toLowerCase(), 'open-source']);
    add(`${tool} alternative for startups`, 'alternative_to', 'tools', [tool.toLowerCase(), 'startups']);
    add(`cheaper ${tool} alternative`, 'alternative_to', 'tools', [tool.toLowerCase(), 'budget']);
  }

  // ─── Pattern 3: "is there an app for X" / "app for X" ───
  const appIdeas = [
    "tracking freelance expenses", "managing rental properties", "finding vibe coding ideas",
    "validating startup ideas", "comparing SaaS tools", "tracking competitor pricing",
    "generating invoices automatically", "managing multiple side hustles",
    "tracking habits with accountability", "splitting bills with roommates",
    "managing a food truck", "tracking pet vaccinations", "planning group trips",
    "managing a coworking space", "tracking carbon footprint",
    "organizing digital recipes", "managing freelance contracts",
    "finding local coworking spaces", "tracking medication schedules",
    "managing multiple email accounts", "automating social media posting",
    "creating a personal CRM", "tracking net worth over time",
    "managing a small gym", "scheduling dog walks",
    "tracking toddler milestones", "managing a book club",
    "planning home renovations", "tracking plant watering",
    "managing a YouTube channel", "creating branded link shorteners",
    "managing podcast episodes", "tracking daily water intake",
    "generating privacy policies", "managing restaurant reservations",
    "tracking gym workouts", "planning meal prep",
    "managing client testimonials", "tracking shipping costs",
    "automating invoice reminders", "managing a newsletter",
    "tracking employee time off", "creating landing pages fast",
    "managing a Discord community", "tracking sleep quality",
    "managing warranty information", "creating customer surveys",
    "tracking competitive keywords", "managing a membership site",
    "creating a knowledge base", "tracking project deadlines",
    "managing multiple Shopify stores", "tracking affiliate commissions",
    "automating customer onboarding", "managing a virtual assistant team",
    "tracking domain name renewals", "creating employee handbooks",
    "managing meeting notes", "tracking customer churn",
    "creating automated email sequences", "managing a SaaS waitlist",
    "tracking content performance", "managing influencer partnerships",
    "creating product roadmaps", "tracking support tickets",
    "managing a Notion workspace", "tracking monthly recurring revenue",
    "creating interactive demos", "managing feature requests",
    "tracking API usage", "managing multiple databases",
    "creating automated reports", "tracking website uptime",
    "managing a design system", "tracking customer lifetime value",
    "creating onboarding checklists", "managing changelog updates"
  ];

  for (const idea of appIdeas) {
    add(`is there an app for ${idea}`, 'is_there_app', inferCategory(idea), []);
    add(`app for ${idea}`, 'is_there_app', inferCategory(idea), []);
  }

  // ─── Pattern 4: "how to build X" ───
  for (const [category, niches] of Object.entries(NICHES)) {
    for (const niche of niches) {
      add(`how to build a ${niche}`, 'how_to_build', category, []);
      add(`how to build a ${niche} with no code`, 'how_to_build', category, ['no-code']);
      add(`how to build a ${niche} with AI`, 'how_to_build', category, ['ai']);
    }
  }

  // ─── Pattern 5: "top X tools" / "best X tools" / "X tools 2026" ───
  for (const [category, niches] of Object.entries(NICHES)) {
    for (const niche of niches) {
      add(`top ${niche} tools 2026`, 'top_x', category, ['2026']);
      add(`best free ${niche} tools`, 'top_x', category, ['free']);
      add(`${niche} tools for startups`, 'top_x', category, ['startups']);
    }
  }

  // ─── Pattern 6: "X vs Y" (common comparisons) ───
  const comparisons = [
    ["Notion", "Obsidian"], ["Trello", "Asana"], ["Figma", "Canva"],
    ["Stripe", "Lemonsqueezy"], ["Vercel", "Netlify"], ["Supabase", "Firebase"],
    ["Linear", "Jira"], ["Cursor", "Replit"], ["Bubble", "FlutterFlow"],
    ["Webflow", "Framer"], ["Zapier", "Make.com"], ["ConvertKit", "Beehiiv"],
    ["ChatGPT", "Claude"], ["Shopify", "WooCommerce"], ["Cal.com", "Calendly"],
    ["Bolt", "Lovable"], ["GitHub", "GitLab"], ["Mailchimp", "Resend"],
    ["Todoist", "TickTick"], ["1Password", "Bitwarden"], ["n8n", "Zapier"],
    ["Railway", "Render"], ["Neon", "PlanetScale"], ["Tally", "Typeform"],
    ["Intercom", "Crisp"], ["Wix", "Squarespace"], ["Airtable", "Coda"],
    ["Monday.com", "ClickUp"], ["Hotjar", "Mixpanel"], ["AWS", "DigitalOcean"],
    ["Postmark", "SendGrid"], ["Bear", "Obsidian"], ["Glide", "Adalo"],
    ["Things 3", "Todoist"], ["Excalidraw", "Miro"], ["Whimsical", "FigJam"],
    ["v0", "Bolt"], ["Lovable", "Cursor"], ["Replit", "Bolt"]
  ];

  for (const [a, b] of comparisons) {
    add(`${a} vs ${b}`, 'comparison', 'tools', [a.toLowerCase(), b.toLowerCase()]);
    add(`${a} vs ${b} for startups`, 'comparison', 'tools', [a.toLowerCase(), b.toLowerCase(), 'startups']);
    add(`${a} vs ${b} for indie hackers`, 'comparison', 'tools', [a.toLowerCase(), b.toLowerCase(), 'indie-hackers']);
  }

  // ─── Pattern 7: "X market size" / "X market gap" ───
  for (const [category, niches] of Object.entries(NICHES)) {
    for (const niche of niches) {
      add(`${niche} market gap`, 'market_gap', category, []);
      add(`${niche} market opportunity 2026`, 'market_gap', category, ['2026']);
    }
  }

  // ─── Pattern 8: niche-specific long-tail ───
  const longTail = [
    // Vibecoding specific
    "what to build with Cursor", "what to build with Lovable", "what to build with Bolt",
    "what to build with Replit", "what to build with v0", "what to build with FlutterFlow",
    "what to build with Bubble", "what to build with Glide",
    "best SaaS ideas 2026", "best micro SaaS ideas", "best AI app ideas 2026",
    "best no-code app ideas", "most profitable SaaS niches 2026",
    "underserved SaaS markets", "SaaS ideas with low competition",
    "profitable app ideas for solo developers", "app ideas that make money",
    "side project ideas for developers", "weekend project ideas",
    "SaaS ideas under 1000 users", "niche SaaS ideas nobody is building",
    "app ideas for the vibecoding era", "what to vibecode next",
    "profitable niches for indie hackers", "app markets with no competition",
    "untapped SaaS markets 2026", "easiest SaaS to build and sell",
    "SaaS ideas you can build in a weekend", "micro SaaS that makes 10k MRR",
    "boring SaaS ideas that print money", "SaaS ideas for non-technical founders",
    "app ideas for remote workers", "tools remote teams actually need",
    "app ideas for content creators", "app ideas for teachers",
    "app ideas for real estate agents", "app ideas for personal trainers",
    "app ideas for therapists", "app ideas for accountants",
    "app ideas for lawyers", "app ideas for dentists",
    "app ideas for photographers", "app ideas for musicians",
    "app ideas for podcasters", "app ideas for YouTubers",
    "app ideas for Twitch streamers", "app ideas for Etsy sellers",
    "app ideas for Amazon FBA sellers", "app ideas for dropshippers",
    "AI wrapper ideas 2026", "AI tool ideas nobody built yet",
    "ChatGPT wrapper ideas", "Claude API project ideas",
    "best API to build a SaaS around", "APIs you can build products on",
    "how to find SaaS ideas", "how to validate a SaaS idea",
    "how to find market gaps", "how to do market research for SaaS",
    "how to find underserved niches", "how to analyze competitors for SaaS",
    "SaaS idea validation checklist", "startup idea validation framework",
    "how to know if your app idea is good", "signs your SaaS idea will fail",
    "why most SaaS ideas fail", "common mistakes in SaaS validation",
    "how to pivot a failing SaaS", "when to kill a SaaS idea"
  ];

  for (const kw of longTail) {
    const cat = kw.includes('SaaS') || kw.includes('micro') ? 'saas' :
                kw.includes('AI') || kw.includes('ChatGPT') || kw.includes('Claude') ? 'ai_tools' :
                kw.includes('Cursor') || kw.includes('Lovable') || kw.includes('Bolt') || kw.includes('Replit') || kw.includes('vibecod') ? 'vibecoding' :
                kw.includes('app ideas for') ? 'niche_ideas' : 'general';
    add(kw, 'long_tail', cat, []);
  }

  return keywords;
}

function inferCategory(text) {
  const t = text.toLowerCase();
  if (t.includes('freelanc') || t.includes('invoice') || t.includes('contract')) return 'freelancing';
  if (t.includes('rent') || t.includes('property')) return 'real_estate';
  if (t.includes('food') || t.includes('recipe') || t.includes('restaurant') || t.includes('meal')) return 'food_and_restaurant';
  if (t.includes('pet') || t.includes('dog') || t.includes('vet')) return 'pet';
  if (t.includes('gym') || t.includes('workout') || t.includes('sleep') || t.includes('health') || t.includes('water intake') || t.includes('medication')) return 'health';
  if (t.includes('saas') || t.includes('startup') || t.includes('waitlist') || t.includes('churn') || t.includes('mrr') || t.includes('onboarding')) return 'saas';
  if (t.includes('social media') || t.includes('newsletter') || t.includes('content') || t.includes('influencer') || t.includes('youtube') || t.includes('podcast') || t.includes('blog')) return 'content_creation';
  if (t.includes('shopify') || t.includes('shipping') || t.includes('affiliate') || t.includes('store')) return 'ecommerce';
  if (t.includes('domain') || t.includes('api') || t.includes('database') || t.includes('deploy') || t.includes('uptime') || t.includes('design system') || t.includes('changelog')) return 'developer_tools';
  if (t.includes('community') || t.includes('discord') || t.includes('meeting') || t.includes('team') || t.includes('employee')) return 'community';
  if (t.includes('landing page') || t.includes('survey') || t.includes('email') || t.includes('demo') || t.includes('testimonial')) return 'marketing';
  if (t.includes('knowledge') || t.includes('notion')) return 'productivity';
  if (t.includes('privacy') || t.includes('warranty') || t.includes('handbook')) return 'legal';
  if (t.includes('carbon') || t.includes('plant')) return 'sustainability';
  if (t.includes('toddler') || t.includes('baby') || t.includes('book club')) return 'parenting';
  if (t.includes('renovation') || t.includes('home')) return 'real_estate';
  return 'general';
}

// ── Run ──
const keywords = generateKeywords();
console.error(`Generated ${keywords.length} keywords`);

// Output JSON
console.log(JSON.stringify(keywords, null, 2));
