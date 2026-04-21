import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-black">
          Akıllı Gardırop
        </h1>

        <Link
          href="/wardrobe"
          className="rounded bg-black px-6 py-3 text-white"
        >
          Dolabı Aç
        </Link>
      </div>
    </main>
  );
}