import Image from "next/image";
import Link from "next/link";

type BrandTile = {
  id: number;
  name: string;
  slug: string;
  logo_url?: string | null;
  logo_path?: string | null;
};

export default function HomeBrands({
  title,
  brands,
}: {
  title?: string | null;
  brands: BrandTile[];
}) {
  if (!brands.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl font-extrabold tracking-tight text-brand-black md:text-3xl">
          {title || "Nos marques"}
        </h2>
        <Link href="/marques" className="text-sm font-semibold text-brand-orange hover:underline">
          Toutes les marques
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
        {brands.map((b) => {
          const src = b.logo_url || b.logo_path;
          return (
            <Link
              key={b.id}
              href={`/marque/${b.slug}`}
              className="relative flex h-16 w-28 items-center justify-center grayscale transition hover:grayscale-0 md:h-20 md:w-36"
            >
              {src ? (
                <Image src={src} alt={b.name} fill className="object-contain" sizes="144px" loading="lazy" />
              ) : (
                <span className="text-sm font-bold text-brand-black/70">{b.name}</span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
