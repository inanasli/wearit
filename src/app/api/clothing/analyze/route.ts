import { classifyClothingImage } from "@/lib/ai/classifyClothing";
import { jsonError } from "@/lib/api";
import { fetchProductMetadata, type ProductMetadata } from "@/lib/productMetadata";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("image");
      if (!(file instanceof File)) return jsonError("Lütfen bir kıyafet görseli yükle.");

      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Image = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
      const classification = await classifyClothingImage({ base64Image, fileName: file.name });
      return Response.json({
        classification,
        hasRealVision: !classification.aiDescription.toLowerCase().includes("mock"),
      });
    }

    const body = await request.json();

    if (body.imageUrl) {
      if (!/^https?:\/\//i.test(body.imageUrl)) return jsonError("Geçerli bir görsel URL'si gir.");
      const classification = await classifyClothingImage({ imageUrl: body.imageUrl });
      return Response.json({
        classification,
        imageUrl: body.imageUrl,
        hasRealVision: !classification.aiDescription.toLowerCase().includes("mock"),
      });
    }

    if (body.productUrl) {
      if (!/^https?:\/\//i.test(body.productUrl)) return jsonError("Geçerli bir ürün URL'si gir.");
      const metadata: ProductMetadata = await fetchProductMetadata(body.productUrl).catch(() => ({}));
      if (!metadata.imageUrl) {
        return jsonError("Ürün görseli alınamadı. Doğrudan görsel URL'si kullanabilirsin.", 422);
      }
      const classification = await classifyClothingImage({
        imageUrl: metadata.imageUrl,
        productUrl: body.productUrl,
        title: metadata.title,
        description: metadata.description || metadata.fallbackText,
      });
      return Response.json({
        classification: {
          ...classification,
          name: metadata.title || classification.name,
        },
        imageUrl: metadata.imageUrl,
        productUrl: body.productUrl,
        hasRealVision: !classification.aiDescription.toLowerCase().includes("mock"),
      });
    }

    return jsonError("Analiz için görsel veya ürün linki gerekli.");
  } catch {
    return jsonError("Görsel analiz edilemedi.", 500);
  }
}
