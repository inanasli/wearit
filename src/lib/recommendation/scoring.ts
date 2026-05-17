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
  formalityCompatibility: number;
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
  "navy-beige",
  "navy-gray",
  "cream-brown",
  "cream-blue",
  "white-green",
  "black-blue",
]);

const clashingColorPairs = new Set([
  "red-green",
  "red-orange",
  "pink-red",
  "purple-orange",
  "yellow-purple",
  "green-purple",
]);

const styleFamilies: Record<string, string[]> = {
  casual: ["casual", "basic", "comfortable", "streetwear", "sporty"],
  smart: ["smart_casual", "minimal", "classic", "elegant", "formal"],
  summer: ["summer", "bohemian", "colorful", "comfortable", "casual"],
};

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
  const recentExactKeys = new Set(
    db.recommendations
      .slice(-6)
      .map((recommendation) => outfitKey(getOutfitItems(recommendation.outfitId, db).map((item) => item.id)))
      .filter(Boolean),
  );

  const candidates = templates
    .flatMap((template) => buildCandidates(template, byCategory).map((items) => ({ template, items })))
    .filter(({ template, items }) => isValidCandidate(template, items))
    .filter(({ items }) => {
      const key = outfitKey(items.map((item) => item.id));
      if (seen.has(key) || dislikedExactKeys.has(key)) return false;
      seen.add(key);
      return true;
    });

  const freshCandidates = candidates.filter(({ items }) => !recentExactKeys.has(outfitKey(items.map((item) => item.id))));
  return (freshCandidates.length ? freshCandidates : candidates)
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
    styleCompatibility: scoreStyleCompatibility(items),
    formalityCompatibility: scoreFormalityCompatibility(items),
    stylePreference: scoreStylePreferences(items, db),
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

function scoreStylePreferences(items: ClothingItem[], db: Database) {
  const activePrefs = db.preferences.filter((pref) => pref.weight > 0);
  if (!activePrefs.length) return 0;

  const preferredTags = new Set(activePrefs.map((pref) => pref.styleTag));
  const matchedItems = items.filter((item) => item.styleTags.some((tag) => preferredTags.has(tag))).length;
  const matchedTags = unique(items.flatMap((item) => item.styleTags.filter((tag) => preferredTags.has(tag))));
  const matchRatio = matchedItems / items.length;

  let score = Math.round(matchRatio * 32 + matchedTags.length * 4);
  if (matchedItems === items.length) score += 10;
  if (matchedItems === 0) score -= 24;

  for (const pref of db.preferences) {
    if (pref.weight >= 0) continue;
    const hasDislikedStyle = items.some((item) => item.styleTags.includes(pref.styleTag));
    if (hasDislikedStyle) score -= 12 * Math.min(Math.abs(pref.weight), 2);
  }

  return Math.max(-30, Math.min(52, score));
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

  if (hasClashingColors(colors) && neutralCount === 0) return -14;
  if (strongCount >= 3 && neutralCount === 0) return -10;
  if (neutralCount >= Math.max(1, colors.length - 1)) return 14;
  if (hasCompatibleColors(colors)) return 12;
  if (hasPatternedItem && neutralCount >= 1) return 8;
  if (colors.length <= 2) return 9;
  if (colors.length <= 3 && neutralCount >= 1) return 6;
  return -2;
}

function scoreStyleCompatibility(items: ClothingItem[]) {
  const tags = unique(items.flatMap((item) => item.styleTags));
  const shared = sharedStyleTags(items);
  let bestFamilyScore = 0;

  for (const familyTags of Object.values(styleFamilies)) {
    const matches = items.filter((item) => item.styleTags.some((tag) => familyTags.includes(tag))).length;
    bestFamilyScore = Math.max(bestFamilyScore, matches);
  }

  let score = 0;
  if (shared.length >= 2) score += 16;
  else if (shared.length === 1) score += 12;
  else if (bestFamilyScore === items.length) score += 10;
  else if (bestFamilyScore >= Math.max(2, items.length - 1)) score += 7;

  score += scoreOutfitCoherence(items);
  if (tags.includes("formal") && tags.includes("sporty")) score -= 12;
  return Math.max(-35, Math.min(22, score));
}

function scoreOutfitCoherence(items: ClothingItem[]) {
  const has = (category: MainCategory, pattern: RegExp) =>
    items.some((item) => item.mainCategory === category && pattern.test(itemText(item)));
  const hasCategory = (category: MainCategory) => items.some((item) => item.mainCategory === category);
  const allText = items.map(itemText).join(" ");
  let score = 0;

  if (has("dress", /\b(evening|satin|formal|gown|mini)\b/) && has("shoes", /\b(sneaker|running|sport)\b/)) score -= 20;
  if (has("lower", /\b(skirt|etek)\b/) && has("upper", /\b(hoodie|sweatshirt|sport)\b/)) score -= 12;
  if (has("upper", /\b(tank|crop|cami|askılı|askili)\b/) && has("outerwear", /\b(coat|trench|winter)\b/)) score -= 10;
  if (has("upper", /\b(blouse|shirt|sweater|kazak|gömlek|gomlek)\b/) && has("lower", /\b(trousers|wide leg|pantolon|midi skirt)\b/)) score += 8;
  if (has("upper", /\b(t-shirt|tee|basic)\b/) && has("lower", /\b(jeans|denim|pants)\b/) && has("shoes", /\b(sneaker)\b/)) score += 8;
  if (has("outerwear", /\b(blazer|jacket|ceket)\b/) && has("lower", /\b(trousers|wide leg|pantolon|skirt|etek)\b/)) score += 8;
  if (hasCategory("dress") && has("shoes", /\b(heel|loafer|boot|bot|sandal)\b/)) score += 6;
  if (/\b(patterned|multicolor|colorful)\b/.test(allText) && items.filter((item) => item.colors.some((color) => neutralColors.has(normalizeColor(color)))).length === 0) {
    score -= 8;
  }

  return score;
}

function scoreFormalityCompatibility(items: ClothingItem[]) {
  const formalityRank: Record<string, number> = {
    sporty: 0,
    casual: 1,
    unknown: 1,
    smart_casual: 2,
    formal: 3,
  };
  const ranks = items.map((item) => formalityRank[item.formality] ?? 1);
  const spread = Math.max(...ranks) - Math.min(...ranks);
  if (spread === 0) return 10;
  if (spread === 1) return 7;
  if (spread === 2) return -4;
  return -10;
}

function scoreDiversity(items: ClothingItem[], db: Database) {
  const recentOutfitIds = db.recommendations.slice(-8).map((recommendation) => recommendation.outfitId);
  const recentItemIds = new Set(
    db.outfitItems.filter((row) => recentOutfitIds.includes(row.outfitId)).map((row) => row.clothingItemId),
  );
  const repeatedCount = items.filter((item) => recentItemIds.has(item.id)).length;
  if (repeatedCount === 0) return 14;
  if (repeatedCount === 1) return -8;
  if (repeatedCount === 2) return -18;
  return -30;
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
  const isWet = isWetWeather(weather);
  const hasDress = template.includes("dress");
  const shoes = items.filter((item) => item.mainCategory === "shoes");
  let score = 0;

  if (temperature <= 10) score += hasOuterwear ? 22 : -30;
  if (temperature <= 5) score += hasOuterwear && hasWinter ? 14 : -18;
  if (temperature > 10 && temperature <= 18) score += hasOuterwear || hasWinter ? 16 : -4;
  if (temperature >= 24) score += hasSummer && !hasOuterwear ? 18 : hasOuterwear ? -24 : 8;
  if (temperature > 18 && temperature < 24) score += tags.includes("all_season") || hasSummer ? 8 : 4;

  if (isWet && hasShoes) {
    score += hasOuterwear ? 18 : -26;
    score += shoes.some(isWeatherResistantShoe) ? 16 : shoes.some(isOpenOrLightShoe) ? -24 : -8;
    if (hasDress && !hasOuterwear) score -= 22;
    if (hasDress && items.some(isSummerOrLightItem)) score -= 16;
  }

  if ((condition.includes("snow") || condition.includes("kar")) && hasOuterwear) score += 10;
  score += items.reduce((sum, item) => sum + scoreItemForWeather(item, weather), 0);

  return Math.max(-60, Math.min(55, score));
}

function scoreItemForWeather(item: ClothingItem, weather: WeatherContext) {
  const temperature = weather.temperature;
  const tags = item.seasonTags.map((tag) => tag.toLowerCase());
  const text = itemText(item);
  let score = 0;

  if (temperature <= 10) {
    if (tags.some((tag) => tag.includes("winter") || tag.includes("autumn"))) score += 8;
    if (isSummerOrLightItem(item)) score -= 18;
  }

  if (temperature >= 24) {
    if (tags.some((tag) => tag.includes("summer") || tag.includes("spring"))) score += 7;
    if (item.mainCategory === "outerwear" || text.includes("sweater") || text.includes("kazak")) score -= 16;
  }

  if (isWetWeather(weather)) {
    if (item.mainCategory === "outerwear") score += 10;
    if (item.mainCategory === "dress" && isSummerOrLightItem(item)) score -= 18;
    if (item.mainCategory === "shoes" && isWeatherResistantShoe(item)) score += 12;
    if (item.mainCategory === "shoes" && isOpenOrLightShoe(item)) score -= 18;
  }

  return score;
}

function isWetWeather(weather: WeatherContext) {
  const condition = weather.condition.toLowerCase();
  return (
    condition.includes("rain") ||
    condition.includes("yağmur") ||
    condition.includes("wet") ||
    condition.includes("storm") ||
    condition.includes("fırtına") ||
    weather.precipitation > 0.2
  );
}

function isSummerOrLightItem(item: ClothingItem) {
  const text = itemText(item);
  return (
    item.seasonTags.some((tag) => ["summer", "spring"].includes(tag.toLowerCase())) ||
    text.includes("tank") ||
    text.includes("askılı") ||
    text.includes("t-shirt") ||
    text.includes("mini") ||
    text.includes("sandal")
  );
}

function isWeatherResistantShoe(item: ClothingItem) {
  const text = itemText(item);
  return text.includes("boot") || text.includes("bot") || text.includes("leather") || text.includes("deri");
}

function isOpenOrLightShoe(item: ClothingItem) {
  const text = itemText(item);
  return text.includes("sandal") || text.includes("heel") || text.includes("stiletto") || text.includes("sneaker");
}

function itemText(item: ClothingItem) {
  return `${item.name} ${item.subCategory} ${item.styleTags.join(" ")} ${item.aiDescription}`.toLowerCase();
}

function buildReason(styleTags: string[], colors: string[], breakdown: ScoreBreakdown, weather?: WeatherContext) {
  const reasons = [];
  if (weather && breakdown.weatherSuitability > 0) reasons.push(`${Math.round(weather.temperature)}°C ve ${weather.condition} hava durumuna uygun`);
  if (weather && breakdown.weatherSuitability < 0) reasons.push("eldeki parçalar içinde hava durumuna en yakın dengeyi kuruyor");
  if (breakdown.formalityCompatibility >= 7) reasons.push("parçaların günlük/formal seviyesi birbirine yakın");
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

function hasClashingColors(colors: string[]) {
  return colors.some((a) => colors.some((b) => a !== b && clashingColorPairs.has([a, b].sort().join("-"))));
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
