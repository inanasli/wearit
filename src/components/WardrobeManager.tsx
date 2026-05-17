"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { demoWardrobeItems } from "@/lib/demoWardrobe";
import { FORMALITIES, MAIN_CATEGORIES, type ClothingItem } from "@/lib/types";

const categoryLabels: Record<string, string> = {
  head: "Baş / şapka",
  upper: "Üst giyim",
  lower: "Alt giyim",
  dress: "Elbise",
  outerwear: "Dış giyim",
  shoes: "Ayakkabı",
  bag: "Çanta",
  accessory: "Aksesuar",
};

export function WardrobeManager() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || "";
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [editing, setEditing] = useState<ClothingItem | null>(null);
  const [filters, setFilters] = useState({ category: "", style: "", color: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (categoryParam && MAIN_CATEGORIES.includes(categoryParam as never)) {
      setFilters((current) => ({ ...current, category: categoryParam }));
    }
  }, [categoryParam]);

  async function fetchItems() {
    const response = await fetch("/api/clothing");
    setItems(await response.json());
  }

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (!filters.category || item.mainCategory === filters.category) &&
          (!filters.style || item.styleTags.includes(filters.style)) &&
          (!filters.color || item.colors.includes(filters.color)),
      ),
    [items, filters],
  );

  const counts = useMemo(() => {
    return MAIN_CATEGORIES.reduce<Record<string, number>>((acc, category) => {
      acc[category] = items.filter((item) => item.mainCategory === category).length;
      return acc;
    }, {});
  }, [items]);

  async function addDemoWardrobe() {
    setLoading(true);
    setMessage("");
    try {
      for (const item of demoWardrobeItems) {
        await fetch("/api/clothing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }
      setMessage("Örnek dolap eklendi. Artık hava durumuna göre kombin önerisi alabilirsin.");
      await fetchItems();
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    const response = await fetch(`/api/clothing/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (!response.ok) {
      setMessage("Kıyafet kaydedilemedi.");
      return;
    }
    setEditing(null);
    setMessage("Kıyafet bilgileri güncellendi.");
    fetchItems();
  }

  async function remove(id: string) {
    await fetch(`/api/clothing/${id}`, { method: "DELETE" });
    fetchItems();
  }

  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <span className="eyebrow">Dijital dolap</span>
          <h1 className="hero-title">Eklediğin kıyafetler kategori, renk, stil ve mevsime göre düzenlenir.</h1>
          <p className="hero-copy">
            Öneri algoritması bu etiketleri kullanarak üst, alt, ayakkabı ve gerektiğinde dış giyimden uygun kombin üretir.
          </p>
        </div>
        <div className="stat-row">
          <div className="stat"><strong>{items.length}</strong><span>kıyafet</span></div>
          <div className="stat"><strong>{counts.upper || 0}</strong><span>üst</span></div>
          <div className="stat"><strong>{counts.shoes || 0}</strong><span>ayakkabı</span></div>
        </div>
      </div>

      <div className="panel">
        <div className="grid three">
          <label>
            Kategori
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
              <option value="">Tümü</option>
              {MAIN_CATEGORIES.map((cat) => <option key={cat} value={cat}>{categoryLabels[cat]}</option>)}
            </select>
          </label>
          <label>
            Stil etiketi
            <input value={filters.style} onChange={(e) => setFilters({ ...filters, style: e.target.value.toLowerCase() })} placeholder="casual" />
          </label>
          <label>
            Renk
            <input value={filters.color} onChange={(e) => setFilters({ ...filters, color: e.target.value.toLowerCase() })} placeholder="blue" />
          </label>
        </div>
        <div className="actions">
          <a className="button" href="/add-clothing">Kıyafet ekle</a>
          <button className="secondary" onClick={addDemoWardrobe} disabled={loading}>
            {loading ? "Ekleniyor..." : "Örnek dolap yükle"}
          </button>
          {filters.category && (
            <button className="secondary" onClick={() => setFilters({ ...filters, category: "" })}>
              Filtreyi temizle
            </button>
          )}
        </div>
      </div>

      {message && <div className="message">{message}</div>}

      {!filtered.length && (
        <div className="empty-state">
          <div>
            <h2>{filters.category ? `${categoryLabels[filters.category]} boş` : "Dolap henüz boş"}</h2>
            <p>Öneri alabilmek için en az bir üst, bir alt ve bir ayakkabı eklemelisin.</p>
            <div className="actions">
              <a className="button" href="/add-clothing">Kıyafet ekle</a>
              <button className="secondary" onClick={addDemoWardrobe} disabled={loading}>Demo verisiyle dene</button>
            </div>
          </div>
        </div>
      )}

      {MAIN_CATEGORIES.map((category) => {
        const categoryItems = filtered.filter((item) => item.mainCategory === category);
        if (!categoryItems.length) return null;
        return (
          <section key={category} className="grid" id={category}>
            <h2 className="section-title">{categoryLabels[category]}</h2>
            <div className="grid three">
              {categoryItems.map((item) => (
                <article className="card wardrobe-card" key={item.id}>
                  <img className="item-image" src={item.imageUrl} alt={item.name} />
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.subCategory} - güven {Math.round(item.confidence * 100)}%</p>
                  </div>
                  <div className="tags">{[...item.colors, ...item.styleTags, ...item.seasonTags].map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
                  <div className="actions">
                    <button className="secondary" onClick={() => setEditing(item)}>Düzenle</button>
                    <button className="danger" onClick={() => remove(item.id)}>Sil</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {editing && (
        <section className="panel">
          <h2>Kıyafet bilgilerini düzenle</h2>
          <div className="grid two">
            <label>İsim<input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
            <label>Ana kategori<select value={editing.mainCategory} onChange={(e) => setEditing({ ...editing, mainCategory: e.target.value as ClothingItem["mainCategory"] })}>{MAIN_CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}</select></label>
            <label>Alt kategori<input value={editing.subCategory} onChange={(e) => setEditing({ ...editing, subCategory: e.target.value })} /></label>
            <label>Kullanım tarzı<select value={editing.formality} onChange={(e) => setEditing({ ...editing, formality: e.target.value as ClothingItem["formality"] })}>{FORMALITIES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Renkler<input value={editing.colors.join(", ")} onChange={(e) => setEditing({ ...editing, colors: csv(e.target.value) })} /></label>
            <label>Stil etiketleri<input value={editing.styleTags.join(", ")} onChange={(e) => setEditing({ ...editing, styleTags: csv(e.target.value) })} /></label>
            <label>Mevsim etiketleri<input value={editing.seasonTags.join(", ")} onChange={(e) => setEditing({ ...editing, seasonTags: csv(e.target.value) })} /></label>
          </div>
          <div className="actions">
            <button onClick={saveEdit}>Kaydet</button>
            <button className="secondary" onClick={() => setEditing(null)}>Vazgeç</button>
          </div>
        </section>
      )}
    </section>
  );
}

function csv(value: string) {
  return value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
}
