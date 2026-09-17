"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

export type ServiceCardData = {
  id: number;
  title: string;
  slug: string;
  icon?: string | null;
  icon_image?: string | null;
  short_description?: string | null;
  cta_label?: string | null;
};

/** Icônes métier meubles / électroménager */
export const SERVICE_ICON_KEYS = [
  "delivery",
  "install",
  "repair",
  "maintenance",
  "warranty",
  "tradein",
  "finance",
  "support",
  "fridge",
  "washer",
  "sofa",
] as const;

const ICONS: Record<string, ReactNode> = {
  // Livraison
  delivery: (
    <>
      <path d="M3 8h11v9H3z" />
      <path d="M14 11h4l3 3v3h-7v-6Z" />
      <circle cx="7" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
      <path d="M7 8V6h5" />
    </>
  ),
  truck: null as unknown as ReactNode, // alias set below
  // Installation / mise en service
  install: (
    <>
      <rect x="5" y="4" width="14" height="12" rx="1.5" />
      <path d="M9 20h6M12 16v4" />
      <path d="M8 9h3M13 9h3M8 12h8" />
      <circle cx="18" cy="6" r="3" fill="none" />
      <path d="m16.8 6 0.8 0.8 1.6-1.6" />
    </>
  ),
  // Réparation SAV
  repair: (
    <>
      <rect x="6" y="3" width="12" height="14" rx="1.5" />
      <path d="M9 7h6M9 10h6M9 13h4" />
      <path d="M10 20h4" />
      <path d="m15 16 4 4M19 16l-4 4" />
    </>
  ),
  wrench: null as unknown as ReactNode,
  // Maintenance / entretien
  maintenance: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
      <path d="M12 8.5c2 0 3.5 1.2 3.5 2.5S14 13.5 12 13.5" />
    </>
  ),
  tools: null as unknown as ReactNode,
  // Garantie
  warranty: (
    <>
      <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  shield: null as unknown as ReactNode,
  // Reprise ancien appareil
  tradein: (
    <>
      <rect x="3" y="5" width="8" height="10" rx="1" />
      <rect x="13" y="9" width="8" height="10" rx="1" />
      <path d="M8 18h3M16 7h3" />
      <path d="M11 8h2l-1 2h2M13 16H11l1-2h-2" />
    </>
  ),
  recycle: null as unknown as ReactNode,
  // Financement
  finance: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 14h2M12 14h4" />
      <circle cx="17" cy="7.5" r="0.8" />
    </>
  ),
  wallet: null as unknown as ReactNode,
  // Support / hotline
  support: (
    <>
      <path d="M5 10a7 7 0 0 1 14 0v2" />
      <path d="M5 12v3a2 2 0 0 0 2 2h1v-5H5Zm14 0v3a2 2 0 0 1-2 2h-1v-5h3Z" />
      <path d="M10 19h4M12 19v2" />
    </>
  ),
  headset: null as unknown as ReactNode,
  // Motifs catalogue
  fridge: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="1.5" />
      <path d="M7 11h10" />
      <path d="M9.5 5.5v2M9.5 14v3" />
    </>
  ),
  washer: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="13" r="5" />
      <circle cx="12" cy="13" r="2.5" />
      <circle cx="8" cy="6" r="0.8" />
      <circle cx="11" cy="6" r="0.8" />
    </>
  ),
  sofa: (
    <>
      <path d="M4 13v5h2v-2h12v2h2v-5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2Z" />
      <path d="M6 11V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
      <path d="M8 18v1M16 18v1" />
    </>
  ),
  ac: (
    <>
      <rect x="3" y="5" width="18" height="8" rx="1.5" />
      <path d="M7 17c1 .8 2 .8 3 0s2-.8 3 0 2 .8 3 0 2-.8 3 0" />
      <path d="M8 9h8" />
    </>
  ),
  desk: (
    <>
      <path d="M3 10h18v2H3z" />
      <path d="M5 12v7M19 12v7M8 10V7h8v3" />
      <path d="M10 7h4" />
    </>
  ),
};

// Rétrocompatibilité anciennes clés admin
ICONS.truck = ICONS.delivery;
ICONS.wrench = ICONS.repair;
ICONS.tools = ICONS.maintenance;
ICONS.shield = ICONS.warranty;
ICONS.recycle = ICONS.tradein;
ICONS.wallet = ICONS.finance;
ICONS.headset = ICONS.support;

export const SERVICE_ICON_LABELS: Record<string, string> = {
  delivery: "Livraison",
  install: "Installation",
  repair: "Réparation / SAV",
  maintenance: "Entretien",
  warranty: "Garantie",
  tradein: "Reprise",
  finance: "Financement",
  support: "Support / Hotline",
  fridge: "Réfrigérateur",
  washer: "Lave-linge",
  sofa: "Meuble / Canapé",
  ac: "Climatisation",
  desk: "Bureau",
};

function ServiceIcon({ name, image }: { name?: string | null; image?: string | null }) {
  if (image) {
    return (
      <span className="relative block h-24 w-24">
        <Image src={image} alt="" fill className="object-contain" sizes="96px" />
      </span>
    );
  }
  const paths = ICONS[name || ""] || ICONS.delivery;
  return (
    <svg viewBox="0 0 24 24" className="h-24 w-24 text-brand-black" fill="none" stroke="currentColor" strokeWidth="1.4">
      {paths}
    </svg>
  );
}

export default function ServiceCard({ service }: { service: ServiceCardData }) {
  const [open, setOpen] = useState(false);

  return (
    <article
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-sm border border-black/10 bg-white"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => {
        if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) {
          setOpen((v) => !v);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((v) => !v);
        }
      }}
      role="button"
      tabIndex={0}
      aria-expanded={open}
    >
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-5 px-4 transition-opacity duration-300 ${
          open ? "pointer-events-none opacity-0" : "opacity-100"
        } md:group-hover:pointer-events-none md:group-hover:opacity-0`}
      >
        <ServiceIcon name={service.icon} image={service.icon_image} />
        <h2 className="text-center text-base font-bold text-brand-black md:text-lg">{service.title}</h2>
      </div>

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-4 px-5 text-center transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        } md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100`}
      >
        <h2 className="text-base font-bold text-brand-black md:text-lg">{service.title}</h2>
        {service.short_description ? (
          <p className="line-clamp-5 text-sm leading-relaxed text-brand-black/70">{service.short_description}</p>
        ) : null}
        <Link
          href={`/services/${service.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 inline-flex rounded bg-brand-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-orange"
        >
          {service.cta_label || "Voir plus"}
        </Link>
      </div>
    </article>
  );
}
