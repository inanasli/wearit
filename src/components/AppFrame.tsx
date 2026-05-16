"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/">
          Wear It
        </Link>
        <nav>
          <Link href="/add-clothing">Kıyafet Ekle</Link>
          <Link href="/wardrobe">Dijital Dolap</Link>
          <Link href="/recommend">Öneri Al</Link>
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </>
  );
}
