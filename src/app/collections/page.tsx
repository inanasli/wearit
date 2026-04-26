import AppShell from "@/components/AppShell";
import { collections } from "@/data/clothes";

export default function CollectionsPage() {
  return (
    <AppShell
      eyebrow="Koleksiyonlar"
      title="Dolap ve kombinlerini kullanım senaryolarına göre ayır."
      description="Koleksiyonlar, kıyafetleri ve önerilen kombinleri iş, hafta sonu veya hava durumu gibi bağlamlara göre gruplayacak temel yapıyı temsil eder."
      action={{ href: "/outfits", label: "Kombinleri Gör" }}
    >
      <section className="grid gap-5 lg:grid-cols-3">
        {collections.map((collection) => (
          <article
            key={collection.id}
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
          >
            <div
              aria-label={collection.name}
              className="h-56 bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url(${collection.coverImage})` }}
            />

            <div className="p-5">
              <h2 className="text-2xl font-black">{collection.name}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {collection.description}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f7f5f0] p-4">
                  <p className="text-xs font-bold text-zinc-500">Parça</p>
                  <p className="mt-1 text-2xl font-black">
                    {collection.itemCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f7f5f0] p-4">
                  <p className="text-xs font-bold text-zinc-500">Kombin</p>
                  <p className="mt-1 text-2xl font-black">
                    {collection.outfitCount}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {collection.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-zinc-200 bg-[#fbfaf7] px-3 py-2 text-sm font-semibold text-zinc-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
