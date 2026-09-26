import Link from "next/link";
import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import { api } from "@/lib/api";
import { getSite, waLink } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Produits reconditionnés à Dakar",
  description:
    "Électroménager et meubles reconditionnés chez DK HOMETECH à Dakar : testés, remis en état, prix avantageux. Livraison Sénégal.",
  path: "/reconditionne",
});

const PERKS = [
  {
    title: "Contrôlés",
    text: "Chaque article est vérifié avant mise en vente.",
  },
  {
    title: "Prix malins",
    text: "Qualité soignée à un tarif plus accessible que le neuf.",
  },
  {
    title: "Transparent",
    text: "État et informations indiqués clairement sur la fiche.",
  },
  {
    title: "Livraison",
    text: "Dakar et régions — ou retrait en showroom.",
  },
];

const FAQ = [
  {
    q: "Qu’est-ce qu’un produit reconditionné ?",
    a: "Un appareil ou un meuble remis en état après contrôle. Il n’est pas neuf, mais fonctionne correctement et est proposé à un meilleur prix.",
  },
  {
    q: "Y a-t-il une différence avec le déstockage ?",
    a: "Le déstockage concerne souvent des produits neufs en fin de série ou surplus. Le reconditionné a été testé / remis en état. Les deux peuvent coexister selon le stock.",
  },
  {
    q: "Puis-je voir le produit avant d’acheter ?",
    a: "Oui : venez en showroom, ou contactez-nous sur WhatsApp pour confirmer disponibilité et état.",
  },
];

export default async function ReconditionnePage() {
  const [products, site] = await Promise.all([
    api.getProducts({ condition: "reconditionne", per_page: "48", page: "1" }).catch(() => []),
    getSite(),
  ]);

  const count = products.length;
  const whatsappHref = waLink(
    "Bonjour, je cherche un produit reconditionné. Pouvez-vous m’aider ?",
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
              <li>
                <Link href="/produits" className="hover:text-[var(--accent-primary)]">
                  Produits
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li style={{ color: "var(--text-primary)" }}>Reconditionné</li>
            </ol>
          </nav>

          <p
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--accent-primary)" }}
          >
            Bonnes affaires
          </p>
          <h1
            className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl lg:text-[2.75rem]"
            style={{ color: "var(--text-primary)" }}
          >
            Produits reconditionnés
          </h1>
          <p
            className="mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            Électroménager et mobilier remis en état, contrôlés et proposés à prix avantageux à Dakar
            — idéal pour équiper sans surpayer.
          </p>
          <span
            className="mt-5 block h-1 w-16 rounded-full"
            style={{ background: "var(--accent-primary)" }}
            aria-hidden
          />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold"
              style={{ borderColor: "var(--border-light)", color: "var(--text-primary)" }}
            >
              {count} produit{count !== 1 ? "s" : ""}
            </span>
            <Link
              href="/destockage"
              className="text-sm font-bold hover:underline"
              style={{ color: "var(--accent-primary)" }}
            >
              Voir aussi le déstockage →
            </Link>
            <Link
              href="/promotions"
              className="text-sm font-semibold hover:underline"
              style={{ color: "var(--text-secondary)" }}
            >
              Promotions
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map((p) => (
            <li
              key={p.title}
              className="rounded-2xl border bg-[var(--body-bg)] px-5 py-4 shadow-sm"
              style={{ borderColor: "var(--border-light)" }}
            >
              <p className="text-base font-extrabold" style={{ color: "var(--accent-primary)" }}>
                {p.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {p.text}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-14 md:px-6 md:pb-20">
        {count > 0 ? (
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
                  Catalogue reconditionné
                </h2>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  Sélection actuelle — stock limité, sous réserve de disponibilité.
                </p>
              </div>
              <Link
                href="/produits"
                className="text-sm font-bold hover:underline"
                style={{ color: "var(--accent-primary)" }}
              >
                Tout le catalogue →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : (
          <section
            className="rounded-2xl border bg-[var(--body-bg)] px-6 py-12 text-center shadow-sm md:px-10 md:py-16"
            style={{ borderColor: "var(--border-light)" }}
          >
            <span
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-extrabold text-white"
              style={{ background: "var(--accent-primary)" }}
              aria-hidden
            >
              ✓
            </span>
            <h2 className="mt-5 text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
              Aucun produit reconditionné pour le moment
            </h2>
            <p
              className="mx-auto mt-3 max-w-lg text-sm leading-relaxed md:text-base"
              style={{ color: "var(--text-secondary)" }}
            >
              Le stock change régulièrement. Explorez le déstockage, les promotions, ou contactez-nous
              : on vous prévient dès qu’un article correspondant arrive.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/destockage"
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: "var(--accent-primary)" }}
              >
                Voir le déstockage
              </Link>
              <Link
                href="/promotions"
                className="inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-bold"
                style={{ borderColor: "var(--border-light)", color: "var(--text-primary)" }}
              >
                Promotions
              </Link>
              <Link
                href="/produits"
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: "var(--text-primary)" }}
              >
                Catalogue neuf
              </Link>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-bold"
                  style={{ borderColor: "var(--border-light)", color: "var(--text-primary)" }}
                >
                  WhatsApp
                </a>
              ) : null}
            </div>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-2">
          <div
            className="rounded-2xl border bg-[var(--body-bg)] p-6 shadow-sm md:p-7"
            style={{ borderColor: "var(--border-light)" }}
          >
            <h2 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
              Pourquoi choisir le reconditionné ?
            </h2>
            <ul className="mt-4 space-y-3">
              {[
                "Budget maîtrisé sans renoncer à un équipement fiable",
                "Moins de gaspillage : une seconde vie aux appareils et meubles",
                "Conseil magasin ou WhatsApp pour bien choisir selon votre usage",
                "Retrait showroom ou livraison selon disponibilité",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: "var(--accent-primary)" }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-2xl border bg-[var(--body-bg)] p-6 shadow-sm md:p-7"
            style={{ borderColor: "var(--border-light)" }}
          >
            <h2 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
              Questions fréquentes
            </h2>
            <dl className="mt-4 space-y-5">
              {FAQ.map((f) => (
                <div key={f.q}>
                  <dt className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {f.q}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {f.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
            Continuer vos achats
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/destockage", label: "Déstockage", hint: "Fin de série & surplus" },
              { href: "/promotions", label: "Promotions", hint: "Offres du moment" },
              { href: "/showrooms", label: "Showrooms", hint: "Voir avant d’acheter" },
              { href: "/comment-commander", label: "Comment commander", hint: "Étapes & paiement" },
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

        <section
          className="overflow-hidden rounded-2xl px-6 py-8 text-white md:px-10 md:py-10"
          style={{ background: "var(--footer-bg-primary, #232323)" }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-xl font-extrabold md:text-2xl">Un modèle précis en tête ?</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70 md:text-base">
                Dites-nous ce que vous cherchez : on vérifie le stock reconditionné, le déstockage ou
                une alternative neuve.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white"
                  style={{ background: "var(--accent-primary)" }}
                >
                  WhatsApp
                </a>
              ) : null}
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-2.5 text-sm font-bold text-white hover:border-white"
              >
                Contact
              </Link>
              <Link
                href="/devis"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Demander un devis
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
