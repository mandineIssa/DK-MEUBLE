"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasCustomerSession } from "@/lib/customerApi";
import { api } from "@/lib/api";
import { useSite } from "@/components/SiteProvider";
import SiteBrand from "@/components/SiteBrand";
import { useCartCount } from "@/components/CartProvider";
import CategoryMegaMenu from "@/components/CategoryMegaMenu";
import NotificationBell from "@/components/NotificationBell";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

const FALLBACK_NAV = [
  { label: "Nos produits", href: "/produits" },
  { label: "Promotion", href: "/promo" },
  { label: "Reconditionné", href: "/reconditionne" },
  { label: "Destockage", href: "/destockage" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const site = useSite();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [navLinks, setNavLinks] = useState(FALLBACK_NAV);
  const [q, setQ] = useState("");
  const cartCount = useCartCount();

  useEffect(() => {
    hasCustomerSession().then(setLoggedIn).catch(() => setLoggedIn(false));
  }, [pathname]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("dk_nav_secondary");
      if (raw) {
        const parsed = JSON.parse(raw) as { at: number; links: typeof FALLBACK_NAV };
        if (parsed?.links?.length && Date.now() - parsed.at < 5 * 60_000) {
          setNavLinks(parsed.links);
        }
      }
    } catch {
      /* ignore */
    }

    api
      .getHomepage()
      .then((h) => {
        const secondary = (h.nav_secondary || [])
          .filter((l) => l.enabled !== false)
          .map((l) => ({
            label: l.label,
            href: l.label.toLowerCase().includes("service") && l.href === "/a-propos" ? "/services" : l.href,
          }));

        const hasProducts = secondary.some((l) => l.href === "/produits");
        const next = hasProducts ? secondary : [{ label: "Nos produits", href: "/produits" }, ...secondary];
        setNavLinks(next);
        try {
          sessionStorage.setItem("dk_nav_secondary", JSON.stringify({ at: Date.now(), links: next }));
        } catch {
          /* ignore */
        }
      })
      .catch(() => setNavLinks(FALLBACK_NAV));
  }, []);

  const accountHref = loggedIn ? "/compte" : "/compte/connexion";
  const phones = site.phones?.length ? site.phones : site.phoneDisplay ? [site.phoneDisplay] : [];

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/produits?search=${encodeURIComponent(term)}` : "/produits");
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 text-white">
      {/* Bande 1 — logo / recherche / icônes */}
      <div className="bg-brand-dark">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:px-4 md:gap-6 md:px-5 md:py-4">
          <Link href="/" className="shrink-0" onClick={() => setMobileOpen(false)}>
            <SiteBrand />
          </Link>

          <form
            onSubmit={onSearch}
            role="search"
            className="hidden min-w-0 flex-1 items-center rounded-full bg-white p-1 sm:flex"
          >
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit…"
              className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-brand-black outline-none placeholder:text-brand-black/40"
              aria-label="Rechercher un produit"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-brand-orange px-5 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-brand-orange-dark"
            >
              Rechercher
            </button>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
            <NotificationBell />
            <Link
              href={accountHref}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10 hover:text-brand-orange"
              aria-label={loggedIn ? "Mon compte" : "Connexion"}
              title={loggedIn ? "Mon compte" : "Connexion"}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 19c0-3.5 3-6 7-6s7 2.5 7 6" />
              </svg>
            </Link>

            <Link
              href="/showrooms"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10 hover:text-brand-orange sm:inline-flex"
              aria-label="Showrooms"
              title="Showrooms"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
                <circle cx="12" cy="10" r="2.2" />
              </svg>
            </Link>

            <Link
              href="/panier"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10 hover:text-brand-orange"
              aria-label="Panier"
              title="Panier"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="9" cy="20" r="1.2" />
                <circle cx="18" cy="20" r="1.2" />
                <path d="M3 4h2l2.2 11h11.3l1.8-7H7.2" />
              </svg>
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg lg:hidden"
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? (
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Recherche mobile */}
        <form onSubmit={onSearch} role="search" className="flex items-center gap-2 px-3 pb-3 sm:hidden">
          <div className="flex min-w-0 flex-1 items-center rounded-full bg-white p-1">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit…"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-brand-black outline-none"
              aria-label="Rechercher un produit"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-brand-orange px-3 py-2 text-[11px] font-bold uppercase text-white"
            >
              OK
            </button>
          </div>
        </form>
      </div>

      {/* Bande 2 — catégories / liens / téléphones */}
      <div className="bg-brand-black">
        <div className="mx-auto hidden max-w-7xl items-center gap-4 px-3 py-0 sm:px-4 md:px-5 lg:flex">
          <div className="shrink-0 py-3">
            <CategoryMegaMenu variant="nav" />
          </div>

          <nav className="flex min-w-0 flex-1 items-stretch justify-center overflow-x-auto">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className={`whitespace-nowrap px-3 py-3.5 text-[11px] font-bold uppercase tracking-wide transition xl:px-4 xl:text-xs ${
                    active
                      ? "text-brand-orange"
                      : "text-white/90 hover:text-brand-orange"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0 py-2 text-right text-[11px] font-semibold leading-tight text-white/95 xl:text-xs">
            {phones.length ? (
              phones.slice(0, 2).map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`} className="block hover:text-brand-orange">
                  {phone}
                </a>
              ))
            ) : (
              <span className="text-white/40">Tél. à configurer</span>
            )}
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 bg-brand-black lg:hidden">
          <div className="space-y-3 px-4 py-4">
            <CategoryMegaMenu variant="nav" />
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg px-3 py-3 text-sm font-semibold uppercase ${
                    isActive(pathname, link.href)
                      ? "bg-white/10 text-brand-orange"
                      : "text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/showrooms"
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold"
              >
                Showrooms
              </Link>
              {phones.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="block rounded-lg px-3 py-3 text-sm font-semibold text-brand-orange"
                >
                  {phone}
                </a>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
