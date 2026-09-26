"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasCustomerSession } from "@/lib/customerApi";
import { api } from "@/lib/api";
import { useSite } from "@/components/SiteProvider";
import { useTheme } from "@/components/ThemeProvider";
import SiteBrand from "@/components/SiteBrand";
import { useCartCount } from "@/components/CartProvider";
import CategoryMegaMenu from "@/components/CategoryMegaMenu";
import NotificationBell from "@/components/NotificationBell";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

const FALLBACK_NAV = [
  { label: "Nos produits", href: "/produits" },
  { label: "Promotion", href: "/promotions" },
  { label: "Reconditionné", href: "/reconditionne" },
  { label: "Destockage", href: "/destockage" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const site = useSite();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [navLinks, setNavLinks] = useState(FALLBACK_NAV);
  const [q, setQ] = useState("");
  const [compact, setCompact] = useState(false);
  const cartCount = useCartCount();
  const scrollThreshold = theme.header_compact_scroll || 80;

  useEffect(() => {
    hasCustomerSession().then(setLoggedIn).catch(() => setLoggedIn(false));
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > scrollThreshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollThreshold]);

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
    setSearchOpen(false);
  }

  const iconBtn =
    "inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-[var(--text-primary)] transition hover:text-[var(--accent-primary)]";

  return (
    <header
      className="sticky top-0 z-40 text-[var(--text-primary)] shadow-header"
      style={{ background: "var(--header-bg)" }}
    >
      {/* Bande 1 — logo / recherche / icônes */}
      <div
        className={`border-b transition-[padding] duration-200 ${compact ? "py-1.5" : ""}`}
        style={{
          background: "var(--header-bg)",
          borderColor: "var(--border-light)",
        }}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center gap-3 px-3 sm:px-4 md:gap-6 md:px-5 ${
            compact ? "py-1.5" : "py-3 md:py-3.5"
          }`}
        >
          <Link href="/" className="shrink-0" onClick={() => setMobileOpen(false)}>
            <SiteBrand compact={compact} variant="light" />
          </Link>

          <form
            onSubmit={onSearch}
            role="search"
            className={`min-w-0 flex-1 items-stretch overflow-hidden rounded-md border bg-white ${
              compact ? "hidden md:flex" : "hidden sm:flex"
            }`}
            style={{ borderColor: "var(--border-light)" }}
          >
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit…"
              className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
              aria-label="Rechercher un produit"
            />
            <button
              type="submit"
              className="shrink-0 px-5 text-xs font-bold uppercase tracking-wide text-white transition hover:opacity-90"
              style={{ background: "var(--accent-primary)" }}
            >
              Rechercher
            </button>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 md:gap-1">
            {/* Loupe mobile / mode compact */}
            <button
              type="button"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-primary)] hover:text-[var(--accent-primary)] ${
                compact ? "md:hidden" : "sm:hidden"
              }`}
              aria-label="Rechercher"
              onClick={() => setSearchOpen((v) => !v)}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
            </button>

            <NotificationBell />

            <Link
              href={accountHref}
              className={`${iconBtn} ${compact ? "px-2" : ""}`}
              aria-label={loggedIn ? "Mon compte" : "Connexion"}
              title={loggedIn ? "Mon compte" : "Se connecter"}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 19c0-3.5 3-6 7-6s7 2.5 7 6" />
              </svg>
              <span className="hidden text-xs font-semibold lg:inline">
                {loggedIn ? "Compte" : "Se connecter"}
              </span>
            </Link>

            <Link
              href="/contact"
              className={`hidden sm:inline-flex ${iconBtn}`}
              aria-label="Aide"
              title="Aide / Contact"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9.5a2.5 2.5 0 1 1 3.8 2.1c-.8.5-1.3 1-1.3 2" />
                <circle cx="12" cy="16.5" r="0.8" fill="currentColor" />
              </svg>
              <span className="hidden text-xs font-semibold lg:inline">Aide</span>
            </Link>

            <Link
              href="/panier"
              className={`relative ${iconBtn}`}
              aria-label="Panier"
              title="Panier"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="9" cy="20" r="1.2" />
                <circle cx="18" cy="20" r="1.2" />
                <path d="M3 4h2l2.2 11h11.3l1.8-7H7.2" />
              </svg>
              <span className="hidden text-xs font-semibold lg:inline">Panier</span>
              {cartCount > 0 ? (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ background: "var(--accent-primary)" }}
                >
                  {cartCount}
                </span>
              ) : null}
            </Link>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-primary)] hover:text-[var(--accent-primary)] lg:hidden"
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

        {/* Recherche : visible sur mobile ; en mode compact desktop via loupe */}
        <form
          onSubmit={onSearch}
          role="search"
          className={
            searchOpen
              ? "flex items-center gap-2 px-3 pb-3"
              : compact
                ? "hidden"
                : "flex items-center gap-2 px-3 pb-3 sm:hidden"
          }
        >
          <div
            className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-md border bg-white"
            style={{ borderColor: "var(--border-light)" }}
          >
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit…"
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
              aria-label="Rechercher un produit"
            />
            <button
              type="submit"
              className="shrink-0 px-4 text-[11px] font-bold uppercase text-white"
              style={{ background: "var(--accent-primary)" }}
            >
              OK
            </button>
          </div>
        </form>
      </div>

      {/* Bande 2 — catégories / liens / téléphones */}
      <div
        className={`border-b transition-all duration-200 ${compact ? "hidden lg:block" : ""}`}
        style={{
          background: "var(--header-nav-bg)",
          borderColor: "var(--border-light)",
        }}
      >
        <div className="mx-auto hidden max-w-7xl items-center gap-4 px-3 py-0 sm:px-4 md:px-5 lg:flex">
          <div className="shrink-0 py-2.5">
            <CategoryMegaMenu variant="nav" />
          </div>

          <nav className="flex min-w-0 flex-1 items-stretch justify-center overflow-x-auto">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className="whitespace-nowrap px-3 py-3 text-[11px] font-bold uppercase tracking-wide transition xl:px-4 xl:text-xs"
                  style={{
                    color: active ? "var(--accent-primary)" : "var(--text-primary)",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div
            className="shrink-0 py-2 text-right text-[11px] font-semibold leading-tight xl:text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            {phones.length ? (
              phones.slice(0, 2).map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="block hover:text-[var(--accent-primary)]"
                >
                  {phone}
                </a>
              ))
            ) : (
              <span className="opacity-50">Tél. à configurer</span>
            )}
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div
          className="border-t lg:hidden"
          style={{
            background: "var(--header-bg)",
            borderColor: "var(--border-light)",
          }}
        >
          <div className="space-y-3 px-4 py-4">
            <CategoryMegaMenu variant="nav" />
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-3 text-sm font-semibold uppercase"
                  style={{
                    color: isActive(pathname, link.href)
                      ? "var(--accent-primary)"
                      : "var(--text-primary)",
                    background: isActive(pathname, link.href)
                      ? "color-mix(in srgb, var(--accent-primary) 10%, transparent)"
                      : undefined,
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/showrooms"
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold text-[var(--text-primary)]"
              >
                Showrooms
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold text-[var(--text-primary)] sm:hidden"
              >
                Aide / Contact
              </Link>
              {phones.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="block rounded-lg px-3 py-3 text-sm font-semibold"
                  style={{ color: "var(--accent-primary)" }}
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
