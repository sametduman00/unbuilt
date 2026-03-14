export interface Category {
  slug: string;
  label: string;
  emoji: string;
  color: string;
  subcategories: string[];
}

export const CATEGORIES: Category[] = [
  {
    slug: "games",
    label: "Games",
    emoji: "🎮",
    color: "#e74c3c",
    subcategories: ["Puzzle Games", "Action Games", "Strategy Games", "Casual Games", "RPG Games", "Simulation Games"],
  },
  {
    slug: "health-fitness",
    label: "Health & Fitness",
    emoji: "💪",
    color: "#2ecc71",
    subcategories: ["Workout Tracking", "Meditation & Mindfulness", "Nutrition & Diet", "Sleep Tracking", "Women's Health"],
  },
  {
    slug: "finance",
    label: "Finance",
    emoji: "💰",
    color: "#f1c40f",
    subcategories: ["Budgeting Apps", "Investment Tracking", "Crypto & Web3", "Expense Management", "Tax Planning"],
  },
  {
    slug: "education",
    label: "Education",
    emoji: "📚",
    color: "#3498db",
    subcategories: ["Language Learning", "STEM Education", "Test Preparation", "Skill Development", "Kids Education"],
  },
  {
    slug: "productivity",
    label: "Productivity",
    emoji: "⚡",
    color: "#e67e22",
    subcategories: ["Task Management", "Note Taking", "Calendar & Scheduling", "Automation Tools", "Focus & Time Tracking"],
  },
  {
    slug: "social-networking",
    label: "Social Networking",
    emoji: "👥",
    color: "#9b59b6",
    subcategories: ["Community Platforms", "Dating Apps", "Professional Networking", "Anonymous Social", "Interest-Based Social"],
  },
  {
    slug: "entertainment",
    label: "Entertainment",
    emoji: "🎬",
    color: "#e91e63",
    subcategories: ["Streaming Apps", "Fan Communities", "Trivia & Quiz", "Meme & Content Creation", "Event Discovery"],
  },
  {
    slug: "food-drink",
    label: "Food & Drink",
    emoji: "🍕",
    color: "#ff5722",
    subcategories: ["Recipe Apps", "Meal Planning", "Restaurant Discovery", "Grocery & Delivery", "Cooking Community"],
  },
  {
    slug: "travel",
    label: "Travel",
    emoji: "✈️",
    color: "#00bcd4",
    subcategories: ["Trip Planning", "Hotel & Accommodation", "Local Experiences", "Travel Budget", "Digital Nomad Tools"],
  },
  {
    slug: "shopping",
    label: "Shopping",
    emoji: "🛍️",
    color: "#ff9800",
    subcategories: ["Price Comparison", "Coupon & Deals", "Secondhand & Resale", "Wishlist & Tracking", "Group Buying"],
  },
  {
    slug: "music",
    label: "Music",
    emoji: "🎵",
    color: "#8e44ad",
    subcategories: ["Music Production", "Practice & Learning", "Music Discovery", "DJ & Mixing", "Lyrics & Songwriting"],
  },
  {
    slug: "sports",
    label: "Sports",
    emoji: "⚽",
    color: "#27ae60",
    subcategories: ["Fantasy Sports", "Score Tracking", "Training & Coaching", "Sports Betting", "Pickup Games"],
  },
  {
    slug: "news",
    label: "News",
    emoji: "📰",
    color: "#607d8b",
    subcategories: ["News Aggregation", "Niche Newsletters", "Fact-Checking", "Local News", "Industry News"],
  },
  {
    slug: "weather",
    label: "Weather",
    emoji: "🌤️",
    color: "#4fc3f7",
    subcategories: ["Weather Alerts", "Outdoor Activity Weather", "Agricultural Weather", "Travel Weather", "Severe Weather Tracking"],
  },
  {
    slug: "utilities",
    label: "Utilities",
    emoji: "🔧",
    color: "#78909c",
    subcategories: ["File Management", "QR & Scanning", "Calculator & Converter", "Device Maintenance", "Privacy & Security"],
  },
  {
    slug: "photo-video",
    label: "Photo & Video",
    emoji: "📸",
    color: "#ec407a",
    subcategories: ["Photo Editing", "Video Editing", "Camera Apps", "Photo Organization", "AI Image Generation"],
  },
  {
    slug: "business",
    label: "Business",
    emoji: "💼",
    color: "#455a64",
    subcategories: ["CRM Tools", "Invoicing & Billing", "Team Collaboration", "HR & Recruiting", "Analytics & Reporting"],
  },
  {
    slug: "lifestyle",
    label: "Lifestyle",
    emoji: "🌿",
    color: "#66bb6a",
    subcategories: ["Habit Tracking", "Home & Interior", "Pet Care", "Personal Journaling", "Wardrobe & Fashion"],
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
