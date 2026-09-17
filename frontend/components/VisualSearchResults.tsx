"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/lib/api";
import { VISUAL_SEARCH_KEY } from "@/lib/visualSearch";

type Stored = {
  preview: string;
  products: Product[];
  keywords: string[];
  image_url: string;
  fallback: boolean;
};

export default function VisualSearchResults() {
  const [data, setData] = useState<Stored | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(VISUAL_SEARCH_KEY);
      if (raw) setData(JSON.parse(raw) as Stored);
    } catch {
      setData(null);
    }
  }, []);

  if (!data) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm text-brand-black/60">
        Aucune recherche image en cours.{" "}
        <Link href="/" className="font-semibold text-brand-orange">
          Retour à l’accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
        <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-[#eee]">
          <Image
            src={data.preview || data.image_url}
            alt="Image recherchée"
            fill
            unoptimized
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-brand-black">Recherche par image</p>
          <p className="mt-1 text-sm text-brand-black/60">
            {data.keywords?.length
              ? `Mots-clés détectés : ${data.keywords.slice(0, 6).join(", ")}`
              : "Produits suggérés à partir de votre photo."}
          </p>
        </div>
        <Link
          href="/produits"
          className="rounded-full border border-brand-black/15 px-4 py-2 text-sm font-semibold"
        >
          Voir tout
        </Link>
      </div>

      {data.products.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-brand-black/60">
          Aucun produit correspondant.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
