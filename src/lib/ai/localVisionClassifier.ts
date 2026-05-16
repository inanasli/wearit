"use client";

import { mockClassifyClothing, type MockClassifyInput } from "@/lib/ai/mockClothingClassifier";
import type { ClothingClassification, Formality, MainCategory } from "@/lib/types";

type LocalVisionInput = MockClassifyInput & {
  image: File | string;
};

type ZeroShotResult = Array<{ label: string; score: number }>;
type ZeroShotClassifier = (image: string, labels: string[], options?: { hypothesis_template?: string }) => Promise<ZeroShotResult>;

const MODEL_ID = "Xenova/clip-vit-base-patch32";

const clothingLabels = [
  "black blazer",
  "blazer",
  "suit jacket",
  "gray bomber jacket",
  "bomber jacket",
  "cropped bomber jacket",
  "zip-up jacket",
  "casual jacket",
  "lightweight jacket",
  "varsity jacket",
  "coat",
  "jacket",
  "cardigan",
  "shirt dress",
  "maxi dress",
  "midi dress",
  "dress",
  "camisole top",
  "tank top",
  "blouse",
  "shirt",
  "t-shirt",
  "sweater",
  "hoodie",
  "black wide leg pants",
  "wide leg pants",
  "palazzo pants",
  "loose pants",
  "drawstring pants",
  "culotte pants",
  "sweatpants",
  "black trousers",
  "maxi skirt",
  "midi skirt",
  "mini skirt",
  "patterned skirt",
  "skirt",
  "trousers",
  "jeans",
  "pants",
  "shorts",
  "sneakers",
  "boots",
  "heels",
  "sandals",
  "handbag",
  "shoulder bag",
  "hat",
  "cap",
];

const styleLabels = [
  "formal clothing",
  "smart casual clothing",
  "elegant clothing",
  "classic clothing",
  "minimal clothing",
  "casual clothing",
  "sporty clothing",
  "streetwear clothing",
  "bohemian clothing",
  "colorful summer clothing",
  "comfortable clothing",
  "trendy clothing",
];

const colorLabels = [
  "black clothing",
  "white clothing",
  "beige clothing",
  "gray clothing",
  "brown clothing",
  "blue clothing",
  "green clothing",
  "red clothing",
  "pink clothing",
  "yellow clothing",
  "orange clothing",
  "purple clothing",
  "multicolor clothing",
  "patterned clothing",
];

const categoryMap: Record<string, MainCategory> = {
  "black blazer": "outerwear",
  blazer: "outerwear",
  "suit jacket": "outerwear",
  "gray bomber jacket": "outerwear",
  "bomber jacket": "outerwear",
  "cropped bomber jacket": "outerwear",
  "zip-up jacket": "outerwear",
  "casual jacket": "outerwear",
  "lightweight jacket": "outerwear",
  "varsity jacket": "outerwear",
  coat: "outerwear",
  jacket: "outerwear",
  cardigan: "outerwear",
  "shirt dress": "dress",
  "maxi dress": "dress",
  "midi dress": "dress",
  dress: "dress",
  "camisole top": "upper",
  "tank top": "upper",
  blouse: "upper",
  shirt: "upper",
  "t-shirt": "upper",
  sweater: "upper",
  hoodie: "upper",
  "black wide leg pants": "lower",
  "wide leg pants": "lower",
  "palazzo pants": "lower",
  "loose pants": "lower",
  "drawstring pants": "lower",
  "culotte pants": "lower",
  sweatpants: "lower",
  "black trousers": "lower",
  "maxi skirt": "lower",
  "midi skirt": "lower",
  "mini skirt": "lower",
  "patterned skirt": "lower",
  skirt: "lower",
  trousers: "lower",
  jeans: "lower",
  pants: "lower",
  shorts: "lower",
  sneakers: "shoes",
  boots: "shoes",
  heels: "shoes",
  sandals: "shoes",
  handbag: "bag",
  "shoulder bag": "bag",
  hat: "head",
  cap: "head",
};

const styleMap: Record<string, string[]> = {
  "formal clothing": ["formal"],
  "smart casual clothing": ["smart_casual"],
  "elegant clothing": ["elegant"],
  "classic clothing": ["classic"],
  "minimal clothing": ["minimal"],
  "casual clothing": ["casual"],
  "sporty clothing": ["sporty"],
  "streetwear clothing": ["streetwear"],
  "bohemian clothing": ["bohemian"],
  "colorful summer clothing": ["colorful", "summer"],
  "comfortable clothing": ["comfortable"],
  "trendy clothing": ["trendy"],
};

const colorMap: Record<string, string[]> = {
  "black clothing": ["black"],
  "white clothing": ["white"],
  "beige clothing": ["beige"],
  "gray clothing": ["gray"],
  "brown clothing": ["brown"],
  "blue clothing": ["blue"],
  "green clothing": ["green"],
  "red clothing": ["red"],
  "pink clothing": ["pink"],
  "yellow clothing": ["yellow"],
  "orange clothing": ["orange"],
  "purple clothing": ["purple"],
  "multicolor clothing": ["multicolor"],
  "patterned clothing": ["patterned"],
};

let classifierPromise: Promise<ZeroShotClassifier> | null = null;

export async function classifyClothingWithLocalVision(input: LocalVisionInput): Promise<ClothingClassification> {
  let objectUrl: string | null = null;

  try {
    const classifier = await getClassifier();
    const imageInput = input.image instanceof File ? URL.createObjectURL(input.image) : input.image;
    objectUrl = input.image instanceof File ? imageInput : null;

    const [clothing, styles, colors, visualColors] = await Promise.all([
      classifier(imageInput, clothingLabels, { hypothesis_template: "This is a photo of {}." }),
      classifier(imageInput, styleLabels, { hypothesis_template: "This is a photo of {}." }),
      classifier(imageInput, colorLabels, { hypothesis_template: "This is a photo of {}." }),
      analyzeDominantColors(imageInput),
    ]);
    const classification = mapClipOutputs(clothing, styles, colors, visualColors, input);

    if (!classification || classification.confidence < 0.25) {
      throw new Error("Local vision result was not usable.");
    }

    return classification;
  } catch {
    return mockClassifyClothing(input, "Local vision classifier failed. Using demo classifier instead.");
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

async function getClassifier(): Promise<ZeroShotClassifier> {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      const { env, pipeline } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      env.allowRemoteModels = true;

      // q8 uses the quantized ONNX files for this Xenova model when available,
      // keeping the browser download smaller than full precision.
      return (await pipeline("zero-shot-image-classification", MODEL_ID, {
        device: "wasm",
        dtype: "q8",
      })) as unknown as ZeroShotClassifier;
    })();
  }

  return classifierPromise;
}

function mapClipOutputs(
  clothing: ZeroShotResult,
  styles: ZeroShotResult,
  colors: ZeroShotResult,
  visualColors: string[],
  input: MockClassifyInput,
): ClothingClassification | null {
  const topClothing = clothing[0];
  if (!topClothing) return null;

  const subCategory = chooseSubCategory(clothing, input);
  const mainCategory = categoryMap[subCategory] || "accessory";
  const styleTags = refineStyleTags(subCategory, unique(selectRelevant(styles, 3).flatMap((item) => styleMap[item.label] || [])));
  const selectedColors = chooseColors(visualColors, colors, subCategory, styleTags, input);
  const formality = detectFormality(subCategory, styleTags);
  const seasonTags = detectSeasonTags(subCategory);
  const chosenClothing = clothing.find((item) => item.label === subCategory) || topClothing;
  const confidence = scoreConfidence(chosenClothing, styleTags, selectedColors);
  const name = titleCase(`${selectedColors.find((color) => color !== "patterned" && color !== "multicolor") || ""} ${subCategory}`.trim());

  return {
    name,
    mainCategory,
    subCategory,
    colors: selectedColors.length ? selectedColors : ["unknown"],
    styleTags: styleTags.length ? styleTags : ["minimal"],
    seasonTags,
    formality,
    aiDescription: confidence < 0.6
      ? "Local CLIP vision classification completed. Please review classification."
      : "Local CLIP vision classification completed in the browser.",
    confidence,
  };
}

function chooseSubCategory(clothing: ZeroShotResult, input: MockClassifyInput) {
  const top = clothing[0];
  const evidenceText = [input.fileName, input.imageUrl, input.productUrl, input.title, input.description].filter(Boolean).join(" ").toLowerCase();
  if (/\b(bomber|zip[-_\s]?up|varsity)\b/.test(evidenceText)) {
    if (/\bgray|grey\b/.test(evidenceText) && /\bbomber\b/.test(evidenceText)) return "gray bomber jacket";
    if (/\bcropped\b/.test(evidenceText) && /\bbomber\b/.test(evidenceText)) return "cropped bomber jacket";
    if (/\bzip[-_\s]?up\b/.test(evidenceText)) return "zip-up jacket";
    if (/\bvarsity\b/.test(evidenceText)) return "varsity jacket";
    return "bomber jacket";
  }
  if (/\b(wide[-_\s]?leg|pantolon|pantalon|palazzo|trousers?|pants?|culotte|sweatpants)\b/.test(evidenceText)) {
    if (/\bblack\b/.test(evidenceText) && /\bwide[-_\s]?leg\b/.test(evidenceText)) return "black wide leg pants";
    if (/\bwide[-_\s]?leg\b/.test(evidenceText)) return "wide leg pants";
    if (/\bpalazzo\b/.test(evidenceText)) return "palazzo pants";
    if (/\bculotte\b/.test(evidenceText)) return "culotte pants";
    if (/\bsweatpants\b/.test(evidenceText)) return "sweatpants";
    if (/\bblack\b/.test(evidenceText) && /\btrousers?\b/.test(evidenceText)) return "black trousers";
    return "trousers";
  }

  const skirtLabels = new Set(["skirt", "maxi skirt", "midi skirt", "mini skirt", "patterned skirt"]);
  const pantsLabels = new Set(["black wide leg pants", "wide leg pants", "palazzo pants", "loose pants", "drawstring pants", "culotte pants", "sweatpants", "black trousers", "trousers", "pants", "jeans", "shorts"]);
  const bomberLabels = new Set(["gray bomber jacket", "bomber jacket", "cropped bomber jacket", "zip-up jacket", "casual jacket", "lightweight jacket", "varsity jacket", "jacket"]);
  if (top && ["suit jacket", "blazer"].includes(top.label) && top.score < 0.62) {
    const closeCasualJacket = clothing
      .slice(0, 6)
      .filter((item) => bomberLabels.has(item.label) && top.score - item.score <= 0.12)
      .sort((a, b) => jacketSpecificity(b.label) - jacketSpecificity(a.label) || b.score - a.score)[0];
    if (closeCasualJacket) return closeCasualJacket.label === "jacket" ? "casual jacket" : closeCasualJacket.label;
  }
  if (top && skirtLabels.has(top.label) && top.score < 0.55) {
    const closePants = clothing
      .slice(0, 5)
      .filter((item) => pantsLabels.has(item.label) && top.score - item.score <= 0.1)
      .sort((a, b) => pantsSpecificity(b.label) - pantsSpecificity(a.label) || b.score - a.score)[0];
    if (closePants) return closePants.label;
  }

  return top?.label || "shirt";
}

function selectRelevant(results: ZeroShotResult, limit: number) {
  const topScore = results[0]?.score || 0;
  return results
    .filter((result, index) => index === 0 || result.score >= topScore * 0.65)
    .slice(0, limit);
}

function pantsSpecificity(label: string) {
  if (["black wide leg pants", "wide leg pants"].includes(label)) return 5;
  if (["palazzo pants", "black trousers", "trousers"].includes(label)) return 4;
  if (["loose pants", "drawstring pants", "culotte pants"].includes(label)) return 3;
  if (["pants", "sweatpants"].includes(label)) return 2;
  return 1;
}

function jacketSpecificity(label: string) {
  if (["gray bomber jacket", "cropped bomber jacket", "bomber jacket"].includes(label)) return 5;
  if (["zip-up jacket", "varsity jacket"].includes(label)) return 4;
  if (["casual jacket", "lightweight jacket"].includes(label)) return 3;
  return 1;
}

function refineStyleTags(subCategory: string, styleTags: string[]) {
  if (isBomberLike(subCategory)) {
    return unique([...styleTags.filter((tag) => tag !== "formal"), "casual", "comfortable", "streetwear", "trendy"]);
  }
  return styleTags;
}

async function analyzeDominantColors(imageInput: string): Promise<string[]> {
  try {
    const image = await loadImage(imageInput);
    const canvas = document.createElement("canvas");
    const maxSide = 96;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return [];
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const counts = new Map<string, number>();

    for (let index = 0; index < pixels.length; index += 16) {
      const alpha = pixels[index + 3];
      if (alpha < 180) continue;
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const label = rgbToColorName(r, g, b);
      if (!label) continue;
      counts.set(label, (counts.get(label) || 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([color]) => color);
  } catch {
    return [];
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (/^https?:\/\//i.test(src)) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be loaded for color analysis."));
    image.src = src;
  });
}

function rgbToColorName(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const brightness = (r + g + b) / 3;
  const saturation = max === 0 ? 0 : (max - min) / max;

  // Ignore very light, low-saturation pixels because clothing photos often use white studio backgrounds.
  if (brightness > 225 && saturation < 0.22) return null;
  if (brightness < 48) return "black";
  if (brightness < 82 && saturation < 0.28) return "black";
  if (saturation < 0.16) {
    if (brightness < 145) return "gray";
    return null;
  }

  if (r > 150 && g > 115 && b < 95) return "brown";
  if (r > 170 && g > 120 && b > 70 && saturation < 0.45) return "beige";
  if (r > g * 1.25 && r > b * 1.25) return r > 180 && g > 85 ? "orange" : "red";
  if (g > r * 1.15 && g > b * 1.12) return "green";
  if (b > r * 1.15 && b > g * 1.1) return "blue";
  if (r > 130 && b > 120 && g < 115) return "purple";
  if (r > 180 && b > 135 && g < 155) return "pink";
  if (r > 175 && g > 145 && b < 90) return "yellow";
  return null;
}

function chooseColors(visualColors: string[], clipColors: ZeroShotResult, subCategory: string, styleTags: string[], input: MockClassifyInput) {
  const evidenceText = [input.fileName, input.imageUrl, input.productUrl, input.title, input.description].filter(Boolean).join(" ").toLowerCase();
  const clipRelevant = selectRelevant(clipColors, 3);
  const clipMapped = unique(clipRelevant.flatMap((item) => colorMap[item.label] || []));
  const patternScore = clipColors.find((item) => item.label === "patterned clothing")?.score || 0;
  const hasPatternEvidence =
    /pattern|printed|print|floral|striped|plaid|checked|polka/.test(evidenceText) ||
    subCategory.includes("patterned") ||
    styleTags.includes("bohemian") ||
    patternScore >= 0.45;

  let colors = visualColors.length ? [...visualColors] : clipMapped.filter((color) => color !== "patterned");

  if (!colors.length) {
    colors = clipMapped.filter((color) => color !== "patterned" && color !== "multicolor");
  }

  if (subCategory === "black blazer" || subCategory === "black wide leg pants" || subCategory === "black trousers" || /\bblack\b/.test(evidenceText)) {
    return ["black"];
  }
  if (subCategory === "gray bomber jacket" || /\bgray|grey\b/.test(evidenceText)) {
    return ["gray"];
  }

  const strongNonNeutralColors = colors.filter((color) => ["blue", "green", "red", "orange", "yellow", "pink", "purple"].includes(color));
  const mostlyDark = colors[0] === "black" || (clipMapped.includes("black") && strongNonNeutralColors.length === 0);
  if (mostlyDark && ["black blazer", "blazer", "suit jacket", "jacket", "dress", "shirt dress", "camisole top", "blouse", "shirt", "t-shirt", "black wide leg pants", "wide leg pants", "palazzo pants", "loose pants", "drawstring pants", "culotte pants", "black trousers", "trousers", "pants"].includes(subCategory)) {
    colors = ["black"];
  }

  if (hasPatternEvidence && (clipMapped.includes("patterned") || evidenceText.includes("pattern"))) {
    colors.push("patterned");
  }

  return unique(colors).slice(0, 3);
}

function detectFormality(subCategory: string, styleTags: string[]): Formality {
  if (isBomberLike(subCategory)) return "casual";
  if (["black blazer", "blazer", "suit jacket"].includes(subCategory) || styleTags.includes("formal")) return "formal";
  if (["wide leg pants", "black wide leg pants", "palazzo pants", "loose pants", "drawstring pants", "culotte pants", "trousers", "black trousers", "shirt dress", "camisole top"].includes(subCategory) || styleTags.some((tag) => ["elegant", "classic", "smart_casual"].includes(tag))) return "smart_casual";
  if (["hoodie", "sneakers", "sweatpants"].includes(subCategory) || styleTags.includes("sporty")) return "sporty";
  if (["t-shirt", "jeans", "shorts", "pants"].includes(subCategory) || styleTags.includes("casual")) return "casual";
  if (["skirt", "maxi skirt", "midi skirt", "mini skirt", "patterned skirt"].includes(subCategory)) return styleTags.some((tag) => ["elegant", "classic", "minimal"].includes(tag)) ? "smart_casual" : "casual";
  return "unknown";
}

function detectSeasonTags(subCategory: string) {
  if (isBomberLike(subCategory)) return ["autumn", "winter", "all_season"];
  if (["coat", "sweater", "hoodie", "boots"].includes(subCategory)) return ["autumn", "winter"];
  if (["wide leg pants", "black wide leg pants", "palazzo pants", "loose pants", "drawstring pants", "culotte pants", "sweatpants", "trousers", "black trousers", "pants", "jeans"].includes(subCategory)) return ["all_season"];
  if (["dress", "shirt dress", "maxi dress", "midi dress", "skirt", "maxi skirt", "midi skirt", "mini skirt", "patterned skirt", "camisole top", "tank top", "sandals"].includes(subCategory)) {
    const tags = ["spring", "summer"];
    if (["dress", "skirt", "maxi skirt", "midi skirt", "mini skirt"].includes(subCategory)) tags.push("all_season");
    return tags;
  }
  if (["black blazer", "blazer", "suit jacket", "shirt", "trousers", "jeans"].includes(subCategory)) return ["all_season"];
  return ["all_season"];
}

function scoreConfidence(topClothing: { label: string; score: number }, styleTags: string[], colors: string[]) {
  const specificBonus = topClothing.label.includes(" ") ? 0.08 : 0.03;
  const contextBonus = Math.min(0.08, styleTags.length * 0.02 + colors.length * 0.01);
  return Number(Math.min(0.95, Math.max(0.35, topClothing.score + specificBonus + contextBonus)).toFixed(2));
}

function isBomberLike(subCategory: string) {
  return ["gray bomber jacket", "bomber jacket", "cropped bomber jacket", "zip-up jacket", "casual jacket", "lightweight jacket", "varsity jacket"].includes(subCategory);
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}
