import AppShell from "@/components/AppShell";
import AddClothingForm from "@/components/AddClothingForm";

export default function AddItemPage() {
  return (
    <AppShell
      eyebrow="Kıyafet ekle"
      title="Yeni parçanı dijital dolaba hazırla."
      description="Şimdilik kayıt işlemi mock çalışır. Form yapısı, ileride fotoğraf yükleme ve AI kıyafet tanıma akışına bağlanacak şekilde düzenlendi."
      action={{ href: "/wardrobe", label: "Dolabı Gör" }}
    >
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <AddClothingForm />

        <aside className="rounded-2xl border border-zinc-200 bg-zinc-950 p-5 text-white shadow-xl shadow-zinc-900/10">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">
            Yakında
          </p>
          <h2 className="mt-3 text-2xl font-black">Fotoğrafla tanıma akışı</h2>
          <div className="mt-6 space-y-3">
            {[
              "Görselden kategori ve renk tahmini",
              "Mevsim ve tarz etiketi önerisi",
              "Benzer parçaları ayırt etme",
              "Kombinlerde tekrar kullanım kontrolü",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-semibold text-zinc-100"
              >
                {item}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
