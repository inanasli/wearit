import { jsonError } from "@/lib/api";
import { fetchProductMetadata } from "@/lib/productMetadata";

export async function POST(request: Request) {
  let productUrl = "";
  try {
    ({ productUrl } = await request.json());
    if (!productUrl || !/^https?:\/\//i.test(productUrl)) return jsonError("Invalid product URL");

    const metadata = await fetchProductMetadata(productUrl);
    if (metadata.imageUrl) {
      metadata.imageUrl = new URL(metadata.imageUrl, productUrl).toString();
    }
    return Response.json(metadata);
  } catch {
    const fallbackText = productUrl
      ? decodeURIComponent(productUrl).replace(/^https?:\/\//i, "").replace(/[/?#=&._-]+/g, " ").replace(/\s+/g, " ").trim()
      : "";
    if (fallbackText) {
      return Response.json({
        fallbackText,
        warning: "Product image could not be extracted. Classification was estimated from product text. You can upload an image or paste a direct image URL for better visual analysis.",
      });
    }
    return jsonError("Product image could not be extracted. Please paste a direct image URL manually.", 422);
  }
}
