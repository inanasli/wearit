import AppShell from "@/components/AppShell";
import { outfits } from "@/data/clothes";

export default function OutfitsPage() {
  return (
    <AppShell
      eyebrow="Kombin önerileri"
      title="Hava durumuna ve stile göre hazırlanmış mock kombinler."
      description="Bu liste gerçek AI çıktısı değil; ürünün kombin öneri deneyimini göstermek için mock veriyle hazırlanmış temel sayfa yapısıdır."
      action={{ href: "/add-item", label: "Yeni Parça Ekle" }}
    >
      <section className="grid gap-5 lg:grid-cols-3">
        {outfits.map((outfit) => (
          <article
            key={outfit.id}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.14em] text-rose-700">
                  {outfit.occasion}
                </p>
                <h2 className="mt-2 text-2xl font-black">{outfit.name}</h2>
                <p className="mt-1 text-sm font-semibold text-zinc-500">
                  {outfit.weather}
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800">
                %{outfit.matchScore}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {outfit.items.map((item) => (
                <div
                  key={item.id}
                  aria-label={item.name}
                  className="aspect-[3/4] rounded-2xl bg-cover bg-center"
                  role="img"
                  style={{ backgroundImage: `url(${item.imageUrl})` }}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {outfit.items.map((item) => (
                <span
                  key={`${outfit.id}-${item.id}`}
                  className="rounded-full border border-zinc-200 bg-[#fbfaf7] px-3 py-2 text-sm font-semibold text-zinc-700"
                >
                  {item.name}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
