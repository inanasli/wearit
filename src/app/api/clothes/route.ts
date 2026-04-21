import { NextResponse } from "next/server";
import { clothes } from "@/data/clothes";
import { ClothingItem } from "@/types/clothing";

export async function GET() {
  return NextResponse.json(clothes);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, category, color, season, imageUrl } = body;

    if (!name || !category || !color || !season || !imageUrl) {
      return NextResponse.json(
        { message: "Tüm alanlar zorunludur." },
        { status: 400 }
      );
    }

    const newItem: ClothingItem = {
      id: crypto.randomUUID(),
      name,
      category,
      color,
      season,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    clothes.unshift(newItem);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Kıyafet eklenirken hata oluştu." },
      { status: 500 }
    );
  }
}