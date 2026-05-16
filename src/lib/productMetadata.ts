import "server-only";

export type ProductMetadata = {
  imageUrl?: string;
  title?: string;
  description?: string;
};

export async function fetchProductMetadata(productUrl: string): Promise<ProductMetadata> {
  const response = await fetch(productUrl, {
    headers: { "User-Agent": "WearItMVP/1.0" },
    next: { revalidate: 0 },
  });
  if (!response.ok) throw new Error("Product page could not be fetched.");
  const html = await response.text();
  return {
    imageUrl: extractMeta(html, "og:image") || extractMeta(html, "twitter:image"),
    title: extractMeta(html, "og:title") || extractTitle(html),
    description: extractMeta(html, "og:description") || extractMeta(html, "description"),
  };
}

function extractMeta(html: string, key: string) {
  const escaped = key.replace(":", "\\:");
  const property = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i");
  const contentFirst = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i");
  return decodeHtml(html.match(property)?.[1] || html.match(contentFirst)?.[1] || "");
}

function extractTitle(html: string) {
  return decodeHtml(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "");
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").trim() || undefined;
}
