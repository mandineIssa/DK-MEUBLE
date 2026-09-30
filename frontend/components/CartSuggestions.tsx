"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { aiApi, type AiProduct } from "@/lib/ai";
import type { Product } from "@/lib/api";

export default function CartSuggestions({ productIds }: { productIds: number[] }) {
  const [products, setProducts] = useState<AiProduct[]>([]);
  const key = productIds.join(",");

  useEffect(() => {
    if (!productIds.length) {
      setProducts([]);
      return;
    }
    aiApi.cartSuggestions(productIds).then((result) => setProducts(result.products || [])).catch(() => setProducts([]));
  }, [key]);

  if (!products.length) return null;

  return (
    <section className="mt-6">
      <h2 className="text-xl font-extrabold text-brand-black">Pour compléter votre achat</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <ProductCard key={product.id} product={product as Product} />
        ))}
      </div>
    </section>
  );
}
