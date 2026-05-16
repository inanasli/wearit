import "server-only";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { normalizeClassification } from "@/lib/api";
import type { ClothingClassification, Formality, MainCategory } from "@/lib/types";

type ClassifyInput = {
  imageUrl?: string;
  base64Image?: string;
  fileName?: string;
  productUrl?: string;
  title?: string;
  description?: string;
};

type ZeroShotResult = Array<{ label: string; score: number }>;
type ZeroShotClassifier = (image: string, labels: string[], options?: { hypothesis_template?: string }) => Promise<ZeroShotResult>;

const MODEL_ID = "Xenova/clip-vit-base-patch32";

const clothingLabels = [
  "t-shirt",
  "shirt",
  "blouse",
  "sweater",
  "hoodie",
  "jacket",
  "coat",
  "blazer",
  "dress",
  "skirt",
  "jeans",
  "pants",
  "trousers",
  "shorts",
  "sneakers",
  "boots",
  "heels",
  "sandals",
  "handbag",
  "hat",
];

const colorLabels = [
  "black clothing",
  "white clothing",
  "gray clothing",
  "beige clothing",
  "brown clothing",
  "blue clothing",
  "green clothing",
  "red clothing",
  "pink clothing",
  "yellow clothing",
  "orange clothing",
  "purple clothing",
  "multicolor clothing",
];

const styleLabels = [
  "casual clothing",
  "sporty clothing",
  "formal clothing",
  "smart casual clothing",
  "minimal clothing",
  "classic clothing",
  "streetwear clothing",
  "elegant clothing",
];

const categoryMap: Record<string, MainCategory> = {
  "t-shirt": "upper",
  shirt: "upper",
  blouse: "upper",
  sweater: "upper",
  hoodie: "upper",
  jacket: "outerwear",
  coat: "outerwear",
  blazer: "outerwear",
  dress: "dress",
  skirt: "lower",
  jeans: "lower",
  pants: "lower",
  trousers: "lower",
  shorts: "lower",
  sneakers: "shoes",
  boots: "shoes",
  heels: "shoes",
  sandals: "shoes",
  handbag: "bag",
  hat: "head",
};

const colorMap: Record<string, string> = {
  "black clothing": "black",
  "white clothing": "white",
  "gray clothing": "gray",
  "beige clothing": "beige",
  "brown clothing": "brown",
  "blue clothing": "blue",
  "green clothing": "green",
  "red clothing": "red",
  "pink clothing": "pink",
  "yellow clothing": "yellow",
  "orange clothing": "orange",
  "purple clothing": "purple",
  "multicolor clothing": "multicolor",
};

const styleMap: Record<string, string> = {
  "casual clothing": "casual",
  "sporty clothing": "sporty",
  "formal clothing": "formal",
  "smart casual clothing": "smart_casual",
  "minimal clothing": "minimal",
  "classic clothing": "classic",
  "streetwear clothing": "streetwear",
  "elegant clothing": "elegant",
};

let classifierPromise: Promise<ZeroShotClassifier> | null = null;

export async function classifyClothingWithServerVision(input: ClassifyInput): Promise<ClothingClassification> {
  const prepared = await prepareImageInput(input);

  try {
    const classifier = await getClassifier();
    const [clothing, colors, styles] = await Promise.all([
      classifier(prepared.image, clothingLabels, { hypothesis_template: "This is a photo of a {}." }),
      classifier(prepared.image, colorLabels, { hypothesis_template: "This clothing item is {}." }),
      classifier(prepared.image, styleLabels, { hypothesis_template: "This is a photo of {}." }),
    ]);

    const topClothing = clothing[0];
    if (!topClothing || topClothing.score < 0.18) {
      throw new Error("Server vision model could not classify the clothing item confidently.");
    }

    const subCategory = topClothing.label;
    const mainCategory = categoryMap[subCategory] || "accessory";
    const selectedColors = selectColors(colors);
    const styleTags = selectStyles(styles, subCategory);
    const formality = detectFormality(subCategory, styleTags);

    return normalizeClassification({
      name: titleCase(`${selectedColors[0] || ""} ${subCategory}`.trim()),
      mainCategory,
      subCategory,
      colors: selectedColors.length ? selectedColors : ["unknown"],
      styleTags,
      seasonTags: detectSeasonTags(subCategory),
      formality,
      aiDescription: "Server-side CLIP vision classification completed from the uploaded image.",
      confidence: Number(Math.min(0.94, Math.max(0.35, topClothing.score + 0.18)).toFixed(2)),
    });
  } finally {
    if (prepared.cleanupPath) {
      await fs.unlink(prepared.cleanupPath).catch(() => undefined);
    }
  }
}

async function prepareImageInput(input: ClassifyInput) {
  if (input.imageUrl) return { image: input.imageUrl, cleanupPath: null as string | null };
  if (!input.base64Image) throw new Error("No image provided for server vision classification.");

  const match = input.base64Image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid base64 image for server vision classification.");

  const mimeType = match[1];
  const extension = mimeType.includes("png") ? ".png" : mimeType.includes("webp") ? ".webp" : ".jpg";
  const filePath = path.join(os.tmpdir(), `wearit-classify-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
  await fs.writeFile(filePath, Buffer.from(match[2], "base64"));
  return { image: filePath, cleanupPath: filePath };
}

async function getClassifier(): Promise<ZeroShotClassifier> {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      const { env, pipeline } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      return (await pipeline("zero-shot-image-classification", MODEL_ID, {
        device: "cpu",
        dtype: "q8",
      })) as unknown as ZeroShotClassifier;
    })();
  }
  return classifierPromise;
}

function selectColors(results: ZeroShotResult) {
  const top = results[0]?.score || 0;
  return unique(
    results
      .filter((result, index) => index === 0 || result.score >= top * 0.72)
      .slice(0, 2)
      .map((result) => colorMap[result.label])
      .filter(Boolean),
  );
}

function selectStyles(results: ZeroShotResult, subCategory: string) {
  const top = results[0]?.score || 0;
  const tags = results
    .filter((result, index) => index === 0 || result.score >= top * 0.7)
    .slice(0, 3)
    .map((result) => styleMap[result.label])
    .filter(Boolean);

  if (["sneakers", "hoodie"].includes(subCategory)) tags.push("sporty", "casual");
  if (["blazer", "trousers"].includes(subCategory)) tags.push("smart_casual", "classic");
  if (["t-shirt", "jeans"].includes(subCategory)) tags.push("casual", "basic");
  return unique(tags).slice(0, 5);
}

function detectFormality(subCategory: string, styleTags: string[]): Formality {
  if (["blazer", "heels"].includes(subCategory) || styleTags.includes("formal")) return "formal";
  if (["trousers", "dress", "coat"].includes(subCategory) || styleTags.includes("smart_casual")) return "smart_casual";
  if (["sneakers", "hoodie"].includes(subCategory) || styleTags.includes("sporty")) return "sporty";
  return "casual";
}

function detectSeasonTags(subCategory: string) {
  if (["coat", "sweater", "hoodie", "boots"].includes(subCategory)) return ["autumn", "winter"];
  if (["t-shirt", "shorts", "sandals"].includes(subCategory)) return ["spring", "summer"];
  return ["all_season"];
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
