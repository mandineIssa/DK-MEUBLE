"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Product, imageUrl } from "@/lib/api";
import { useCart } from "@/components/CartProvider";
import ProductContactActions from "@/components/ProductContactActions";
import FavoriteButton from "@/components/FavoriteButton";
import { useCompare } from "@/components/CompareProvider";
import ProductLink from "@/components/ProductLink";
import StockBadge from "@/components/StockBadge";

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
  const compareList = useCompare();
  const router = useRouter();

  async function onAdd(goCheckout = false) {
    if (effective == null) return;
    setBusy(true);
    setError("");
    try {
      await addToCart(product.id, 1);
      if (goCheckout) router.push("/commande");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className="group relative w-full min-w-0 overflow-hidden rounded-xl bg-[var(--body-bg)] transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ border: "1px solid var(--border-light)" }}
    >
      <ProductLink href={`/produits/${product.slug}`} label={product.name} className="block min-w-0">
        <div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl"
          style={{ background: "var(--content-bg-alt)" }}
        >
          {cover ? (
            <Image
              src={imageUrl(cover.path)}
              alt={product.name}
              fill
              className="object-contain transition duration-500 group-hover:scale-105"
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
          <span className="absolute bottom-3 left-3 z-10">
            <StockBadge quantity={product.stock_quantity} customizable={product.is_customizable} />
          </span>
          {product.badge_label && (
            <span
              className="absolute left-3 top-3 rounded-sm px-2.5 py-1 text-xs font-bold text-white"
              style={{ background: "var(--badge-bg)" }}
            >
              {product.badge_label}
            </span>
          )}
          <span className="absolute right-2 top-2 z-10">
            <FavoriteButton productId={product.id} />
          </span>
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
          <p className="line-clamp-2 font-bold" style={{ color: "var(--text-primary)" }}>
            {product.name}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <p className="price-current text-sm">{priceLabel}</p>
            {compare ? (
              <p className="price-compare text-xs">
                {compare.toLocaleString("fr-FR")} FCFA
              </p>
            ) : null}
            {compare && effective != null && compare > effective ? (
              <p className="text-xs font-semibold text-brand-orange">
                −{(compare - effective).toLocaleString("fr-FR")} FCFA
              </p>
            ) : null}
          </div>
        </div>
      </ProductLink>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4 pt-3">
        {effective != null ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => onAdd(false)}
              className="btn-accent min-h-10 rounded-full px-3 py-2 text-xs font-semibold disabled:opacity-60"
            >
              {busy ? "…" : "Panier"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onAdd(true)}
              className="rounded-full border border-brand-black/15 px-3 py-1.5 text-xs font-semibold"
            >
              Acheter
            </button>
          </>
        ) : (
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Sur devis
          </span>
        )}
        <button
          type="button"
          onClick={() => compareList.toggle({ id: product.id, slug: product.slug, name: product.name })}
          className="text-xs font-semibold text-brand-black/60"
        >
          {compareList.has(product.id) ? "Retiré" : "Comparer"}
        </button>
        <ProductContactActions
          productId={product.id}
          productName={product.name}
          sku={product.sku}
          price={effective}
          slug={product.slug}
        />
      </div>
      {error && (
        <p className="px-4 pb-3 text-xs" style={{ color: "var(--danger-color)" }}>
          {error}
        </p>
      )}
    </article>
  );
}
