import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { api } from "@/lib/api";
import { getSite, waLink } from "@/lib/site";
import ReturnsFaq from "@/components/returns/ReturnsFaq";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: 'Livraison & expédition',
  description:
    'Livraison électroménager et mobilier à Dakar et partout au Sénégal.',
  path: '/livraison',
});

type Highlight = { label?: string; value?: string; hint?: string };
type Step = { title?: string; text?: string };
type Zone = { title?: string; text?: string };
type Section = { title?: string; body?: string };
type Faq = { q?: string; a?: string };

const DEFAULT_HIGHLIGHTS: Highlight[] = [
  { label: "Dakar", value: "24–72 h", hint: "délai indicatif" },
  { label: "Régions", value: "3–7 j", hint: "selon destination" },
  { label: "Retrait", value: "Showroom", hint: "sans frais de port" },
  { label: "Paiement", value: "Flexible", hint: "Wave, OM, cash…" },
];

const DEFAULT_STEPS: Step[] = [
  {
    title: "Commande validée",
    text: "Après confirmation du paiement ou du devis, votre commande est préparée en magasin ou en entrepôt.",
  },
  {
    title: "Planification",
    text: "Nous vous contactons pour convenir d’un créneau de livraison ou d’un retrait en showroom.",
  },
  {
    title: "Transport",
    text: "Vos articles sont emballés et acheminés. Pour les gros volumes, une équipe peut accompagner la livraison.",
  },
  {
    title: "Réception",
    text: "Vérifiez l’état du colis à l’arrivée. En cas de réserve, notez-la et contactez-nous sous 48 h avec photos.",
  },
];

export default async function LivraisonPage() {
  const [page, site] = await Promise.all([
    api.getPage("delivery").catch(() => ({ blocks: {} as Record<string, unknown> })),
    getSite(),
  ]);

  const b = page.blocks as {
    hero?: { eyebrow?: string; title?: string; subtitle?: string };
    intro?: string;
    highlights?: Highlight[];
    steps?: Step[];
    zones_title?: string;
    zones?: Zone[];
    included_title?: string;
    included?: string[];
    notes_title?: string;
    notes?: string[];
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
  const zones = Array.isArray(b.zones) ? b.zones : [];
  const included = Array.isArray(b.included) ? b.included : [];
  const notes = Array.isArray(b.notes) ? b.notes : [];
  const sections = Array.isArray(b.sections) ? b.sections : [];
  const faq = (Array.isArray(b.faq) ? b.faq : [])
    .filter((f) => f.q && f.a)
    .map((f) => ({ q: String(f.q), a: String(f.a) }));
  const cta = b.cta || {};
  const whatsappHref = waLink(
    "Bonjour, je souhaite des informations sur la livraison (zone et délai).",
    site.whatsapp
  );

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
              <li style={{ color: "var(--text-primary)" }}>Livraison & expédition</li>
            </ol>
          </nav>

          <p
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--accent-primary)" }}
          >
            {hero.eyebrow || "Livraison"}
          </p>
          <h1
            className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl lg:text-[2.75rem]"
            style={{ color: "var(--text-primary)" }}
          >
            {hero.title || "Livraison & expédition"}
          </h1>
          <p
            className="mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            {hero.subtitle ||
              "Livraison à domicile, retrait en showroom et délais clairs pour Dakar et tout le Sénégal."}
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
            Livraison partout au Sénégal
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed md:text-base" style={{ color: "var(--text-secondary)" }}>
            {b.intro ||
              "DK HOMETECH livre l’électroménager et le mobilier partout au Sénégal. Modes de livraison, délais indicatifs et conseils pour le jour J."}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
            Comment se passe la livraison ?
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            De la commande à la réception, en quatre étapes.
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

        {zones.length > 0 ? (
          <section>
            <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
              {b.zones_title || "Zones & délais indicatifs"}
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {zones.map((z, i) => (
                <li
                  key={i}
                  className="rounded-2xl border bg-[var(--body-bg)] p-5 shadow-sm"
                  style={{ borderColor: "var(--border-light)" }}
                >
                  <h3 className="text-base font-bold" style={{ color: "var(--accent-primary)" }}>
                    {z.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {z.text}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {(included.length > 0 || notes.length > 0) && (
          <section className="grid gap-4 lg:grid-cols-2">
            {included.length > 0 ? (
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
                    {b.included_title || "Ce qui est inclus"}
                  </h2>
                </div>
                <ul className="mt-4 space-y-3">
                  {included.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--success-color)" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {notes.length > 0 ? (
              <div
                className="rounded-2xl border bg-[var(--body-bg)] p-6 shadow-sm md:p-7"
                style={{ borderColor: "var(--border-light)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: "var(--accent-primary)" }}
                    aria-hidden
                  >
                    i
                  </span>
                  <h2 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                    {b.notes_title || "À prévoir le jour de la livraison"}
                  </h2>
                </div>
                <ul className="mt-4 space-y-3">
                  {notes.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent-primary)" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        )}

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
              Délais, retrait magasin, installation…
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
                {cta.title || "Une question sur votre livraison ?"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70 md:text-base">
                {cta.text ||
                  "Indiquez votre zone et le type de produit : nous vous confirmons délai et tarif."}
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
                href={cta.secondary_href || "/showrooms"}
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {cta.secondary_label || "Voir les showrooms"}
              </Link>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
          <p>{b.updated_label || "Dernière mise à jour : septembre 2026"}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/retours" className="font-semibold hover:text-[var(--accent-primary)]">
              Retours
            </Link>
            <Link href="/commande" className="font-semibold hover:text-[var(--accent-primary)]">
              Suivre ma commande
            </Link>
            <Link href="/contact" className="font-semibold hover:text-[var(--accent-primary)]">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
