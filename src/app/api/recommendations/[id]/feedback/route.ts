import { jsonError } from "@/lib/api";
import { createId, updateDb } from "@/lib/storage/db";
import type { FeedbackType } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };
const deltas: Record<FeedbackType, number> = { like: 1, not_today: -0.25, dislike: -1 };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const feedbackType = body.feedbackType as FeedbackType;
    if (!["like", "not_today", "dislike"].includes(feedbackType)) return jsonError("Feedback could not be saved");
    const saved = await updateDb((db) => {
      const recommendation = db.recommendations.find((row) => row.id === id);
      if (!recommendation) return null;
      const outfit = db.outfits.find((row) => row.id === recommendation.outfitId);
      if (!outfit) return null;
      const feedback = {
        id: createId("feedback"),
        userId: "demo-user",
        recommendationId: id,
        outfitId: outfit.id,
        feedbackType,
        note: body.note || "",
        createdAt: new Date().toISOString(),
      };
      db.feedback.push(feedback);
      for (const tag of outfit.styleTags) {
        const existing = db.preferences.find((pref) => pref.styleTag === tag);
        if (existing) {
          existing.weight = Number((existing.weight + deltas[feedbackType]).toFixed(2));
          existing.updatedAt = new Date().toISOString();
        } else {
          db.preferences.push({ id: createId("pref"), userId: "demo-user", styleTag: tag, weight: deltas[feedbackType], updatedAt: new Date().toISOString() });
        }
      }
      return { feedback, preferences: db.preferences };
    });
    return saved ? Response.json(saved, { status: 201 }) : jsonError("Feedback could not be saved", 404);
  } catch {
    return jsonError("Feedback could not be saved", 500);
  }
}
