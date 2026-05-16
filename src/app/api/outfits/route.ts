import { demoUserId, jsonError } from "@/lib/api";
import { createId, readDb, updateDb } from "@/lib/storage/db";
import type { MainCategory, Outfit, OutfitItem } from "@/lib/types";

export async function GET() {
  const db = await readDb();
  const outfits = db.outfits.map((outfit) => ({
    ...outfit,
    items: db.outfitItems
      .filter((row) => row.outfitId === outfit.id)
      .map((row) => ({ ...row, clothing: db.clothingItems.find((item) => item.id === row.clothingItemId) })),
  }));
  return Response.json(outfits.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const selectedIds = Array.isArray(body.clothingItemIds) ? body.clothingItemIds : [];
    if (!body.name || selectedIds.length === 0) return jsonError("Outfit could not be saved");
    const now = new Date().toISOString();
    const saved = await updateDb((db) => {
      const selected = db.clothingItems.filter((item) => selectedIds.includes(item.id));
      const styleTags = [...new Set(selected.flatMap((item) => item.styleTags))];
      const outfit: Outfit = {
        id: createId("outfit"),
        userId: demoUserId,
        name: String(body.name),
        description: body.description || "",
        styleTags,
        createdBy: "user",
        createdAt: now,
        updatedAt: now,
      };
      const outfitItems: OutfitItem[] = selected.map((item) => ({
        id: createId("outfit_item"),
        outfitId: outfit.id,
        clothingItemId: item.id,
        slot: item.mainCategory as MainCategory,
      }));
      db.outfits.push(outfit);
      db.outfitItems.push(...outfitItems);
      return { ...outfit, items: outfitItems };
    });
    return Response.json(saved, { status: 201 });
  } catch {
    return jsonError("Outfit could not be saved", 500);
  }
}
