import AppShell from "@/components/AppShell";
import ClothingCard from "@/components/ClothingCard";
import { clothes } from "@/data/clothes";

const stats = [
  { label: "Toplam parça", value: clothes.length },
  { label: "Kategori", value: new Set(clothes.map((item) => item.category)).size },
  { label: "Tarz", value: new Set(clothes.map((item) => item.style)).size },
];

export default function WardrobePage() {
  return (
    <AppShell
      eyebrow="Dijital dolap"
      title="Kıyafetlerini düzenli ve akıllı bir dolapta gör."
      description="Mock dolabındaki parçalar kategori, renk, mevsim, tarz ve görsel alanlarıyla listelenir. Sonraki adımda burası gerçek kullanıcı verisiyle beslenecek."
      action={{ href: "/add-item", label: "Kıyafet Ekle" }}
    >
      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-bold text-zinc-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-black text-zinc-950">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {clothes.map((item) => (
          <ClothingCard key={item.id} item={item} />
        ))}
      </section>
    </AppShell>
  );
}
