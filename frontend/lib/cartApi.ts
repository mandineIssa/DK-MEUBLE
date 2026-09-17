const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CART_KEY = "dk_cart_token";

export type CartSummary = {
  token: string;
  items: Array<{
    product_id: number;
    name: string;
    slug: string;
    quantity: number;
    unit_price: number;
    compare_at_price: number | null;
    badge_label: string | null;
    subtotal: number;
    image?: string | null;
  }>;
  items_count: number;
  subtotal: number;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CART_KEY);
}

function saveToken(token: string) {
  localStorage.setItem(CART_KEY, token);
}

async function cartRequest(path: string, options?: RequestInit): Promise<CartSummary> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers["X-Cart-Token"] = token;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const newToken = res.headers.get("X-Cart-Token");
  if (newToken) saveToken(newToken);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Erreur panier");
  }
  return res.json();
}

export const cartApi = {
  get: () => cartRequest("/api/cart"),
  add: (productId: number, quantity = 1) =>
    cartRequest("/api/cart", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, quantity }),
    }),
  update: (productId: number, quantity: number) =>
    cartRequest("/api/cart", {
      method: "PATCH",
      body: JSON.stringify({ product_id: productId, quantity }),
    }),
  remove: (productId: number) =>
    cartRequest("/api/cart", {
      method: "DELETE",
      body: JSON.stringify({ product_id: productId }),
    }),
};

export async function checkoutApi(payload: Record<string, unknown>) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers["X-Cart-Token"] = token;

  const res = await fetch(`${API_URL}/api/checkout`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const newToken = res.headers.get("X-Cart-Token");
  if (newToken) saveToken(newToken);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      body.message ||
      (body.errors && Object.values(body.errors).flat().join(" ")) ||
      "Commande impossible";
    throw new Error(msg);
  }
  return res.json();
}
