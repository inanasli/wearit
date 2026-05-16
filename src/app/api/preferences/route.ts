import { createId, readDb, updateDb } from "@/lib/storage/db";

export async function GET() {
  const db = await readDb();
  return Response.json(db.preferences);
}

export async function POST(request: Request) {
  const { styleTags } = await request.json();
  const tags = Array.isArray(styleTags) ? styleTags.map(String) : [];
  const saved = await updateDb((db) => {
    const now = new Date().toISOString();
    for (const tag of tags) {
      const existing = db.preferences.find((pref) => pref.styleTag === tag);
      if (existing) {
        existing.weight = Math.max(existing.weight, 1);
        existing.updatedAt = now;
      } else {
        db.preferences.push({ id: createId("pref"), userId: "demo-user", styleTag: tag, weight: 1, updatedAt: now });
      }
    }
    return db.preferences;
  });
  return Response.json(saved);
}
