import { classifyClothingImage } from "@/lib/ai/classifyClothing";
import { demoUserId, jsonError } from "@/lib/api";
import { fetchProductMetadata, type ProductMetadata } from "@/lib/productMetadata";
import { createId, updateDb } from "@/lib/storage/db";
import type { ClothingItem } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { productUrl } = await request.json();
    if (!productUrl || !/^https?:\/\//i.test(productUrl)) return jsonError("Invalid product URL");
    const metadata: ProductMetadata = await fetchProductMetadata(productUrl).catch(() => ({}));
    if (!metadata.imageUrl) {
      return jsonError("Product image could not be extracted. Please paste a direct image URL manually.", 422);
    }
    const classification = await classifyClothingImage({
      imageUrl: metadata.imageUrl,
      productUrl,
      title: metadata.title,
      description: metadata.description,
    });
    const now = new Date().toISOString();
    const item: ClothingItem = {
      id: createId("clothing"),
      userId: demoUserId,
      imageUrl: metadata.imageUrl,
      sourceType: "product_url",
      sourceUrl: productUrl,
      ...classification,
      name: metadata.title || classification.name,
      createdAt: now,
      updatedAt: now,
    };
    await updateDb((db) => db.clothingItems.push(item));
    return Response.json(item, { status: 201 });
  } catch {
    return jsonError("Clothing item could not be saved", 500);
  }
}
