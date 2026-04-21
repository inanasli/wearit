import { ClothingItem } from "@/types/clothing";

interface ClothingCardProps {
  item: ClothingItem;
}

export default function ClothingCard({ item }: ClothingCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <img
        src={item.imageUrl}
        alt={item.name}
        className="h-64 w-full object-cover"
      />

      <div className="p-4">
        <h3 className="text-lg font-semibold text-black">{item.name}</h3>
        <p className="mt-1 text-sm text-gray-700">Kategori: {item.category}</p>
        <p className="text-sm text-gray-700">Renk: {item.color}</p>
        <p className="text-sm text-gray-700">Mevsim: {item.season}</p>
      </div>
    </div>
  );
}