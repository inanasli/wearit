"use client";

import { useEffect, useState } from "react";
import AddClothingForm from "@/components/AddClothingForm";
import ClothingCard from "@/components/ClothingCard";
import { ClothingItem } from "@/types/clothing";

export default function WardrobePage() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClothes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clothes");
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClothes();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-black">
      <h1 className="mb-6 text-3xl font-bold text-black">Sanal Dolabım</h1>

      <AddClothingForm onAdded={fetchClothes} />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((item) => (
          <ClothingCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}