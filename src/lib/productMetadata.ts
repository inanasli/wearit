import "server-only";

export type ProductMetadata = {
  imageUrl?: string;
  title?: string;
  description?: string;
  fallbackText?: string;
};

export async function fetchProductMetadata(productUrl: string): Promise<ProductMetadata> {
  const response = await fetch(productUrl, {
    headers: { "User-Agent": "WearItMVP/1.0" },
    next: { revalidate: 0 },
  });
  if (!response.ok) throw new Error("Product page could not be fetched.");
  const html = await response.text();
  const title = extractMeta(html, "og:title") || extractMeta(html, "twitter:title") || extractJsonLdValue(html, "name") || extractTitle(html);
  const description =
    extractMeta(html, "og:description") ||
    extractMeta(html, "twitter:description") ||
    extractMeta(html, "description") ||
    extractJsonLdValue(html, "description");

  return {
    imageUrl:
      extractMeta(html, "og:image") ||
      extractMeta(html, "og:image:secure_url") ||
      extractMeta(html, "twitter:image") ||
      extractMeta(html, "twitter:image:src") ||
      extractLinkImage(html) ||
      extractJsonLdImage(html),
    title,
    description,
    fallbackText: buildFallbackText(productUrl, title, description, html),
  };
}

function extractMeta(html: string, key: string) {
  const escaped = escapeRegExp(key);
  const property = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i");
  const contentFirst = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i");
  return decodeHtml(html.match(property)?.[1] || html.match(contentFirst)?.[1] || "");
}

function extractLinkImage(html: string) {
  const relImage = /<link[^>]+rel=["'][^"']*(?:image_src|preload)[^"']*["'][^>]+href=["']([^"']+)["']/i;
  const hrefFirst = /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*(?:image_src|preload)[^"']*["']/i;
  return decodeHtml(html.match(relImage)?.[1] || html.match(hrefFirst)?.[1] || "");
}

function extractJsonLdImage(html: string) {
  return extractJsonLdValue(html, "image");
}

function extractJsonLdValue(html: string, key: "name" | "description" | "image") {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const script of scripts) {
    const raw = script.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    const parsed = safeJsonParse(raw);
    const value = findJsonLdValue(parsed, key);
    if (value) return decodeHtml(value);
  }
  return undefined;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function findJsonLdValue(value: unknown, key: "name" | "description" | "image"): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJsonLdValue(item, key);
      if (found) return found;
    }
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const direct = record[key];
    if (typeof direct === "string") return direct;
    if (Array.isArray(direct)) {
      const stringValue = direct.find((item) => typeof item === "string");
      if (stringValue) return stringValue;
      const nested = findJsonLdValue(direct, key);
      if (nested) return nested;
    }
    if (typeof direct === "object") {
      const nestedUrl = (direct as Record<string, unknown>)?.url;
      if (typeof nestedUrl === "string") return nestedUrl;
    }
    return findJsonLdValue(record["@graph"], key);
  }
  return undefined;
}

function extractTitle(html: string) {
  return decodeHtml(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "");
}

function buildFallbackText(productUrl: string, title?: string, description?: string, html?: string) {
  const urlText = decodeURIComponent(productUrl)
    .replace(/^https?:\/\//i, "")
    .replace(/[/?#=&._-]+/g, " ");
  const heading = html ? decodeHtml(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, " ") || "") : "";
  return [title, description, heading, urlText].filter(Boolean).join(" ").replace(/\s+/g, " ").trim() || undefined;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim() || undefined;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
