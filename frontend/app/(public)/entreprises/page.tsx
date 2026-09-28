import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import QuoteForm from "@/components/QuoteForm";

export const metadata: Metadata = buildPageMetadata({
  title: "Solutions entreprises",
  description:
    "DK HOMETECH équipe hôtels, restaurants, bureaux, écoles et commerces à Dakar. Devis, livraison et installation au Sénégal.",
  path: "/entreprises",
});

const targets = ["Hôtels", "Restaurants", "Entreprises", "Bureaux", "Écoles", "Commerces", "Résidences"];

export default function EntreprisesPage() {
  return (
    <div className="bg-[#f4f6f8]">
      <section className="bg-white text-brand-black">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-orange">Professionnels</p>
          <h1 className="mt-2 text-4xl font-extrabold">Solutions entreprises</h1>
          <p className="mt-3 max-w-2xl text-brand-black/70">
            Équipement, commandes en volume, devis, livraison, installation et maintenance.
          </p>
        </div>
      </section>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-black">Pour qui</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {targets.map((name) => (
              <li key={name} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-brand-black">
                {name}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-[#5c6570]">
            Le devis reprend le formulaire déjà utilisé sur la boutique. Aucun tarif n’est affiché ici tant qu’il n’est pas confirmé sur une fiche produit.
          </p>
          <Link href="/contact" className="mt-4 inline-flex text-sm font-bold text-brand-orange">
            Parler à un conseiller
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-extrabold text-brand-black">Demander un devis</h2>
          <QuoteForm />
        </div>
      </div>
    </div>
  );
}
