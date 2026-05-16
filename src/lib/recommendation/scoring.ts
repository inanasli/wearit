import { createId } from "@/lib/storage/db";
import type { ClothingItem, Database, MainCategory, Outfit, OutfitItem } from "@/lib/types";

type Candidate = {
  items: ClothingItem[];
  score: number;
  reason: string;
  styleTags: string[];
};

const templates: MainCategory[][] = [
  ["upper", "lower", "shoes"],
  ["dress", "shoes"],
  ["upper", "lower", "outerwear", "shoes"],
  ["upper", "lower", "shoes", "accessory"],
  ["upper", "lower", "shoes", "bag"],
];

const compatibleColors = new Set([
  "black-white",
  "black-gray",
  "black-red",
  "white-blue",
  "white-beige",
  "blue-brown",
  "blue-white",
  "beige-brown",
  "gray-pink",
  "green-brown",
]);

export function generateRecommendation(db: Database): { outfit: Outfit; outfitItems: OutfitItem[]; reason: string; score: number } | null {
  const byCategory = groupByCategory(db.clothingItems);
  const candidates = templates.flatMap((template) => buildCandidates(template, byCategory).slice(0, 40));
  if (!candidates.length) return null;

  const scored = candidates
    .map((candidate) => scoreCandidate(candidate, db))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  const now = new Date().toISOString();
  const outfit: Outfit = {
    id: createId("outfit"),
    userId: "demo-user",
    name: `Recommended ${best.items.map((item) => item.mainCategory).join(" + ")}`,
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

  return { outfit, outfitItems, reason: best.reason, score: Math.round(best.score) };
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

function scoreCandidate(items: ClothingItem[], db: Database): Candidate {
  const tags = unique(items.flatMap((item) => item.styleTags));
  const colors = unique(items.flatMap((item) => item.colors.filter((color) => color !== "unknown")));
  const preferenceScore = db.preferences.reduce((sum, pref) => sum + (tags.includes(pref.styleTag) ? pref.weight * 10 : 0), 0);
  const styleOverlap = tags.length < items.length ? 10 : countSharedTags(items) * 5;
  const colorScore = colors.length <= 2 || hasCompatibleColors(colors) ? 8 : 0;
  const userSimilarity = similarToOutfits(items, db, ["user"]) * 5;
  const liked = feedbackSimilarity(items, db, "like") * 10;
  const disliked = feedbackSimilarity(items, db, "dislike") * -15;
  const notToday = feedbackSimilarity(items, db, "not_today") * -5;
  const score = 20 + preferenceScore + styleOverlap + colorScore + userSimilarity + liked + disliked + notToday;
  const reasonParts = [
    preferenceScore > 0 ? `matches your ${tags.filter((tag) => db.preferences.some((pref) => pref.styleTag === tag && pref.weight > 0)).join(", ")} preferences` : "uses your wardrobe categories well",
    colorScore ? "has compatible colors" : "keeps the outfit complete",
    liked > 0 ? "is similar to outfits you liked before" : "",
  ].filter(Boolean);

  return {
    items,
    styleTags: tags,
    score,
    reason: `This outfit was recommended because it ${reasonParts.join(" and ")}. The score is transparent and feedback will affect future results.`,
  };
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function countSharedTags(items: ClothingItem[]) {
  const all = items.flatMap((item) => item.styleTags);
  return unique(all).filter((tag) => all.filter((value) => value === tag).length > 1).length;
}

function hasCompatibleColors(colors: string[]) {
  return colors.some((a) => colors.some((b) => a !== b && compatibleColors.has([a, b].sort().join("-"))));
}

function similarToOutfits(items: ClothingItem[], db: Database, createdBy: Array<"user" | "ai">) {
  const itemIds = new Set(items.map((item) => item.id));
  return db.outfits.filter((outfit) => createdBy.includes(outfit.createdBy)).reduce((sum, outfit) => {
    const outfitItemIds = db.outfitItems.filter((row) => row.outfitId === outfit.id).map((row) => row.clothingItemId);
    return sum + (outfitItemIds.some((id) => itemIds.has(id)) ? 1 : 0);
  }, 0);
}

function feedbackSimilarity(items: ClothingItem[], db: Database, feedbackType: "like" | "not_today" | "dislike") {
  const itemIds = new Set(items.map((item) => item.id));
  return db.feedback.filter((row) => row.feedbackType === feedbackType).reduce((sum, row) => {
    const outfitItemIds = db.outfitItems.filter((item) => item.outfitId === row.outfitId).map((item) => item.clothingItemId);
    return sum + (outfitItemIds.some((id) => itemIds.has(id)) ? 1 : 0);
  }, 0);
}
