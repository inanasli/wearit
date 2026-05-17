import { createId } from "@/lib/storage/db";
import type { ClothingItem, Database, FeedbackType, MainCategory, Outfit, OutfitItem } from "@/lib/types";

export type WeatherContext = {
  temperature: number;
  condition: string;
  precipitation: number;
};

type ScoreBreakdown = {
  categoryCompleteness: number;
  weatherSuitability: number;
  styleCompatibility: number;
  stylePreference: number;
  colorCompatibility: number;
  colorPreference: number;
  userOutfitSimilarity: number;
  feedbackSimilarity: number;
  diversity: number;
  dislikePenalty: number;
};

type ScoredCandidate = {
  key: string;
  items: ClothingItem[];
  template: MainCategory[];
  score: number;
  breakdown: ScoreBreakdown;
  reason: string;
  styleTags: string[];
  colors: string[];
};

export type RecommendationCandidateResult = {
  outfitItemIds: string[];
  itemNames: string[];
  score: number;
  scoreBreakdown: ScoreBreakdown;
  reason: string;
  styleTags: string[];
  colors: string[];
};

export type GeneratedRecommendation = {
  outfit: Outfit;
  outfitItems: OutfitItem[];
  reason: string;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  topCandidates: RecommendationCandidateResult[];
};

const templates: MainCategory[][] = [
  ["upper", "lower", "shoes"],
  ["dress", "shoes"],
  ["upper", "lower", "outerwear", "shoes"],
  ["dress", "outerwear", "shoes"],
  ["upper", "lower", "shoes", "accessory"],
  ["upper", "lower", "shoes", "bag"],
];

const neutralColors = new Set(["black", "white", "beige", "gray", "grey", "cream", "navy", "brown"]);
const strongColors = new Set(["red", "green", "blue", "pink", "purple", "yellow", "orange"]);
const compatibleColorPairs = new Set([
  "black-white",
  "black-gray",
  "black-beige",
  "black-red",
  "white-blue",
  "white-beige",
  "white-gray",
  "blue-brown",
  "blue-white",
  "beige-brown",
  "beige-green",
  "beige-orange",
  "gray-pink",
  "green-brown",
  "navy-white",
]);

export function generateRecommendation(db: Database, weather?: WeatherContext): GeneratedRecommendation | null {
  const candidates = scoreCandidates(db, weather);
  if (!candidates.length) return null;

  const best = candidates[0];
  const now = new Date().toISOString();
  const outfit: Outfit = {
    id: createId("outfit"),
    userId: "demo-user",
    name: `Günün kombini: ${templateName(best.template)}`,
    description: best.reason,
    styleTags: best.styleTags,
    createdBy: "ai",
    createdAt: now,
    updatedAt: now,
  };
  const outfitItems = best.items.map((item) => ({
    id: createId("outfit_item"),
    outfitId: outfit.id,
    clothingItemId: item.id,
    slot: item.mainCategory,
  }));

  return {
    outfit,
    outfitItems,
    reason: best.reason,
    score: Math.round(best.score),
    scoreBreakdown: roundBreakdown(best.breakdown),
    topCandidates: candidates.slice(0, 3).map(toCandidateResult),
  };
}

function scoreCandidates(db: Database, weather?: WeatherContext) {
  const byCategory = groupByCategory(db.clothingItems);
  const seen = new Set<string>();
  const dislikedExactKeys = new Set(
    db.feedback
      .filter((feedback) => feedback.feedbackType === "dislike")
      .map((feedback) => outfitKey(getOutfitItems(feedback.outfitId, db).map((item) => item.id)))
      .filter(Boolean),
  );

  return templates
    .flatMap((template) => buildCandidates(template, byCategory).map((items) => ({ template, items })))
    .filter(({ template, items }) => isValidCandidate(template, items))
    .filter(({ items }) => {
      const key = outfitKey(items.map((item) => item.id));
      if (seen.has(key) || dislikedExactKeys.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(({ template, items }) => scoreCandidate(template, items, db, weather))
    .sort((a, b) => b.score - a.score);
}

function groupByCategory(items: ClothingItem[]) {
  return items.reduce<Record<string, ClothingItem[]>>((acc, item) => {
    acc[item.mainCategory] = [...(acc[item.mainCategory] || []), item];
    return acc;
  }, {});
}

function buildCandidates(template: MainCategory[], byCategory: Record<string, ClothingItem[]>): ClothingItem[][] {
  if (template.some((category) => !byCategory[category]?.length)) return [];
  return template.reduce<ClothingItem[][]>(
    (rows, category) => rows.flatMap((row) => byCategory[category].map((item) => [...row, item])),
    [[]],
  );
}

function isValidCandidate(template: MainCategory[], items: ClothingItem[]) {
  const categories = items.map((item) => item.mainCategory);
  const hasRequiredCategories = template.every((category) => categories.includes(category));
  const combinesDressWithLower = categories.includes("dress") && categories.includes("lower") && !template.includes("dress");
  return hasRequiredCategories && !combinesDressWithLower && new Set(items.map((item) => item.id)).size === items.length;
}

function scoreCandidate(template: MainCategory[], items: ClothingItem[], db: Database, weather?: WeatherContext): ScoredCandidate {
  const styleTags = unique(items.flatMap((item) => item.styleTags));
  const colors = unique(items.flatMap((item) => item.colors.filter((color) => color !== "unknown").map(normalizeColor)));
  const userSimilarity = maxSimilarityToOutfits(items, db, (outfit) => outfit.createdBy === "user");
  const likedSimilarity = maxSimilarityToFeedback(items, db, "like");
  const dislikedSimilarity = maxSimilarityToFeedback(items, db, "dislike");
  const notTodaySimilarity = maxSimilarityToFeedback(items, db, "not_today");
  const breakdown: ScoreBreakdown = {
    categoryCompleteness: 25,
    weatherSuitability: scoreWeatherSuitability(items, template, weather),
    styleCompatibility: sharedStyleTags(items).length > 0 ? 10 : 0,
    stylePreference: scoreStylePreferences(styleTags, db),
    colorCompatibility: scoreColorCompatibility(colors, items),
    colorPreference: scoreColorPreferences(colors, db),
    userOutfitSimilarity: userSimilarity >= 0.45 ? 10 : userSimilarity >= 0.25 ? 5 : 0,
    feedbackSimilarity: (likedSimilarity >= 0.45 ? 15 : likedSimilarity >= 0.25 ? 8 : 0) - (notTodaySimilarity >= 0.45 ? 5 : notTodaySimilarity >= 0.25 ? 2 : 0),
    diversity: scoreDiversity(items, db),
    dislikePenalty: dislikedSimilarity >= 0.45 ? -20 : dislikedSimilarity >= 0.25 ? -10 : 0,
  };
  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  return {
    key: outfitKey(items.map((item) => item.id)),
    items,
    template,
    score,
    breakdown,
    reason: buildReason(styleTags, colors, breakdown, weather),
    styleTags,
    colors,
  };
}

function scoreStylePreferences(styleTags: string[], db: Database) {
  let score = 0;
  for (const pref of db.preferences) {
    if (!styleTags.includes(pref.styleTag)) continue;
    if (pref.weight > 0) score += 15 * Math.min(pref.weight, 2);
    if (pref.weight < 0) score -= 10 * Math.min(Math.abs(pref.weight), 2);
  }
  return Math.round(score);
}

function scoreColorPreferences(colors: string[], db: Database) {
  return Math.round(
    (db.colorPreferences || []).reduce((sum, pref) => {
      if (!colors.includes(normalizeColor(pref.color))) return sum;
      return sum + pref.weight * 4;
    }, 0),
  );
}

function scoreColorCompatibility(colors: string[], items: ClothingItem[]) {
  if (!colors.length) return 0;
  const neutralCount = colors.filter((color) => neutralColors.has(color)).length;
  const strongCount = colors.filter((color) => strongColors.has(color)).length;
  const hasPatternedItem = items.some((item) =>
    [...item.styleTags, item.subCategory, item.name].some((value) => /pattern|print|floral|colorful|bohemian/i.test(value)),
  );

  if (strongCount >= 4 && neutralCount === 0) return -8;
  if (neutralCount >= Math.max(1, colors.length - 1)) return 10;
  if (hasCompatibleColors(colors)) return 8;
  if (hasPatternedItem && neutralCount >= 1) return 5;
  if (colors.length <= 3) return 8;
  return 0;
}

function scoreDiversity(items: ClothingItem[], db: Database) {
  const recentOutfitIds = db.recommendations.slice(-5).map((recommendation) => recommendation.outfitId);
  const recentItemIds = new Set(
    db.outfitItems.filter((row) => recentOutfitIds.includes(row.outfitId)).map((row) => row.clothingItemId),
  );
  return items.some((item) => recentItemIds.has(item.id)) ? 0 : 5;
}

function maxSimilarityToFeedback(items: ClothingItem[], db: Database, feedbackType: FeedbackType) {
  const outfitIds = db.feedback.filter((feedback) => feedback.feedbackType === feedbackType).map((feedback) => feedback.outfitId);
  return Math.max(0, ...outfitIds.map((outfitId) => similarity(items, getOutfitItems(outfitId, db))));
}

function maxSimilarityToOutfits(items: ClothingItem[], db: Database, filter: (outfit: Outfit) => boolean) {
  return Math.max(0, ...db.outfits.filter(filter).map((outfit) => similarity(items, getOutfitItems(outfit.id, db))));
}

function similarity(candidateItems: ClothingItem[], referenceItems: ClothingItem[]) {
  if (!referenceItems.length) return 0;
  const candidateTags = unique(candidateItems.flatMap((item) => item.styleTags));
  const referenceTags = unique(referenceItems.flatMap((item) => item.styleTags));
  const candidateColors = unique(candidateItems.flatMap((item) => item.colors.map(normalizeColor)));
  const referenceColors = unique(referenceItems.flatMap((item) => item.colors.map(normalizeColor)));
  const candidateCategories = unique(candidateItems.map((item) => item.mainCategory));
  const referenceCategories = unique(referenceItems.map((item) => item.mainCategory));
  return (
    jaccard(candidateTags, referenceTags) * 0.45 +
    jaccard(candidateColors, referenceColors) * 0.25 +
    jaccard(candidateCategories, referenceCategories) * 0.3
  );
}

function getOutfitItems(outfitId: string, db: Database) {
  const ids = db.outfitItems.filter((row) => row.outfitId === outfitId).map((row) => row.clothingItemId);
  return db.clothingItems.filter((item) => ids.includes(item.id));
}

function scoreWeatherSuitability(items: ClothingItem[], template: MainCategory[], weather?: WeatherContext) {
  if (!weather || Number.isNaN(weather.temperature)) return 0;
  const temperature = weather.temperature;
  const condition = weather.condition.toLowerCase();
  const tags = items.flatMap((item) => item.seasonTags.map((tag) => tag.toLowerCase()));
  const hasOuterwear = template.includes("outerwear");
  const hasShoes = template.includes("shoes");
  const hasWinter = tags.some((tag) => tag.includes("winter") || tag.includes("autumn"));
  const hasSummer = tags.some((tag) => tag.includes("summer") || tag.includes("spring"));
  let score = 0;

  if (temperature <= 10) score += hasOuterwear ? 18 : -18;
  if (temperature <= 5) score += hasOuterwear ? 10 : -12;
  if (temperature > 10 && temperature <= 18) score += hasOuterwear || hasWinter ? 14 : -2;
  if (temperature >= 24) score += hasSummer && !hasOuterwear ? 16 : hasOuterwear ? -18 : 6;
  if (temperature > 18 && temperature < 24) score += tags.includes("all_season") || hasSummer ? 8 : 4;
  if ((condition.includes("rain") || condition.includes("yağmur") || weather.precipitation > 0.2) && hasShoes) score += hasOuterwear ? 12 : 5;
  if ((condition.includes("snow") || condition.includes("kar")) && hasOuterwear) score += 10;

  return Math.max(-20, Math.min(24, score));
}

function buildReason(styleTags: string[], colors: string[], breakdown: ScoreBreakdown, weather?: WeatherContext) {
  const reasons = [];
  if (weather && breakdown.weatherSuitability > 0) reasons.push(`${Math.round(weather.temperature)}°C ve ${weather.condition} hava durumuna uygun`);
  if (weather && breakdown.weatherSuitability < 0) reasons.push("eldeki parçalar içinde hava durumuna en yakın dengeyi kuruyor");
  if (breakdown.stylePreference > 0) reasons.push(`${styleTags.slice(0, 3).join(", ")} stil tercihinle uyumlu`);
  if (breakdown.colorCompatibility >= 8) reasons.push(colors.some((color) => neutralColors.has(color)) ? "nötr renklerle kolay uyum sağlıyor" : "renk paleti dengeli");
  if (breakdown.userOutfitSimilarity > 0) reasons.push("daha önce kaydettiğin kombinlere benziyor");
  if (breakdown.feedbackSimilarity > 0) reasons.push("beğendiğin kombinlere yakın");
  if (breakdown.diversity > 0) reasons.push("son önerilere göre biraz çeşitlilik katıyor");
  if (!reasons.length) reasons.push("gerekli kıyafet kategorilerini tamamlıyor ve en yüksek skoru alıyor");
  return `Bu kombin ${reasons.join(", ")} olduğu için önerildi.`;
}

function templateName(template: MainCategory[]) {
  const labels: Record<MainCategory, string> = {
    head: "baş",
    upper: "üst",
    lower: "alt",
    dress: "elbise",
    outerwear: "dış giyim",
    shoes: "ayakkabı",
    bag: "çanta",
    accessory: "aksesuar",
  };
  return template.map((item) => labels[item]).join(" + ");
}

function toCandidateResult(candidate: ScoredCandidate): RecommendationCandidateResult {
  return {
    outfitItemIds: candidate.items.map((item) => item.id),
    itemNames: candidate.items.map((item) => item.name),
    score: Math.round(candidate.score),
    scoreBreakdown: roundBreakdown(candidate.breakdown),
    reason: candidate.reason,
    styleTags: candidate.styleTags,
    colors: candidate.colors,
  };
}

function roundBreakdown(breakdown: ScoreBreakdown) {
  return Object.fromEntries(Object.entries(breakdown).map(([key, value]) => [key, Math.round(value)])) as ScoreBreakdown;
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function outfitKey(ids: string[]) {
  return ids.slice().sort().join("|");
}

function sharedStyleTags(items: ClothingItem[]) {
  const all = items.flatMap((item) => item.styleTags);
  return unique(all).filter((tag) => all.filter((value) => value === tag).length > 1);
}

function hasCompatibleColors(colors: string[]) {
  return colors.some((a) => colors.some((b) => a !== b && compatibleColorPairs.has([a, b].sort().join("-"))));
}

function normalizeColor(color: string) {
  return color.toLowerCase() === "grey" ? "gray" : color.toLowerCase();
}

function jaccard(a: string[], b: string[]) {
  const left = new Set(a);
  const right = new Set(b);
  const union = new Set([...left, ...right]);
  if (!union.size) return 0;
  return [...left].filter((value) => right.has(value)).length / union.size;
}
