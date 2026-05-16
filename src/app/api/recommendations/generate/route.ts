import { jsonError } from "@/lib/api";
import { generateRecommendation } from "@/lib/recommendation/scoring";
import { createId, updateDb } from "@/lib/storage/db";

export async function POST() {
  const result = await updateDb((db) => {
    const generated = generateRecommendation(db);
    if (!generated) return null;
    db.outfits.push(generated.outfit);
    db.outfitItems.push(...generated.outfitItems);
    const recommendation = {
      id: createId("recommendation"),
      userId: "demo-user",
      outfitId: generated.outfit.id,
      reason: generated.reason,
      score: generated.score,
      createdAt: new Date().toISOString(),
    };
    db.recommendations.push(recommendation);
    return { recommendation, outfit: generated.outfit, outfitItems: generated.outfitItems };
  });

  if (!result) {
    return jsonError("Please add at least one upper, lower, and shoes item to generate an outfit.", 422);
  }
  return Response.json(result, { status: 201 });
}
