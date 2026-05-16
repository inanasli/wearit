import { createId } from "@/lib/storage/db";
import type { ClassificationCorrectionLog, ClothingClassification, SourceType } from "@/lib/types";

export function createClassificationCorrectionLog(input: {
  clothingItemId: string;
  userId?: string | null;
  sourceType: SourceType;
  sourceUrl?: string | null;
  originalClassification?: ClothingClassification | null;
  confirmedClassification: ClothingClassification;
  createdAt: string;
}): ClassificationCorrectionLog | null {
  if (!input.originalClassification) return null;

  return {
    id: createId("classification_correction"),
    userId: input.userId,
    clothingItemId: input.clothingItemId,
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl,
    originalClassification: input.originalClassification,
    confirmedClassification: input.confirmedClassification,
    changedFields: changedClassificationFields(input.originalClassification, input.confirmedClassification),
    createdAt: input.createdAt,
  };
}

function changedClassificationFields(original: ClothingClassification, confirmed: ClothingClassification) {
  const fields: Array<keyof ClothingClassification> = [
    "name",
    "mainCategory",
    "subCategory",
    "colors",
    "styleTags",
    "seasonTags",
    "formality",
    "aiDescription",
    "confidence",
  ];

  return fields.filter((field) => JSON.stringify(original[field]) !== JSON.stringify(confirmed[field]));
}
