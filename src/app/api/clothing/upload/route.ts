import { promises as fs } from "fs";
import path from "path";
import { classifyClothingImage } from "@/lib/ai/classifyClothing";
import { demoUserId, jsonError } from "@/lib/api";
import { createId, updateDb } from "@/lib/storage/db";
import type { ClothingItem } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File)) return jsonError("Please upload an image file.");
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = path.extname(file.name) || ".jpg";
    const fileName = `${createId("upload")}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, fileName), buffer);
    const imageUrl = `/uploads/${fileName}`;
    const base64Image = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
    const classification = await classifyClothingImage({ base64Image, fileName: file.name });
    const now = new Date().toISOString();
    const item: ClothingItem = {
      id: createId("clothing"),
      userId: demoUserId,
      imageUrl,
      sourceType: "upload",
      sourceUrl: null,
      ...classification,
      createdAt: now,
      updatedAt: now,
    };
    await updateDb((db) => db.clothingItems.push(item));
    return Response.json(item, { status: 201 });
  } catch {
    return jsonError("Image classification failed", 500);
  }
}
