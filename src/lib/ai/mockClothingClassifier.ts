import { normalizeClassification } from "@/lib/api";
import type { ClothingClassification, Formality, MainCategory } from "@/lib/types";

export type MockClassifyInput = {
  imageUrl?: string;
  fileName?: string;
  productUrl?: string;
  title?: string;
  description?: string;
};

const categoryRules: Array<[MainCategory, string[]]> = [
  ["dress", ["shirt dress", "midi dress", "maxi dress", "black dress", "dress", "gown"]],
  ["outerwear", ["trench coat", "blazer", "jacket", "coat", "trench", "cardigan"]],
  ["shoes", ["sneakers", "sneaker", "shoe", "shoes", "boot", "boots", "heel", "heels", "sandal", "sandals"]],
  ["bag", ["handbag", "shoulder bag", "bag", "purse"]],
  ["head", ["beanie", "hat", "cap"]],
  ["lower", ["maxi skirt", "patterned skirt", "skirt", "pants", "jeans", "trousers", "shorts", "cargo"]],
  ["upper", ["camisole", "cami", "tank top", "tank", "blouse", "formal shirt", "shirt", "tshirt", "t shirt", "t-shirt", "top", "sweater", "hoodie"]],
];

const subCategoryRules = [
  "shirt dress",
  "maxi dress",
  "midi dress",
  "black dress",
  "maxi skirt",
  "patterned skirt",
  "shoulder bag",
  "tank top",
  "formal shirt",
  "camisole",
  "blazer",
  "cardigan",
  "trench",
  "blouse",
  "trousers",
  "sneakers",
  "boots",
  "sandals",
  "hoodie",
  "sweater",
  "jeans",
  "shorts",
  "skirt",
  "dress",
  "jacket",
  "coat",
  "shirt",
  "top",
  "bag",
  "hat",
];

const colorWords = ["black", "white", "blue", "beige", "red", "green", "gray", "grey", "brown", "pink", "purple", "yellow", "orange"];
const directStyleWords = ["casual", "sporty", "formal", "streetwear", "minimal", "classic", "elegant", "comfortable", "basic", "trendy", "bohemian", "colorful"];

export function mockClassifyClothing(input: MockClassifyInput, note = "Mock classification used because local vision was unavailable."): ClothingClassification {
  const sourceParts = [input.fileName, input.imageUrl, input.productUrl, input.title, input.description].filter(Boolean);
  const haystack = sourceParts
    .join(" ")
    .replace(/[^a-z0-9]+/gi, " ")
    .toLowerCase();

  const match = categoryRules.find(([, words]) => words.some((word) => hasTerm(haystack, word)));
  const mainCategory = match?.[0] ?? "upper";
  const subCategory = detectSubCategory(haystack, mainCategory);
  const colors = normalizeColors(colorWords.filter((color) => hasTerm(haystack, color)));
  const styleTags = detectStyleTags(haystack, mainCategory, subCategory, colors);
  const seasonTags = detectSeasonTags(haystack, mainCategory, subCategory);
  const formality = detectFormality(haystack, mainCategory, subCategory);
  const confidence = detectConfidence(haystack, Boolean(match), Boolean(input.title || input.description), colors.length, styleTags.length);
  const name = normalizeName(input.title || readableName(input.fileName || input.imageUrl || input.productUrl || `${subCategory} item`), subCategory, colors);

  return normalizeClassification({
    name,
    mainCategory,
    subCategory,
    colors: colors.length ? colors : ["unknown"],
    styleTags,
    seasonTags,
    formality,
    aiDescription: confidence < 0.6 ? `${note} Please review classification.` : note,
    confidence,
  });
}

function detectSubCategory(haystack: string, mainCategory: MainCategory) {
  const found = subCategoryRules.find((rule) => hasTerm(haystack, rule));
  if (found) {
    if (found === "black dress") return "dress";
    return found;
  }
  return mainCategory;
}

function detectStyleTags(haystack: string, mainCategory: MainCategory, subCategory: string, colors: string[]) {
  const tags = new Set<string>();
  directStyleWords.filter((style) => hasTerm(haystack, style)).forEach((style) => tags.add(style));

  if (hasAny(haystack, ["blazer", "suit", "formal shirt"]) || subCategory === "blazer") {
    ["formal", "classic", "elegant"].forEach((tag) => tags.add(tag));
  }
  if (hasAny(haystack, ["satin", "silk", "black dress", "camisole", "heel", "heels"]) || ["camisole", "shirt dress"].includes(subCategory)) {
    ["elegant", "minimal", "smart_casual"].forEach((tag) => tags.add(tag));
  }
  if (hasAny(haystack, ["floral", "patterned", "print", "printed", "tropical", "linen", "maxi skirt"]) || colors.some((color) => ["beige", "orange", "green", "blue"].includes(color))) {
    ["bohemian", "colorful", "summer", "comfortable"].forEach((tag) => tags.add(tag));
  }
  if (hasAny(haystack, ["hoodie", "oversized", "sneaker", "sneakers", "cargo", "denim"]) || ["hoodie", "sneakers", "jeans"].includes(subCategory)) {
    ["streetwear", "sporty", "casual"].forEach((tag) => tags.add(tag));
  }
  const neutralMinimal = colors.length > 0 && colors.length <= 2 && colors.every((color) => ["black", "white", "beige", "gray"].includes(color));
  if (hasAny(haystack, ["plain", "basic", "solid"]) || neutralMinimal) {
    ["minimal", "classic"].forEach((tag) => tags.add(tag));
  }
  if (hasAny(haystack, ["satin", "asymmetrical", "cropped"]) || (hasTerm(haystack, "oversized") && mainCategory !== "outerwear")) {
    tags.add("trendy");
    tags.add(hasTerm(haystack, "oversized") ? "streetwear" : "elegant");
  }
  if (!tags.size) {
    if (mainCategory === "shoes") ["comfortable", "sporty"].forEach((tag) => tags.add(tag));
    else if (mainCategory === "outerwear") ["classic", "smart_casual"].forEach((tag) => tags.add(tag));
    else ["minimal", "classic"].forEach((tag) => tags.add(tag));
  }

  return [...tags].slice(0, 5);
}

function detectFormality(haystack: string, mainCategory: MainCategory, subCategory: string): Formality {
  if (hasAny(haystack, ["blazer", "suit", "formal shirt"]) || subCategory === "blazer") return "formal";
  if (hasAny(haystack, ["camisole", "satin top", "silk", "black dress", "heel", "heels"]) || ["camisole", "shirt dress"].includes(subCategory)) return "smart_casual";
  if (hasAny(haystack, ["hoodie", "sneaker", "sneakers", "tshirt", "t-shirt"])) return mainCategory === "shoes" ? "sporty" : "casual";
  if (hasAny(haystack, ["patterned maxi skirt", "maxi skirt", "patterned skirt"])) return "casual";
  if (mainCategory === "outerwear" || subCategory === "trousers") return "smart_casual";
  if (mainCategory === "dress") return "smart_casual";
  return "unknown";
}

function detectSeasonTags(haystack: string, mainCategory: MainCategory, subCategory: string) {
  if (hasAny(haystack, ["coat", "sweater", "hoodie", "boot", "boots"]) || ["coat", "sweater", "hoodie", "boots"].includes(subCategory)) {
    return ["autumn", "winter"];
  }
  if (hasAny(haystack, ["dress", "skirt", "camisole", "sandal", "sandals", "linen"]) || ["dress", "shirt dress", "maxi dress", "midi dress", "skirt", "maxi skirt", "camisole", "sandals"].includes(subCategory)) {
    const tags = ["spring", "summer"];
    if (hasTerm(haystack, "black dress")) tags.push("all_season");
    return tags;
  }
  if (hasAny(haystack, ["blazer", "shirt", "trousers"]) || ["blazer", "shirt", "trousers"].includes(subCategory)) {
    return ["all_season"];
  }
  if (mainCategory === "outerwear") return ["autumn", "winter"];
  return ["all_season"];
}

function detectConfidence(haystack: string, hasCategoryMatch: boolean, hasMetadata: boolean, colorCount: number, styleCount: number) {
  if (!hasCategoryMatch) return haystack.length > 30 ? 0.52 : 0.45;
  let confidence = hasMetadata ? 0.78 : 0.72;
  if (colorCount > 0) confidence += 0.04;
  if (styleCount > 2) confidence += 0.04;
  if (hasAny(haystack, ["shirt dress", "maxi dress", "midi dress", "blazer", "camisole", "maxi skirt", "sneakers", "boots"])) confidence += 0.04;
  return Math.min(0.9, Number(confidence.toFixed(2)));
}

function normalizeColors(colors: string[]) {
  return [...new Set(colors.map((color) => (color === "grey" ? "gray" : color)))];
}

function normalizeName(name: string, subCategory: string, colors: string[]) {
  const clean = name.replace(/\s+/g, " ").trim();
  const lower = clean.toLowerCase();
  const title = lower.includes(subCategory) ? clean : `${colors[0] && colors[0] !== "unknown" ? `${colors[0]} ` : ""}${subCategory}`;
  return titleCase(title);
}

function hasAny(haystack: string, terms: string[]) {
  return terms.some((term) => hasTerm(haystack, term));
}

function hasTerm(haystack: string, term: string) {
  return new RegExp(`(^|\\s)${escapeRegExp(term)}(s|\\s|$)`, "i").test(haystack);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readableName(value: string) {
  const clean = decodeURIComponent(value)
    .split(/[/?#]/)
    .filter(Boolean)
    .at(-1)
    ?.replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ");
  return clean ? titleCase(clean) : "Clothing item";
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}
