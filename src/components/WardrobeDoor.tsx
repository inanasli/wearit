"use client";

import { motion } from "framer-motion";
import WardrobeInterior from "@/components/WardrobeInterior";

interface WardrobeDoorProps {
  isOpen: boolean;
}

export default function WardrobeDoor({ isOpen }: WardrobeDoorProps) {
  return (
    <motion.div
      className="relative mx-auto h-[430px] w-[300px] [perspective:1500px] sm:h-[560px] sm:w-[390px] lg:h-[640px] lg:w-[450px]"
      initial={false}
      animate={{ scale: isOpen ? 1.08 : 1, y: isOpen ? 10 : 0 }}
      transition={{ duration: 1.15, ease: [0.2, 0.82, 0.22, 1] }}
    >
      <motion.div
        className="absolute -inset-8 rounded-t-full bg-amber-200/15 blur-3xl"
        animate={{
          opacity: isOpen ? 0.74 : 0.34,
          scale: isOpen ? 1.12 : 0.94,
        }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />

      <div className="absolute inset-0 rounded-t-[11rem] rounded-b-[2rem] border border-amber-100/20 bg-[#100907] shadow-[0_48px_120px_rgba(0,0,0,0.72)] sm:rounded-t-[13rem]" />
      <div className="absolute inset-[18px] rounded-t-[10rem] rounded-b-[1.35rem] bg-[radial-gradient(circle_at_50%_18%,rgba(255,246,215,0.15),transparent_18%),linear-gradient(90deg,#1a0c07_0%,#432313_48%,#180b07_100%)] sm:rounded-t-[12rem]" />
      <div className="absolute inset-x-[42px] bottom-[40px] top-[58px] rounded-t-[8rem] border border-amber-100/15 bg-black/35 shadow-inner shadow-black/70" />

      <WardrobeInterior isOpen={isOpen} />

      <motion.div
        className="absolute left-[18px] top-[18px] h-[calc(100%-36px)] w-[calc(50%-18px)] origin-left rounded-bl-[1.35rem] rounded-tl-[10rem] border-r border-black/40 bg-[linear-gradient(104deg,#5c2a16_0%,#a46432_38%,#4b2211_68%,#1f0e08_100%)] shadow-2xl shadow-black/60 [backface-visibility:hidden] [transform-style:preserve-3d] sm:rounded-tl-[12rem]"
        animate={{
          rotateY: isOpen ? -96 : 0,
          x: isOpen ? -18 : 0,
          filter: isOpen ? "brightness(0.86)" : "brightness(1)",
        }}
        transition={{ duration: 1.25, ease: [0.2, 0.82, 0.22, 1] }}
      >
        <div className="absolute inset-4 rounded-bl-[1rem] rounded-tl-[8rem] border border-amber-100/20 sm:rounded-tl-[10rem]" />
        <div className="absolute inset-x-8 bottom-14 top-24 rounded-t-full border border-black/25 bg-black/10 shadow-inner shadow-black/30" />
        <span className="absolute right-4 top-1/2 h-3 w-3 rounded-full bg-amber-100 shadow-lg shadow-amber-200/40" />
      </motion.div>

      <motion.div
        className="absolute right-[18px] top-[18px] h-[calc(100%-36px)] w-[calc(50%-18px)] origin-right rounded-br-[1.35rem] rounded-tr-[10rem] border-l border-black/40 bg-[linear-gradient(256deg,#5a2815_0%,#aa6634_40%,#4a2111_70%,#1d0d08_100%)] shadow-2xl shadow-black/60 [backface-visibility:hidden] [transform-style:preserve-3d] sm:rounded-tr-[12rem]"
        animate={{
          rotateY: isOpen ? 96 : 0,
          x: isOpen ? 18 : 0,
          filter: isOpen ? "brightness(0.86)" : "brightness(1)",
        }}
        transition={{ duration: 1.25, ease: [0.2, 0.82, 0.22, 1] }}
      >
        <div className="absolute inset-4 rounded-br-[1rem] rounded-tr-[8rem] border border-amber-100/20 sm:rounded-tr-[10rem]" />
        <div className="absolute inset-x-8 bottom-14 top-24 rounded-t-full border border-black/25 bg-black/10 shadow-inner shadow-black/30" />
        <span className="absolute left-4 top-1/2 h-3 w-3 rounded-full bg-amber-100 shadow-lg shadow-amber-200/40" />
      </motion.div>

      <motion.div
        className="pointer-events-none absolute left-1/2 top-[6%] flex -translate-x-1/2 flex-col items-center gap-1.5 text-center"
        initial={false}
        animate={{
          opacity: isOpen ? 1 : 0,
          y: isOpen ? 0 : 10,
          scale: isOpen ? 1 : 0.96,
        }}
        transition={{ duration: 0.7, delay: 0.35 }}
      >
        <div className="h-5 w-px bg-gradient-to-b from-amber-100/0 via-amber-100/35 to-amber-100/0" />
        <p className="rounded-full border border-amber-100/16 bg-black/24 px-2.5 py-1 text-[0.46rem] font-black uppercase tracking-[0.22em] text-amber-100/78 backdrop-blur">
          Stil Arşivi
        </p>
      </motion.div>
    </motion.div>
  );
}
