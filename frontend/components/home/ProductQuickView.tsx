"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/api";
import { imageUrl } from "@/lib/api";
import { useCart } from "@/components/CartProvider";

export default function ProductQuickView({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const cover = product.images?.[0];
  const effective = product.effective_price ?? product.price;
  const compare = product.compare_at_price;
  const { addToCart } = useCart();
  const [busy, setBusy] = useState(false);

  async function onAdd() {
    if (effective == null) return;
    setBusy(true);
    try {
      await addToCart(product.id, 1);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-black shadow"
          aria-label="Fermer"
        >
          ×
        </button>
        <div className="relative aspect-[16/10] bg-[#eee]">
          {cover ? (
            <Image src={imageUrl(cover.path)} alt={product.name} fill className="object-cover" sizes="512px" />
          ) : null}
        </div>
        <div className="p-5">
          <p className="text-xs uppercase tracking-wide text-brand-black/45">{product.category?.name}</p>
          <h3 className="mt-1 text-xl font-extrabold text-brand-black">{product.name}</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-lg font-bold text-brand-orange">
              {effective != null ? `${effective.toLocaleString("fr-FR")} FCFA` : "Sur devis"}
            </p>
            {compare ? (
              <p className="text-sm text-brand-black/40 line-through">
                {compare.toLocaleString("fr-FR")} FCFA
              </p>
            ) : null}
          </div>
          {product.short_description ? (
            <p className="mt-3 line-clamp-3 text-sm text-brand-black/70">{product.short_description}</p>
          ) : null}
          <div className="mt-5 flex gap-2">
            {effective != null ? (
              <button
                type="button"
                disabled={busy}
                onClick={onAdd}
                className="flex-1 rounded-full bg-brand-orange py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                Ajouter au panier
              </button>
            ) : null}
            <Link
              href={`/produits/${product.slug}`}
              className="flex-1 rounded-full border border-black/10 py-2.5 text-center text-sm font-bold text-brand-black"
            >
              Voir la fiche
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
