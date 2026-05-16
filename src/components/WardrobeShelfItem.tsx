"use client";

import Image from "next/image";
import { useState } from "react";

interface WardrobeShelfItemProps {
  title: string;
  imageSrc: string;
  className: string;
  onClick: () => void;
}

export default function WardrobeShelfItem({
  title,
  imageSrc,
  className,
  onClick,
}: WardrobeShelfItemProps) {
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group absolute cursor-pointer overflow-hidden rounded-md border border-amber-100/10 bg-[#130a06]/50 text-left transition duration-300 hover:border-amber-100/38 hover:bg-[#2a170d]/60 ${className}`}
      aria-label={`${title} bölümünü aç`}
    >
      <span className="absolute inset-0 bg-gradient-to-b from-amber-100/[0.055] via-transparent to-black/18 opacity-90" />
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,218,151,0.18),transparent_45%)] opacity-55 transition group-hover:opacity-100" />
      <span className="absolute inset-x-4 top-3 h-px bg-gradient-to-r from-transparent via-amber-100/22 to-transparent" />
      <span className="absolute inset-x-5 bottom-6 h-px bg-gradient-to-r from-transparent via-black/55 to-transparent" />
      <span className="absolute inset-0 opacity-[0.13] [background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.16)_0_1px,transparent_1px_18px)]" />
      <span className="absolute inset-0 rounded-md opacity-0 shadow-[inset_0_0_46px_rgba(245,205,135,0.16),0_0_30px_rgba(245,205,135,0.18)] transition group-hover:opacity-100" />

      <span className="absolute left-1/2 top-1/2 h-16 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-100/0 blur-2xl transition group-hover:bg-amber-100/12" />

      <span className="absolute inset-x-4 bottom-8 top-5 overflow-hidden rounded-md">
        {!hasImageError ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="(max-width: 640px) 160px, 240px"
            className="object-contain object-center drop-shadow-[0_18px_22px_rgba(0,0,0,0.62)] transition duration-500 group-hover:scale-105"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-md border border-amber-100/10 bg-[radial-gradient(circle_at_50%_20%,rgba(245,205,135,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(0,0,0,0.16))] text-[0.5rem] font-black uppercase tracking-[0.18em] text-amber-100/42">
            Görsel eklenecek
          </span>
        )}
      </span>

      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-100/18 bg-black/35 px-3 py-1 text-[0.5rem] font-black uppercase tracking-[0.17em] text-amber-100/84 shadow-[0_8px_18px_rgba(0,0,0,0.35)] backdrop-blur sm:text-[0.56rem]">
        {title}
      </span>
    </button>
  );
}
