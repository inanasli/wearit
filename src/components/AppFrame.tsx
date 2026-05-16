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
          <Link href="/add-clothing">Add Clothing</Link>
          <Link href="/wardrobe">Wardrobe</Link>
          <Link href="/outfits">Outfits</Link>
          <Link href="/recommend">Recommend</Link>
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </>
  );
}
