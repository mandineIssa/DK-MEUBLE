import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import JsonLd from "@/components/seo/JsonLd";
import { api, imageUrl } from "@/lib/api";
import {
  buildBrandSchema,
  buildBreadcrumbSchema,
  buildPageMetadata,
  truncateMeta,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const data = await api.getBrand(params.slug);
    return buildPageMetadata({
      title: data.brand.meta_title || `${data.brand.name} | Marque DK HOMETECH`,
      description: truncateMeta(
        data.brand.meta_description ||
          data.brand.description ||
          `Produits ${data.brand.name} disponibles chez DK HOMETECH à Dakar, Sénégal.`
      ),
      path: `/marque/${data.brand.slug}`,
      image: data.brand.logo_path,
    });
  } catch {
    return { title: "Marque", robots: { index: false, follow: true } };
  }
}

export default async function MarquePage({ params }: { params: { slug: string } }) {
  const data = await api.getBrand(params.slug).catch(() => null);
  if (!data) notFound();

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: "Accueil", path: "/" },
            { name: "Marques", path: "/marques" },
            { name: data.brand.name, path: `/marque/${data.brand.slug}` },
          ]),
          buildBrandSchema(data.brand),
        ]}
      />
      <div className="bg-[#ececec]">
        <section className="bg-brand-black text-white">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-10 md:px-6">
            {data.brand.logo_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl(data.brand.logo_path)}
                alt={`Logo ${data.brand.name}`}
                className="h-16 rounded bg-white p-2"
              />
            ) : null}
            <div>
              <h1 className="text-3xl font-extrabold">{data.brand.name}</h1>
              {data.brand.description ? (
                <p className="mt-2 max-w-2xl text-white/75">{data.brand.description}</p>
              ) : null}
              <p className="mt-2 text-sm text-white/60">{data.meta.total} produits</p>
            </div>
          </div>
        </section>
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 md:px-6 md:grid-cols-3 lg:grid-cols-4">
          {data.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </>
  );
}
