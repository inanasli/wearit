"use client";

import { useState } from "react";

interface AddClothingFormProps {
  onAdded: () => void;
}

export default function AddClothingForm({ onAdded }: AddClothingFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Tshirt",
    color: "",
    season: "All",
    imageUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/clothes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Bir hata oluştu.");
        return;
      }

      setMessage("Kıyafet başarıyla eklendi.");
      setFormData({
        name: "",
        category: "Tshirt",
        color: "",
        season: "All",
        imageUrl: "",
      });

      onAdded();
    } catch (error) {
      setMessage("Sunucuya bağlanırken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-gray-300 bg-white p-6 shadow-md"
    >
      <h2 className="text-xl font-bold text-black">Yeni Kıyafet Ekle</h2>

      <input
        type="text"
        name="name"
        placeholder="Örn: Beyaz Basic Tişört"
        value={formData.name}
        onChange={handleChange}
        className="w-full rounded border border-gray-300 p-2 text-black placeholder:text-gray-500"
      />

      <input
        type="text"
        name="color"
        placeholder="Örn: Beyaz"
        value={formData.color}
        onChange={handleChange}
        className="w-full rounded border border-gray-300 p-2 text-black placeholder:text-gray-500"
      />

      <input
        type="text"
        name="imageUrl"
        placeholder="Görsel URL gir"
        value={formData.imageUrl}
        onChange={handleChange}
        className="w-full rounded border border-gray-300 p-2 text-black placeholder:text-gray-500"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-black p-2 text-white"
      >
        {loading ? "Ekleniyor..." : "Ekle"}
      </button>

      {message && <p className="text-sm text-black">{message}</p>}
    </form>
  );
}