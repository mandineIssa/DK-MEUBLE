"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSite, useWaLink } from "@/components/SiteProvider";

function telHref(num: string) {
  const digits = num.replace(/\D/g, "");
  return digits ? `tel:${digits}` : "#";
}

type Props = {
  productId: number;
  productName: string;
  /** Compact icons row (cards) vs larger (fiche produit) */
  variant?: "card" | "detail";
};

export default function ProductContactActions({
  productId,
  productName,
  variant = "card",
}: Props) {
  const site = useSite();
  const wa = useWaLink(`Bonjour, je suis intéressé(e) par : ${productName}`);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const phones = site.phones ?? [];

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const iconBtn =
    variant === "card"
      ? "flex h-10 w-10 items-center justify-center rounded-full border border-brand-black/10 bg-white text-brand-black/70 shadow-sm transition hover:border-brand-orange hover:text-brand-orange"
      : "flex h-12 w-12 items-center justify-center rounded-full border border-brand-black/10 bg-white text-brand-black/70 shadow-sm transition hover:border-brand-orange hover:text-brand-orange";

  return (
    <div className="flex items-center justify-end gap-2">
      {phones.length > 0 && (
        <div className="relative" ref={wrapRef}>
          {open && (
            <div className="absolute bottom-[calc(100%+10px)] left-1/2 z-30 min-w-[9.5rem] -translate-x-1/2 rounded-lg bg-white px-3 py-2.5 text-center shadow-lg ring-1 ring-black/10">
              <ul className="space-y-1.5">
                {phones.map((num) => (
                  <li key={num}>
                    <a
                      href={telHref(num)}
                      className="block text-sm font-semibold text-[#c45c26] hover:underline"
                    >
                      {num.replace(/\s/g, "")}
                    </a>
                  </li>
                ))}
              </ul>
              <span className="absolute left-1/2 top-full -mt-px h-0 w-0 -translate-x-1/2 border-x-[7px] border-t-[8px] border-x-transparent border-t-white drop-shadow" />
            </div>
          )}
          <button
            type="button"
            aria-label="Voir les numéros"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={iconBtn}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6.5 4.5h3l1.2 4.2-1.8 1.2a12 12 0 0 0 5.4 5.4l1.2-1.8 4.2 1.2v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 6.7 2 2 0 0 1 6.5 4.5Z" />
            </svg>
          </button>
        </div>
      )}

      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp text-white shadow-sm transition hover:opacity-95"
          style={variant === "detail" ? { height: 48, width: 48 } : undefined}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.42a9.9 9.9 0 0 0 4.62 1.17h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm5.58 13.54c-.24.68-1.4 1.24-1.94 1.32-.5.07-1.14.1-1.84-.12-.42-.13-.97-.32-1.67-.62-2.94-1.27-4.85-4.23-5-4.42-.14-.19-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.57-.36.76-.36h.55c.18 0 .41-.05.64.49.24.56.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.14.31-.28.48-.14.16-.3.37-.42.5-.14.14-.28.29-.12.56.16.28.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.61-.13.24.1 1.56.74 1.83.87.27.14.45.2.52.31.07.12.07.66-.17 1.34Z" />
          </svg>
        </a>
      )}

      <Link
        href={`/devis?product=${productId}`}
        aria-label="Demander un devis"
        className={iconBtn}
        style={variant === "detail" ? { height: 48, width: 48 } : undefined}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H9l-4 4V5Z" />
        </svg>
      </Link>
    </div>
  );
}
