import { jsonError } from "@/lib/api";
import { generateRecommendation, type WeatherContext } from "@/lib/recommendation/scoring";
import { createId, updateDb } from "@/lib/storage/db";

export async function POST(request: Request) {
  let weather: WeatherContext | undefined;
  let weeklyWeather: WeatherContext[] = [];
  let days = 1;
  try {
    const body = await request.json();
    weather = body?.weather;
    weeklyWeather = Array.isArray(body?.weeklyWeather) ? body.weeklyWeather : [];
    days = Math.max(1, Math.min(7, Number(body?.days || 1)));
  } catch {
    weather = undefined;
  }

  const result = await updateDb((db) => {
    const plan = [];

    for (let index = 0; index < days; index += 1) {
      const dayWeather = weeklyWeather[index] || weather;
      const generated = generateRecommendation(db, dayWeather);
      if (!generated) break;

      generated.outfit.name = days > 1 ? `${dayLabel(index)} kombini: ${generated.outfit.name.replace(/^GÃ¼nÃ¼n kombini: |^Günün kombini: /, "")}` : generated.outfit.name;
      db.outfits.push(generated.outfit);
      db.outfitItems.push(...generated.outfitItems);
      const recommendation = {
        id: createId("recommendation"),
        userId: "demo-user",
        outfitId: generated.outfit.id,
        reason: generated.reason,
        score: generated.score,
        scoreBreakdown: generated.scoreBreakdown,
        createdAt: new Date().toISOString(),
      };
      db.recommendations.push(recommendation);
      plan.push({ recommendation, outfit: generated.outfit, outfitItems: generated.outfitItems, topCandidates: generated.topCandidates, weather: dayWeather, dayLabel: dayLabel(index) });
    }

    if (!plan.length) return null;
    return days > 1 ? { weeklyPlan: plan } : plan[0];
  });

  if (!result) {
    return jsonError("Please add at least one upper, lower, and shoes item to generate an outfit.", 422);
  }
  return Response.json(result, { status: 201 });
}

function dayLabel(index: number) {
  const labels = ["Bugün", "Yarın", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  const date = new Date();
  date.setDate(date.getDate() + index);
  if (index < 2) return labels[index];
  return date.toLocaleDateString("tr-TR", { weekday: "long" });
}
