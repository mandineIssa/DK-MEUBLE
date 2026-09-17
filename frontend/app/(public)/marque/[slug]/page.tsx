import ProductCard from "@/components/ProductCard";
import { api, imageUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const data = await api.getBrand(params.slug);
    return {
      title: data.brand.meta_title || data.brand.name,
      description: data.brand.meta_description || data.brand.description || undefined,
    };
  } catch {
    return { title: "Marque" };
  }
}

export default async function MarquePage({ params }: { params: { slug: string } }) {
  const data = await api.getBrand(params.slug).catch(() => null);
  if (!data) {
    return <p className="p-8 text-center">Marque introuvable</p>;
  }

  return (
    <div className="bg-[#ececec]">
      <section className="bg-brand-black text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-10 md:px-6">
          {data.brand.logo_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl(data.brand.logo_path)} alt="" className="h-16 rounded bg-white p-2" />
          ) : null}
          <div>
            <h1 className="text-3xl font-extrabold">{data.brand.name}</h1>
            {data.brand.description && (
              <p className="mt-2 max-w-2xl text-white/75">{data.brand.description}</p>
            )}
            <p className="mt-2 text-sm text-white/60">{data.meta.total} produits</p>
          </div>
        </div>
      </section>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 md:grid-cols-3 md:px-6 lg:grid-cols-4">
        {data.products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
