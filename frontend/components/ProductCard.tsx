"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Product, imageUrl } from "@/lib/api";
import { useCart } from "@/components/CartProvider";
import ProductContactActions from "@/components/ProductContactActions";

export default function ProductCard({ product }: { product: Product }) {
  const cover = product.images?.[0];
  const effective = product.effective_price ?? product.price;
  const compare = product.compare_at_price;
  const priceLabel = effective
    ? `${effective.toLocaleString("fr-FR")} FCFA`
    : "Sur devis";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { addToCart } = useCart();

  async function onAdd() {
    if (effective == null) return;
    setBusy(true);
    setError("");
    try {
      await addToCart(product.id, 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className="group relative rounded-xl bg-[var(--body-bg)] transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ border: "1px solid var(--border-light)" }}
    >
      <Link href={`/produits/${product.slug}`} className="block">
        <div
          className="relative aspect-[4/3] overflow-hidden rounded-t-xl"
          style={{ background: "var(--content-bg-alt)" }}
        >
          {cover ? (
            <Image
              src={imageUrl(cover.path)}
              alt={product.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div
              className="flex h-full items-center justify-center text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Photo à venir
            </div>
          )}
          {product.badge_label && (
            <span
              className="absolute left-3 top-3 rounded-sm px-2.5 py-1 text-xs font-bold text-white"
              style={{ background: "var(--badge-bg)" }}
            >
              {product.badge_label}
            </span>
          )}
        </div>
        <div className="px-4 pt-3">
          {product.brand?.name && (
            <p
              className="text-[11px] font-medium uppercase tracking-wide"
              style={{ color: "var(--text-secondary)" }}
            >
              {product.brand.name}
            </p>
          )}
          <p className="font-bold" style={{ color: "var(--text-primary)" }}>
            {product.name}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <p className="price-current text-sm">{priceLabel}</p>
            {compare ? (
              <p className="price-compare text-xs">
                {compare.toLocaleString("fr-FR")} FCFA
              </p>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2 px-4 pb-4 pt-3">
        {effective != null ? (
          <button
            type="button"
            disabled={busy}
            onClick={onAdd}
            className="btn-accent rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
          >
            {busy ? "…" : "Panier"}
          </button>
        ) : (
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Sur devis
          </span>
        )}
        <ProductContactActions productId={product.id} productName={product.name} />
      </div>
      {error && (
        <p className="px-4 pb-3 text-xs" style={{ color: "var(--danger-color)" }}>
          {error}
        </p>
      )}
    </article>
  );
}
