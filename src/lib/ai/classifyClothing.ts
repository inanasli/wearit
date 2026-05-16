import "server-only";
import { normalizeClassification } from "@/lib/api";
import type { ClothingClassification, MainCategory } from "@/lib/types";

type ClassifyInput = {
  imageUrl?: string;
  base64Image?: string;
  fileName?: string;
  productUrl?: string;
  title?: string;
  description?: string;
};

const keywords: Array<[MainCategory, string[]]> = [
  ["dress", ["dress"]],
  ["outerwear", ["coat", "jacket", "blazer"]],
  ["shoes", ["shoe", "shoes", "sneaker", "boot", "heels"]],
  ["bag", ["bag", "purse"]],
  ["head", ["hat", "cap", "beanie"]],
  ["lower", ["jeans", "pants", "trousers", "skirt", "shorts"]],
  ["upper", ["shirt", "tshirt", "t-shirt", "blouse", "sweater", "hoodie", "top"]],
];

const colorWords = ["black", "white", "blue", "beige", "red", "green", "gray", "brown", "pink", "purple", "yellow", "orange"];
const styleWords = ["casual", "sporty", "formal", "streetwear", "minimal", "classic", "elegant", "comfortable", "basic", "trendy"];

export async function classifyClothingImage(input: ClassifyInput): Promise<ClothingClassification> {
  // Real AI mode is used only when OPENAI_API_KEY exists on the server.
  // Without it, the MVP stays free and reliable through mock/demo classification.
  if (process.env.OPENAI_API_KEY) {
    try {
      return await classifyWithOpenAI(input);
    } catch {
      return mockClassify(input, "AI classification failed, so demo-safe mock data was used.");
    }
  }

  // Mock mode lets the rest of the app work unchanged; real AI can be enabled later.
  return mockClassify(input, "Mock classification used because no API key was found.");
}

async function classifyWithOpenAI(input: ClassifyInput): Promise<ClothingClassification> {
  const imageContent = input.base64Image
    ? { type: "input_image", image_url: input.base64Image }
    : { type: "input_image", image_url: input.imageUrl };

  if (!imageContent.image_url) {
    throw new Error("No image provided for AI classification.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Classify the dominant clothing item. Return only JSON with fields: name, mainCategory, subCategory, colors, styleTags, seasonTags, formality, aiDescription, confidence. Do not invent brands. Use normalized English tags.",
            },
            imageContent,
          ],
        },
      ],
      text: { format: { type: "json_object" } },
    }),
  });

  if (!response.ok) throw new Error("OpenAI request failed.");
  const data = await response.json();
  const text = data.output_text ?? data.output?.[0]?.content?.[0]?.text;
  if (!text) throw new Error("AI response did not include JSON.");
  return normalizeClassification(JSON.parse(text));
}

function mockClassify(input: ClassifyInput, note: string): ClothingClassification {
  const haystack = [input.fileName, input.imageUrl, input.productUrl, input.title, input.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const match = keywords.find(([, words]) => words.some((word) => haystack.includes(word)));
  const mainCategory = match?.[0] ?? "upper";
  const colors = colorWords.filter((color) => haystack.includes(color));
  const styleTags = styleWords.filter((style) => haystack.includes(style));
  const name = input.title || readableName(input.fileName || input.imageUrl || input.productUrl || `${mainCategory} item`);

  return normalizeClassification({
    name,
    mainCategory,
    subCategory: match?.[1].find((word) => haystack.includes(word)) || mainCategory,
    colors: colors.length ? colors : ["unknown"],
    styleTags: styleTags.length ? styleTags : ["basic", mainCategory === "shoes" ? "comfortable" : "casual"],
    seasonTags: mainCategory === "outerwear" ? ["autumn", "winter"] : ["all_season"],
    formality: styleTags.includes("formal") ? "formal" : styleTags.includes("sporty") ? "sporty" : "casual",
    aiDescription: note,
    confidence: match ? 0.72 : 0.28,
  });
}

function readableName(value: string) {
  const clean = decodeURIComponent(value)
    .split(/[/?#]/)
    .filter(Boolean)
    .at(-1)
    ?.replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ");
  return clean ? clean[0].toUpperCase() + clean.slice(1) : "Clothing item";
}
