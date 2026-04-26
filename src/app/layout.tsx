import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WearIt | AI Kombin Asistanı",
  description:
    "Kıyafetlerini dijital dolaba ekle, hava durumu ve kişisel tercihlere göre kombin önerileri al.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
