"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/",
    label: "Accueil",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V20h14V9.5" />
      </svg>
    ),
  },
  {
    href: "/categories",
    label: "Catégories",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    ),
  },
  {
    href: "/recherche",
    label: "Recherche",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
    ),
  },
  {
    href: "/compte#favoris",
    label: "Favoris",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z" />
      </svg>
    ),
  },
  {
    href: "/compte",
    label: "Compte",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 19c1.2-3 3.6-4.5 7-4.5S17.8 16 19 19" />
      </svg>
    ),
  },
];

/** Barre de navigation basse — mobile (maquette) */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 right-0 z-40 border-t border-black/10 bg-brand-black pb-[env(safe-area-inset-bottom)] text-white md:hidden bottom-[var(--vv-bottom,0px)]">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {items.map((item) => {
          const path = item.href.split("#")[0];
          const active = item.href.includes("#")
            ? false
            : path === "/"
              ? pathname === "/"
              : pathname === path || pathname.startsWith(`${path}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium ${
                  active ? "text-brand-orange" : "text-white/70"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
