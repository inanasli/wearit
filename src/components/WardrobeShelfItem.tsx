"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface WardrobeShelfItemProps {
  title: string;
  subtitle: string;
  imageSrc: string;
  href: string;
  className: string;
}

export default function WardrobeShelfItem({
  title,
  subtitle,
  imageSrc,
  href,
  className,
}: WardrobeShelfItemProps) {
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <Link
      href={href}
      className={`group absolute overflow-hidden rounded-lg border border-amber-100/12 bg-[#130a06]/58 text-left transition duration-300 hover:-translate-y-0.5 hover:border-amber-100/42 hover:bg-[#2a170d]/72 ${className}`}
      aria-label={`${title} kategorisine git`}
    >
      <span className="absolute inset-0 bg-gradient-to-b from-amber-100/[0.08] via-transparent to-black/22" />
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,218,151,0.2),transparent_46%)] opacity-60 transition group-hover:opacity-100" />
      <span className="absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.14)_0_1px,transparent_1px_18px)]" />

      <span className="absolute inset-x-3 bottom-12 top-3 overflow-hidden rounded-md">
        {!hasImageError ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="(max-width: 640px) 150px, 220px"
            className="object-contain object-center drop-shadow-[0_18px_22px_rgba(0,0,0,0.62)] transition duration-500 group-hover:scale-105"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-md border border-amber-100/10 bg-black/20 text-[0.5rem] font-black uppercase tracking-[0.18em] text-amber-100/48">
            Kategori
          </span>
        )}
      </span>

      <span className="absolute inset-x-2 bottom-2 rounded-md border border-amber-100/14 bg-black/42 px-2.5 py-1.5 text-center shadow-[0_8px_18px_rgba(0,0,0,0.35)] backdrop-blur">
        <span className="block text-[0.58rem] font-black uppercase tracking-[0.14em] text-amber-100 sm:text-[0.64rem]">
          {title}
        </span>
        <span className="mt-0.5 block text-[0.46rem] font-bold text-amber-100/58 sm:text-[0.5rem]">
          {subtitle}
        </span>
      </span>
    </Link>
  );
}
