"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { aiApi, type AiProduct } from "@/lib/ai";
import type { Product } from "@/lib/api";

const LABELS: Array<{ key: "also" | "similar" | "complement" | "budget"; title: string }> = [
  { key: "also", title: "Vous pourriez aussi aimer" },
  { key: "similar", title: "Produits similaires" },
  { key: "complement", title: "Produits complémentaires" },
  { key: "budget", title: "Dans votre budget" },
];

export default function ProductRecommendations({ slug, outOfStock = false }: { slug: string; outOfStock?: boolean }) {
  const [sets, setSets] = useState<Record<string, AiProduct[]>>({});

  useEffect(() => {
    aiApi.recommendations(slug).then(setSets).catch(() => setSets({}));
  }, [slug]);

  const alternatives = sets.similar || [];

  return (
    <div className="mt-8 space-y-8">
      {outOfStock && alternatives.length > 0 ? (
        <section>
          <h2 className="text-xl font-extrabold text-brand-black">Ce produit est actuellement indisponible. Voici des modèles similaires disponibles.</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {alternatives.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product as Product} />
            ))}
          </div>
        </section>
      ) : null}
      {LABELS.map((block) => {
        const products = (sets[block.key] || []).filter((product, index, list) => list.findIndex((row) => row.id === product.id) === index);
        if (!products.length) return null;
        if (block.key === "similar" && outOfStock) return null;
        return (
          <section key={block.key}>
            <h2 className="text-xl font-extrabold text-brand-black">{block.title}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {products.slice(0, 4).map((product) => (
                <ProductCard key={`${block.key}-${product.id}`} product={product as Product} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
