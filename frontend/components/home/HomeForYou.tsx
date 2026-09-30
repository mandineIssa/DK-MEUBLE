"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { aiApi } from "@/lib/ai";
import type { Product } from "@/lib/api";
import { readViewed, visitorId } from "@/lib/viewedProducts";

export default function HomeForYou() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const slugs = readViewed();
    const visitor = visitorId();
    if (!slugs.length && !visitor) return;
    aiApi
      .forYou(slugs, visitor)
      .then((data) => setProducts((data.products || []) as Product[]))
      .catch(() => setProducts([]));
  }, []);

  if (!products.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h2 className="text-2xl font-extrabold text-brand-black">Pour vous</h2>
      <p className="mt-1 text-sm text-brand-black/70">
        À partir des fiches que vous avez consultées. Uniquement des produits publiés.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
