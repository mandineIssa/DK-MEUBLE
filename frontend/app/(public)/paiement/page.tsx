import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { api } from "@/lib/api";
import { getSite, waLink } from "@/lib/site";
import ReturnsFaq from "@/components/returns/ReturnsFaq";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: 'Informations de paiement',
  description:
    'Modes de paiement DK HOMETECH : Wave, Orange Money, cash à la livraison.',
  path: '/paiement',
});

type Highlight = { label?: string; value?: string; hint?: string };
type Step = { title?: string; text?: string };
type Method = {
  key?: string;
  name?: string;
  badge?: string;
  summary?: string;
  points?: string[];
};
type Section = { title?: string; body?: string };
type Faq = { q?: string; a?: string };

const DEFAULT_HIGHLIGHTS: Highlight[] = [
  { label: "Mobile Money", value: "Wave & OM", hint: "rapide et courant" },
  { label: "Livraison", value: "Cash", hint: "paiement à réception" },
  { label: "Sécurité", value: "Priorité", hint: "jamais de code secret" },
  { label: "Facture", value: "Reçu", hint: "après validation" },
];

const DEFAULT_STEPS: Step[] = [
  {
    title: "Choisissez votre mode",
    text: "Sélectionnez Wave, Orange Money, cash à la livraison ou paiement magasin.",
  },
  {
    title: "Validez le paiement",
    text: "Suivez les instructions. Pour le Mobile Money, confirmez uniquement vers nos coordonnées officielles.",
  },
  {
    title: "Confirmation",
    text: "Dès validation, vous recevez une confirmation et la préparation démarre.",
  },
  {
    title: "Livraison ou retrait",
    text: "Nous planifions la livraison ou le retrait showroom selon votre choix.",
  },
];

const METHOD_ACCENTS: Record<string, string> = {
  wave: "#1DC8FF",
  orange_money: "#FF7900",
  cash: "var(--accent-primary)",
  showroom: "var(--text-primary)",
};

export default async function PaiementPage() {
  const [page, site, footer] = await Promise.all([
    api.getPage("payment").catch(() => ({ blocks: {} as Record<string, unknown> })),
    getSite(),
    api.getFooter().catch(() => null),
  ]);

  const b = page.blocks as {
    hero?: { eyebrow?: string; title?: string; subtitle?: string };
    intro?: string;
    highlights?: Highlight[];
    methods?: Method[];
    steps?: Step[];
    security_title?: string;
    security?: string[];
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
  const methods = Array.isArray(b.methods) ? b.methods : [];
  const steps = Array.isArray(b.steps) && b.steps.length ? b.steps : DEFAULT_STEPS;
  const security = Array.isArray(b.security) ? b.security : [];
  const sections = Array.isArray(b.sections) ? b.sections : [];
  const faq = (Array.isArray(b.faq) ? b.faq : [])
    .filter((f) => f.q && f.a)
    .map((f) => ({ q: String(f.q), a: String(f.a) }));
  const cta = b.cta || {};
  const paymentLogos = footer?.payments || [];
  const whatsappHref = waLink(
    "Bonjour, j’ai une question sur les modes de paiement (Wave / Orange Money / cash).",
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
              <li style={{ color: "var(--text-primary)" }}>Paiement</li>
            </ol>
          </nav>

          <p
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--accent-primary)" }}
          >
            {hero.eyebrow || "Paiement"}
          </p>
          <h1
            className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl lg:text-[2.75rem]"
            style={{ color: "var(--text-primary)" }}
          >
            {hero.title || "Informations de paiement"}
          </h1>
          <p
            className="mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            {hero.subtitle ||
              "Wave, Orange Money, cash à la livraison et paiement en showroom — simples et adaptés au Sénégal."}
          </p>
          <span
            className="mt-5 block h-1 w-16 rounded-full"
            style={{ background: "var(--accent-primary)" }}
            aria-hidden
          />

          {paymentLogos.length > 0 ? (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                Acceptés
              </span>
              {paymentLogos.map((p) =>
                p.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.id}
                    src={p.logo_url}
                    alt={p.name}
                    className="h-8 w-auto object-contain"
                  />
                ) : (
                  <span
                    key={p.id}
                    className="rounded-full border px-3 py-1 text-xs font-semibold"
                    style={{ borderColor: "var(--border-light)", color: "var(--text-primary)" }}
                  >
                    {p.name}
                  </span>
                )
              )}
            </div>
          ) : null}
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
            Payez comme vous voulez
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed md:text-base" style={{ color: "var(--text-secondary)" }}>
            {b.intro ||
              "Choisissez le mode de paiement le plus pratique. Les options disponibles sont confirmées au moment de la commande."}
          </p>
        </section>

        {methods.length > 0 ? (
          <section>
            <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
              Modes de paiement acceptés
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              Sélectionnez l’option adaptée à votre commande.
            </p>
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {methods.map((m, i) => {
                const accent = METHOD_ACCENTS[m.key || ""] || "var(--accent-primary)";
                return (
                  <li
                    key={m.key || i}
                    className="rounded-2xl border bg-[var(--body-bg)] p-5 shadow-sm md:p-6"
                    style={{ borderColor: "var(--border-light)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                          {m.name}
                        </h3>
                        {m.summary ? (
                          <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            {m.summary}
                          </p>
                        ) : null}
                      </div>
                      {m.badge ? (
                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                          style={{ background: accent }}
                        >
                          {m.badge}
                        </span>
                      ) : null}
                    </div>
                    {Array.isArray(m.points) && m.points.length > 0 ? (
                      <ul className="mt-4 space-y-2">
                        {m.points.map((point, j) => (
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

        <section>
          <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
            Comment ça se passe ?
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, i) => (
              <li
                key={i}
                className="rounded-2xl border bg-[var(--body-bg)] p-5 shadow-sm"
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

        {security.length > 0 ? (
          <section
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
              <h2 className="text-lg font-extrabold md:text-xl" style={{ color: "var(--text-primary)" }}>
                {b.security_title || "Sécurité & bonnes pratiques"}
              </h2>
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {security.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-xl px-3 py-2 text-sm leading-relaxed"
                  style={{
                    color: "var(--text-secondary)",
                    background: "var(--content-bg-alt)",
                  }}
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: "var(--danger-color)" }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

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
              Cash, Mobile Money, facture…
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
                {cta.title || "Besoin d’aide pour payer ?"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70 md:text-base">
                {cta.text ||
                  "Notre équipe vous guide pour Wave, Orange Money ou le paiement à la livraison."}
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
                href={cta.secondary_href || "/panier"}
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {cta.secondary_label || "Voir le panier"}
              </Link>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
          <p>{b.updated_label || "Dernière mise à jour : septembre 2026"}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/livraison" className="font-semibold hover:text-[var(--accent-primary)]">
              Livraison
            </Link>
            <Link href="/retours" className="font-semibold hover:text-[var(--accent-primary)]">
              Retours
            </Link>
            <Link href="/cgu" className="font-semibold hover:text-[var(--accent-primary)]">
              CGU
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
