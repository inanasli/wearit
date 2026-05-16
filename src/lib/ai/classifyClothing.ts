import "server-only";
import { normalizeClassification } from "@/lib/api";
import { mockClassifyClothing } from "@/lib/ai/mockClothingClassifier";
import type { ClothingClassification } from "@/lib/types";

type ClassifyInput = {
  imageUrl?: string;
  base64Image?: string;
  fileName?: string;
  productUrl?: string;
  title?: string;
  description?: string;
};

export async function classifyClothingImage(input: ClassifyInput): Promise<ClothingClassification> {
  if (process.env.OPENAI_API_KEY) {
    try {
      return await classifyWithOpenAI(input);
    } catch {
      return mockClassifyClothing(input, "Gerçek görsel sınıflandırma başarısız oldu; geçici demo tahmini kullanıldı.");
    }
  }

  return mockClassifyClothing(
    input,
    "Gerçek fotoğraf analizi için OPENAI_API_KEY gerekli. Şu an yalnızca dosya adı/link metninden demo tahmini yapıldı.",
  );
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
                "Classify the dominant clothing item in the image. Return only valid JSON with fields: name, mainCategory, subCategory, colors, styleTags, seasonTags, formality, aiDescription, confidence. mainCategory must be one of head, upper, lower, dress, outerwear, shoes, bag, accessory. Identify whether it is a t-shirt, shirt, sweater, pants, jeans, skirt, dress, jacket, coat, sneakers, boots, bag, etc. Extract visible dominant colors. Use normalized English tags. Do not invent brands.",
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
