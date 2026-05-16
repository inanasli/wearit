import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wear It MVP",
  description: "Wardrobe and outfit recommendation MVP",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link className="brand" href="/">Wear It</Link>
          <nav>
            <Link href="/add-clothing">Add Clothing</Link>
            <Link href="/wardrobe">Wardrobe</Link>
            <Link href="/outfits">Outfits</Link>
            <Link href="/recommend">Recommend</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
