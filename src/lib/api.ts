import { FORMALITIES, MAIN_CATEGORIES, type ClothingClassification } from "@/lib/types";

export const demoUserId = "demo-user";

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function parseCsv(value: FormDataEntryValue | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function normalizeClassification(input: Partial<ClothingClassification>): ClothingClassification {
  const inferred = inferClassification(input);
  const mainCategory = MAIN_CATEGORIES.includes(inferred.mainCategory as never) ? inferred.mainCategory! : "upper";
  const formality = FORMALITIES.includes(input.formality as never) ? input.formality! : "unknown";
  const confidence = typeof input.confidence === "number" ? Math.min(1, Math.max(0, input.confidence)) : 0.35;

  return {
    name: inferred.name?.trim() || "Clothing item",
    mainCategory,
    subCategory: inferred.subCategory?.trim() || mainCategory,
    colors: normalizeList(inferred.colors, ["unknown"]),
    styleTags: normalizeList(inferred.styleTags, ["basic"]),
    seasonTags: normalizeList(inferred.seasonTags, ["all_season"]),
    formality,
    aiDescription: input.aiDescription?.trim() || "Demo-safe classification. You can edit it manually.",
    confidence,
  };
}

function inferClassification(input: Partial<ClothingClassification>): Partial<ClothingClassification> {
  const text = `${input.name || ""} ${input.subCategory || ""} ${input.aiDescription || ""}`.toLowerCase();
  const next = { ...input };

  const categoryRules: Array<[ClothingClassification["mainCategory"], RegExp]> = [
    ["outerwear", /\b(coat|jacket|blazer|cardigan|trench|mont|ceket|hırka|hirka)\b/],
    ["dress", /\b(dress|gown|elbise)\b/],
    ["lower", /\b(pants|trousers|jeans|skirt|shorts|pantolon|etek)\b/],
    ["shoes", /\b(shoe|sneaker|boot|heel|sandal|loafer|ayakkabı|ayakkabi|bot|çizme|cizme)\b/],
    ["bag", /\b(bag|handbag|purse|tote|çanta|canta)\b/],
    ["upper", /\b(shirt|t-shirt|tee|blouse|sweater|hoodie|tank|top|gömlek|gomlek|kazak|tişört|tisort)\b/],
  ];
  const inferredCategory = categoryRules.find(([, pattern]) => pattern.test(text))?.[0];
  if (inferredCategory) next.mainCategory = inferredCategory;

  if (!next.subCategory || next.subCategory === "upper" || next.subCategory === "lower") {
    const subCategory = [
      "wide leg pants",
      "midi skirt",
      "mini skirt",
      "maxi skirt",
      "t-shirt",
      "tank top",
      "long sleeve shirt",
      "sweater",
      "blazer",
      "jacket",
      "coat",
      "dress",
      "sneakers",
      "boots",
      "heels",
      "sandals",
      "bag",
    ].find((label) => text.includes(label));
    if (subCategory) next.subCategory = subCategory;
  }

  const colors = normalizeList(input.colors, []);
  if (!colors.length || colors.includes("unknown")) {
    const detectedColors = ["black", "white", "beige", "gray", "brown", "blue", "green", "red", "pink", "yellow", "orange", "purple"].filter((color) =>
      text.includes(color),
    );
    if (detectedColors.length) next.colors = detectedColors;
  }

  if (next.mainCategory === "outerwear") next.seasonTags = mergeTags(input.seasonTags, ["autumn", "winter", "all_season"]);
  if (next.mainCategory === "shoes" && /\b(boot|bot|çizme|cizme)\b/.test(text)) next.seasonTags = mergeTags(input.seasonTags, ["autumn", "winter"]);
  if (/\b(tank|sandal|shorts|summer|askılı|askili)\b/.test(text)) next.seasonTags = mergeTags(input.seasonTags, ["spring", "summer"]);

  return next;
}

function normalizeList(values: unknown, fallback: string[]) {
  const list = Array.isArray(values) ? values.map(String).map((value) => value.trim().toLowerCase()).filter(Boolean) : [];
  const normalized = [...new Set(list.map((value) => (value === "grey" ? "gray" : value)))];
  return normalized.length ? normalized : fallback;
}

function mergeTags(values: unknown, additions: string[]) {
  return [...new Set([...normalizeList(values, []), ...additions])];
}
