"use client";

import Link from "next/link";

export type WardrobeShelfKind = "upper" | "outerwear" | "lower" | "shoes" | "accessory";

interface WardrobeShelfItemProps {
  title: string;
  subtitle: string;
  kind: WardrobeShelfKind;
  href: string;
  className: string;
  imageUrls?: string[];
}

export default function WardrobeShelfItem({
  title,
  subtitle,
  kind,
  href,
  className,
  imageUrls = [],
}: WardrobeShelfItemProps) {
  return (
    <Link
      href={href}
      className={`group absolute overflow-hidden rounded-xl border border-amber-100/14 bg-[#160b06]/64 text-left transition duration-300 hover:-translate-y-0.5 hover:border-amber-100/48 hover:bg-[#2a170d]/78 ${className}`}
      aria-label={`${title} kategorisine git`}
    >
      <span className="absolute inset-0 bg-gradient-to-b from-amber-100/[0.1] via-transparent to-black/24" />
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(255,220,154,0.22),transparent_44%)] opacity-80 transition group-hover:opacity-100" />
      <span className="absolute inset-0 opacity-[0.1] [background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.15)_0_1px,transparent_1px_18px)]" />

      <span className="absolute inset-x-3 bottom-12 top-3 grid place-items-center rounded-lg bg-black/12">
        {imageUrls.length ? <WardrobePhotoStack imageUrls={imageUrls} title={title} /> : <CategoryIllustration kind={kind} />}
      </span>

      <span className="absolute inset-x-2 bottom-2 rounded-lg border border-amber-100/14 bg-black/48 px-2.5 py-1.5 text-center shadow-[0_8px_18px_rgba(0,0,0,0.35)] backdrop-blur">
        <span className="block text-[0.58rem] font-black uppercase tracking-[0.14em] text-amber-100 sm:text-[0.64rem]">
          {title}
        </span>
        <span className="mt-0.5 block text-[0.46rem] font-bold text-amber-100/62 sm:text-[0.5rem]">
          {subtitle}
        </span>
      </span>
    </Link>
  );
}

function WardrobePhotoStack({ imageUrls, title }: { imageUrls: string[]; title: string }) {
  return (
    <span className="relative grid h-full w-full grid-cols-2 gap-1.5 p-2">
      {imageUrls.slice(0, 4).map((imageUrl, index) => (
        <span
          key={`${imageUrl}-${index}`}
          className="relative overflow-hidden rounded-lg border border-amber-100/15 bg-[#f4eadb] shadow-[0_14px_18px_rgba(0,0,0,0.3)] transition duration-500 group-hover:-translate-y-0.5"
        >
          <img
            src={imageUrl}
            alt={`${title} parçası`}
            className="h-full w-full object-contain p-1.5"
          />
          <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent_50%,rgba(0,0,0,0.14))]" />
        </span>
      ))}
    </span>
  );
}

function CategoryIllustration({ kind }: { kind: WardrobeShelfKind }) {
  const common = "drop-shadow-[0_18px_22px_rgba(0,0,0,0.55)] transition duration-500 group-hover:scale-105";

  if (kind === "upper") {
    return (
      <svg viewBox="0 0 160 120" className={`h-full w-full ${common}`} role="img" aria-label="Üst giyim">
        <path d="M54 25 38 34 22 58l21 12 8-12v41h58V58l8 12 21-12-16-24-16-9-16 12H70L54 25Z" fill="#e7c48f" />
        <path d="M70 37h20l10-8 6-4 16 9 16 24-21 12-8-12v41H51V58l-8 12-21-12 16-24 16-9 6 4 10 8Z" fill="#b85f3d" opacity=".95" />
        <path d="M70 37c4 8 16 8 20 0" fill="none" stroke="#ffe6b5" strokeWidth="4" strokeLinecap="round" />
        <path d="M52 58h56M52 74h56" stroke="#7c371f" strokeWidth="3" opacity=".45" />
      </svg>
    );
  }

  if (kind === "outerwear") {
    return (
      <svg viewBox="0 0 160 120" className={`h-full w-full ${common}`} role="img" aria-label="Dış giyim">
        <path d="M58 22h44l21 18 8 68H29l8-68 21-18Z" fill="#314b42" />
        <path d="M65 22 80 51l15-29M80 51v57" fill="none" stroke="#f3d39e" strokeWidth="5" strokeLinecap="round" />
        <path d="M48 45h19M93 45h19M53 77h20M87 77h20" stroke="#8fad84" strokeWidth="5" strokeLinecap="round" />
        <path d="M39 40 24 70l19 9M121 40l15 30-19 9" fill="none" stroke="#314b42" strokeWidth="14" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "lower") {
    return (
      <svg viewBox="0 0 160 120" className={`h-full w-full ${common}`} role="img" aria-label="Alt giyim">
        <path d="M52 20h56l8 88H92L80 55l-12 53H44l8-88Z" fill="#315d7c" />
        <path d="M53 20h54v19H53z" fill="#203b51" />
        <path d="M80 39v18M66 29h28M60 108h29M71 108h29" stroke="#9bc2da" strokeWidth="4" strokeLinecap="round" opacity=".55" />
        <circle cx="80" cy="30" r="3" fill="#d6b477" />
      </svg>
    );
  }

  if (kind === "shoes") {
    return (
      <svg viewBox="0 0 160 120" className={`h-full w-full ${common}`} role="img" aria-label="Ayakkabı">
        <path d="M30 70c22 0 30-27 48-27 17 0 20 24 46 29 10 2 17 9 17 18v8H22V84c0-8 2-14 8-14Z" fill="#f2e5cf" />
        <path d="M22 91h119v9H22z" fill="#2a2522" />
        <path d="M70 51c8 8 17 14 33 15" fill="none" stroke="#a84f34" strokeWidth="5" strokeLinecap="round" />
        <path d="M72 65h32M83 57l-8 8M94 60l-8 8" stroke="#2a2522" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 160 120" className={`h-full w-full ${common}`} role="img" aria-label="Aksesuar">
      <path d="M49 46h62l10 58H39l10-58Z" fill="#9a4f35" />
      <path d="M62 48c0-18 36-18 36 0" fill="none" stroke="#e8c087" strokeWidth="8" strokeLinecap="round" />
      <path d="M49 46h62l5 25H44l5-25Z" fill="#bf6c42" />
      <circle cx="65" cy="77" r="5" fill="#f4d8a6" />
      <circle cx="95" cy="77" r="5" fill="#f4d8a6" />
    </svg>
  );
}
