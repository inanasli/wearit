"use client";

import { useRouter } from "next/navigation";
import WardrobeExperience from "@/components/WardrobeExperience";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#070605] text-zinc-950">
      <WardrobeExperience onEnterApp={() => router.push("/wardrobe")} />
    </main>
  );
}
