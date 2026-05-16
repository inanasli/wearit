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
  const [mode, setMode] = useState<Mode>("upload");
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
    setLoadingText("Görsel analiz ediliyor...");
    setMessage("");
    setWarning("");
    setCreated(null);
    setDraft(null);
    setOriginalPrediction(null);

    try {
      let classification: ClothingClassification;
      let nextSource: PendingSource;

      if (mode === "upload") {
        if (!file) throw new Error("Lütfen bir kıyafet görseli yükle.");
        const previewUrl = URL.createObjectURL(file);
        classification = await classifyClothingWithLocalVision({ image: file, fileName: file.name });
        nextSource = { sourceType: "upload", imageUrl: previewUrl, sourceUrl: null, file, previewUrl, hasVisualImage: true };
      } else if (mode === "image_url") {
        if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) throw new Error("Geçerli bir görsel URL'si gir.");
        classification = await classifyClothingWithLocalVision({ image: imageUrl, imageUrl });
        nextSource = { sourceType: "image_url", imageUrl, sourceUrl: imageUrl, hasVisualImage: true };
      } else {
        if (!productUrl || !/^https?:\/\//i.test(productUrl)) throw new Error("Geçerli bir ürün URL'si gir.");
        const metadataResponse = await fetch("/api/product-metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productUrl }),
        });
        const metadata = await metadataResponse.json();
        if (!metadataResponse.ok) {
          throw new Error(metadata.error || "Ürün görseli alınamadı. Doğrudan görsel URL'si kullanabilirsin.");
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
          throw new Error("Ürün görseli alınamadı. Doğrudan görsel URL'si kullanabilirsin.");
        }
      }

      setDraft(classification);
      setOriginalPrediction(JSON.parse(JSON.stringify(classification)));
      setPendingSource(nextSource);
      setWarning(
        classification.aiDescription.includes("Product image could not be extracted")
          ? "Ürün görseli alınamadı; tahmin ürün metninden yapıldı."
          : classification.aiDescription.includes("Local vision classifier failed")
            ? "Yerel görsel sınıflandırıcı çalışmadı; demo sınıflandırıcı kullanıldı."
            : "",
      );
      setMessage("Kaydetmeden önce tahmini kontrol et.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Görsel sınıflandırılamadı.");
    } finally {
      setLoadingText("");
    }
  }

  async function saveConfirmedItem() {
    if (!draft || !pendingSource) return;
    setLoadingText("Kaydediliyor...");
    setMessage("");

    try {
      let response: Response;
      if (pendingSource.sourceType === "upload") {
        if (!pendingSource.file) throw new Error("Lütfen bir kıyafet görseli yükle.");
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
      if (!response.ok) throw new Error(data.error || "Kıyafet dolaba kaydedilemedi.");
      setCreated(data);
      setDraft(null);
      setOriginalPrediction(null);
      setPendingSource(null);
      setMessage("Kıyafet dijital dolaba kaydedildi.");
      setWarning("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kıyafet dolaba kaydedilemedi.");
    } finally {
      setLoadingText("");
    }
  }

  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <span className="eyebrow">Dolabını oluştur</span>
          <h1 className="hero-title">Kıyafet fotoğrafını ekle, sistem türünü ve etiketlerini tahmin etsin.</h1>
          <p className="hero-copy">
            Fotoğraf yükleyebilir, görsel linki verebilir veya ürün linkinden tahmin alabilirsin.
            Kaydetmeden önce kategori, renk, stil ve mevsim etiketlerini düzeltebilirsin.
          </p>
        </div>
      </div>

      <div className="panel">
      <div className="tabs">
        {(["upload", "image_url", "product_url"] as Mode[]).map((tab) => (
          <button key={tab} className={`tab ${mode === tab ? "active" : ""}`} onClick={() => setMode(tab)}>
            {tab === "upload" ? "Görsel yükle" : tab === "image_url" ? "Görsel linki" : "Ürün linki"}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        {mode === "upload" && (
          <label>
            Kıyafet görseli
            <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
        )}
        {mode === "image_url" && (
          <label>
            Doğrudan görsel linki
            <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://example.com/blue-shirt.jpg" />
          </label>
        )}
        {mode === "product_url" && (
          <label>
            Ürün veya alışveriş linki
            <input value={productUrl} onChange={(event) => setProductUrl(event.target.value)} placeholder="https://shop.example.com/product" />
          </label>
        )}
        <button onClick={classifyForReview} disabled={Boolean(loadingText)}>{loadingText || "Analiz et"}</button>
      </div>
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
          <h2>Tahmini kontrol et</h2>
          {draft.confidence < 0.6 && <p className="review-note">Tahmin düşük güvenli, lütfen düzelt.</p>}
          <div className="grid two">
            <label>İsim<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
            <label>Ana kategori<select value={draft.mainCategory} onChange={(event) => setDraft({ ...draft, mainCategory: event.target.value as ClothingClassification["mainCategory"] })}>{MAIN_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Alt kategori<input value={draft.subCategory} onChange={(event) => setDraft({ ...draft, subCategory: event.target.value })} /></label>
            <label>Kullanım tarzı<select value={draft.formality} onChange={(event) => setDraft({ ...draft, formality: event.target.value as ClothingClassification["formality"] })}>{FORMALITIES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Güven skoru<input type="number" min="0" max="1" step="0.01" value={draft.confidence} onChange={(event) => setDraft({ ...draft, confidence: Number(event.target.value) })} /></label>
          </div>
          <ChipGroup label="Renkler" options={colorOptions} selected={draft.colors} onToggle={(value) => setDraft({ ...draft, colors: toggleArray(draft.colors, value) })} />
          <ChipGroup label="Stil etiketleri" options={styleOptions} selected={draft.styleTags} onToggle={(value) => setDraft({ ...draft, styleTags: toggleArray(draft.styleTags, value) })} />
          <ChipGroup label="Mevsim etiketleri" options={seasonOptions} selected={draft.seasonTags} onToggle={(value) => setDraft({ ...draft, seasonTags: toggleArray(draft.seasonTags, value) })} />
          <label>Açıklama<textarea value={draft.aiDescription} onChange={(event) => setDraft({ ...draft, aiDescription: event.target.value })} /></label>
          <div className="actions">
            <button onClick={saveConfirmedItem} disabled={Boolean(loadingText)}>{loadingText || "Dolaba kaydet"}</button>
            <button className="secondary" onClick={() => { setDraft(null); setOriginalPrediction(null); setPendingSource(null); }}>Vazgeç</button>
          </div>
        </article>
      )}

      {created && (
        <article className="card" style={{ marginTop: 16 }}>
          <img className="item-image" src={created.imageUrl} alt={created.name} />
          <h3>{created.name}</h3>
          <p>{created.mainCategory} / {created.subCategory} - güven {Math.round(created.confidence * 100)}%</p>
          {created.confidence < 0.6 && <p className="review-note">Sınıflandırmayı kontrol et.</p>}
          <div className="tags">{created.styleTags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
          {created.sourceUrl && (
            <a className="source-link" href={created.sourceUrl} target="_blank" rel="noreferrer" title={created.sourceUrl}>
              {created.sourceType === "product_url" ? "Ürünü gör" : `Kaynağı gör${sourceDomain(created.sourceUrl) ? `: ${sourceDomain(created.sourceUrl)}` : ""}`}
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
