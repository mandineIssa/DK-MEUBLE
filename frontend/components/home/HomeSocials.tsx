"use client";

import Link from "next/link";
import { useSocials } from "@/components/SiteProvider";

export default function HomeSocials({ title }: { title?: string | null }) {
  const socials = useSocials();
  if (!socials.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-8 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-black">{title || "Suivez-nous"}</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: s.background }}
            >
              <svg viewBox="0 0 24 24" className={`h-5 w-5 ${s.iconClass}`}>
                <path d={s.path} />
              </svg>
            </a>
          ))}
        </div>
        <Link href="/contact" className="text-sm font-semibold text-brand-orange hover:underline">
          Nous contacter
        </Link>
      </div>
    </section>
  );
}
