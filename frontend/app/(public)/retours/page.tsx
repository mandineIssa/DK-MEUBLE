import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { api } from "@/lib/api";
import { getSite, waLink } from "@/lib/site";
import ReturnsFaq from "@/components/returns/ReturnsFaq";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: 'Politique de retours',
  description:
    'Retours et remboursements DK HOMETECH — conditions claires à Dakar.',
  path: '/retours',
});

type Highlight = { label?: string; value?: string; hint?: string };
type Step = { title?: string; text?: string };
type Section = { title?: string; body?: string };
type Faq = { q?: string; a?: string };

const DEFAULT_HIGHLIGHTS: Highlight[] = [
  { label: "Délai", value: "7 jours", hint: "après réception" },
  { label: "État", value: "Neuf", hint: "emballage d’origine" },
  { label: "Traitement", value: "48–72 h", hint: "après validation" },
  { label: "Contact", value: "WhatsApp", hint: "ou page Contact" },
];

const DEFAULT_STEPS: Step[] = [
  {
    title: "Contactez-nous",
    text: "Via WhatsApp, téléphone ou formulaire Contact, indiquez votre n° de commande et le motif du retour.",
  },
  {
    title: "Validation",
    text: "Notre équipe vérifie l’éligibilité (délai, état du produit, type d’article) sous 24 à 48 h ouvrées.",
  },
  {
    title: "Retour / reprise",
    text: "Dépôt en showroom, reprise à domicile ou échange — les modalités vous sont confirmées avant toute action.",
  },
  {
    title: "Remboursement",
    text: "Après contrôle, remboursement ou avoir selon votre mode de paiement (Wave, Orange Money, cash…).",
  },
];

export default async function RetoursPage() {
  const [page, site] = await Promise.all([
    api.getPage("returns").catch(() => ({ blocks: {} as Record<string, unknown> })),
    getSite(),
  ]);

  const b = page.blocks as {
    hero?: { eyebrow?: string; title?: string; subtitle?: string };
    intro?: string;
    highlights?: Highlight[];
    steps?: Step[];
    eligible_title?: string;
    eligible?: string[];
    excluded_title?: string;
    excluded?: string[];
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
  const steps = Array.isArray(b.steps) && b.steps.length ? b.steps : DEFAULT_STEPS;
  const eligible = Array.isArray(b.eligible) ? b.eligible : [];
  const excluded = Array.isArray(b.excluded) ? b.excluded : [];
  const sections = Array.isArray(b.sections) ? b.sections : [];
  const faq = (Array.isArray(b.faq) ? b.faq : [])
    .filter((f) => f.q && f.a)
    .map((f) => ({ q: String(f.q), a: String(f.a) }));
  const cta = b.cta || {};
  const whatsappHref = waLink(
    "Bonjour, je souhaite une information sur un retour / remboursement.",
    site.whatsapp
  );

  return (
    <div className="bg-[var(--content-bg-alt)]">
      {/* Hero */}
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
              <li style={{ color: "var(--text-primary)" }}>Retours & remboursements</li>
            </ol>
          </nav>

          <p
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--accent-primary)" }}
          >
            {hero.eyebrow || "Service client"}
          </p>
          <h1
            className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl lg:text-[2.75rem]"
            style={{ color: "var(--text-primary)" }}
          >
            {hero.title || "Politique de retours & remboursements"}
          </h1>
          <p
            className="mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            {hero.subtitle ||
              "Des conditions claires pour vos retours d’électroménager et de mobilier à Dakar et partout au Sénégal."}
          </p>
          <span
            className="mt-5 block h-1 w-16 rounded-full"
            style={{ background: "var(--accent-primary)" }}
            aria-hidden
          />
        </div>
      </section>

      {/* Highlights */}
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
        {/* Intro */}
        <section
          className="rounded-2xl border bg-[var(--body-bg)] p-6 shadow-sm md:p-8"
          style={{ borderColor: "var(--border-light)" }}
        >
          <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
            Notre engagement
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed md:text-base" style={{ color: "var(--text-secondary)" }}>
            {b.intro ||
              "Chez DK HOMETECH, votre satisfaction compte. Cette page décrit dans quels cas un retour ou un échange est possible, les délais à respecter et la marche à suivre."}
          </p>
        </section>

        {/* Steps */}
        <section>
          <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
            Comment effectuer un retour ?
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Quatre étapes simples, sans surprise.
          </p>
          <ol className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, i) => (
              <li
                key={i}
                className="relative rounded-2xl border bg-[var(--body-bg)] p-5 shadow-sm"
                style={{ borderColor: "var(--border-light)" }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold text-white"
                  style={{ background: "var(--accent-primary)" }}
                >
                  {i + 1}
                </span>
                <h3 className="mt-3 text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Eligible / Excluded */}
        {(eligible.length > 0 || excluded.length > 0) && (
          <section className="grid gap-4 lg:grid-cols-2">
            {eligible.length > 0 ? (
              <div
                className="rounded-2xl border bg-[var(--body-bg)] p-6 shadow-sm md:p-7"
                style={{ borderColor: "var(--border-light)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: "var(--success-color)" }}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <h2 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                    {b.eligible_title || "Produits éligibles au retour"}
                  </h2>
                </div>
                <ul className="mt-4 space-y-3">
                  {eligible.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--success-color)" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {excluded.length > 0 ? (
              <div
                className="rounded-2xl border bg-[var(--body-bg)] p-6 shadow-sm md:p-7"
                style={{ borderColor: "var(--border-light)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: "var(--danger-color)" }}
                    aria-hidden
                  >
                    !
                  </span>
                  <h2 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                    {b.excluded_title || "Cas non couverts"}
                  </h2>
                </div>
                <ul className="mt-4 space-y-3">
                  {excluded.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--danger-color)" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        )}

        {/* Detailed sections */}
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

        {/* FAQ */}
        {faq.length > 0 ? (
          <section>
            <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
              Questions fréquentes
            </h2>
            <p className="mt-2 mb-5 text-sm" style={{ color: "var(--text-secondary)" }}>
              Les réponses les plus demandées par nos clients.
            </p>
            <ReturnsFaq items={faq} />
          </section>
        ) : null}

        {/* CTA */}
        <section
          className="overflow-hidden rounded-2xl px-6 py-8 text-white md:px-10 md:py-10"
          style={{ background: "var(--footer-bg-primary, #232323)" }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-xl font-extrabold md:text-2xl">
                {cta.title || "Besoin d’un retour ou d’une assistance ?"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70 md:text-base">
                {cta.text ||
                  "Notre équipe vous répond rapidement pour étudier votre demande et vous indiquer la marche à suivre."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={cta.primary_href || "/contact"}
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: "var(--accent-primary)" }}
              >
                {cta.primary_label || "Nous contacter"}
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
              <Link
                href={cta.secondary_href || "/commande"}
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {cta.secondary_label || "Suivre ma commande"}
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
            <Link href="/showrooms" className="font-semibold hover:text-[var(--accent-primary)]">
              Showrooms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
