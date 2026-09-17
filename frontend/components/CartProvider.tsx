"use client";

import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { imageUrl } from "@/lib/api";
import { cartApi, CartSummary } from "@/lib/cartApi";

type AddedLine = CartSummary["items"][number];

type CartContextValue = {
  count: number;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  refresh: () => void;
};

const CartContext = createContext<CartContextValue>({
  count: 0,
  addToCart: async () => undefined,
  refresh: () => undefined,
});

function CartAddedModal({
  open,
  onClose,
  cart,
  added,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartSummary | null;
  added: AddedLine | null;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !cart || !added) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-added-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute -right-3 -top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[#c41e3a] text-white shadow-md ring-2 ring-white transition hover:bg-[#a01830]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <path d="M7 7l10 10M17 7 7 17" />
          </svg>
        </button>

        <div className="grid overflow-hidden rounded-2xl md:grid-cols-2">
          <div className="border-b border-black/10 p-5 md:border-b-0 md:border-r md:p-6">
            <p id="cart-added-title" className="text-sm font-semibold text-green-600">
              Produit ajouté.
            </p>
            <div className="mt-4 flex gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#eee]">
                {added.image ? (
                  <Image
                    src={imageUrl(added.image)}
                    alt={added.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase leading-snug text-brand-black">
                  {added.name}
                </p>
                <p className="mt-2 text-base font-extrabold text-brand-orange">
                  {added.unit_price.toLocaleString("fr-FR")} FCFA
                </p>
                <p className="mt-1 text-xs text-brand-black/50">Qty: {added.quantity}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-3 p-5 md:p-6">
            <Link
              href="/commande"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-lg bg-brand-orange px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-white hover:bg-brand-orange-dark"
            >
              Commander
            </Link>
            <p className="text-center text-xs text-brand-black/50">Sous-total de la commande</p>
            <p className="text-center text-2xl font-extrabold text-brand-orange">
              {cart.subtotal.toLocaleString("fr-FR")} FCFA
            </p>
            <p className="text-center text-sm text-brand-black/55">
              Votre panier contient {cart.items_count} article
              {cart.items_count > 1 ? "s" : ""}
            </p>
            <Link
              href="/panier"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-lg border-2 border-brand-orange px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-brand-orange hover:bg-brand-orange/5"
            >
              Voir le panier
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [added, setAdded] = useState<AddedLine | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => {
    cartApi
      .get()
      .then((c) => {
        setCart(c);
        setCount(c.items_count);
      })
      .catch(() => {
        setCount(0);
      });
  }, []);

  useEffect(() => {
    refresh();
    const onUpd = () => refresh();
    window.addEventListener("cart-updated", onUpd);
    return () => window.removeEventListener("cart-updated", onUpd);
  }, [refresh]);

  const addToCart = useCallback(async (productId: number, quantity = 1) => {
    const summary = await cartApi.add(productId, quantity);
    setCart(summary);
    setCount(summary.items_count);
    const line = summary.items.find((i) => i.product_id === productId) || null;
    setAdded(line);
    setOpen(true);
    window.dispatchEvent(new Event("cart-updated"));
  }, []);

  return (
    <CartContext.Provider value={{ count, addToCart, refresh }}>
      {children}
      <CartAddedModal
        open={open}
        onClose={() => setOpen(false)}
        cart={cart}
        added={added}
      />
    </CartContext.Provider>
  );
}

export function useCartCount() {
  return useContext(CartContext).count;
}

export function useCart() {
  return useContext(CartContext);
}
