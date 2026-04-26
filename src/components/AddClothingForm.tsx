"use client";

import { useState } from "react";

const categories = [
  "Tshirt",
  "Shirt",
  "Pants",
  "Skirt",
  "Dress",
  "Jacket",
  "Shoes",
  "Bag",
  "Accessory",
];

const seasons = ["Spring", "Summer", "Autumn", "Winter", "All"];
const styles = [
  "Minimal",
  "Casual",
  "Smart Casual",
  "Sport",
  "Elegant",
  "Streetwear",
];

interface AddClothingFormProps {
  onAdded?: () => void;
}

export default function AddClothingForm({ onAdded }: AddClothingFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Tshirt",
    color: "",
    season: "All",
    style: "Casual",
    imageUrl: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(
      "Mock kayıt hazırlandı. Veritabanı bağlandığında bu parça dolabına eklenecek."
    );
    onAdded?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-black text-zinc-700">Kıyafet adı</span>
          <input
            type="text"
            name="name"
            placeholder="Beyaz basic tişört"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-xl border border-zinc-300 bg-[#fbfaf7] px-4 py-3 text-sm font-semibold outline-none transition placeholder:text-zinc-400 focus:border-zinc-950"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-zinc-700">Kategori</span>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full rounded-xl border border-zinc-300 bg-[#fbfaf7] px-4 py-3 text-sm font-semibold outline-none transition focus:border-zinc-950"
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-zinc-700">Renk</span>
          <input
            type="text"
            name="color"
            placeholder="Krem, siyah, lacivert"
            value={formData.color}
            onChange={handleChange}
            className="w-full rounded-xl border border-zinc-300 bg-[#fbfaf7] px-4 py-3 text-sm font-semibold outline-none transition placeholder:text-zinc-400 focus:border-zinc-950"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-zinc-700">Mevsim</span>
          <select
            name="season"
            value={formData.season}
            onChange={handleChange}
            className="w-full rounded-xl border border-zinc-300 bg-[#fbfaf7] px-4 py-3 text-sm font-semibold outline-none transition focus:border-zinc-950"
          >
            {seasons.map((season) => (
              <option key={season}>{season}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-zinc-700">Tarz</span>
          <select
            name="style"
            value={formData.style}
            onChange={handleChange}
            className="w-full rounded-xl border border-zinc-300 bg-[#fbfaf7] px-4 py-3 text-sm font-semibold outline-none transition focus:border-zinc-950"
          >
            {styles.map((style) => (
              <option key={style}>{style}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-black text-zinc-700">Görsel URL</span>
          <input
            type="url"
            name="imageUrl"
            placeholder="https://..."
            value={formData.imageUrl}
            onChange={handleChange}
            className="w-full rounded-xl border border-zinc-300 bg-[#fbfaf7] px-4 py-3 text-sm font-semibold outline-none transition placeholder:text-zinc-400 focus:border-zinc-950"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          className="rounded-full bg-zinc-950 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-zinc-900/15 transition hover:bg-zinc-800"
        >
          Mock Kıyafeti Hazırla
        </button>
        {message && <p className="text-sm font-semibold text-emerald-700">{message}</p>}
      </div>
    </form>
  );
}
