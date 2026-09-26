import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { api } from "@/lib/api";
import { getSite, waLink } from "@/lib/site";
import ShowroomsExplorer from "@/components/showrooms/ShowroomsExplorer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: 'Showrooms à Dakar',
  description:
    'Retrouvez les showrooms DK HOMETECH à Dakar — essayer, conseiller, retirer.',
  path: '/showrooms',
});

const PERKS = [
  {
    title: "Essayer en magasin",
    text: "Voir et comparer les modèles avant d’acheter.",
    icon: (
      <path d="M3 9l9-7 9 7v11a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9Z" />
    ),
  },
  {
    title: "Conseil expert",
    text: "Notre équipe vous oriente selon votre budget et votre espace.",
    icon: (
      <path d="M12 3a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4Zm-7 16a7 7 0 0 1 14 0v1H5v-1Z" />
    ),
  },
  {
    title: "Retrait gratuit",
    text: "Récupérez votre commande sans frais de livraison.",
    icon: (
      <path d="M3 7h11v10H3V7Zm11 3h4l3 3v4h-7V10Z" />
    ),
  },
  {
    title: "Paiement sur place",
    text: "Wave, Orange Money ou cash selon disponibilité.",
    icon: (
      <path d="M4 7h16v10H4V7Zm2 2v2h4V9H6Zm0 4v2h8v-2H6Z" />
    ),
  },
];

export default async function ShowroomsPage() {
  const [showrooms, site] = await Promise.all([
    api.getShowrooms().catch(() => []),
    getSite(),
  ]);

  const cities = Array.from(
    new Set(showrooms.map((s) => s.city).filter((c): c is string => Boolean(c)))
  );
  const whatsappHref = waLink(
    "Bonjour, je souhaite des informations sur vos showrooms / horaires.",
    site.whatsapp
  );

  return (
    <div className="bg-[var(--content-bg-alt)]">
      {/* Hero compact — thème clair */}
      <section
        className="border-b bg-[var(--body-bg)]"
        style={{ borderColor: "var(--border-light)" }}
      >
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <nav className="mb-3 text-xs font-medium" aria-label="Fil d’Ariane">
            <ol className="flex flex-wrap items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <li>
                <Link href="/" className="hover:text-[var(--accent-primary)]">
                  Accueil
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li style={{ color: "var(--text-primary)" }}>Showrooms</li>
            </ol>
          </nav>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: "var(--accent-primary)" }}
              >
                Points de vente
              </p>
              <h1
                className="mt-1.5 text-3xl font-extrabold tracking-tight md:text-4xl"
                style={{ color: "var(--text-primary)" }}
              >
                Nos showrooms
              </h1>
              <p className="mt-2 text-sm leading-relaxed md:text-base" style={{ color: "var(--text-secondary)" }}>
                Venez découvrir électroménager et mobilier en magasin — conseil, retrait et
                paiement sur place.
              </p>
              <span
                className="mt-4 block h-1 w-14 rounded-full"
                style={{ background: "var(--accent-primary)" }}
                aria-hidden
              />
            </div>

            {showrooms.length > 0 ? (
              <ul className="flex flex-wrap gap-3">
                <li
                  className="rounded-xl border px-4 py-2.5 text-center"
                  style={{ borderColor: "var(--border-light)", background: "var(--content-bg-alt)" }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                    Magasins
                  </p>
                  <p className="text-xl font-extrabold" style={{ color: "var(--accent-primary)" }}>
                    {showrooms.length}
                  </p>
                </li>
                {cities.length > 0 ? (
                  <li
                    className="rounded-xl border px-4 py-2.5 text-center"
                    style={{ borderColor: "var(--border-light)", background: "var(--content-bg-alt)" }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                      Ville{cities.length > 1 ? "s" : ""}
                    </p>
                    <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                      {cities.slice(0, 2).join(", ")}
                      {cities.length > 2 ? ` +${cities.length - 2}` : ""}
                    </p>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map((p) => (
            <li
              key={p.title}
              className="flex gap-3 rounded-2xl border bg-[var(--body-bg)] p-4 shadow-sm"
              style={{ borderColor: "var(--border-light)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                style={{ background: "var(--accent-primary)" }}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  {p.icon}
                </svg>
              </span>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {p.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {p.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Contenu principal */}
      <div className="mx-auto max-w-7xl px-4 pb-14 md:px-6 md:pb-16">
        {showrooms.length === 0 ? (
          <div
            className="rounded-2xl border bg-[var(--body-bg)] px-6 py-16 text-center shadow-sm"
            style={{ borderColor: "var(--border-light)" }}
          >
            <p className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
              Aucun showroom publié
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--text-secondary)" }}>
              Les points de vente seront bientôt disponibles. Contactez-nous pour un rendez-vous
              ou une livraison.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/contact"
                className="rounded-full px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: "var(--accent-primary)" }}
              >
                Nous contacter
              </Link>
              <Link
                href="/produits"
                className="rounded-full border px-5 py-2.5 text-sm font-bold"
                style={{ borderColor: "var(--text-primary)", color: "var(--text-primary)" }}
              >
                Voir les produits
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>
                  Trouver un magasin
                </h2>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  Sélectionnez un showroom pour afficher la carte et l’itinéraire.
                </p>
              </div>
              {showrooms.length > 1 ? (
                <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {showrooms.length} points de vente
                </p>
              ) : null}
            </div>

            <ShowroomsExplorer showrooms={showrooms} />
          </>
        )}

        {/* CTA */}
        <section
          className="mt-10 overflow-hidden rounded-2xl px-6 py-8 text-white md:px-10 md:py-9"
          style={{ background: "var(--footer-bg-primary, #232323)" }}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-lg">
              <h2 className="text-xl font-extrabold md:text-2xl">Avant de vous déplacer ?</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Vérifiez la disponibilité d’un produit, prenez rendez-vous ou demandez un devis —
                on vous répond rapidement.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white"
                >
                  WhatsApp
                </a>
              ) : null}
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: "var(--accent-primary)" }}
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
