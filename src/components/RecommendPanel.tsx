"use client";

import { useEffect, useState } from "react";
import { STYLE_OPTIONS, type ClothingItem, type UserStylePreference } from "@/lib/types";

type RecommendationResult = {
  recommendation: { id: string; reason: string; score: number; scoreBreakdown?: Record<string, number> };
  outfit: { id: string; name: string; styleTags: string[] };
  outfitItems: Array<{ clothingItemId: string }>;
  topCandidates?: Array<{
    outfitItemIds: string[];
    itemNames: string[];
    score: number;
    scoreBreakdown: Record<string, number>;
    reason: string;
  }>;
};

export function RecommendPanel() {
  const [preferences, setPreferences] = useState<UserStylePreference[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const [prefs, clothing] = await Promise.all([fetch("/api/preferences"), fetch("/api/clothing")]);
    const prefData = await prefs.json();
    setPreferences(prefData);
    setSelected(prefData.filter((pref: UserStylePreference) => pref.weight > 0).map((pref: UserStylePreference) => pref.styleTag));
    setWardrobe(await clothing.json());
  }

  async function savePreferences() {
    await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ styleTags: selected }),
    });
    setMessage("Style preferences saved.");
    refresh();
  }

  async function generate() {
    setMessage("");
    const response = await fetch("/api/recommendations/generate", { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Recommendation could not be generated");
      setResult(null);
      return;
    }
    setResult(data);
  }

  async function feedback(feedbackType: "like" | "not_today" | "dislike") {
    if (!result) return;
    const response = await fetch(`/api/recommendations/${result.recommendation.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackType }),
    });
    if (!response.ok) {
      setMessage("Feedback could not be saved");
      return;
    }
    setMessage("Feedback saved and style weights updated.");
    refresh();
  }

  const recommendedItems = result?.outfitItems.map((row) => wardrobe.find((item) => item.id === row.clothingItemId)).filter(Boolean) as ClothingItem[] | undefined;

  return (
    <section className="grid two">
      <div className="panel">
        <h1>Recommend Outfit</h1>
        <p>The recommendation system uses transparent scoring: category completeness, color compatibility, style overlap, saved outfits, feedback history, and preference weights.</p>
        <h2>Style Preferences</h2>
        <div className="grid two">
          {STYLE_OPTIONS.map((tag) => (
            <label className="card" key={tag}>
              <input
                type="checkbox"
                checked={selected.includes(tag)}
                onChange={(event) => setSelected(event.target.checked ? [...selected, tag] : selected.filter((item) => item !== tag))}
              />
              {tag}
            </label>
          ))}
        </div>
        <div className="actions">
          <button onClick={savePreferences}>Save preferences</button>
          <button className="secondary" onClick={generate}>Generate recommendation</button>
        </div>
        {message && <div className={`message ${message.includes("Please") || message.includes("could not") ? "error" : ""}`}>{message}</div>}
        <h3>Current weights</h3>
        <div className="tags">{preferences.map((pref) => <span className="tag" key={pref.id}>{pref.styleTag}: {pref.weight}</span>)}</div>
      </div>

      <div className="panel">
        <h2>Recommended outfit</h2>
        {!result && <p>No recommendation generated yet.</p>}
        {result && (
          <article className="card">
            <h3>{result.outfit.name}</h3>
            <p>Score: {result.recommendation.score}</p>
            <p>{result.recommendation.reason}</p>
            {result.recommendation.scoreBreakdown && (
              <div className="tags">
                {Object.entries(result.recommendation.scoreBreakdown).map(([label, value]) => (
                  <span className="tag" key={label}>{label}: {value}</span>
                ))}
              </div>
            )}
            <div className="grid three">
              {recommendedItems?.map((item) => <img className="item-image" src={item.imageUrl} alt={item.name} key={item.id} />)}
            </div>
            <div className="actions" style={{ marginTop: 12 }}>
              <button onClick={() => feedback("like")}>Güzel</button>
              <button className="secondary" onClick={() => feedback("not_today")}>Bugün Değil</button>
              <button className="danger" onClick={() => feedback("dislike")}>Beğenmedim</button>
            </div>
          </article>
        )}
        {result?.topCandidates && result.topCandidates.length > 1 && (
          <div className="grid" style={{ marginTop: 16 }}>
            <h3>Top candidates</h3>
            {result.topCandidates.map((candidate, index) => (
              <article className="card" key={candidate.outfitItemIds.join("-")}>
                <strong>#{index + 1} - Score {candidate.score}</strong>
                <p>{candidate.itemNames.join(" + ")}</p>
                <p>{candidate.reason}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
