import Link from "next/link";
import { api, imageUrl } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: 'Marques',
  description:
    'Marques électroménager et meubles disponibles chez DK HOMETECH à Dakar.',
  path: '/marques',
});

export default async function MarquesPage() {
  const brands = await api.getBrands().catch(() => []);

  return (
    <div className="bg-[#ececec]">
      <section className="bg-brand-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
          <h1 className="text-3xl font-extrabold">Marques</h1>
        </div>
      </section>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 md:grid-cols-3 md:px-6 lg:grid-cols-4">
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`/marque/${b.slug}`}
            className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-sm hover:shadow-md"
          >
            {b.logo_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl(b.logo_path)} alt={b.name} className="h-16 object-contain" />
            ) : (
              <span className="text-2xl font-extrabold text-brand-orange">{b.name.slice(0, 1)}</span>
            )}
            <span className="font-bold">{b.name}</span>
            <span className="text-xs text-brand-black/50">{b.products_count ?? 0} produits</span>
          </Link>
        ))}
        {brands.length === 0 && (
          <p className="col-span-full text-center text-brand-black/50">Aucune marque pour le moment.</p>
        )}
      </div>
    </div>
  );
}
