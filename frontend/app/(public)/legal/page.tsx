import Link from "next/link";
import { api } from "@/lib/api";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: 'Mentions légales & CGV',
  description:
    'Mentions légales et conditions générales de vente — DK HOMETECH.',
  path: '/legal',
});

export default async function LegalPage() {
  const settings = await api.getSettings().catch(() => null);
  const legal = settings?.legal;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Informations légales</h1>
      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-bold">CGV</h2>
        <p className="mt-3 whitespace-pre-line text-sm text-brand-black/70">
          {legal?.cgv || "Textes CGV à renseigner dans Admin → Paramètres."}
        </p>
      </section>
      <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-bold">Mentions légales</h2>
        <p className="mt-3 whitespace-pre-line text-sm text-brand-black/70">
          {legal?.mentions || "Mentions légales à renseigner dans Admin → Paramètres."}
        </p>
      </section>
      <Link href="/" className="mt-6 inline-block text-sm font-semibold text-brand-orange">
        ← Accueil
      </Link>
    </div>
  );
}
