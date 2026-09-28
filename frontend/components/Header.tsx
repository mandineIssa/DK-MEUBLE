"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { Product } from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";
import { hasCustomerSession } from "@/lib/customerApi";
import { api } from "@/lib/api";
import { useSite, useWaLink } from "@/components/SiteProvider";
import { useTheme } from "@/components/ThemeProvider";
import SiteBrand from "@/components/SiteBrand";
import { useCartCount } from "@/components/CartProvider";
import CategoryMegaMenu from "@/components/CategoryMegaMenu";
import { formatSnPhone } from "@/lib/phone";
import NotificationBell from "@/components/NotificationBell";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

const PRIMARY_NAV = [
  { label: "Accueil", href: "/" },
  { label: "Produits", href: "/produits" },
  { label: "Promotions", href: "/promotions" },
  { label: "Services", href: "/services" },
  { label: "Entreprises", href: "/entreprises" },
  { label: "Contact", href: "/contact" },
];

const FALLBACK_NAV = [
  { label: "Nos produits", href: "/produits" },
  { label: "Promotion", href: "/promotions" },
  { label: "Reconditionné", href: "/reconditionne" },
  { label: "Destockage", href: "/destockage" },
  { label: "Services", href: "/services" },
  { label: "Entreprises", href: "/entreprises" },
  { label: "Contact", href: "/contact" },
];

function ensureEntreprises(links: { label: string; href: string }[]) {
  if (links.some((l) => l.href === "/entreprises")) return links;
  const contact = links.findIndex((l) => l.href.startsWith("/contact"));
  const item = { label: "Entreprises", href: "/entreprises" };
  if (contact < 0) return [...links, item];
  return [...links.slice(0, contact), item, ...links.slice(contact)];
}

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
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [compact, setCompact] = useState(false);
  const cartCount = useCartCount();
  const scrollThreshold = theme.header_compact_scroll || 80;

  useEffect(() => {
    hasCustomerSession().then(setLoggedIn).catch(() => setLoggedIn(false));
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onScroll = () => {
      // Compact uniquement desktop : sur mobile ça cache la recherche
      // et change la hauteur du sticky → clignotement / fantômes au scroll.
      setCompact(mq.matches && window.scrollY > scrollThreshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    mq.addEventListener("change", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", onScroll);
    };
  }, [scrollThreshold]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("dk_nav_secondary");
      if (raw) {
        const parsed = JSON.parse(raw) as { at: number; links: typeof FALLBACK_NAV };
        if (parsed?.links?.length && Date.now() - parsed.at < 5 * 60_000) {
          setNavLinks(ensureEntreprises(parsed.links));
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
        const next = ensureEntreprises(
          hasProducts ? secondary : [{ label: "Nos produits", href: "/produits" }, ...secondary]
        );
        setNavLinks(next);
        try {
          sessionStorage.setItem("dk_nav_secondary", JSON.stringify({ at: Date.now(), links: next }));
        } catch {
          /* ignore */
        }
      })
      .catch(() => setNavLinks(FALLBACK_NAV));
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(() => {
      api
        .getProducts({ search: term, per_page: "5" })
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [q]);

  const accountHref = loggedIn ? "/compte" : "/compte/connexion";
  const waHref = useWaLink(
    "Bonjour DK HOMETECH, je suis intéressé par un produit et j'aimerais avoir plus d'informations."
  );
  const primaryHrefs = new Set(PRIMARY_NAV.map((l) => l.href));
  const extraLinks = navLinks.filter((l) => !primaryHrefs.has(l.href) && l.href !== "/categories");
  const phones = site.phones?.length ? site.phones : site.phoneDisplay ? [site.phoneDisplay] : [];

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/produits?search=${encodeURIComponent(term)}` : "/produits");
    setSuggestions([]);
    setMobileOpen(false);
    setSearchOpen(false);
  }

  const iconBtn =
    "inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-[var(--text-primary)] transition hover:text-[var(--accent-primary)]";

  return (
    <header
      className="sticky top-0 z-40 isolate text-[var(--text-primary)] shadow-header"
      style={{ background: "var(--header-bg, #ffffff)" }}
    >
      {/* Bande 1 — logo / recherche / icônes */}
      <div
        className={`border-b transition-[padding] duration-200 ${compact ? "py-1.5" : ""}`}
        style={{
          background: "var(--header-bg, #ffffff)",
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
            className={`relative min-w-0 flex-1 items-stretch overflow-visible rounded-md border bg-white ${
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
            {suggestions.length > 0 ? (
              <ul className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-white text-sm shadow-lg" style={{ borderColor: "var(--border-light)" }}>
                {suggestions.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/produits/${p.slug}`}
                      className="block px-4 py-2 hover:bg-black/5"
                      onClick={() => setSuggestions([])}
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
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
              href={loggedIn ? "/compte#favoris" : "/compte/connexion"}
              className={iconBtn}
              aria-label="Favoris"
              title="Favoris"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z" />
              </svg>
              <span className="hidden text-xs font-semibold lg:inline">Favoris</span>
            </Link>

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

            {waHref ? (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className={iconBtn} aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-whatsapp" fill="currentColor">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.42a9.9 9.9 0 0 0 4.62 1.17h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Z" />
                </svg>
                <span className="hidden text-xs font-semibold lg:inline">WhatsApp</span>
              </a>
            ) : null}

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

        {/* Recherche mobile : hauteur stable (pas de hide/show au scroll) */}
        <form
          onSubmit={onSearch}
          role="search"
          className={
            searchOpen
              ? "relative flex items-center gap-2 px-3 pb-3 lg:flex"
              : "relative flex items-center gap-2 px-3 pb-3 sm:hidden"
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
          {suggestions.length > 0 ? (
            <ul className="absolute left-3 right-3 top-full z-50 overflow-hidden rounded-md border bg-white text-sm shadow-lg sm:hidden" style={{ borderColor: "var(--border-light)" }}>
              {suggestions.map((p) => (
                <li key={p.id}>
                  <Link href={`/produits/${p.slug}`} className="block px-4 py-2" onClick={() => setSuggestions([])}>
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
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
            {[...PRIMARY_NAV, ...extraLinks].map((link) => {
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
              phones.slice(0, 2).map((phone) => {
                const formatted = formatSnPhone(phone);
                return (
                  <a
                    key={phone}
                    href={`tel:${formatted.tel}`}
                    className="block hover:text-[var(--accent-primary)]"
                  >
                    {formatted.display}
                  </a>
                );
              })
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
