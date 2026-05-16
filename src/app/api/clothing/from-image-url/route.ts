import { classifyClothingImage } from "@/lib/ai/classifyClothing";
import { demoUserId, jsonError } from "@/lib/api";
import { createId, updateDb } from "@/lib/storage/db";
import type { ClothingItem } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) return jsonError("Invalid image URL");
    const classification = await classifyClothingImage({ imageUrl });
    const now = new Date().toISOString();
    const item: ClothingItem = {
      id: createId("clothing"),
      userId: demoUserId,
      imageUrl,
      sourceType: "image_url",
      sourceUrl: imageUrl,
      ...classification,
      createdAt: now,
      updatedAt: now,
    };
    await updateDb((db) => db.clothingItems.push(item));
    return Response.json(item, { status: 201 });
  } catch {
    return jsonError("Clothing item could not be saved", 500);
  }
}
