import Image from "next/image";
import Link from "next/link";
import type { HomepageItem } from "@/lib/api";

export default function HomeCategoryGrid({
  title,
  items,
}: {
  title?: string | null;
  items: HomepageItem[];
}) {
  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      {title ? (
        <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-brand-black md:text-3xl">
          {title}
        </h2>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {items.map((item) => {
          const href = item.link_url || (item.category ? `/categorie/${item.category.slug}` : "#");
          return (
            <Link
              key={item.id}
              href={href}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#ddd]"
            >
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.title || "Catégorie"}
                  fill
                  loading="lazy"
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <p className="absolute bottom-3 left-3 right-3 text-sm font-bold text-white md:text-base">
                {item.title || item.category?.name}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
