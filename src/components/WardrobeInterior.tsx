"use client";

import { motion } from "framer-motion";
import WardrobeShelfItem from "@/components/WardrobeShelfItem";

interface WardrobeInteriorProps {
  isOpen: boolean;
}

const shelves = [
  {
    title: "Kazaklar",
    imageSrc: "/wardrobe/categories/sweater.png",
    className: "left-[12%] right-[12%] top-[18%] h-[14%]",
  },
  {
    title: "Tişörtler",
    imageSrc: "/wardrobe/categories/tshirt.png",
    className: "left-[10%] top-[37%] h-[22%] w-[29%]",
  },
  {
    title: "Ceketler / Elbiseler",
    imageSrc: "/wardrobe/categories/jacket.png",
    className: "left-[42%] top-[37%] h-[22%] w-[48%]",
  },
  {
    title: "Aksesuarlar / Takılar",
    imageSrc: "/wardrobe/categories/jewelry.png",
    className: "left-[10%] top-[64%] h-[13%] w-[80%]",
  },
  {
    title: "Pantolonlar",
    imageSrc: "/wardrobe/categories/pants.png",
    className: "left-[10%] bottom-[12%] h-[16%] w-[34%]",
  },
  {
    title: "Ayakkabılar",
    imageSrc: "/wardrobe/categories/shoes.png",
    className: "left-[47%] bottom-[12%] h-[16%] w-[22%]",
  },
  {
    title: "Çanta",
    imageSrc: "/wardrobe/categories/bag.png",
    className: "right-[10%] bottom-[12%] h-[16%] w-[18%]",
  },
];

export default function WardrobeInterior({ isOpen }: WardrobeInteriorProps) {
  const handleShelfClick = (title: string) => {
    console.log(title);
  };

  return (
    <motion.div
      className="absolute inset-[34px] overflow-hidden rounded-t-[8.6rem] rounded-b-[1.2rem] border border-amber-100/12 bg-[linear-gradient(180deg,#170d09_0%,#2b170e_52%,#120806_100%)] shadow-inner shadow-black/80 sm:inset-[42px] sm:rounded-t-[10.2rem]"
      initial={false}
      animate={{
        opacity: isOpen ? 1 : 0.1,
        scale: isOpen ? 1 : 0.98,
        filter: isOpen ? "brightness(1.06)" : "brightness(0.42)",
      }}
      transition={{ duration: 0.9, ease: "easeOut", delay: isOpen ? 0.18 : 0 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(255,220,154,0.24),transparent_25%),linear-gradient(90deg,rgba(255,255,255,0.045),transparent_18%,transparent_82%,rgba(0,0,0,0.25))]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.1)_0_1px,transparent_1px_21px)]" />

      <div className="absolute left-[9%] right-[9%] top-[33%] h-px bg-amber-100/18" />
      <div className="absolute left-[9%] right-[9%] top-[62%] h-px bg-amber-100/18" />
      <div className="absolute left-[39%] top-[33%] h-[44%] w-px bg-amber-100/14" />
      <div className="absolute right-[8%] top-[33%] h-[44%] w-px bg-amber-100/14" />
      <div className="absolute left-[8%] right-[8%] bottom-[30%] h-px bg-amber-100/14" />

      {shelves.map((shelf, index) => (
        <motion.div
          key={shelf.title}
          initial={false}
          animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 10 }}
          transition={{ duration: 0.5, delay: isOpen ? 0.18 + index * 0.05 : 0 }}
        >
          <WardrobeShelfItem
            title={shelf.title}
            imageSrc={shelf.imageSrc}
            className={shelf.className}
            onClick={() => handleShelfClick(shelf.title)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
