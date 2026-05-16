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
  const mainCategory = MAIN_CATEGORIES.includes(input.mainCategory as never) ? input.mainCategory! : "upper";
  const formality = FORMALITIES.includes(input.formality as never) ? input.formality! : "unknown";
  const confidence = typeof input.confidence === "number" ? Math.min(1, Math.max(0, input.confidence)) : 0.35;

  return {
    name: input.name?.trim() || "Clothing item",
    mainCategory,
    subCategory: input.subCategory?.trim() || mainCategory,
    colors: Array.isArray(input.colors) ? input.colors.map(String).filter(Boolean) : ["unknown"],
    styleTags: Array.isArray(input.styleTags) ? input.styleTags.map(String).filter(Boolean) : ["basic"],
    seasonTags: Array.isArray(input.seasonTags) ? input.seasonTags.map(String).filter(Boolean) : ["all_season"],
    formality,
    aiDescription: input.aiDescription?.trim() || "Demo-safe classification. You can edit it manually.",
    confidence,
  };
}
