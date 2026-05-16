"use client";

import { useState } from "react";
import type { ClothingItem } from "@/lib/types";

type Mode = "upload" | "image_url" | "product_url";

export function AddClothingForm() {
  const [mode, setMode] = useState<Mode>("image_url");
  const [imageUrl, setImageUrl] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [created, setCreated] = useState<ClothingItem | null>(null);

  async function submit() {
    setLoading(true);
    setMessage("");
    setCreated(null);
    try {
      let response: Response;
      if (mode === "upload") {
        if (!file) throw new Error("Please upload an image file.");
        const form = new FormData();
        form.append("image", file);
        response = await fetch("/api/clothing/upload", { method: "POST", body: form });
      } else if (mode === "image_url") {
        response = await fetch("/api/clothing/from-image-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        });
      } else {
        response = await fetch("/api/clothing/from-product-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productUrl }),
        });
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Clothing item could not be saved");
      setCreated(data);
      setMessage(data.aiDescription || "Item saved to wardrobe.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Clothing item could not be saved");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <h1>Add Clothing</h1>
      <p>Upload an image, paste a direct image URL, or use a product URL. Mock mode keeps the MVP free; real AI mode is enabled only on the server when OPENAI_API_KEY exists.</p>
      <div className="tabs">
        {(["upload", "image_url", "product_url"] as Mode[]).map((tab) => (
          <button key={tab} className={`tab ${mode === tab ? "active" : ""}`} onClick={() => setMode(tab)}>
            {tab === "upload" ? "Upload image" : tab === "image_url" ? "Image URL" : "Product URL"}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        {mode === "upload" && (
          <label>
            Image file
            <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
        )}
        {mode === "image_url" && (
          <label>
            Direct image URL
            <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://example.com/blue-shirt.jpg" />
          </label>
        )}
        {mode === "product_url" && (
          <label>
            Product or shopping URL
            <input value={productUrl} onChange={(event) => setProductUrl(event.target.value)} placeholder="https://shop.example.com/product" />
          </label>
        )}
        <button onClick={submit} disabled={loading}>{loading ? "Saving..." : "Classify and save"}</button>
      </div>

      {message && <div className={`message ${created ? "" : "error"}`}>{message}</div>}
      {created && (
        <article className="card">
          <img className="item-image" src={created.imageUrl} alt={created.name} />
          <h3>{created.name}</h3>
          <p>{created.mainCategory} / {created.subCategory} - confidence {Math.round(created.confidence * 100)}%</p>
          <div className="tags">{created.styleTags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
        </article>
      )}
    </section>
  );
}
