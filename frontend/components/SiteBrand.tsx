"use client";

import Image from "next/image";
import { imageUrl } from "@/lib/api";
import { useSite } from "@/components/SiteProvider";

function BrandName({
  name,
  className = "text-lg",
  variant = "light",
}: {
  name: string;
  className?: string;
  variant?: "light" | "dark";
}) {
  const parts = name.trim().split(/\s+/);
  const primary = variant === "light" ? "text-[var(--text-primary)]" : "text-white";
  const accent = "text-[var(--accent-primary)]";

  if (parts.length >= 2) {
    const last = parts.pop()!;
    return (
      <span className={`${className} font-bold tracking-tight`}>
        <span className={primary}>{parts.join(" ")}</span>{" "}
        <span className={accent}>{last}</span>
      </span>
    );
  }
  return <span className={`${className} font-bold tracking-tight ${primary}`}>{name}</span>;
}

/** Logo + nom depuis Admin → Paramètres (brand). */
export default function SiteBrand({
  compact = false,
  variant = "light",
}: {
  compact?: boolean;
  /** light = header clair (texte sombre) ; dark = fond sombre (footer / ancien header) */
  variant?: "light" | "dark";
}) {
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
          className="flex items-center justify-center rounded-full text-white"
          style={{
            width: size,
            height: size,
            background: "var(--accent-primary)",
          }}
        >
          <svg viewBox="0 0 24 24" className={compact ? "h-4 w-4" : "h-5 w-5"} fill="currentColor">
            <path d="M12 2.5 13.9 8.2H20l-4.9 3.6 1.9 5.7L12 14l-5 3.5 1.9-5.7L4 8.2h6.1L12 2.5Z" />
          </svg>
        </span>
      )}
      <BrandName name={site.name} className={compact ? "text-base" : "text-lg"} variant={variant} />
    </span>
  );
}
