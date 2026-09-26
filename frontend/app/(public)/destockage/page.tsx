import Link from "next/link";
import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import { api } from "@/lib/api";
import { getSite, waLink } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Déstockage meubles & électroménager à Dakar",
  description:
    "Déstockage DK HOMETECH à Dakar : fin de série, surplus et bonnes affaires sur meubles et électroménager. Livraison Sénégal.",
  path: "/destockage",
});

const PERKS = [
  {
    title: "Prix cassés",
    text: "Fin de série et surplus à tarifs avantageux.",
  },
  {
    title: "Stock limité",
    text: "Les quantités partent vite — premier arrivé, premier servi.",
  },
  {
    title: "Qualité",
    text: "Produits sélectionnés, informations claires sur chaque fiche.",
  },
  {
    title: "Livraison",
    text: "Dakar et régions — ou retrait en showroom.",
  },
];

const FAQ = [
  {
    q: "Qu’est-ce que le déstockage ?",
    a: "Des produits souvent neufs en fin de série, surplus d’entrepôt ou opérations spéciales, proposés à prix réduit le temps du stock.",
  },
  {
    q: "Différence avec le reconditionné ?",
    a: "Le reconditionné a été contrôlé / remis en état. Le déstockage vise surtout des opportunités de stock (fin de série, surplus). Les deux rayons peuvent coexister.",
  },
  {
    q: "Les retours sont-ils possibles ?",
    a: "Certaines offres « ni repris ni échangés » sont signalées sur la fiche. Sinon, les conditions générales de retours s’appliquent — voir la page Retours.",
  },
];

export default async function DestockagePage() {
  const [products, site] = await Promise.all([
    api.getProducts({ clearance: "1", per_page: "48", page: "1" }).catch(() => []),
    getSite(),
  ]);

  const count = products.length;
  const whatsappHref = waLink(
    "Bonjour, je m’intéresse au déstockage. Pouvez-vous m’indiquer les disponibilités ?",
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
              <li style={{ color: "var(--text-primary)" }}>Déstockage</li>
            </ol>
          </nav>

          <p
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--accent-primary)" }}
          >
            Offres
          </p>
          <h1
            className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl lg:text-[2.75rem]"
            style={{ color: "var(--text-primary)" }}
          >
            Déstockage
          </h1>
          <p
            className="mt-4 max-w-2xl text-base leading-relaxed md:text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            Fin de série, surplus et opportunités sur meubles et électroménager à Dakar — pour
            équiper malin tant que le stock dure.
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
              href="/reconditionne"
              className="text-sm font-bold hover:underline"
              style={{ color: "var(--accent-primary)" }}
            >
              Voir aussi le reconditionné →
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
                  Offres de déstockage
                </h2>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  Sélection actuelle — quantités limitées.
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
              %
            </span>
            <h2 className="mt-5 text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
              Aucun produit en déstockage pour le moment
            </h2>
            <p
              className="mx-auto mt-3 max-w-lg text-sm leading-relaxed md:text-base"
              style={{ color: "var(--text-secondary)" }}
            >
              Les opérations de déstockage sont ponctuelles. Consultez les promotions, le
              reconditionné, ou écrivez-nous : on vous alerte dès qu’une offre arrive.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/promotions"
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: "var(--accent-primary)" }}
              >
                Voir les promotions
              </Link>
              <Link
                href="/reconditionne"
                className="inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-bold"
                style={{ borderColor: "var(--border-light)", color: "var(--text-primary)" }}
              >
                Reconditionné
              </Link>
              <Link
                href="/produits"
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: "var(--text-primary)" }}
              >
                Catalogue
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
              Bien profiter du déstockage
            </h2>
            <ul className="mt-4 space-y-3">
              {[
                "Vérifiez l’état (neuf / promo) et les conditions sur la fiche produit",
                "Stock limité : validez rapidement si le modèle vous convient",
                "Demandez conseil WhatsApp ou en showroom avant un gros volume",
                "Comparez avec les promotions et le reconditionné selon votre budget",
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
              { href: "/reconditionne", label: "Reconditionné", hint: "Contrôlé, prix malin" },
              { href: "/promotions", label: "Promotions", hint: "Offres du moment" },
              { href: "/showrooms", label: "Showrooms", hint: "Voir avant d’acheter" },
              { href: "/retours", label: "Retours", hint: "Conditions d’échange" },
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
              <h2 className="text-xl font-extrabold md:text-2xl">Cherchez un modèle en déstockage ?</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70 md:text-base">
                Indiquez le produit ou votre budget : on vérifie les opportunités en cours et les
                alternatives.
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
