import { demoUserId, jsonError } from "@/lib/api";
import { createId, readDb, updateDb } from "@/lib/storage/db";
import type { ClothingItem } from "@/lib/types";

export async function GET() {
  const db = await readDb();
  return Response.json(db.clothingItems.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const item: ClothingItem = {
      ...body,
      id: createId("clothing"),
      userId: demoUserId,
      createdAt: now,
      updatedAt: now,
    };
    await updateDb((db) => db.clothingItems.push(item));
    return Response.json(item, { status: 201 });
  } catch {
    return jsonError("Clothing item could not be saved", 500);
  }
}
