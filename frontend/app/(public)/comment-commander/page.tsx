import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import { getSite, waLink } from "@/lib/site";
import ReturnsFaq from "@/components/returns/ReturnsFaq";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: 'Comment commander',
  description:
    'Guide pour commander chez DK HOMETECH : en ligne, WhatsApp, showroom ou devis.',
  path: '/comment-commander',
});

type Highlight = { label?: string; value?: string; hint?: string };
type Step = { title?: string; text?: string };
type Channel = {
  key?: string;
  name?: string;
  badge?: string;
  summary?: string;
  points?: string[];
  cta_label?: string;
  cta_href?: string;
};
type Section = { title?: string; body?: string };
type Faq = { q?: string; a?: string };

const DEFAULT_HIGHLIGHTS: Highlight[] = [
  { label: "En ligne", value: "24/7", hint: "site & panier" },
  { label: "WhatsApp", value: "Rapide", hint: "conseil + commande" },
  { label: "Showroom", value: "Sur place", hint: "essayer & payer" },
  { label: "Paiement", value: "Flexible", hint: "Wave, OM, cash…" },
];

const DEFAULT_STEPS: Step[] = [
  {
    title: "Choisissez vos produits",
    text: "Parcourez les catégories et fiches produit. Vérifiez options, stock et état (neuf / reconditionné).",
  },
  {
    title: "Ajoutez au panier",
    text: "Sélectionnez la quantité puis contrôlez le total dans le panier avant de continuer.",
  },
  {
    title: "Livraison ou retrait",
    text: "Indiquez votre zone de livraison, ou choisissez le retrait en showroom sans frais de port.",
  },
  {
    title: "Payez",
    text: "Wave, Orange Money, cash à la livraison ou paiement magasin — selon les options disponibles.",
  },
  {
    title: "Confirmation",
    text: "Vous recevez une confirmation. On prépare la commande et on planifie livraison ou retrait.",
  },
];

const DEFAULT_CHANNELS: Channel[] = [
  {
    key: "online",
    name: "Sur le site",
    badge: "Recommandé",
    summary: "Parcourez le catalogue, gérez votre panier et validez en quelques clics.",
    points: ["Disponible 24 h/24", "Prix et stock affichés", "Suivi depuis votre compte"],
    cta_label: "Voir les produits",
    cta_href: "/produits",
  },
  {
    key: "whatsapp",
    name: "Par WhatsApp",
    badge: "Conseil",
    summary: "Envoyez le produit ou une photo : on confirme dispo, prix et délai.",
    points: ["Réponse rapide", "Comparer plusieurs modèles", "Confirmation écrite"],
    cta_label: "Écrire sur WhatsApp",
    cta_href: "whatsapp",
  },
  {
    key: "showroom",
    name: "En showroom",
    badge: "Magasin",
    summary: "Venez voir et essayer avant d’acheter. Paiement et retrait sur place.",
    points: ["Conseil en magasin", "Paiement cash ou Mobile Money", "Retrait selon stock"],
    cta_label: "Voir les showrooms",
    cta_href: "/showrooms",
  },
  {
    key: "devis",
    name: "Demande de devis",
    badge: "Projets",
    summary: "Pour un aménagement, un volume important ou une commande pro.",
    points: ["Devis sous 24–48 h", "Accompagnement sur mesure", "Conditions B2B"],
    cta_label: "Demander un devis",
    cta_href: "/devis",
  },
];

const DEFAULT_TIPS = [
  "Vérifiez le stock et les dimensions (accès escalier, porte, véhicule) avant de valider.",
  "Conservez votre n° de commande et la preuve de paiement Mobile Money.",
  "Pour un gros appareil ou un salon, prévoyez quelqu’un sur place le jour de la livraison.",
  "Un doute sur le modèle ? Demandez conseil sur WhatsApp ou en showroom avant d’acheter.",
];

const DEFAULT_CHECKLIST = [
  "Coordonnées téléphone / WhatsApp correctes",
  "Adresse ou showroom de retrait choisi",
  "Mode de paiement sélectionné",
  "Total (produits + livraison) vérifié",
];

const CHANNEL_ICONS: Record<string, ReactNode> = {
  online: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  whatsapp: (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  showroom: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  devis: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

function resolveHref(href: string | undefined, whatsappHref: string | null): string {
  if (!href || href === "whatsapp") return whatsappHref || "/contact";
  return href;
}

export default async function CommentCommanderPage() {
  const [page, site] = await Promise.all([
    api.getPage("how_to_order").catch(() => ({ blocks: {} as Record<string, unknown> })),
    getSite(),
  ]);

  const b = page.blocks as {
    hero?: { eyebrow?: string; title?: string; subtitle?: string };
    intro?: string;
    highlights?: Highlight[];
    channels_title?: string;
    channels?: Channel[];
    steps_title?: string;
    steps_subtitle?: string;
    steps?: Step[];
    tips_title?: string;
    tips?: string[];
    checklist_title?: string;
    checklist?: string[];
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
  const channels = Array.isArray(b.channels) && b.channels.length ? b.channels : DEFAULT_CHANNELS;
  const steps = Array.isArray(b.steps) && b.steps.length ? b.steps : DEFAULT_STEPS;
  const tips = Array.isArray(b.tips) && b.tips.length ? b.tips : DEFAULT_TIPS;
  const checklist =
    Array.isArray(b.checklist) && b.checklist.length ? b.checklist : DEFAULT_CHECKLIST;
  const sections = Array.isArray(b.sections) ? b.sections : [];
  const faq = (Array.isArray(b.faq) ? b.faq : [])
    .filter((f) => f.q && f.a)
    .map((f) => ({ q: String(f.q), a: String(f.a) }));
  const cta = b.cta || {};
  const whatsappHref = waLink(
    "Bonjour, je souhaite passer une commande / obtenir des infos sur un produit.",
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
              <li style={{ color: "var(--text-primary)" }}>Comment commander</li>
            </ol>
          </nav>

          <p
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--accent-primary)" }}
          >
            {hero.eyebrow || "Guide d’achat"}
          </p>
          <h1
            className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl lg:text-[2.75rem]"
            style={{ color: "var(--text-primary)" }}
          >
            {hero.title || "Comment commander"}
          </h1>
          <p
            className="mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            {hero.subtitle ||
              "En ligne, WhatsApp ou en showroom — passez commande chez DK HOMETECH en quelques étapes simples."}
          </p>
          <span
            className="mt-5 block h-1 w-16 rounded-full"
            style={{ background: "var(--accent-primary)" }}
            aria-hidden
          />

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/produits"
              className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: "var(--accent-primary)" }}
            >
              Commencer mes achats
            </Link>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border bg-[var(--body-bg)] px-5 py-2.5 text-sm font-bold transition hover:border-[var(--accent-primary)]"
                style={{ borderColor: "var(--border-light)", color: "var(--text-primary)" }}
              >
                <svg className="h-4 w-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Commander sur WhatsApp
              </a>
            ) : null}
            <Link
              href="/showrooms"
              className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white"
              style={{ background: "var(--text-primary)" }}
            >
              Visiter un showroom
            </Link>
          </div>
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
            Simple, flexible, adapté au Sénégal
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed md:text-base" style={{ color: "var(--text-secondary)" }}>
            {b.intro ||
              "Commandez en ligne, via WhatsApp, en showroom ou sur devis. Paiement Wave, Orange Money ou cash — livraison à domicile ou retrait magasin."}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
            {b.channels_title || "Choisissez votre façon de commander"}
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Quatre parcours, un même niveau de service.
          </p>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {channels.map((ch, i) => {
              const href = resolveHref(ch.cta_href, whatsappHref);
              const isExternal = href.startsWith("http");
              const icon = CHANNEL_ICONS[ch.key || ""] || CHANNEL_ICONS.online;
              return (
                <li
                  key={ch.key || i}
                  className="flex flex-col rounded-2xl border bg-[var(--body-bg)] p-5 shadow-sm md:p-6"
                  style={{ borderColor: "var(--border-light)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                        style={{ background: "var(--accent-primary)" }}
                      >
                        {icon}
                      </span>
                      <div>
                        <h3 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                          {ch.name}
                        </h3>
                        {ch.summary ? (
                          <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            {ch.summary}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {ch.badge ? (
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                        style={{ background: "var(--text-primary)" }}
                      >
                        {ch.badge}
                      </span>
                    ) : null}
                  </div>
                  {Array.isArray(ch.points) && ch.points.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {ch.points.map((p, j) => (
                        <li key={j} className="flex gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: "var(--accent-primary)" }}
                          />
                          {p}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-5 grow" />
                  {isExternal ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                      style={{ background: "var(--accent-primary)" }}
                    >
                      {ch.cta_label || "Continuer"}
                    </a>
                  ) : (
                    <Link
                      href={href}
                      className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                      style={{ background: "var(--accent-primary)" }}
                    >
                      {ch.cta_label || "Continuer"}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
            {b.steps_title || "Commander en ligne en 5 étapes"}
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            {b.steps_subtitle || "Du catalogue à la confirmation, le parcours classique."}
          </p>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

        {(tips.length > 0 || checklist.length > 0) && (
          <section className="grid gap-4 lg:grid-cols-2">
            {tips.length > 0 ? (
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
                    {b.tips_title || "Conseils pour une commande sans stress"}
                  </h2>
                </div>
                <ul className="mt-4 space-y-3">
                  {tips.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: "var(--accent-primary)" }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {checklist.length > 0 ? (
              <div
                className="rounded-2xl border bg-[var(--body-bg)] p-6 shadow-sm md:p-7"
                style={{ borderColor: "var(--border-light)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: "var(--success-color, #22c55e)" }}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <h2 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                    {b.checklist_title || "Avant de valider"}
                  </h2>
                </div>
                <ul className="mt-4 space-y-3">
                  {checklist.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
                        style={{ background: "var(--success-color, #22c55e)" }}
                        aria-hidden
                      >
                        ✓
                      </span>
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
              Bon à savoir
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

        <section>
          <h2 className="mb-4 text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
            Pages utiles
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/paiement", label: "Paiement", hint: "Wave, OM, cash…" },
              { href: "/livraison", label: "Livraison", hint: "Délais & zones" },
              { href: "/retours", label: "Retours", hint: "Échanges & remboursements" },
              { href: "/commande", label: "Suivi commande", hint: "Statut & historique" },
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

        {faq.length > 0 ? (
          <section>
            <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
              Questions fréquentes
            </h2>
            <p className="mt-2 mb-5 text-sm" style={{ color: "var(--text-secondary)" }}>
              Compte, WhatsApp, stock, paiement, retrait…
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
                {cta.title || "Prêt à commander ?"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70 md:text-base">
                {cta.text ||
                  "Parcourez le catalogue ou contactez-nous : on vous guide jusqu’à la livraison ou le retrait."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={cta.primary_href || "/produits"}
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: "var(--accent-primary)" }}
              >
                {cta.primary_label || "Voir les produits"}
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
                href={cta.secondary_href || "/devis"}
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {cta.secondary_label || "Demander un devis"}
              </Link>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
          <p>{b.updated_label || "Dernière mise à jour : septembre 2026"}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/paiement" className="font-semibold hover:text-[var(--accent-primary)]">
              Paiement
            </Link>
            <Link href="/livraison" className="font-semibold hover:text-[var(--accent-primary)]">
              Livraison
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
