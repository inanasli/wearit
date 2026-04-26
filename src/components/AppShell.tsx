import Link from "next/link";

const navItems = [
  { href: "/wardrobe", label: "Dolap" },
  { href: "/add-item", label: "Kıyafet Ekle" },
  { href: "/outfits", label: "Kombinler" },
  { href: "/collections", label: "Koleksiyonlar" },
];

interface AppShellProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: {
    href: string;
    label: string;
  };
  children: React.ReactNode;
}

export default function AppShell({
  eyebrow,
  title,
  description,
  action,
  children,
}: AppShellProps) {
  return (
    <main className="min-h-screen bg-[#f7f5f0] text-zinc-950">
      <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <nav className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight">
            WearIt
          </Link>
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-bold text-zinc-700 shadow-sm transition hover:border-zinc-950 hover:text-zinc-950"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <header className="flex flex-col gap-5 py-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-700">
              {description}
            </p>
          </div>

          {action && (
            <Link
              href={action.href}
              className="rounded-full bg-zinc-950 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-zinc-900/15 transition hover:bg-zinc-800"
            >
              {action.label}
            </Link>
          )}
        </header>

        {children}
      </div>
    </main>
  );
}
