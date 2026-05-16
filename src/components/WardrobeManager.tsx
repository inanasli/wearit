"use client";

import { useEffect, useMemo, useState } from "react";
import { FORMALITIES, MAIN_CATEGORIES, type ClothingItem } from "@/lib/types";

export function WardrobeManager() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [editing, setEditing] = useState<ClothingItem | null>(null);
  const [filters, setFilters] = useState({ category: "", style: "", color: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const response = await fetch("/api/clothing");
    setItems(await response.json());
  }

  const filtered = useMemo(() => items.filter((item) =>
    (!filters.category || item.mainCategory === filters.category) &&
    (!filters.style || item.styleTags.includes(filters.style)) &&
    (!filters.color || item.colors.includes(filters.color))
  ), [items, filters]);

  async function saveEdit() {
    if (!editing) return;
    const response = await fetch(`/api/clothing/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (!response.ok) {
      setMessage("Clothing item could not be saved");
      return;
    }
    setEditing(null);
    setMessage("Item updated.");
    fetchItems();
  }

  async function remove(id: string) {
    await fetch(`/api/clothing/${id}`, { method: "DELETE" });
    fetchItems();
  }

  return (
    <section className="grid">
      <div className="panel">
        <h1>Wardrobe</h1>
        <p>Items are grouped by category. AI/mock fields can be corrected manually so the MVP stays reliable even when classification is imperfect.</p>
        <div className="grid three">
          <label>Category<select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">All</option>{MAIN_CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}</select></label>
          <label>Style tag<input value={filters.style} onChange={(e) => setFilters({ ...filters, style: e.target.value.toLowerCase() })} placeholder="casual" /></label>
          <label>Color<input value={filters.color} onChange={(e) => setFilters({ ...filters, color: e.target.value.toLowerCase() })} placeholder="blue" /></label>
        </div>
      </div>

      {message && <div className="message">{message}</div>}

      {MAIN_CATEGORIES.map((category) => {
        const categoryItems = filtered.filter((item) => item.mainCategory === category);
        if (!categoryItems.length) return null;
        return (
          <section key={category}>
            <h2 className="section-title">{category[0].toUpperCase() + category.slice(1)}</h2>
            <div className="grid three">
              {categoryItems.map((item) => (
                <article className="card" key={item.id}>
                  <img className="item-image" src={item.imageUrl} alt={item.name} />
                  <h3>{item.name}</h3>
                  <p>{item.mainCategory} / {item.subCategory} - {Math.round(item.confidence * 100)}%</p>
                  <div className="tags">{[...item.colors, ...item.styleTags].map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
                  <div className="actions" style={{ marginTop: 12 }}>
                    <button className="secondary" onClick={() => setEditing(item)}>Edit</button>
                    <button className="danger" onClick={() => remove(item.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {editing && (
        <section className="panel">
          <h2>Edit classification</h2>
          <div className="grid two">
            <label>Name<input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
            <label>Main category<select value={editing.mainCategory} onChange={(e) => setEditing({ ...editing, mainCategory: e.target.value as ClothingItem["mainCategory"] })}>{MAIN_CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}</select></label>
            <label>Subcategory<input value={editing.subCategory} onChange={(e) => setEditing({ ...editing, subCategory: e.target.value })} /></label>
            <label>Formality<select value={editing.formality} onChange={(e) => setEditing({ ...editing, formality: e.target.value as ClothingItem["formality"] })}>{FORMALITIES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Colors comma-separated<input value={editing.colors.join(", ")} onChange={(e) => setEditing({ ...editing, colors: csv(e.target.value) })} /></label>
            <label>Style tags comma-separated<input value={editing.styleTags.join(", ")} onChange={(e) => setEditing({ ...editing, styleTags: csv(e.target.value) })} /></label>
            <label>Season tags comma-separated<input value={editing.seasonTags.join(", ")} onChange={(e) => setEditing({ ...editing, seasonTags: csv(e.target.value) })} /></label>
          </div>
          <div className="actions">
            <button onClick={saveEdit}>Save changes</button>
            <button className="secondary" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </section>
      )}
    </section>
  );
}

function csv(value: string) {
  return value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
}
