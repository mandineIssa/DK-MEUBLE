import Image from "next/image";
import Link from "next/link";
import { api, imageUrl } from "@/lib/api";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: 'Nos réalisations',
  description:
    'Réalisations et aménagements DK HOMETECH à Dakar.',
  path: '/realisations',
});

export default async function RealisationsPage() {
  const [items, page] = await Promise.all([
    api.getRealizations().catch(() => []),
    api.getPage("realizations").catch(() => ({ blocks: {} as Record<string, any> })),
  ]);

  const hero = (page.blocks.hero || {}) as Record<string, string>;
  const cta = (page.blocks.cta || {}) as Record<string, string>;

  return (
    <div className="bg-[#ececec]">
      <section className="bg-brand-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <p className="text-sm font-medium uppercase tracking-wider text-brand-orange">
            {hero.eyebrow || "Portfolio"}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
            {hero.title || "Nos réalisations"}
          </h1>
          {hero.subtitle && (
            <p className="mt-3 max-w-2xl text-white/75">{hero.subtitle}</p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={imageUrl(item.image_url)}
                  alt={item.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {item.tag && (
                  <span className="absolute left-3 top-3 rounded-full bg-brand-orange px-3 py-1 text-xs font-semibold text-white">
                    {item.tag}
                  </span>
                )}
              </div>
              <div className="p-5">
                <h2 className="font-bold text-brand-black">{item.title}</h2>
                {item.description && (
                  <p className="mt-2 text-sm leading-relaxed text-brand-black/65">
                    {item.description}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>

        {!items.length && (
          <p className="rounded-2xl bg-white p-8 text-center text-brand-black/50 shadow-sm">
            Aucune réalisation publiée pour le moment.
          </p>
        )}

        <div className="mt-10 rounded-2xl bg-brand-black px-6 py-8 text-center text-white md:px-10">
          <p className="text-lg font-bold">{cta.title || "Un projet à réaliser ?"}</p>
          <p className="mt-2 text-sm text-white/70">
            {cta.text || "Parlez-nous de vos besoins — nous vous répondons rapidement."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/devis"
              className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-orange-dark"
            >
              Demander un devis
            </Link>
            <Link
              href="/contact"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-black"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
