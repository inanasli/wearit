import { promises as fs } from "fs";
import path from "path";
import { classifyClothingImage } from "@/lib/ai/classifyClothing";
import { demoUserId, jsonError, normalizeClassification } from "@/lib/api";
import { createClassificationCorrectionLog } from "@/lib/classificationCorrections";
import { createId, updateDb } from "@/lib/storage/db";
import type { ClothingClassification, ClothingItem } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File)) return jsonError("Please upload an image file.");
    const confirmedClassification = form.get("classification");
    const parsedClassification = typeof confirmedClassification === "string"
      ? normalizeClassification(JSON.parse(confirmedClassification))
      : null;
    const originalClassificationValue = form.get("originalClassification");
    const originalClassification: ClothingClassification | null = typeof originalClassificationValue === "string"
      ? normalizeClassification(JSON.parse(originalClassificationValue))
      : null;
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = path.extname(file.name) || ".jpg";
    const fileName = `${createId("upload")}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const uploadPath = path.join(uploadDir, fileName);
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(uploadPath, buffer);
    const imageUrl = `/uploads/${fileName}`;
    const base64Image = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
    const classification = parsedClassification || await classifyClothingImage({ base64Image, fileName: file.name });
    const now = new Date().toISOString();
    const item: ClothingItem = {
      id: createId("clothing"),
      userId: demoUserId,
      imageUrl,
      sourceType: "upload",
      sourceUrl: null,
      originalClassification,
      ...classification,
      createdAt: now,
      updatedAt: now,
    };
    await updateDb((db) => {
      db.clothingItems.push(item);
      const log = createClassificationCorrectionLog({
        clothingItemId: item.id,
        userId: demoUserId,
        sourceType: item.sourceType,
        sourceUrl: item.sourceUrl,
        originalClassification,
        confirmedClassification: item,
        createdAt: now,
      });
      if (log) db.classificationCorrections.push(log);
    });
    return Response.json(item, { status: 201 });
  } catch {
    return jsonError("Image classification failed", 500);
  }
}
