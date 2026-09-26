import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import ContactForm from "@/components/ContactForm";
import { api } from "@/lib/api";
import { getSite, socialsFromSite, waLink } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact — DK HOMETECH à Dakar',
  description:
    'Contactez DK HOMETECH à Dakar : WhatsApp, téléphone, formulaire, devis et showroom.',
  path: '/contact',
});

function formatAddress(raw: string): string {
  const t = raw.trim();
  if (!t) return "Dakar, Sénégal";
  if (t !== t.toUpperCase()) return t;
  return t
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function formatHours(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  const compact = t.replace(/\s+/g, "").toLowerCase();
  if (compact === "24h/24h" || compact === "24h/24" || compact === "24/24") {
    return "Ouvert 24 h / 24";
  }
  if (compact === "24h/247j/7" || compact === "24h/24h7j/7j" || /24h.*7j/.test(compact)) {
    return "Ouvert 24 h / 24 · 7 j / 7";
  }
  return t;
}

function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
  }
  return raw.trim();
}

export default async function ContactPage() {
  const [site, page] = await Promise.all([
    getSite(),
    api.getPage("contact").catch(() => ({ blocks: {} as Record<string, unknown> })),
  ]);

  const b = page.blocks as {
    hero?: { eyebrow?: string; title?: string; subtitle?: string };
    intro?: string;
    cta?: {
      title?: string;
      text?: string;
      primary_label?: string;
      primary_href?: string;
      secondary_label?: string;
      secondary_href?: string;
    };
  };

  const hero = b.hero || {};
  const cta = b.cta || {};
  const socials = socialsFromSite(site);
  const whatsappHref = waLink(
    "Bonjour, je souhaite vous contacter depuis le site DK HOMETECH.",
    site.whatsapp
  );
  const phoneHref = site.phoneTel ? `tel:${site.phoneTel}` : null;
  const addressDisplay = formatAddress(site.address);
  const hoursDisplay = formatHours(site.hours);
  const phoneDisplay = formatPhoneDisplay(site.phoneDisplay || site.phoneTel || "");
  const mapsSearchHref = site.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`
    : null;

  return (
    <div className="bg-[var(--content-bg-alt)]">
      <section
        className="border-b bg-[var(--body-bg)]"
        style={{ borderColor: "var(--border-light)" }}
      >
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <nav className="mb-4 text-xs font-medium" aria-label="Fil d’Ariane">
            <ol className="flex flex-wrap items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <li>
                <Link href="/" className="hover:text-[var(--accent-primary)]">
                  Accueil
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li style={{ color: "var(--text-primary)" }}>Contact</li>
            </ol>
          </nav>

          <p
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--accent-primary)" }}
          >
            {hero.eyebrow || "Contact"}
          </p>
          <h1
            className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl lg:text-[2.75rem]"
            style={{ color: "var(--text-primary)" }}
          >
            {hero.title || "Parlons de votre projet"}
          </h1>
          <p
            className="mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            {hero.subtitle ||
              "WhatsApp, téléphone, devis ou message — l’équipe DK HOMETECH vous répond rapidement à Dakar."}
          </p>
          <span
            className="mt-5 block h-1 w-16 rounded-full"
            style={{ background: "var(--accent-primary)" }}
            aria-hidden
          />
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-6 md:py-12 md:pb-20">
        {/* Actions rapides */}
        <section aria-label="Actions rapides">
          <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            <li>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full flex-col gap-2 rounded-2xl bg-[#25D366] p-5 text-white shadow-sm transition hover:brightness-105"
                >
                  <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden>
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.42a9.9 9.9 0 0 0 4.62 1.17h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm5.58 13.54c-.24.68-1.4 1.24-1.94 1.32-.5.07-1.14.1-1.84-.12-.42-.13-.97-.32-1.67-.62-2.94-1.27-4.85-4.23-5-4.42-.14-.19-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.57-.36.76-.36h.55c.18 0 .41-.05.64.49.24.56.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.14.31-.28.48-.14.16-.3.37-.42.5-.14.14-.28.29-.12.56.16.28.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.61-.13.24.1 1.56.74 1.83.87.27.14.45.2.52.31.07.12.07.66-.17 1.34Z" />
                  </svg>
                  <span className="text-lg font-extrabold leading-tight">WhatsApp</span>
                  <span className="text-sm text-white/90">Réponse rapide · chat direct</span>
                </a>
              ) : (
                <div
                  className="flex h-full flex-col gap-2 rounded-2xl border p-5"
                  style={{ borderColor: "var(--border-light)", background: "var(--body-bg)", color: "var(--text-secondary)" }}
                >
                  <p className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                    WhatsApp
                  </p>
                  <p className="text-sm">À configurer dans l’admin</p>
                </div>
              )}
            </li>

            <li>
              {phoneHref ? (
                <a
                  href={phoneHref}
                  className="flex h-full flex-col gap-2 rounded-2xl p-5 text-white shadow-sm transition hover:opacity-90"
                  style={{ background: "var(--accent-primary)" }}
                >
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M6.5 4.5h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 6.5a2 2 0 0 1 2-2Z" />
                  </svg>
                  <span className="text-lg font-extrabold leading-tight">Appeler</span>
                  <span className="text-sm text-white/90">
                    {phoneDisplay || "Nous joindre par téléphone"}
                  </span>
                </a>
              ) : (
                <div
                  className="flex h-full flex-col gap-2 rounded-2xl border p-5"
                  style={{ borderColor: "var(--border-light)", background: "var(--body-bg)", color: "var(--text-secondary)" }}
                >
                  <p className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                    Appeler
                  </p>
                  <p className="text-sm">À configurer dans l’admin</p>
                </div>
              )}
            </li>

            <li>
              <Link
                href="/devis"
                className="flex h-full flex-col gap-2 rounded-2xl p-5 text-white shadow-sm transition hover:opacity-90"
                style={{ background: "var(--text-primary)" }}
              >
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M7 3h8l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
                  <path d="M15 3v5h5M8 12h8M8 16h6" />
                </svg>
                <span className="text-lg font-extrabold leading-tight">Demande de devis</span>
                <span className="text-sm text-white/80">Projet ou volume important</span>
              </Link>
            </li>
          </ul>
        </section>

        {/* Formulaire + infos / carte */}
        <section className="grid gap-6 lg:grid-cols-5 lg:items-start lg:gap-8">
          <div
            className="rounded-2xl border bg-[var(--body-bg)] p-6 shadow-sm md:p-8 lg:col-span-3"
            style={{ borderColor: "var(--border-light)" }}
          >
            <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
              Envoyez-nous un message
            </h2>
            <p className="mt-2 text-sm leading-relaxed md:text-base" style={{ color: "var(--text-secondary)" }}>
              {b.intro ||
                "Une question sur un produit, une commande ou un aménagement ? Laissez vos coordonnées — on vous rappelle."}
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>

          <aside className="space-y-4 lg:col-span-2">
            <div
              className="rounded-2xl border bg-[var(--body-bg)] p-5 shadow-sm md:p-6"
              style={{ borderColor: "var(--border-light)" }}
            >
              <h2 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                Coordonnées
              </h2>
              <ul className="mt-5 space-y-5">
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: "color-mix(in srgb, var(--accent-primary) 15%, transparent)",
                      color: "var(--accent-primary)",
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                      <path d="M12 2c-3.9 0-7 3-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-4-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                      Adresse
                    </p>
                    <p className="mt-0.5 font-semibold" style={{ color: "var(--text-primary)" }}>
                      {addressDisplay}
                    </p>
                    {mapsSearchHref ? (
                      <a
                        href={mapsSearchHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-sm font-semibold hover:underline"
                        style={{ color: "var(--accent-primary)" }}
                      >
                        Itinéraire →
                      </a>
                    ) : null}
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: "color-mix(in srgb, var(--accent-primary) 15%, transparent)",
                      color: "var(--accent-primary)",
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M6.5 4.5h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 6.5a2 2 0 0 1 2-2Z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                      Téléphone
                    </p>
                    {phoneHref ? (
                      <a
                        href={phoneHref}
                        className="mt-0.5 block font-semibold hover:underline"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {phoneDisplay}
                      </a>
                    ) : (
                      <p className="mt-0.5 font-semibold" style={{ color: "var(--text-secondary)" }}>
                        À renseigner
                      </p>
                    )}
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: "color-mix(in srgb, var(--accent-primary) 15%, transparent)",
                      color: "var(--accent-primary)",
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 7 9-7" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                      Email
                    </p>
                    {site.email ? (
                      <a
                        href={`mailto:${site.email}`}
                        className="mt-0.5 block break-all font-semibold hover:underline"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {site.email}
                      </a>
                    ) : (
                      <p className="mt-0.5 font-semibold" style={{ color: "var(--text-secondary)" }}>
                        À renseigner
                      </p>
                    )}
                  </div>
                </li>

                {hoursDisplay ? (
                  <li className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: "color-mix(in srgb, var(--accent-primary) 15%, transparent)",
                        color: "var(--accent-primary)",
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                        Horaires
                      </p>
                      <p className="mt-0.5 font-semibold" style={{ color: "var(--text-primary)" }}>
                        {hoursDisplay}
                      </p>
                    </div>
                  </li>
                ) : null}
              </ul>
            </div>

            <div
              className="overflow-hidden rounded-2xl border bg-[var(--body-bg)] shadow-sm"
              style={{ borderColor: "var(--border-light)" }}
            >
              {site.mapsEmbed ? (
                <iframe
                  title="Carte DK HOMETECH"
                  src={site.mapsEmbed}
                  className="aspect-[4/3] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <div
                  className="flex aspect-[4/3] flex-col items-center justify-center gap-3 px-6 py-8 text-center"
                  style={{ background: "var(--content-bg-alt)" }}
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{
                      background: "color-mix(in srgb, var(--accent-primary) 15%, transparent)",
                      color: "var(--accent-primary)",
                    }}
                    aria-hidden
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                      <path d="M12 2c-3.9 0-7 3-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-4-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
                    </svg>
                  </span>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {addressDisplay}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Carte interactive à configurer dans Admin → Paramètres → URL embed Google Maps
                  </p>
                  {mapsSearchHref ? (
                    <a
                      href={mapsSearchHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold text-white"
                      style={{ background: "var(--accent-primary)" }}
                    >
                      Ouvrir dans Google Maps
                    </a>
                  ) : null}
                </div>
              )}
            </div>

            {socials.length > 0 ? (
              <div
                className="rounded-2xl border bg-[var(--body-bg)] p-5 shadow-sm"
                style={{ borderColor: "var(--border-light)" }}
              >
                <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                  Réseaux sociaux
                </h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition hover:border-[var(--accent-primary)]"
                      style={{ borderColor: "var(--border-light)", color: "var(--text-primary)" }}
                    >
                      <span
                        style={{ background: s.background }}
                        className="flex h-7 w-7 items-center justify-center rounded-full"
                      >
                        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${s.iconClass}`} aria-hidden>
                          <path d={s.path} />
                        </svg>
                      </span>
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </section>

        {/* Liens utiles */}
        <section>
          <h2 className="mb-4 text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
            Besoin d’aide ?
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/comment-commander", label: "Comment commander", hint: "Étapes & canaux" },
              { href: "/livraison", label: "Livraison", hint: "Délais & zones" },
              { href: "/paiement", label: "Paiement", hint: "Wave, OM, cash…" },
              { href: "/showrooms", label: "Showrooms", hint: "Venir en magasin" },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex flex-col rounded-2xl border bg-[var(--body-bg)] px-5 py-4 shadow-sm transition hover:border-[var(--accent-primary)]"
                  style={{ borderColor: "var(--border-light)" }}
                >
                  <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                    {l.label}
                  </span>
                  <span className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {l.hint}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA showroom */}
        <section
          className="overflow-hidden rounded-2xl px-6 py-8 text-white md:px-10 md:py-10"
          style={{ background: "var(--footer-bg-primary, #232323)" }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-xl font-extrabold md:text-2xl">
                {cta.title || "Venez nous voir en showroom"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70 md:text-base">
                {cta.text ||
                  "Essayez les produits, obtenez un conseil et payez sur place si vous préférez."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={cta.primary_href || "/showrooms"}
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: "var(--accent-primary)" }}
              >
                {cta.primary_label || "Voir les showrooms"}
              </Link>
              <Link
                href={cta.secondary_href || "/devis"}
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {cta.secondary_label || "Demander un devis"}
              </Link>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-2.5 text-sm font-bold text-white hover:border-white"
                >
                  WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <div
          className="flex flex-wrap items-center justify-between gap-3 text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          <p>DK HOMETECH — Meubles & électroménager à Dakar</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/retours" className="font-semibold hover:text-[var(--accent-primary)]">
              Retours
            </Link>
            <Link href="/comment-commander" className="font-semibold hover:text-[var(--accent-primary)]">
              Comment commander
            </Link>
            <Link href="/a-propos" className="font-semibold hover:text-[var(--accent-primary)]">
              À propos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
