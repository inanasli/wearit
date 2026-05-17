import { demoUserId, jsonError, normalizeClassification } from "@/lib/api";
import { createClassificationCorrectionLog } from "@/lib/classificationCorrections";
import { createId, readDb, updateDb } from "@/lib/storage/db";
import type { ClothingClassification, ClothingItem } from "@/lib/types";

export async function GET() {
  const db = await readDb();
  return Response.json(db.clothingItems.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const originalClassification = body.originalClassification as ClothingClassification | null | undefined;
    const classification = normalizeClassification(body);
    const item: ClothingItem = {
      ...body,
      ...classification,
      originalClassification: originalClassification || null,
      id: createId("clothing"),
      userId: demoUserId,
      createdAt: now,
      updatedAt: now,
    };
    await updateDb((db) => {
      db.clothingItems.push(item);
      const log = createClassificationCorrectionLog({
        clothingItemId: item.id,
        userId: demoUserId,
        sourceType: item.sourceType,
        sourceUrl: item.sourceUrl,
        originalClassification,
        confirmedClassification: item,
        createdAt: now,
      });
      if (log) db.classificationCorrections.push(log);
    });
    return Response.json(item, { status: 201 });
  } catch {
    return jsonError("Clothing item could not be saved", 500);
  }
}
