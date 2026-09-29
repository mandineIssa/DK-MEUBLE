"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cartApi, CartSummary } from "@/lib/cartApi";
import { imageUrl } from "@/lib/api";

export default function PanierPage() {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const c = await cartApi.get();
      setCart(c);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setQty(productId: number, quantity: number) {
    setCart(await cartApi.update(productId, quantity));
    window.dispatchEvent(new Event("cart-updated"));
  }

  if (!cart) {
    return <p className="p-8 text-center text-brand-black/50">{error || "Chargement…"}</p>;
  }

  const money = (value: number) => `${value.toLocaleString("fr-FR")} FCFA`;

  return (
    <div className="min-w-0 max-w-full overflow-x-clip bg-[#ececec]">
      <section className="bg-white text-brand-black">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
          <h1 className="text-3xl font-extrabold">Panier</h1>
          <p className="mt-2 text-brand-black/70">{cart.items_count} article(s)</p>
        </div>
      </section>

      <div className="mx-auto grid min-w-0 max-w-6xl gap-4 px-4 py-6 md:px-6 md:py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {cart.items.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center shadow-sm lg:col-span-2">
            Panier vide.{" "}
            <Link href="/produits" className="font-semibold text-brand-orange">
              Voir les produits
            </Link>
          </p>
        ) : (
          <>
            <div className="min-w-0 space-y-4">
            {cart.items.map((item) => (
              <article key={item.product_id} className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-2xl bg-white p-3 shadow-sm sm:grid-cols-[6rem_minmax(0,1fr)] sm:p-4">
                <div className="relative h-[4.5rem] overflow-hidden rounded-xl bg-brand-black/5 sm:h-24">
                  {item.image ? (
                    <Image src={imageUrl(item.image)} alt="" fill className="object-cover" sizes="96px" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <Link href={`/produits/${item.slug}`} className="min-w-0 break-words font-bold leading-snug hover:text-brand-orange">
                      {item.name}
                    </Link>
                    <p className="shrink-0 text-right text-sm font-bold leading-tight">{money(item.subtotal)}</p>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-brand-orange">{money(item.unit_price)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-full border"
                      onClick={() => setQty(item.product_id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-full border"
                      onClick={() => setQty(item.product_id, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-600"
                      onClick={() => setQty(item.product_id, 0)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </article>
            ))}
            </div>
            <div className="h-fit min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-28">
              <div className="flex min-w-0 items-start justify-between gap-3 text-base font-extrabold sm:text-lg">
                <span className="shrink-0">Sous-total</span>
                <span className="min-w-0 text-right leading-tight">{money(cart.subtotal)}</span>
              </div>
              <Link
                href="/commande"
                className="mt-4 hidden w-full items-center justify-center rounded-full bg-brand-orange px-5 py-3 text-sm font-semibold text-white md:inline-flex"
              >
                Passer la commande
              </Link>
              <Link
                href="/produits"
                className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-brand-black/15 px-5 py-3 text-center text-sm font-semibold"
              >
                Continuer mes achats
              </Link>
            </div>
          </>
        )}
      </div>
      {cart.items.length > 0 ? (
        <div className="fixed inset-x-0 z-30 border-t bg-white px-4 py-3 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] md:hidden bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px)+var(--vv-bottom,0px))]">
          <div className="mx-auto flex min-w-0 max-w-lg items-center gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-brand-black/50">Sous-total</p>
              <p className="truncate text-sm font-extrabold">{money(cart.subtotal)}</p>
            </div>
            <Link
              href="/commande"
              className="ml-auto inline-flex shrink-0 items-center justify-center rounded-full bg-brand-orange px-4 py-3 text-sm font-semibold text-white"
            >
              Passer la commande
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
