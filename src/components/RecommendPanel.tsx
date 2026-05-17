"use client";

import { useEffect, useMemo, useState } from "react";
import { demoWardrobeItems } from "@/lib/demoWardrobe";
import { STYLE_OPTIONS, type ClothingItem, type UserStylePreference } from "@/lib/types";

type WeatherState = {
  temperature: number;
  condition: string;
  precipitation: number;
  source: string;
};

type RecommendationResult = {
  recommendation: { id: string; reason: string; score: number; scoreBreakdown?: Record<string, number> };
  outfit: { id: string; name: string; styleTags: string[] };
  outfitItems: Array<{ clothingItemId: string }>;
  weather?: WeatherState;
  topCandidates?: Array<{
    outfitItemIds: string[];
    itemNames: string[];
    score: number;
    scoreBreakdown: Record<string, number>;
    reason: string;
  }>;
};

const scoreLabels: Record<string, string> = {
  categoryCompleteness: "Kategori tamamlığı",
  weatherSuitability: "Hava uyumu",
  styleCompatibility: "Stil uyumu",
  formalityCompatibility: "Tarz seviyesi",
  stylePreference: "Stil tercihi",
  colorCompatibility: "Renk uyumu",
  colorPreference: "Renk tercihi",
  userOutfitSimilarity: "Kaydedilen kombinler",
  feedbackSimilarity: "Geri bildirim",
  diversity: "Çeşitlilik",
  dislikePenalty: "Beğenmeme cezası",
};

export function RecommendPanel() {
  const [preferences, setPreferences] = useState<UserStylePreference[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherState>({
    temperature: 14,
    condition: "yağmur olasılığı",
    precipitation: 0.4,
    source: "manuel",
  });

  useEffect(() => {
    refresh();
    loadWeather();
  }, []);

  async function refresh() {
    const [prefs, clothing] = await Promise.all([fetch("/api/preferences"), fetch("/api/clothing")]);
    const prefData = await prefs.json();
    setPreferences(prefData);
    setSelected(prefData.filter((pref: UserStylePreference) => pref.weight > 0).map((pref: UserStylePreference) => pref.styleTag));
    setWardrobe(await clothing.json());
  }

  async function loadWeather() {
    const fallback = { latitude: 41.0082, longitude: 28.9784, label: "İstanbul" };
    const coords = await new Promise<typeof fallback>((resolve) => {
      if (!navigator.geolocation) {
        resolve(fallback);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, label: "konumun" }),
        () => resolve(fallback),
        { timeout: 3500 },
      );
    });

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,precipitation,weather_code&timezone=auto`,
      );
      const data = await response.json();
      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        precipitation: Number(data.current.precipitation || 0),
        condition: weatherCodeToText(Number(data.current.weather_code)),
        source: coords.label,
      });
    } catch {
      setMessage("Hava durumu alınamadı; manuel değerlerle öneri oluşturabilirsin.");
    }
  }

  async function addDemoWardrobe() {
    setLoading(true);
    for (const item of demoWardrobeItems) {
      await fetch("/api/clothing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    }
    await refresh();
    setLoading(false);
    setMessage("Demo dolap eklendi. Şimdi öneri oluşturabilirsin.");
  }

  async function savePreferences() {
    await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ styleTags: selected }),
    });
    setMessage("Stil tercihleri kaydedildi.");
    refresh();
  }

  async function generate() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/recommendations/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weather }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(data.error || "Öneri oluşturulamadı.");
      setResult(null);
      return;
    }
    setResult(data);
    await refresh();
  }

  async function feedback(feedbackType: "like" | "not_today" | "dislike") {
    if (!result) return;
    const response = await fetch(`/api/recommendations/${result.recommendation.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackType }),
    });
    if (!response.ok) {
      setMessage("Geri bildirim kaydedilemedi.");
      return;
    }
    setMessage("Geri bildirim kaydedildi; sonraki öneriler buna göre güncellenecek.");
    refresh();
  }

  const recommendedItems = useMemo(
    () => result?.outfitItems.map((row) => wardrobe.find((item) => item.id === row.clothingItemId)).filter(Boolean) as ClothingItem[] | undefined,
    [result, wardrobe],
  );

  const hasMinimumWardrobe = wardrobe.some((item) => item.mainCategory === "upper") && wardrobe.some((item) => item.mainCategory === "lower") && wardrobe.some((item) => item.mainCategory === "shoes");

  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <span className="eyebrow">Akıllı kombin önerisi</span>
          <h1 className="hero-title">Sen kombin yapmazsın; sistem dolabından bugüne uygun kombini seçer.</h1>
          <p className="hero-copy">
            Algoritma kategori tamamlığı, renk uyumu, stil tercihleri, daha önce kaydettiğin kombinler,
            geri bildirimler ve hava durumunu birlikte skorlar.
          </p>
        </div>
        <div className="stat-row">
          <div className="stat"><strong>{Math.round(weather.temperature)}°C</strong><span>{weather.condition}</span></div>
          <div className="stat"><strong>{wardrobe.length}</strong><span>dolap parçası</span></div>
        </div>
      </div>

      <section className="grid two">
        <div className="panel">
          <h2>1. Hava durumu</h2>
          <p>Konum izni verilirse güncel veri alınır; istersen manuel de değiştirebilirsin.</p>
          <div className="weather-box">
            <label>Sıcaklık<input type="number" value={weather.temperature} onChange={(e) => setWeather({ ...weather, temperature: Number(e.target.value), source: "manuel" })} /></label>
            <label>Durum<input value={weather.condition} onChange={(e) => setWeather({ ...weather, condition: e.target.value, source: "manuel" })} /></label>
            <label>Yağış<input type="number" step="0.1" value={weather.precipitation} onChange={(e) => setWeather({ ...weather, precipitation: Number(e.target.value), source: "manuel" })} /></label>
          </div>
          <div className="tags">
            <span className="tag weather">Kaynak: {weather.source}</span>
            <span className="tag weather">{weather.temperature <= 10 ? "Dış giyim güçlü önerilir" : weather.temperature >= 24 ? "Hafif parçalar öne çıkar" : "Katmanlı kombin uygun"}</span>
          </div>
        </div>

        <div className="panel">
          <h2>2. Stil tercihleri</h2>
          <div className="chip-grid">
            {STYLE_OPTIONS.map((tag) => (
              <button
                type="button"
                className={`chip ${selected.includes(tag) ? "selected" : ""}`}
                key={tag}
                onClick={() => setSelected(selected.includes(tag) ? selected.filter((item) => item !== tag) : [...selected, tag])}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="actions" style={{ marginTop: 16 }}>
            <button onClick={savePreferences}>Tercihleri kaydet</button>
            <button className="secondary" onClick={addDemoWardrobe} disabled={loading}>Demo dolap ekle</button>
          </div>
        </div>
      </section>

      {message && <div className={`message ${message.includes("oluşturulamadı") || message.includes("Please") ? "error" : ""}`}>{message}</div>}

      <section className="grid two">
        <div className="panel">
          <h2>3. Kombin üret</h2>
          {!hasMinimumWardrobe && (
            <div className="empty-state">
              <div>
                <h3>Öneri için dolapta eksik parça var</h3>
                <p>En az bir üst, bir alt ve bir ayakkabı eklenince algoritma kombin üretebilir.</p>
                <div className="actions">
                  <a className="button" href="/add-clothing">Kıyafet ekle</a>
                  <button className="secondary" onClick={addDemoWardrobe} disabled={loading}>Demo ile doldur</button>
                </div>
              </div>
            </div>
          )}
          {hasMinimumWardrobe && (
            <>
              <p>Sistem dolabındaki olası kombinleri kendisi üretir, skorlar ve en uygun olanı seçer.</p>
              <button onClick={generate} disabled={loading}>{loading ? "Hesaplanıyor..." : "Kombini otomatik seç"}</button>
            </>
          )}
        </div>

        <div className="panel">
          <h2>Önerilen kombin</h2>
          {!result && <p>Henüz öneri oluşturulmadı.</p>}
          {result && (
            <article className="grid">
              <div className="tags">
                <span className="tag score">Skor: {result.recommendation.score}</span>
                <span className="tag weather">{Math.round(weather.temperature)}°C - {weather.condition}</span>
              </div>
              <h3>{result.outfit.name}</h3>
              <p>{result.recommendation.reason}</p>
              <div className="outfit-preview">
                {recommendedItems?.map((item) => (
                  <div className="card" key={item.id}>
                    <img className="item-image" src={item.imageUrl} alt={item.name} />
                    <h3>{item.name}</h3>
                    <div className="tags">{[item.mainCategory, ...item.colors].map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
                  </div>
                ))}
              </div>
              {result.recommendation.scoreBreakdown && <ScoreBreakdown rows={result.recommendation.scoreBreakdown} />}
              <div className="actions">
                <button onClick={() => feedback("like")}>Beğendim</button>
                <button className="secondary" onClick={() => feedback("not_today")}>Bugün değil</button>
                <button className="danger" onClick={() => feedback("dislike")}>Beğenmedim</button>
              </div>
            </article>
          )}
        </div>
      </section>
    </section>
  );
}

function ScoreBreakdown({ rows }: { rows: Record<string, number> }) {
  return (
    <div className="score-list">
      {Object.entries(rows).map(([key, value]) => {
        const width = Math.max(0, Math.min(100, value + 20));
        return (
          <div className="score-row" key={key}>
            <span>{scoreLabels[key] || key}</span>
            <div className="score-bar"><span style={{ width: `${width}%` }} /></div>
            <strong>{value}</strong>
          </div>
        );
      })}
    </div>
  );
}

function weatherCodeToText(code: number) {
  if ([0, 1].includes(code)) return "açık";
  if ([2, 3].includes(code)) return "bulutlu";
  if ([45, 48].includes(code)) return "sisli";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "yağmurlu";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "karlı";
  if ([95, 96, 99].includes(code)) return "fırtınalı";
  return "değişken";
}
