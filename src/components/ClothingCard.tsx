import { ClothingItem } from "@/types/clothing";

interface ClothingCardProps {
  item: ClothingItem;
}

export default function ClothingCard({ item }: ClothingCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div
        aria-label={item.name}
        className="h-64 bg-cover bg-center"
        role="img"
        style={{ backgroundImage: `url(${item.imageUrl})` }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-black text-zinc-950">{item.name}</h3>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-700">
            {item.style}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-xl bg-[#f7f5f0] p-3">
            <p className="text-xs font-bold text-zinc-500">Kategori</p>
            <p className="font-black text-zinc-900">{item.category}</p>
          </div>
          <div className="rounded-xl bg-[#f7f5f0] p-3">
            <p className="text-xs font-bold text-zinc-500">Renk</p>
            <p className="font-black text-zinc-900">{item.color}</p>
          </div>
          <div className="rounded-xl bg-[#f7f5f0] p-3">
            <p className="text-xs font-bold text-zinc-500">Mevsim</p>
            <p className="font-black text-zinc-900">{item.season}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
