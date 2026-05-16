import { jsonError } from "@/lib/api";
import { readDb, updateDb } from "@/lib/storage/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const db = await readDb();
  const outfit = db.outfits.find((row) => row.id === id);
  if (!outfit) return jsonError("Outfit not found", 404);
  const items = db.outfitItems
    .filter((row) => row.outfitId === id)
    .map((row) => ({ ...row, clothing: db.clothingItems.find((item) => item.id === row.clothingItemId) }));
  return Response.json({ ...outfit, items });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  await updateDb((db) => {
    db.outfits = db.outfits.filter((outfit) => outfit.id !== id);
    db.outfitItems = db.outfitItems.filter((item) => item.outfitId !== id);
    db.recommendations = db.recommendations.filter((rec) => rec.outfitId !== id);
  });
  return Response.json({ ok: true });
}
