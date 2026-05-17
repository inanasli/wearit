import { STYLE_OPTIONS } from "@/lib/types";
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
    const selectedTags = new Set(tags.filter((tag) => STYLE_OPTIONS.includes(tag as (typeof STYLE_OPTIONS)[number])));

    for (const pref of db.preferences) {
      if (STYLE_OPTIONS.includes(pref.styleTag as (typeof STYLE_OPTIONS)[number])) {
        pref.weight = selectedTags.has(pref.styleTag) ? 1 : 0;
        pref.updatedAt = now;
      }
    }

    for (const tag of selectedTags) {
      const existing = db.preferences.find((pref) => pref.styleTag === tag);
      if (existing) {
        existing.weight = 1;
        existing.updatedAt = now;
      } else {
        db.preferences.push({ id: createId("pref"), userId: "demo-user", styleTag: tag, weight: 1, updatedAt: now });
      }
    }
    return db.preferences.filter((pref) => pref.weight > 0);
  });
  return Response.json(saved);
}
