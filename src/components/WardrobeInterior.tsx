"use client";

import { motion } from "framer-motion";
import WardrobeShelfItem, { type WardrobeShelfKind } from "@/components/WardrobeShelfItem";

interface WardrobeInteriorProps {
  isOpen: boolean;
}

const shelves: Array<{
  title: string;
  subtitle: string;
  kind: WardrobeShelfKind;
  href: string;
  className: string;
}> = [
  {
    title: "Üst Giyim",
    subtitle: "tişört, gömlek, kazak",
    kind: "upper",
    href: "/wardrobe?category=upper",
    className: "left-[9%] top-[17%] h-[25%] w-[38%]",
  },
  {
    title: "Dış Giyim",
    subtitle: "ceket, kaban, blazer",
    kind: "outerwear",
    href: "/wardrobe?category=outerwear",
    className: "right-[9%] top-[17%] h-[25%] w-[38%]",
  },
  {
    title: "Alt Giyim",
    subtitle: "pantolon, jean, etek",
    kind: "lower",
    href: "/wardrobe?category=lower",
    className: "left-[9%] top-[48%] h-[21%] w-[38%]",
  },
  {
    title: "Ayakkabılar",
    subtitle: "sneaker, bot, loafer",
    kind: "shoes",
    href: "/wardrobe?category=shoes",
    className: "right-[9%] top-[48%] h-[21%] w-[38%]",
  },
  {
    title: "Çanta & Aksesuar",
    subtitle: "çanta, şapka, takı",
    kind: "accessory",
    href: "/wardrobe?category=bag",
    className: "left-[9%] right-[9%] bottom-[8%] h-[17%]",
  },
];

export default function WardrobeInterior({ isOpen }: WardrobeInteriorProps) {
  return (
    <motion.div
      className="absolute inset-[34px] overflow-hidden rounded-t-[8.6rem] rounded-b-[1.2rem] border border-amber-100/12 bg-[linear-gradient(180deg,#170d09_0%,#2b170e_54%,#120806_100%)] shadow-inner shadow-black/80 sm:inset-[42px] sm:rounded-t-[10.2rem]"
      initial={false}
      animate={{
        opacity: isOpen ? 1 : 0.1,
        scale: isOpen ? 1 : 0.98,
        filter: isOpen ? "brightness(1.06)" : "brightness(0.42)",
      }}
      transition={{ duration: 0.9, ease: "easeOut", delay: isOpen ? 0.18 : 0 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,220,154,0.25),transparent_26%),linear-gradient(90deg,rgba(255,255,255,0.045),transparent_18%,transparent_82%,rgba(0,0,0,0.28))]" />
      <div className="absolute inset-0 opacity-[0.13] [background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.1)_0_1px,transparent_1px_22px)]" />

      <div className="absolute left-[7%] right-[7%] top-[45%] h-px bg-amber-100/18" />
      <div className="absolute left-[7%] right-[7%] top-[72%] h-px bg-amber-100/15" />
      <div className="absolute left-1/2 top-[15%] h-[56%] w-px -translate-x-1/2 bg-amber-100/12" />

      {shelves.map((shelf, index) => (
        <motion.div
          key={shelf.title}
          initial={false}
          animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 10 }}
          transition={{ duration: 0.5, delay: isOpen ? 0.18 + index * 0.05 : 0 }}
        >
          <WardrobeShelfItem {...shelf} />
        </motion.div>
      ))}
    </motion.div>
  );
}
