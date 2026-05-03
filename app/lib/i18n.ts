/**
 * UI label dictionary for Dig and Stack reports.
 *
 * Why this exists: Claude's narrative output already follows the
 * LANGUAGE_RULE (it answers in the user's language). But the UI
 * around the narrative — card titles, pill text, section headers,
 * recommended-action labels, button copy — is rendered by React
 * components with hardcoded English strings. So a Turkish user
 * sees a Turkish summary inside an English chrome ("CURRENT IDEA
 * ASSESSMENT", "RECOMMENDED: REPOSITION", "HIGH CONFIDENCE", etc.)
 * which feels broken.
 *
 * This module gives the UI components access to a single `t` object
 * with translations for every label. The component does:
 *   const t = getLabels(idea);
 *   <Card title={t.assessmentTitle}>
 *
 * Adding a new language:
 *   - Add a new LABELS_XX object below with the same shape as LABELS_EN.
 *   - Add a detection branch in detectLang().
 *   - That's it. Type-safe — TS will yell if you miss a key.
 */

type Labels = {
  // Top synthesis card
  assessmentTitle: string;
  confidenceHigh: string;
  confidenceModerate: string;
  confidenceLow: string;
  recommendedPrefix: string;
  // Section headers (small caps above blocks)
  whereItWorks: string;
  yourMove: string;
  hardPart: string;
  whatMakesItWork: string;
  bestNextMove: string;
  sharpenAngle: string;
  whyHasSignal: string;
  riskToWatch: string;
  upsideCondition: string;
  // Other cards
  scoreBreakdown: string;
  scoreBreakdownSub: string;
  marketSizing: string;
  marketSizingSub: string;
  multiSource: string;
  growing: string;
  marketSegments: string;
  marketSegmentsSub: string;
  communitySignals: string;
  communitySignalsSub: string;
  painPoints: string;
  painPointsSub: string;
  signalFeed: string;
  signalFeedSub: string;
  redditPosts: string;
  redditPostsSubFn: (n: number) => string;
  xPosts: string;
  xPostsSubFn: (n: number) => string;
  competitiveLandscape: string;
  competitiveLandscapeSubFn: (n: number) => string;
  activeSuffixFn: (n: number) => string;
  existingApps: string;
  existingAppsSub: string;
  marketGaps: string;
  marketGapsSub: string;
  swot: string;
  swotSub: string;
  targetCustomer: string;
  targetCustomerSub: string;
  goToMarket: string;
  goToMarketSub: string;
  industryTrends: string;
  industryTrendsSub: string;
  financialSnapshot: string;
  financialSnapshotSub: string;
  fundabilityRadar: string;
  fundabilityRadarSub: string;
  validateBeforeBuilding: string;
  validateBeforeBuildingSubFn: (n: number) => string;
  customerInterviewGuide: string;
  customerInterviewGuideSubFn: (n: number) => string;
  yourOpportunity: string;
  yourOpportunitySub: string;
  actNow: string;
  launchRoadmap: string;
  launchRoadmapSub: string;
  synthesis: string;
  synthesisSub: string;
  defensibility: string;
  defensibilitySub: string;
  // Recommended action enum labels (from synthesis.recommendedAction)
  actions: {
    kill: string;
    reposition: string;
    build_mvp: string;
    move_fast: string;
    watch_market: string;
    // Generic fallback shown if backend invents a new enum value we
    // haven't translated yet — UI uses raw string with underscores
    // replaced with spaces.
  };
  // Small confidence note below the card
  evidenceNoteFn: (active: number, total: number, level: string) => string;
};

const LABELS_EN: Labels = {
  assessmentTitle: "Current idea assessment",
  confidenceHigh: "high confidence",
  confidenceModerate: "moderate confidence",
  confidenceLow: "low confidence",
  recommendedPrefix: "Recommended",
  whereItWorks: "Where this idea actually works",
  yourMove: "Your move",
  hardPart: "The hard part",
  whatMakesItWork: "What makes this work",
  bestNextMove: "Best next move",
  sharpenAngle: "Sharpen the angle",
  whyHasSignal: "Why this has signal",
  riskToWatch: "The risk you should watch",
  upsideCondition: "Upside condition",
  scoreBreakdown: "Score Breakdown",
  scoreBreakdownSub: "How the market score was calculated",
  marketSizing: "Market Sizing",
  marketSizingSub: "TAM to SAM to SOM funnel",
  multiSource: "Multi-source",
  growing: "Growing",
  marketSegments: "Market Segments",
  marketSegmentsSub: "Addressable sub-markets ranked by fit",
  communitySignals: "Community Signals",
  communitySignalsSub: "What real users are saying",
  painPoints: "Pain Points",
  painPointsSub: "Real quotes from your target market",
  signalFeed: "Signal Feed",
  signalFeedSub: "Community discussions",
  redditPosts: "Reddit Posts",
  redditPostsSubFn: (n) => `Live posts from Reddit — ${n} found`,
  xPosts: "X / Twitter Posts",
  xPostsSubFn: (n) => `Live posts from X — ${n} found`,
  competitiveLandscape: "Competitive Landscape",
  competitiveLandscapeSubFn: (n) => `${n} competitors analyzed`,
  activeSuffixFn: (n) => `${n} Active`,
  existingApps: "Existing Apps",
  existingAppsSub: "Top results from App Store and Google Play",
  marketGaps: "Market Gaps",
  marketGapsSub: "Where competitors fall short",
  swot: "SWOT Analysis",
  swotSub: "Strategic position overview",
  targetCustomer: "Target Customer",
  targetCustomerSub: "Who to sell to first",
  goToMarket: "Go-to-Market Channels",
  goToMarketSub: "Distribution strategy + estimated CAC",
  industryTrends: "Industry Trends",
  industryTrendsSub: "Forces shaping your market",
  financialSnapshot: "Financial Snapshot",
  financialSnapshotSub: "Key metrics for your first year",
  fundabilityRadar: "Fundability Radar",
  fundabilityRadarSub: "Investor lens",
  validateBeforeBuilding: "Validate Before Building",
  validateBeforeBuildingSubFn: (n) => `${n} assumptions to test`,
  customerInterviewGuide: "Customer Interview Guide",
  customerInterviewGuideSubFn: (n) => `Non-leading questions — Target: ${n} interviews`,
  yourOpportunity: "Your Opportunity",
  yourOpportunitySub: "The gap you can own",
  actNow: "Act Now",
  launchRoadmap: "Launch Roadmap",
  launchRoadmapSub: "Phased go-to-market plan",
  synthesis: "Synthesis",
  synthesisSub: "Your idea, the full picture",
  defensibility: "Defensibility",
  defensibilitySub: "How protected is this position?",
  actions: {
    kill: "kill",
    reposition: "reposition",
    build_mvp: "build mvp",
    move_fast: "move fast",
    watch_market: "watch market",
  },
  evidenceNoteFn: (active, total, level) =>
    `${active} of ${total} data sources returned results. Confidence: ${level}.`,
};

const LABELS_TR: Labels = {
  assessmentTitle: "Mevcut fikir değerlendirmesi",
  confidenceHigh: "yüksek güven",
  confidenceModerate: "orta güven",
  confidenceLow: "düşük güven",
  recommendedPrefix: "Önerilen",
  whereItWorks: "Bu fikir gerçekten nerede işe yarar",
  yourMove: "Senin hamlen",
  hardPart: "Zor kısmı",
  whatMakesItWork: "Bunu işe yarayan şey",
  bestNextMove: "En iyi sonraki hamle",
  sharpenAngle: "Açıyı keskinleştir",
  whyHasSignal: "Neden sinyal var",
  riskToWatch: "Dikkat etmen gereken risk",
  upsideCondition: "Yükseliş koşulu",
  scoreBreakdown: "Skor Dağılımı",
  scoreBreakdownSub: "Pazar skoru nasıl hesaplandı",
  marketSizing: "Pazar Büyüklüğü",
  marketSizingSub: "TAM, SAM ve SOM hunisi",
  multiSource: "Çoklu kaynak",
  growing: "Büyüyor",
  marketSegments: "Pazar Segmentleri",
  marketSegmentsSub: "Uygunluğa göre sıralanmış alt pazarlar",
  communitySignals: "Topluluk Sinyalleri",
  communitySignalsSub: "Gerçek kullanıcılar ne diyor",
  painPoints: "Acı Noktaları",
  painPointsSub: "Hedef pazardan gerçek alıntılar",
  signalFeed: "Sinyal Akışı",
  signalFeedSub: "Topluluk tartışmaları",
  redditPosts: "Reddit Gönderileri",
  redditPostsSubFn: (n) => `Reddit'ten canlı gönderiler — ${n} bulundu`,
  xPosts: "X / Twitter Gönderileri",
  xPostsSubFn: (n) => `X'ten canlı gönderiler — ${n} bulundu`,
  competitiveLandscape: "Rekabet Görünümü",
  competitiveLandscapeSubFn: (n) => `${n} rakip analiz edildi`,
  activeSuffixFn: (n) => `${n} Aktif`,
  existingApps: "Mevcut Uygulamalar",
  existingAppsSub: "App Store ve Google Play'den en iyi sonuçlar",
  marketGaps: "Pazar Boşlukları",
  marketGapsSub: "Rakiplerin zayıf kaldığı yerler",
  swot: "SWOT Analizi",
  swotSub: "Stratejik konum özeti",
  targetCustomer: "Hedef Müşteri",
  targetCustomerSub: "Önce kime satılmalı",
  goToMarket: "Pazara Giriş Kanalları",
  goToMarketSub: "Dağıtım stratejisi + tahmini CAC",
  industryTrends: "Sektör Trendleri",
  industryTrendsSub: "Pazarını şekillendiren kuvvetler",
  financialSnapshot: "Finansal Görünüm",
  financialSnapshotSub: "İlk yıl için temel metrikler",
  fundabilityRadar: "Yatırım Potansiyeli",
  fundabilityRadarSub: "Yatırımcı gözüyle",
  validateBeforeBuilding: "İnşa Etmeden Önce Doğrula",
  validateBeforeBuildingSubFn: (n) => `${n} test edilecek varsayım`,
  customerInterviewGuide: "Müşteri Görüşme Rehberi",
  customerInterviewGuideSubFn: (n) => `Yönlendirici olmayan sorular — Hedef: ${n} görüşme`,
  yourOpportunity: "Senin Fırsatın",
  yourOpportunitySub: "Sahip olabileceğin boşluk",
  actNow: "Hemen Harekete Geç",
  launchRoadmap: "Lansman Yol Haritası",
  launchRoadmapSub: "Aşamalı pazara giriş planı",
  synthesis: "Sentez",
  synthesisSub: "Fikrinin bütüncül resmi",
  defensibility: "Korunma Gücü",
  defensibilitySub: "Bu konum ne kadar korunuyor?",
  actions: {
    kill: "iptal et",
    reposition: "yeniden konumlandır",
    build_mvp: "mvp yap",
    move_fast: "hızlı hareket et",
    watch_market: "pazarı izle",
  },
  evidenceNoteFn: (active, total, level) => {
    const lvl = level === "high" ? "yüksek" : level === "moderate" ? "orta" : level === "low" ? "düşük" : level;
    return `${total} kaynaktan ${active} tanesi sonuç döndürdü. Güven: ${lvl}.`;
  },
};

/**
 * Detect language from a free-form idea/query string. Conservative —
 * only returns "tr" if there's strong evidence; otherwise "en". Adding
 * a new language? Add a branch above the final return.
 */
export function detectLang(input: string | null | undefined): "en" | "tr" {
  if (!input) return "en";
  const text = input.toLowerCase();

  // Turkish-specific characters carry the strongest signal — none of
  // them appear in English. One occurrence is enough.
  if (/[çğıöşü]/i.test(input)) return "tr";

  // Common Turkish stopwords / function words — most English text
  // would never contain these. Catch lower-case Turkish input
  // even when the user typed without diacritics ("icin" vs "için").
  const trMarkers = /\b(bir|ve|ile|icin|için|gibi|olarak|kullanici|kullanıcı|uygulama|sistem|nasil|nasıl|nedir|veya|ama|ya da|degil|değil|eğer|eger|hangi|burada|orada|şimdi|simdi|bugün|bugun)\b/;
  if (trMarkers.test(text)) return "tr";

  return "en";
}

export function getLabels(input: string | null | undefined): Labels {
  return detectLang(input) === "tr" ? LABELS_TR : LABELS_EN;
}

// Exported just in case a component wants to opt-in to a specific lang.
export const LABELS = { en: LABELS_EN, tr: LABELS_TR };
