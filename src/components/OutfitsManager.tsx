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
      setMessage("Outfit could not be saved");
      return;
    }
    setName("");
    setSelected([]);
    setMessage("Outfit saved.");
    refresh();
  }

  return (
    <section className="grid two">
      <div className="panel">
        <h1>Outfits</h1>
        <p>Create manual outfits from wardrobe items. The saved combinations are used by the recommendation score as examples of your taste.</p>
        <label>Outfit name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Weekend city outfit" /></label>
        {MAIN_CATEGORIES.map((category) => {
          const items = wardrobe.filter((item) => item.mainCategory === category);
          if (!items.length) return null;
          return (
            <div key={category}>
              <h3>{category}</h3>
              <div className="grid">
                {items.map((item) => (
                  <label className="card" key={item.id}>
                    <input
                      type="checkbox"
                      checked={selected.includes(item.id)}
                      onChange={(event) => setSelected(event.target.checked ? [...selected, item.id] : selected.filter((id) => id !== item.id))}
                    />
                    {item.name} - {item.mainCategory}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        <button disabled={!name || selected.length === 0} onClick={saveOutfit}>Save outfit</button>
        {message && <div className="message">{message}</div>}
      </div>

      <div className="panel">
        <h2>Saved outfits</h2>
        <div className="grid">
          {outfits.map((outfit) => (
            <article className="card" key={outfit.id}>
              <h3>{outfit.name}</h3>
              <p>Created by {outfit.createdBy}</p>
              <div className="tags">{outfit.styleTags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
              <div className="grid three" style={{ marginTop: 12 }}>
                {outfit.items.map((row) => row.clothing && <img className="item-image" key={row.clothing.id} src={row.clothing.imageUrl} alt={row.clothing.name} />)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
