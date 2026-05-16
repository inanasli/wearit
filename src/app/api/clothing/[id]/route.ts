import { jsonError, normalizeClassification } from "@/lib/api";
import { updateDb } from "@/lib/storage/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const updated = await updateDb((db) => {
    const item = db.clothingItems.find((row) => row.id === id);
    if (!item) return null;
    Object.assign(item, normalizeClassification({ ...item, ...body }), { updatedAt: new Date().toISOString() });
    return item;
  });
  return updated ? Response.json(updated) : jsonError("Clothing item not found", 404);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  await updateDb((db) => {
    db.clothingItems = db.clothingItems.filter((item) => item.id !== id);
    db.outfitItems = db.outfitItems.filter((item) => item.clothingItemId !== id);
  });
  return Response.json({ ok: true });
}
