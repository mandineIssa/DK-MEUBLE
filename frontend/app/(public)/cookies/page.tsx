import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { api } from "@/lib/api";
import ReturnsFaq from "@/components/returns/ReturnsFaq";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: 'Politique de cookies',
  description:
    'Politique de cookies DK HOMETECH.',
  path: '/cookies',
});

type Highlight = { label?: string; value?: string; hint?: string };
type Category = {
  name?: string;
  badge?: string;
  summary?: string;
  points?: string[];
};
type Section = { title?: string; body?: string };
type Faq = { q?: string; a?: string };

const DEFAULT_HIGHLIGHTS: Highlight[] = [
  { label: "Essentiels", value: "Obligatoires", hint: "session & sécurité" },
  { label: "Mesure", value: "Statistiques", hint: "amélioration du site" },
  { label: "Préférences", value: "Confort", hint: "langue, panier…" },
  { label: "Contrôle", value: "Vous", hint: "navigateur / paramètres" },
];

const BADGE_COLORS = ["var(--accent-primary)", "var(--success-color)", "#2563eb", "var(--text-primary)"];

export default async function CookiesPage() {
  const page = await api.getPage("cookies").catch(() => ({ blocks: {} as Record<string, unknown> }));

  const b = page.blocks as {
    hero?: { eyebrow?: string; title?: string; subtitle?: string };
    intro?: string;
    highlights?: Highlight[];
    categories?: Category[];
    sections?: Section[];
    faq?: Faq[];
    cta?: {
      title?: string;
      text?: string;
      primary_label?: string;
      primary_href?: string;
      secondary_label?: string;
      secondary_href?: string;
    };
    updated_label?: string;
  };

  const hero = b.hero || {};
  const highlights = Array.isArray(b.highlights) && b.highlights.length ? b.highlights : DEFAULT_HIGHLIGHTS;
  const categories = Array.isArray(b.categories) ? b.categories : [];
  const sections = Array.isArray(b.sections) ? b.sections : [];
  const faq = (Array.isArray(b.faq) ? b.faq : [])
    .filter((f) => f.q && f.a)
    .map((f) => ({ q: String(f.q), a: String(f.a) }));
  const cta = b.cta || {};

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
              <li style={{ color: "var(--text-primary)" }}>Cookies</li>
            </ol>
          </nav>

          <p
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--accent-primary)" }}
          >
            {hero.eyebrow || "Légal"}
          </p>
          <h1
            className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl lg:text-[2.75rem]"
            style={{ color: "var(--text-primary)" }}
          >
            {hero.title || "Politique de cookies"}
          </h1>
          <p
            className="mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            {hero.subtitle ||
              "Comment DK HOMETECH utilise les cookies et technologies similaires sur le site."}
          </p>
          <span
            className="mt-5 block h-1 w-16 rounded-full"
            style={{ background: "var(--accent-primary)" }}
            aria-hidden
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h, i) => (
            <li
              key={i}
              className="rounded-2xl border bg-[var(--body-bg)] px-5 py-4 shadow-sm"
              style={{ borderColor: "var(--border-light)" }}
            >
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                {h.label}
              </p>
              <p className="mt-1 text-2xl font-extrabold" style={{ color: "var(--accent-primary)" }}>
                {h.value}
              </p>
              {h.hint ? (
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                  {h.hint}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-14 md:px-6 md:pb-20">
        <section
          className="rounded-2xl border bg-[var(--body-bg)] p-6 shadow-sm md:p-8"
          style={{ borderColor: "var(--border-light)" }}
        >
          <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
            Transparence sur les cookies
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed md:text-base" style={{ color: "var(--text-secondary)" }}>
            {b.intro ||
              "Cette politique explique ce que sont les cookies, lesquels nous utilisons, pourquoi, et comment vous pouvez les gérer."}
          </p>
          <p className="mt-3 text-sm">
            <Link
              href="/politique-confidentialite"
              className="font-semibold hover:underline"
              style={{ color: "var(--accent-primary)" }}
            >
              Voir aussi la Politique de confidentialité →
            </Link>
          </p>
        </section>

        {categories.length > 0 ? (
          <section>
            <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
              Types de cookies utilisés
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              Classés par finalité pour plus de clarté.
            </p>
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {categories.map((cat, i) => {
                const accent = BADGE_COLORS[i % BADGE_COLORS.length];
                return (
                  <li
                    key={i}
                    className="rounded-2xl border bg-[var(--body-bg)] p-5 shadow-sm md:p-6"
                    style={{ borderColor: "var(--border-light)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                          {cat.name}
                        </h3>
                        {cat.summary ? (
                          <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            {cat.summary}
                          </p>
                        ) : null}
                      </div>
                      {cat.badge ? (
                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                          style={{ background: accent }}
                        >
                          {cat.badge}
                        </span>
                      ) : null}
                    </div>
                    {Array.isArray(cat.points) && cat.points.length > 0 ? (
                      <ul className="mt-4 space-y-2">
                        {cat.points.map((point, j) => (
                          <li
                            key={j}
                            className="flex gap-2.5 text-sm leading-relaxed"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <span
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: accent }}
                            />
                            {point}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {/* Tableau récapitulatif */}
        <section
          className="overflow-hidden rounded-2xl border bg-[var(--body-bg)] shadow-sm"
          style={{ borderColor: "var(--border-light)" }}
        >
          <div className="border-b px-5 py-4 md:px-6" style={{ borderColor: "var(--border-light)" }}>
            <h2 className="text-lg font-extrabold md:text-xl" style={{ color: "var(--text-primary)" }}>
              Récapitulatif
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              Vue rapide des finalités principales.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr style={{ background: "var(--content-bg-alt)", color: "var(--text-secondary)" }}>
                  <th className="px-5 py-3 font-bold md:px-6">Catégorie</th>
                  <th className="px-5 py-3 font-bold md:px-6">Finalité</th>
                  <th className="px-5 py-3 font-bold md:px-6">Obligatoire</th>
                </tr>
              </thead>
              <tbody style={{ color: "var(--text-secondary)" }}>
                {[
                  ["Essentiels", "Session, sécurité, panier", "Oui"],
                  ["Performance", "Statistiques d’usage agrégées", "Non"],
                  ["Préférences", "Confort de navigation", "Non"],
                  ["Tiers", "Services externes (si activés)", "Non"],
                ].map(([cat, purpose, required]) => (
                  <tr
                    key={cat}
                    className="border-t"
                    style={{ borderColor: "var(--border-light)" }}
                  >
                    <td className="px-5 py-3 font-semibold md:px-6" style={{ color: "var(--text-primary)" }}>
                      {cat}
                    </td>
                    <td className="px-5 py-3 md:px-6">{purpose}</td>
                    <td className="px-5 py-3 md:px-6">
                      <span
                        className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                        style={{
                          background: required === "Oui" ? "var(--accent-primary)" : "var(--text-secondary)",
                        }}
                      >
                        {required}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {sections.length > 0 ? (
          <section
            className="rounded-2xl border bg-[var(--body-bg)] p-6 shadow-sm md:p-8"
            style={{ borderColor: "var(--border-light)" }}
          >
            <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
              Conditions détaillées
            </h2>
            <div className="mt-6 space-y-8">
              {sections.map((section, i) => (
                <article key={`${section.title || "s"}-${i}`}>
                  {section.title ? (
                    <h3 className="text-base font-bold md:text-lg" style={{ color: "var(--text-primary)" }}>
                      {section.title}
                    </h3>
                  ) : null}
                  {section.body ? (
                    <p
                      className="mt-2 whitespace-pre-line text-sm leading-relaxed md:text-base"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {section.body}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {faq.length > 0 ? (
          <section>
            <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
              Questions fréquentes
            </h2>
            <p className="mt-2 mb-5 text-sm" style={{ color: "var(--text-secondary)" }}>
              Gestion, publicité, données de paiement…
            </p>
            <ReturnsFaq items={faq} />
          </section>
        ) : null}

        <section
          className="overflow-hidden rounded-2xl px-6 py-8 text-white md:px-10 md:py-10"
          style={{ background: "var(--footer-bg-primary, #232323)" }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-xl font-extrabold md:text-2xl">
                {cta.title || "Une question sur vos données ?"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70 md:text-base">
                {cta.text ||
                  "Notre équipe peut vous préciser quels cookies sont utilisés et comment exercer vos droits."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={cta.primary_href || "/politique-confidentialite"}
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: "var(--accent-primary)" }}
              >
                {cta.primary_label || "Politique de confidentialité"}
              </Link>
              <Link
                href={cta.secondary_href || "/contact"}
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {cta.secondary_label || "Nous contacter"}
              </Link>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
          <p>{b.updated_label || "Dernière mise à jour : septembre 2026"}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/cgu" className="font-semibold hover:text-[var(--accent-primary)]">
              CGU
            </Link>
            <Link
              href="/politique-confidentialite"
              className="font-semibold hover:text-[var(--accent-primary)]"
            >
              Confidentialité
            </Link>
            <Link href="/paiement" className="font-semibold hover:text-[var(--accent-primary)]">
              Paiement
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
