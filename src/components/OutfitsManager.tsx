"use client";

import { useEffect, useState } from "react";
import { MAIN_CATEGORIES, type ClothingItem } from "@/lib/types";

type OutfitRow = {
  id: string;
  name: string;
  styleTags: string[];
  createdBy: string;
  items: Array<{ clothing?: ClothingItem }>;
};

const labels: Record<string, string> = {
  upper: "Üst giyim",
  lower: "Alt giyim",
  outerwear: "Dış giyim",
  shoes: "Ayakkabı",
  dress: "Elbise",
  bag: "Çanta",
  accessory: "Aksesuar",
  head: "Baş / şapka",
};

export function OutfitsManager() {
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<OutfitRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const [clothingResponse, outfitResponse] = await Promise.all([fetch("/api/clothing"), fetch("/api/outfits")]);
    setWardrobe(await clothingResponse.json());
    setOutfits(await outfitResponse.json());
  }

  async function saveOutfit() {
    const response = await fetch("/api/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, clothingItemIds: selected }),
    });
    if (!response.ok) {
      setMessage("Kombin kaydedilemedi.");
      return;
    }
    setName("");
    setSelected([]);
    setMessage("Kombin kaydedildi. Öneri algoritması bu seçimi zevk örneği olarak kullanacak.");
    refresh();
  }

  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <span className="eyebrow">Kombin hafızası</span>
          <h1 className="hero-title">Kendi beğendiğin kombinleri kaydet, algoritma zevkini öğrensin.</h1>
          <p className="hero-copy">
            Kaydedilen kombinler öneri skorunda referans olarak kullanılır. Böylece sistem yalnızca rastgele eşleştirme yapmaz.
          </p>
        </div>
        <div className="stat-row">
          <div className="stat"><strong>{outfits.length}</strong><span>kayıtlı kombin</span></div>
          <div className="stat"><strong>{wardrobe.length}</strong><span>dolap parçası</span></div>
        </div>
      </div>

      <section className="grid two">
        <div className="panel">
          <h2>Yeni kombin oluştur</h2>
          <label>Kombin adı<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Yağmurlu okul günü" /></label>
          {MAIN_CATEGORIES.map((category) => {
            const items = wardrobe.filter((item) => item.mainCategory === category);
            if (!items.length) return null;
            return (
              <div key={category}>
                <h3>{labels[category]}</h3>
                <div className="grid">
                  {items.map((item) => (
                    <label className="card" key={item.id}>
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={(event) => setSelected(event.target.checked ? [...selected, item.id] : selected.filter((id) => id !== item.id))}
                      />
                      <span>{item.name} - {item.colors.join(", ")}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
          <button disabled={!name || selected.length === 0} onClick={saveOutfit}>Kombini kaydet</button>
          {message && <div className="message">{message}</div>}
        </div>

        <div className="panel">
          <h2>Kayıtlı kombinler</h2>
          {!outfits.length && <div className="empty-state"><p>Henüz kombin kaydedilmedi.</p></div>}
          <div className="grid">
            {outfits.map((outfit) => (
              <article className="card" key={outfit.id}>
                <h3>{outfit.name}</h3>
                <p>{outfit.createdBy === "ai" ? "Algoritma önerisi" : "Kullanıcı kaydı"}</p>
                <div className="tags">{outfit.styleTags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
                <div className="outfit-preview" style={{ marginTop: 12 }}>
                  {outfit.items.map((row) => row.clothing && (
                    <div key={row.clothing.id}>
                      <img className="item-thumb" src={row.clothing.imageUrl} alt={row.clothing.name} />
                      <p>{row.clothing.name}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
