import Link from "next/link";

const features = [
  {
    title: "Dijital Dolap",
    description:
      "Kıyafetlerini kategori, renk, tarz ve mevsim etiketleriyle düzenli bir gardıropta topla.",
    accent: "bg-emerald-500",
  },
  {
    title: "AI Kıyafet Tanıma",
    description:
      "Fotoğrafla eklediğin parçaların türünü, rengini ve stil ipuçlarını otomatik algılayan akıllı yapı.",
    accent: "bg-indigo-500",
  },
  {
    title: "Hava Durumuna Göre Kombin",
    description:
      "Sıcaklık, yağmur ve mevsim bilgisini dikkate alan günlük kombin önerileri hazırla.",
    accent: "bg-sky-500",
  },
  {
    title: "Kişiselleştirilmiş Öneriler",
    description:
      "Rahatlık, renk tercihleri, ortam ve tekrar giyme kısıtlarına göre daha isabetli seçimler al.",
    accent: "bg-rose-500",
  },
  {
    title: "Kombin Koleksiyonları",
    description:
      "İş, hafta sonu, akşam planı veya seyahat için favori kombinlerini koleksiyonlara ayır.",
    accent: "bg-amber-500",
  },
];

const flow = [
  "Kıyafet ekle",
  "Dolabını oluştur",
  "Tercihini seç",
  "Kombin önerisi al",
];

const outfits = [
  {
    name: "Yağmurlu Ofis",
    weather: "14°C, hafif yağmur",
    match: "%92 uyum",
    pieces: ["Trençkot", "Beyaz gömlek", "Lacivert pantolon", "Loafer"],
    palette: ["#111827", "#f8fafc", "#1d4ed8", "#a16207"],
  },
  {
    name: "Hafta Sonu Kahve",
    weather: "21°C, parçalı bulutlu",
    match: "%88 uyum",
    pieces: ["Oversize tişört", "Açık jean", "Sneaker", "Kanvas çanta"],
    palette: ["#fb7185", "#93c5fd", "#f9fafb", "#16a34a"],
  },
  {
    name: "Akşam Planı",
    weather: "18°C, serin",
    match: "%95 uyum",
    pieces: ["Siyah ceket", "Saten bluz", "Düz kesim pantolon", "Bot"],
    palette: ["#030712", "#eab308", "#4b5563", "#7c2d12"],
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-zinc-950">
      <section className="mx-auto flex min-h-[88vh] w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">
            WearIt
          </Link>
          <Link
            href="/wardrobe"
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-950"
          >
            Dolabımı Oluştur
          </Link>
        </nav>

        <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1fr_0.9fr] lg:py-10">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm">
              Yapay zeka destekli kombin asistanı
            </p>
            <h1 className="text-5xl font-black leading-[1.02] tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl">
              Dolabını dijitalleştir, kombinlerini akıllı önerilerle oluştur
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-700">
              WearIt, kıyafetlerini tanıyan, dolabını düzenleyen ve hava
              durumuna göre sana uygun kombinleri seçen kişisel stil
              yardımcın olur.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/wardrobe"
                className="rounded-full bg-zinc-950 px-7 py-4 text-center text-sm font-bold text-white shadow-lg shadow-zinc-900/15 transition hover:bg-zinc-800"
              >
                Dolabımı Oluştur
              </Link>
              <a
                href="#demo"
                className="rounded-full border border-zinc-300 bg-white px-7 py-4 text-center text-sm font-bold text-zinc-900 shadow-sm transition hover:border-zinc-950"
              >
                Demo kombinleri gör
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-4 shadow-2xl shadow-zinc-900/10">
              <div className="rounded-[1.5rem] bg-zinc-950 p-4 text-white">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Bugünün önerisi</p>
                    <h2 className="text-2xl font-black">Smart Casual</h2>
                  </div>
                  <div className="rounded-full bg-emerald-400 px-3 py-1 text-sm font-black text-zinc-950">
                    %94
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Üst", "Krem triko", "bg-stone-200 text-zinc-950"],
                    ["Alt", "Antrasit pantolon", "bg-zinc-700"],
                    ["Dış", "Yeşil ceket", "bg-emerald-700"],
                    ["Ayakkabı", "Beyaz sneaker", "bg-slate-100 text-zinc-950"],
                  ].map(([label, item, color]) => (
                    <div
                      key={item}
                      className={`${color} flex aspect-[4/5] flex-col justify-between rounded-2xl p-4`}
                    >
                      <span className="text-xs font-bold uppercase opacity-70">
                        {label}
                      </span>
                      <span className="text-base font-black">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-zinc-400">Hava</p>
                    <p className="font-bold">17°C</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-zinc-400">Tarz</p>
                    <p className="font-bold">Minimal</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-zinc-400">Tekrar</p>
                    <p className="font-bold">Uygun</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
              Özellikler
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Dolabını daha akıllı, sabahlarını daha kolay hale getir.
            </h2>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-zinc-200 bg-[#fbfaf7] p-5"
              >
                <div className={`mb-5 h-2 w-12 rounded-full ${feature.accent}`} />
                <h3 className="text-lg font-black">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f5f0] py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-indigo-700">
                Kullanım akışı
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Birkaç adımda her güne hazır kombin.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {flow.map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="mt-5 text-base font-black">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-rose-700">
                Demo kombinler
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                WearIt’in oluşturabileceği mock öneriler.
              </h2>
            </div>
            <Link
              href="/wardrobe"
              className="rounded-full bg-zinc-950 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-zinc-800"
            >
              Dolabımı Oluştur
            </Link>
          </div>

          <div className="mt-9 grid gap-5 lg:grid-cols-3">
            {outfits.map((outfit) => (
              <article
                key={outfit.name}
                className="rounded-2xl border border-zinc-200 bg-[#fbfaf7] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black">{outfit.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-zinc-500">
                      {outfit.weather}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800">
                    {outfit.match}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-4 gap-2">
                  {outfit.palette.map((color) => (
                    <span
                      key={color}
                      className="h-14 rounded-xl border border-black/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {outfit.pieces.map((piece) => (
                    <span
                      key={piece}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700"
                    >
                      {piece}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
