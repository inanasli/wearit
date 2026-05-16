"use client";

import { useEffect, useState } from "react";
import { classifyClothingWithLocalVision } from "@/lib/ai/localVisionClassifier";
import { mockClassifyClothing } from "@/lib/ai/mockClothingClassifier";
import { FORMALITIES, MAIN_CATEGORIES, type ClothingClassification, type ClothingItem, type SourceType } from "@/lib/types";

type Mode = "upload" | "image_url" | "product_url";
type PendingSource = {
  sourceType: SourceType;
  imageUrl: string;
  sourceUrl: string | null;
  file?: File;
  previewUrl?: string;
  hasVisualImage: boolean;
};

const colorOptions = ["black", "white", "beige", "gray", "brown", "blue", "green", "red", "pink", "yellow", "orange", "purple", "multicolor", "patterned"];
const styleOptions = ["casual", "smart_casual", "formal", "sporty", "streetwear", "minimal", "classic", "elegant", "bohemian", "colorful", "comfortable", "basic", "trendy", "summer"];
const seasonOptions = ["spring", "summer", "autumn", "winter", "all_season"];

export function AddClothingForm() {
  const [mode, setMode] = useState<Mode>("image_url");
  const [imageUrl, setImageUrl] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loadingText, setLoadingText] = useState("");
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [created, setCreated] = useState<ClothingItem | null>(null);
  const [draft, setDraft] = useState<ClothingClassification | null>(null);
  const [originalPrediction, setOriginalPrediction] = useState<ClothingClassification | null>(null);
  const [pendingSource, setPendingSource] = useState<PendingSource | null>(null);

  useEffect(() => {
    return () => {
      if (pendingSource?.previewUrl) URL.revokeObjectURL(pendingSource.previewUrl);
    };
  }, [pendingSource?.previewUrl]);

  async function classifyForReview() {
    setLoadingText("Analyzing image locally...");
    setMessage("");
    setWarning("");
    setCreated(null);
    setDraft(null);
    setOriginalPrediction(null);

    try {
      let classification: ClothingClassification;
      let nextSource: PendingSource;

      if (mode === "upload") {
        if (!file) throw new Error("Please upload an image file.");
        const previewUrl = URL.createObjectURL(file);
        classification = await classifyClothingWithLocalVision({ image: file, fileName: file.name });
        nextSource = { sourceType: "upload", imageUrl: previewUrl, sourceUrl: null, file, previewUrl, hasVisualImage: true };
      } else if (mode === "image_url") {
        if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) throw new Error("Invalid image URL");
        classification = await classifyClothingWithLocalVision({ image: imageUrl, imageUrl });
        nextSource = { sourceType: "image_url", imageUrl, sourceUrl: imageUrl, hasVisualImage: true };
      } else {
        if (!productUrl || !/^https?:\/\//i.test(productUrl)) throw new Error("Invalid product URL");
        const metadataResponse = await fetch("/api/product-metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productUrl }),
        });
        const metadata = await metadataResponse.json();
        if (!metadataResponse.ok) {
          throw new Error(metadata.error || "Product image could not be extracted. Please paste a direct image URL manually.");
        }
        if (metadata.imageUrl) {
          classification = await classifyClothingWithLocalVision({
            image: metadata.imageUrl,
            imageUrl: metadata.imageUrl,
            productUrl,
            title: metadata.title,
            description: metadata.description || metadata.fallbackText,
          });
          nextSource = { sourceType: "product_url", imageUrl: metadata.imageUrl, sourceUrl: productUrl, hasVisualImage: true };
        } else if (metadata.title || metadata.description || metadata.fallbackText) {
          classification = mockClassifyClothing({
            productUrl,
            title: metadata.title,
            description: [metadata.description, metadata.fallbackText].filter(Boolean).join(" "),
          }, "Product image could not be extracted. Classification was estimated from product text. You can upload an image or paste a direct image URL for better visual analysis.");
          nextSource = { sourceType: "product_url", imageUrl: "/placeholder-clothing.svg", sourceUrl: productUrl, hasVisualImage: false };
        } else {
          throw new Error("Product image could not be extracted. Please paste a direct image URL manually.");
        }
      }

      setDraft(classification);
      setOriginalPrediction(JSON.parse(JSON.stringify(classification)));
      setPendingSource(nextSource);
      setWarning(
        classification.aiDescription.includes("Product image could not be extracted")
          ? "Product image could not be extracted. Classification was estimated from product text. You can upload an image or paste a direct image URL for better visual analysis."
          : classification.aiDescription.includes("Local vision classifier failed")
            ? "Local vision classifier failed. Using demo classifier instead."
            : "",
      );
      setMessage("Review classification before saving.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Image classification failed");
    } finally {
      setLoadingText("");
    }
  }

  async function saveConfirmedItem() {
    if (!draft || !pendingSource) return;
    setLoadingText("Saving...");
    setMessage("");

    try {
      let response: Response;
      if (pendingSource.sourceType === "upload") {
        if (!pendingSource.file) throw new Error("Please upload an image file.");
        const form = new FormData();
        form.append("image", pendingSource.file);
        form.append("classification", JSON.stringify(draft));
        if (originalPrediction) form.append("originalClassification", JSON.stringify(originalPrediction));
        response = await fetch("/api/clothing/upload", { method: "POST", body: form });
      } else {
        response = await fetch("/api/clothing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...draft,
            imageUrl: pendingSource.imageUrl,
            sourceType: pendingSource.sourceType,
            sourceUrl: pendingSource.sourceUrl,
            originalClassification: originalPrediction,
          }),
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Clothing item could not be saved");
      setCreated(data);
      setDraft(null);
      setOriginalPrediction(null);
      setPendingSource(null);
      setMessage("Item saved to wardrobe.");
      setWarning("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Clothing item could not be saved");
    } finally {
      setLoadingText("");
    }
  }

  return (
    <section className="panel">
      <h1>Add Clothing</h1>
      <p>Upload an image, paste a direct image URL, or use a product URL. Local CLIP runs in the browser first, then you review the classification before saving.</p>
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
        <button onClick={classifyForReview} disabled={Boolean(loadingText)}>{loadingText || "Analyze for review"}</button>
      </div>

      {warning && <div className="message error">{warning}</div>}
      {message && <div className={`message ${created || draft ? "" : "error"}`}>{message}</div>}

      {draft && pendingSource && (
        <article className="card" style={{ marginTop: 16 }}>
          {pendingSource.hasVisualImage ? (
            <img className="item-image" src={pendingSource.imageUrl} alt={draft.name} />
          ) : (
            <div className="item-image placeholder-image">No product image extracted</div>
          )}
          <h2>Review Classification</h2>
          {draft.confidence < 0.6 && <p className="review-note">Please review classification.</p>}
          <div className="grid two">
            <label>Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
            <label>Main category<select value={draft.mainCategory} onChange={(event) => setDraft({ ...draft, mainCategory: event.target.value as ClothingClassification["mainCategory"] })}>{MAIN_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Subcategory<input value={draft.subCategory} onChange={(event) => setDraft({ ...draft, subCategory: event.target.value })} /></label>
            <label>Formality<select value={draft.formality} onChange={(event) => setDraft({ ...draft, formality: event.target.value as ClothingClassification["formality"] })}>{FORMALITIES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Confidence<input type="number" min="0" max="1" step="0.01" value={draft.confidence} onChange={(event) => setDraft({ ...draft, confidence: Number(event.target.value) })} /></label>
          </div>
          <ChipGroup label="Colors" options={colorOptions} selected={draft.colors} onToggle={(value) => setDraft({ ...draft, colors: toggleArray(draft.colors, value) })} />
          <ChipGroup label="Style tags" options={styleOptions} selected={draft.styleTags} onToggle={(value) => setDraft({ ...draft, styleTags: toggleArray(draft.styleTags, value) })} />
          <ChipGroup label="Season tags" options={seasonOptions} selected={draft.seasonTags} onToggle={(value) => setDraft({ ...draft, seasonTags: toggleArray(draft.seasonTags, value) })} />
          <label>AI description<textarea value={draft.aiDescription} onChange={(event) => setDraft({ ...draft, aiDescription: event.target.value })} /></label>
          <div className="actions">
            <button onClick={saveConfirmedItem} disabled={Boolean(loadingText)}>{loadingText || "Save confirmed item"}</button>
            <button className="secondary" onClick={() => { setDraft(null); setOriginalPrediction(null); setPendingSource(null); }}>Cancel</button>
          </div>
        </article>
      )}

      {created && (
        <article className="card" style={{ marginTop: 16 }}>
          <img className="item-image" src={created.imageUrl} alt={created.name} />
          <h3>{created.name}</h3>
          <p>{created.mainCategory} / {created.subCategory} - confidence {Math.round(created.confidence * 100)}%</p>
          {created.confidence < 0.6 && <p className="review-note">Please review classification</p>}
          <div className="tags">{created.styleTags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
          {created.sourceUrl && (
            <a className="source-link" href={created.sourceUrl} target="_blank" rel="noreferrer" title={created.sourceUrl}>
              {created.sourceType === "product_url" ? "View product" : `View source${sourceDomain(created.sourceUrl) ? `: ${sourceDomain(created.sourceUrl)}` : ""}`}
            </a>
          )}
        </article>
      )}
    </section>
  );
}

function ChipGroup({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="chip-section">
      <span>{label}</span>
      <div className="chip-grid">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`chip ${selected.includes(option) ? "selected" : ""}`}
            onClick={() => onToggle(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function toggleArray(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function sourceDomain(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
