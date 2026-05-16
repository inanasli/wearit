"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import WardrobeDoor from "@/components/WardrobeDoor";

interface WardrobeExperienceProps {
  onEnterApp: () => void;
}

export default function WardrobeExperience({
  onEnterApp,
}: WardrobeExperienceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const touchStartY = useRef<number | null>(null);

  const openWardrobe = () => {
    setIsOpen(true);
  };

  const handleWheel = (event: React.WheelEvent<HTMLElement>) => {
    if (event.deltaY > 18) {
      openWardrobe();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStartY.current === null) {
      return;
    }

    const currentY = event.touches[0]?.clientY ?? touchStartY.current;
    if (touchStartY.current - currentY > 24) {
      openWardrobe();
    }
  };

  return (
    <section
      className="relative flex h-screen overflow-hidden bg-[#070605] text-stone-50"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(231,184,119,0.2),transparent_24%),radial-gradient(circle_at_50%_56%,rgba(120,68,34,0.18),transparent_35%),linear-gradient(180deg,#11100f_0%,#070605_66%,#130b08_100%)]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,.65)_0.7px,transparent_0.7px)] [background-size:11px_11px]" />
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,transparent_0%,rgba(0,0,0,0.28)_52%,rgba(0,0,0,0.9)_100%)]"
        animate={{ opacity: isOpen ? 0.78 : 0.38 }}
        transition={{ duration: 0.9 }}
      />

      <div className="relative z-10 flex h-screen w-full flex-col">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
          <Link href="/" className="text-2xl font-black tracking-tight">
            WearIt
          </Link>
          <button
            type="button"
            onClick={isOpen ? onEnterApp : openWardrobe}
            className="rounded-full border border-stone-100/20 bg-white/10 px-4 py-2 text-sm font-bold text-stone-100 backdrop-blur transition hover:border-amber-100/60 hover:bg-white/15"
          >
            {isOpen ? "Dolabıma Git" : "Dolabı Aç"}
          </button>
        </nav>

        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-5 pb-8 sm:px-8 lg:px-10">
          <motion.div
            className="mb-4 max-w-xl text-center"
            animate={{
              opacity: isOpen ? 0 : 1,
              y: isOpen ? -18 : 0,
              height: isOpen ? 0 : "auto",
              marginBottom: isOpen ? 0 : 16,
            }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <p className="mx-auto mb-3 inline-flex rounded-full border border-amber-100/20 bg-amber-100/10 px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.22em] text-amber-100">
              Private digital wardrobe
            </p>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              Gardırobunu aç.
            </h1>
          </motion.div>

          <motion.div
            className="relative w-full"
            animate={{
              scale: isOpen ? 1.1 : 0.95,
              y: isOpen ? -10 : 0,
            }}
            transition={{ duration: 1.15, ease: [0.2, 0.82, 0.22, 1] }}
          >
            <WardrobeDoor isOpen={isOpen} />
          </motion.div>

          <motion.div
            className="relative z-30 mt-7 flex flex-col items-center gap-3 sm:flex-row"
            animate={{ y: isOpen ? -8 : 0 }}
            transition={{ duration: 0.45 }}
          >
            {!isOpen ? (
              <>
                <button
                  type="button"
                  onClick={openWardrobe}
                  className="rounded-full bg-amber-100 px-7 py-4 text-sm font-black text-[#1b120d] shadow-2xl shadow-amber-900/30 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Dolabı Aç
                </button>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Kaydırarak da açılır
                </span>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="rounded-full bg-amber-100 px-7 py-4 text-sm font-black text-[#1b120d] shadow-2xl shadow-amber-900/30 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Dolabıma Git
                </button>
                <Link
                  href="/add-clothing"
                  className="rounded-full border border-stone-100/25 bg-white/10 px-7 py-4 text-center text-sm font-bold text-stone-100 backdrop-blur transition hover:border-amber-100/60 hover:bg-white/15"
                >
                  Parça Ekle
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
