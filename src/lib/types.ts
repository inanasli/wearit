export const MAIN_CATEGORIES = [
  "head",
  "upper",
  "lower",
  "dress",
  "outerwear",
  "shoes",
  "bag",
  "accessory",
] as const;

export const FORMALITIES = ["casual", "smart_casual", "formal", "sporty", "unknown"] as const;
export const STYLE_OPTIONS = [
  "casual",
  "sporty",
  "formal",
  "smart_casual",
  "streetwear",
  "minimal",
  "classic",
  "bohemian",
  "colorful",
  "elegant",
  "summer",
  "comfortable",
  "basic",
  "trendy",
] as const;

export type MainCategory = (typeof MAIN_CATEGORIES)[number];
export type Formality = (typeof FORMALITIES)[number];
export type SourceType = "upload" | "image_url" | "product_url";
export type CreatedBy = "user" | "ai";
export type FeedbackType = "like" | "not_today" | "dislike";

export type ClothingClassification = {
  name: string;
  mainCategory: MainCategory;
  subCategory: string;
  colors: string[];
  styleTags: string[];
  seasonTags: string[];
  formality: Formality;
  aiDescription: string;
  confidence: number;
};

export type ClothingItem = ClothingClassification & {
  id: string;
  userId?: string | null;
  imageUrl: string;
  sourceType: SourceType;
  sourceUrl?: string | null;
  originalClassification?: ClothingClassification | null;
  createdAt: string;
  updatedAt: string;
};

export type Outfit = {
  id: string;
  userId?: string | null;
  name: string;
  description?: string;
  styleTags: string[];
  createdBy: CreatedBy;
  createdAt: string;
  updatedAt: string;
};

export type OutfitItem = {
  id: string;
  outfitId: string;
  clothingItemId: string;
  slot: MainCategory | "extra";
};

export type Recommendation = {
  id: string;
  userId?: string | null;
  outfitId: string;
  reason: string;
  score: number;
  scoreBreakdown?: Record<string, number>;
  createdAt: string;
};

export type Feedback = {
  id: string;
  userId?: string | null;
  recommendationId?: string | null;
  outfitId: string;
  feedbackType: FeedbackType;
  note?: string;
  createdAt: string;
};

export type UserStylePreference = {
  id: string;
  userId?: string | null;
  styleTag: string;
  weight: number;
  updatedAt: string;
};

export type UserColorPreference = {
  id: string;
  userId?: string | null;
  color: string;
  weight: number;
  updatedAt: string;
};

export type ClassificationCorrectionLog = {
  id: string;
  userId?: string | null;
  clothingItemId: string;
  sourceType: SourceType;
  sourceUrl?: string | null;
  originalClassification: ClothingClassification;
  confirmedClassification: ClothingClassification;
  changedFields: string[];
  createdAt: string;
};

export type Database = {
  clothingItems: ClothingItem[];
  outfits: Outfit[];
  outfitItems: OutfitItem[];
  recommendations: Recommendation[];
  feedback: Feedback[];
  preferences: UserStylePreference[];
  colorPreferences: UserColorPreference[];
  classificationCorrections: ClassificationCorrectionLog[];
};
