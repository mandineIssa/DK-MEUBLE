import QuoteForm from "@/components/QuoteForm";
import { api } from "@/lib/api";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: 'Demande de devis',
  description:
    'Demandez un devis électroménager ou meubles à DK HOMETECH — Dakar, livraison Sénégal.',
  path: '/devis',
});

export default async function QuotePage({
  searchParams,
}: {
  searchParams: { product?: string; qty?: string };
}) {
  const page = await api.getPage("devis").catch(() => ({ blocks: {} as Record<string, any> }));
  const hero = (page.blocks.hero || {}) as Record<string, string>;
  const productId = searchParams.product ? Number(searchParams.product) : undefined;
  const initialQty = searchParams.qty ? Number(searchParams.qty) : 1;

  return (
    <div className="bg-[#ececec]">
      <section className="bg-brand-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
          <p className="text-sm font-medium uppercase tracking-wider text-brand-orange">
            {hero.eyebrow || "Devis"}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">
            {hero.title || "Demande de devis"}
          </h1>
          <p className="mt-3 max-w-2xl text-white/75">
            {hero.subtitle ||
              "Particulier ou entreprise : décrivez votre besoin et nous vous recontactons avec une proposition adaptée."}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
        <div className="rounded-2xl bg-[#f7f7f7] p-5 shadow-sm md:p-8">
          <QuoteForm productId={productId} initialQty={initialQty} />
        </div>
      </div>
    </div>
  );
}
