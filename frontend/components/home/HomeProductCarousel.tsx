"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { Product } from "@/lib/api";
import { imageUrl } from "@/lib/api";
import { useCart } from "@/components/CartProvider";
import ProductQuickView from "@/components/home/ProductQuickView";

export default function HomeProductCarousel({
  title,
  bannerImage,
  bannerLink,
  products,
}: {
  title?: string | null;
  bannerImage?: string | null;
  bannerLink?: string | null;
  products: Product[];
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [quick, setQuick] = useState<Product | null>(null);
  const { addToCart } = useCart();
  const [busyId, setBusyId] = useState<number | null>(null);

  function scrollBy(dir: number) {
    scroller.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  }

  async function onAdd(p: Product) {
    if (p.effective_price == null && p.price == null) return;
    setBusyId(p.id);
    try {
      await addToCart(p.id, 1);
    } finally {
      setBusyId(null);
    }
  }

  if (!products.length && !bannerImage) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight text-brand-black md:text-3xl">
          {title || "Produits"}
        </h2>
        <div className="flex items-center gap-2">
          {bannerLink ? (
            <Link href={bannerLink} className="text-sm font-semibold text-brand-orange hover:underline">
              Voir tout
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-brand-black md:flex"
            aria-label="Précédent"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-brand-black md:flex"
            aria-label="Suivant"
          >
            ›
          </button>
        </div>
      </div>

      {bannerImage ? (
        <Link href={bannerLink || "#"} className="relative mb-5 block aspect-[21/5] overflow-hidden rounded-2xl bg-[#ddd]">
          <Image src={bannerImage} alt={title || ""} fill className="object-cover" sizes="100vw" loading="lazy" />
        </Link>
      ) : null}

      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => {
          const cover = product.images?.[0];
          const effective = product.effective_price ?? product.price;
          const compare = product.compare_at_price;
          return (
            <article
              key={product.id}
              className="w-[220px] shrink-0 snap-start overflow-hidden rounded-2xl bg-white shadow-sm sm:w-[240px]"
            >
              <div className="relative aspect-[4/3] bg-[#ddd]">
                <Link href={`/produits/${product.slug}`}>
                  {cover ? (
                    <Image
                      src={imageUrl(cover.path)}
                      alt={product.name}
                      fill
                      loading="lazy"
                      className="object-cover"
                      sizes="240px"
                    />
                  ) : null}
                </Link>
                {product.badge_label ? (
                  <span className="absolute left-2 top-2 rounded-full bg-brand-orange px-2 py-0.5 text-[11px] font-bold text-white">
                    {product.badge_label}
                  </span>
                ) : null}
              </div>
              <div className="p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-brand-black/45">
                  {product.category?.name}
                </p>
                <Link href={`/produits/${product.slug}`} className="mt-0.5 line-clamp-2 text-sm font-bold text-brand-black">
                  {product.name}
                </Link>
                <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
                  <p className="text-sm font-bold text-brand-orange">
                    {effective != null ? `${effective.toLocaleString("fr-FR")} FCFA` : "Sur devis"}
                  </p>
                  {compare ? (
                    <p className="text-[11px] text-brand-black/40 line-through">
                      {compare.toLocaleString("fr-FR")} FCFA
                    </p>
                  ) : null}
                </div>
                <div className="mt-3 flex gap-2">
                  {effective != null ? (
                    <button
                      type="button"
                      disabled={busyId === product.id}
                      onClick={() => onAdd(product)}
                      className="flex-1 rounded-full bg-brand-black px-2 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60"
                    >
                      Panier
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setQuick(product)}
                    className="rounded-full border border-black/10 px-2 py-1.5 text-[11px] font-semibold text-brand-black"
                  >
                    Aperçu
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {quick ? <ProductQuickView product={quick} onClose={() => setQuick(null)} /> : null}
    </section>
  );
}
