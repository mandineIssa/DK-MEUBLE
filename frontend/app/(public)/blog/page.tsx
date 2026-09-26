import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Guides & conseils — Meubles et électroménager",
  description:
    "Conseils pratiques pour choisir meubles, mobilier de bureau et électroménager à Dakar. Guides DK HOMETECH.",
  path: "/blog",
});

const GUIDES = [
  {
    href: "/comment-commander",
    title: "Comment commander chez DK HOMETECH",
    text: "Site, WhatsApp, showroom ou devis : le parcours d’achat étape par étape.",
  },
  {
    href: "/livraison",
    title: "Livraison à Dakar et au Sénégal",
    text: "Délais indicatifs, retrait showroom et conseils pour la réception.",
  },
  {
    href: "/paiement",
    title: "Payer en Wave, Orange Money ou cash",
    text: "Modes de paiement acceptés et bonnes pratiques de sécurité.",
  },
  {
    href: "/retours",
    title: "Retours et remboursements",
    text: "Conditions claires pour échanger ou retourner un produit.",
  },
  {
    href: "/showrooms",
    title: "Visiter nos showrooms",
    text: "Voir et essayer avant d’acheter — adresses et horaires.",
  },
  {
    href: "/services",
    title: "Nos services",
    text: "Installation, réparation et accompagnement autour de vos équipements.",
  },
];

export default function BlogPage() {
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
              <li style={{ color: "var(--text-primary)" }}>Guides</li>
            </ol>
          </nav>
          <p
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--accent-primary)" }}
          >
            Conseils
          </p>
          <h1
            className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl"
            style={{ color: "var(--text-primary)" }}
          >
            Guides & conseils
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Des pages utiles pour bien choisir, commander et recevoir vos meubles et appareils à
            Dakar — sans contenu artificiel.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:pb-20">
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g) => (
            <li key={g.href}>
              <Link
                href={g.href}
                className="flex h-full flex-col rounded-2xl border bg-[var(--body-bg)] p-5 shadow-sm transition hover:border-[var(--accent-primary)]"
                style={{ borderColor: "var(--border-light)" }}
              >
                <h2 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                  {g.title}
                </h2>
                <p className="mt-2 grow text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {g.text}
                </p>
                <span className="mt-4 text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
                  Lire →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
