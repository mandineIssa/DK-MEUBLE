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

  return (
    <div className="bg-[#ececec]">
      <section className="bg-brand-black text-white">
        <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
          <h1 className="text-3xl font-extrabold">Panier</h1>
          <p className="mt-2 text-white/70">{cart.items_count} article(s)</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8 md:px-6">
        {cart.items.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center shadow-sm">
            Panier vide.{" "}
            <Link href="/produits" className="font-semibold text-brand-orange">
              Voir les produits
            </Link>
          </p>
        ) : (
          <>
            {cart.items.map((item) => (
              <article key={item.product_id} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-black/5">
                  {item.image ? (
                    <Image src={imageUrl(item.image)} alt="" fill className="object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <Link href={`/produits/${item.slug}`} className="font-bold hover:text-brand-orange">
                    {item.name}
                  </Link>
                  <p className="text-sm text-brand-orange font-semibold">
                    {item.unit_price.toLocaleString("fr-FR")} FCFA
                  </p>
                  <div className="mt-2 flex items-center gap-2">
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
                      className="ml-auto text-xs font-semibold text-red-600"
                      onClick={() => setQty(item.product_id, 0)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <p className="font-bold">{item.subtotal.toLocaleString("fr-FR")} FCFA</p>
              </article>
            ))}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex justify-between text-lg font-extrabold">
                <span>Sous-total</span>
                <span>{cart.subtotal.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <Link
                href="/commande"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-brand-orange px-5 py-3 text-sm font-semibold text-white"
              >
                Passer la commande
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
