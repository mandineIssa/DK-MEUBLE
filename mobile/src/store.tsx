import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getAuthToken, saveAuthToken, type CartSummary, type Customer, type Product } from "./api";

const emptyCart: CartSummary = { token: "", items: [], items_count: 0, subtotal: 0 };

type CartCtx = {
  cart: CartSummary;
  refresh: () => Promise<void>;
  add: (productId: number, quantity?: number) => Promise<void>;
  update: (productId: number, quantity: number) => Promise<void>;
  remove: (productId: number) => Promise<void>;
};

type AuthCtx = {
  ready: boolean;
  customer: Customer | null;
  wishlistIds: number[];
  signIn: (token: string, customer: Customer) => Promise<void>;
  signOut: () => Promise<void>;
  toggleWish: (product: Product) => Promise<void>;
};

const CartContext = createContext<CartCtx | null>(null);
const AuthContext = createContext<AuthCtx | null>(null);

export function AppState({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartSummary>(emptyCart);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setCart(await api.cart());
    } catch {
      setCart(emptyCart);
    }
  }, []);

  const loadWishlist = useCallback(async () => {
    try {
      const items = await api.wishlist();
      setWishlistIds(items.map((p) => p.id));
    } catch {
      setWishlistIds([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      const token = await getAuthToken();
      if (token) {
        try {
          setCustomer(await api.me());
          await loadWishlist();
        } catch {
          await saveAuthToken(null);
        }
      }
      setReady(true);
    })();
  }, [refresh, loadWishlist]);

  const cartValue = useMemo<CartCtx>(
    () => ({
      cart,
      refresh,
      add: async (productId, quantity = 1) => setCart(await api.cartAdd(productId, quantity)),
      update: async (productId, quantity) => setCart(await api.cartUpdate(productId, quantity)),
      remove: async (productId) => setCart(await api.cartRemove(productId)),
    }),
    [cart, refresh]
  );

  const authValue = useMemo<AuthCtx>(
    () => ({
      ready,
      customer,
      wishlistIds,
      signIn: async (token, next) => {
        await saveAuthToken(token);
        setCustomer(next);
        await loadWishlist();
      },
      signOut: async () => {
        await api.logout().catch(() => undefined);
        await saveAuthToken(null);
        setCustomer(null);
        setWishlistIds([]);
      },
      toggleWish: async (product) => {
        if (!customer) throw new Error("Connectez-vous pour enregistrer un favori.");
        if (wishlistIds.includes(product.id)) {
          await api.wishlistRemove(product.id);
          setWishlistIds((ids) => ids.filter((id) => id !== product.id));
        } else {
          await api.wishlistAdd(product.id);
          setWishlistIds((ids) => [...ids, product.id]);
        }
      },
    }),
    [ready, customer, wishlistIds, loadWishlist]
  );

  return (
    <AuthContext.Provider value={authValue}>
      <CartContext.Provider value={cartValue}>{children}</CartContext.Provider>
    </AuthContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("Panier indisponible");
  return ctx;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("Compte indisponible");
  return ctx;
}
