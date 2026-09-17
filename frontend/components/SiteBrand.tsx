"use client";

import Image from "next/image";
import { imageUrl } from "@/lib/api";
import { useSite } from "@/components/SiteProvider";

function BrandName({ name, className = "text-lg" }: { name: string; className?: string }) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const last = parts.pop()!;
    return (
      <span className={`${className} font-bold tracking-tight`}>
        <span className="text-white">{parts.join(" ")}</span>{" "}
        <span className="text-brand-orange">{last}</span>
      </span>
    );
  }
  return <span className={`${className} font-bold tracking-tight text-white`}>{name}</span>;
}

/** Logo + nom depuis Admin → Paramètres (brand). */
export default function SiteBrand({ compact = false }: { compact?: boolean }) {
  const site = useSite();
  const logoSrc = site.logoUrl ? imageUrl(site.logoUrl) : "";
  const size = compact ? 36 : 40;

  return (
    <span className="flex shrink-0 items-center gap-2">
      {logoSrc ? (
        <span
          className="relative overflow-hidden rounded-full bg-white"
          style={{ width: size, height: size }}
        >
          <Image
            src={logoSrc}
            alt={site.name}
            width={size}
            height={size}
            className="h-full w-full object-cover"
            unoptimized
          />
        </span>
      ) : (
        <span
          className="flex items-center justify-center rounded-full bg-brand-orange text-white"
          style={{ width: size, height: size }}
        >
          <svg viewBox="0 0 24 24" className={compact ? "h-4 w-4" : "h-5 w-5"} fill="currentColor">
            <path d="M12 3 3 10h2v9h5v-5h4v5h5v-9h2L12 3Z" />
          </svg>
        </span>
      )}
      <BrandName name={site.name} className={compact ? "text-base" : "text-lg"} />
    </span>
  );
}
