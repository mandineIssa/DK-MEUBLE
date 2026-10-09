import * as SecureStore from "expo-secure-store";

export const API_URL = "https://api.dkhometech.sn";

const CART_KEY = "dk_cart_token";
const AUTH_KEY = "dk_customer_token";

export type Category = {
  id: number;
  name: string;
  slug: string;
  image_path?: string | null;
  products_count?: number;
  children?: Category[];
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  sku?: string | null;
  description?: string | null;
  short_description?: string | null;
  price: number | null;
  promo_price?: number | null;
  effective_price?: number | null;
  compare_at_price?: number | null;
  discount_percent?: number | null;
  badge_label?: string | null;
  stock_quantity?: number | null;
  specs?: Record<string, unknown> | null;
  images?: Array<{ id: number; path: string }>;
  brand?: { id: number; name: string; slug: string } | null;
  category?: { id: number; name: string; slug: string } | null;
};

export type CartItem = {
  product_id: number;
  name: string;
  slug: string;
  quantity: number;
  unit_price: number;
  compare_at_price: number | null;
  badge_label: string | null;
  subtotal: number;
  image?: string | null;
};

export type CartSummary = {
  token: string;
  items: CartItem[];
  items_count: number;
  subtotal: number;
};

export type Customer = {
  id: number;
  phone: string | null;
  name: string | null;
  email: string | null;
};

export type Review = {
  id: number;
  author_name: string;
  rating: number;
  title?: string | null;
  body: string;
};

export function imageUrl(path?: string | null): string {
  let raw = String(path || "").trim();
  if (!raw) return "";
  const local = raw.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/.*)$/i);
  if (local) raw = local[1];
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/storage/")) return `${API_URL}${raw}`;
  if (raw.startsWith("storage/")) return `${API_URL}/${raw}`;
  return `${API_URL}/storage/${raw.replace(/^\//, "")}`;
}

export async function getCartToken() {
  return SecureStore.getItemAsync(CART_KEY);
}

export async function saveCartToken(token: string) {
  await SecureStore.setItemAsync(CART_KEY, token);
}

export async function getAuthToken() {
  return SecureStore.getItemAsync(AUTH_KEY);
}

export async function saveAuthToken(token: string | null) {
  if (!token) {
    await SecureStore.deleteItemAsync(AUTH_KEY).catch(() => undefined);
    return;
  }
  await SecureStore.setItemAsync(AUTH_KEY, token);
}

function errorMessage(body: { message?: string; errors?: Record<string, string[]> }): string {
  if (body.errors) {
    const flat = Object.values(body.errors).flat().filter(Boolean).join(" ");
    if (flat) return flat;
  }
  return body.message || "Une erreur est survenue. Réessayez.";
}

export async function apiFetch<T>(path: string, options?: RequestInit & { auth?: boolean; cart?: boolean }): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options?.body ? { "Content-Type": "application/json" } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (options?.auth) {
    const token = await getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (options?.cart) {
    const token = await getCartToken();
    if (token) headers["X-Cart-Token"] = token;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Connexion impossible. Vérifiez le réseau.");
  }

  const cartToken = res.headers.get("X-Cart-Token");
  if (cartToken) await saveCartToken(cartToken);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(errorMessage(body));
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

function asProducts(payload: Product[] | { data?: Product[] }): Product[] {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.data) ? payload.data : [];
}

export const api = {
  homepage: () => apiFetch<Record<string, unknown>>("/api/homepage"),
  settings: () => apiFetch<Record<string, unknown>>("/api/settings"),
  categories: () =>
    apiFetch<{ tree: Category[]; popular: Category[] }>("/api/categories"),
  category: (slug: string) =>
    apiFetch<{ category: Category; products: Product[] }>(`/api/categories/${slug}`),
  products: async (params: Record<string, string>) => {
    const qs = new URLSearchParams({ paginated: "1", per_page: "24", ...params }).toString();
    const res = await apiFetch<Product[] | { data?: Product[] }>(`/api/products?${qs}`);
    return asProducts(res);
  },
  product: (slug: string) => apiFetch<Product>(`/api/products/${slug}`),
  reviews: (slug: string) =>
    apiFetch<{ average: number; count: number; reviews: Review[] }>(`/api/products/${slug}/reviews`),
  promotions: () =>
    apiFetch<{ data: Array<{ product?: Product; discount_percent?: number; discount_label?: string }> }>(
      "/api/promotions?per_page=24"
    ),
  cart: () => apiFetch<CartSummary>("/api/cart", { cart: true }),
  cartAdd: (productId: number, quantity = 1) =>
    apiFetch<CartSummary>("/api/cart", {
      method: "POST",
      cart: true,
      body: JSON.stringify({ product_id: productId, quantity }),
    }),
  cartUpdate: (productId: number, quantity: number) =>
    apiFetch<CartSummary>("/api/cart", {
      method: "PATCH",
      cart: true,
      body: JSON.stringify({ product_id: productId, quantity }),
    }),
  cartRemove: (productId: number) =>
    apiFetch<CartSummary>("/api/cart", {
      method: "DELETE",
      cart: true,
      body: JSON.stringify({ product_id: productId }),
    }),
  zones: () =>
    apiFetch<Array<{ id: number; zone_name: string; city: string | null; delivery_fee: number; estimated_delay: string | null }>>(
      "/api/delivery-zones"
    ),
  checkoutOptions: () =>
    apiFetch<{ payment_methods: Array<{ key: string; label: string; enabled: boolean }> }>("/api/checkout/options"),
  showrooms: () =>
    apiFetch<Array<{ id: number; name: string; address: string; city?: string | null }>>("/api/showrooms"),
  checkout: (payload: Record<string, unknown>) =>
    apiFetch<{ reference?: string; id?: number; total?: number }>("/api/checkout", {
      method: "POST",
      cart: true,
      auth: true,
      body: JSON.stringify(payload),
    }),
  identify: (login: string) =>
    apiFetch<{ channel: "email" | "phone"; login: string; exists: boolean; has_password: boolean }>("/api/auth/identify", {
      method: "POST",
      body: JSON.stringify({ login }),
    }),
  login: (login: string, password: string) =>
    apiFetch<{ token: string; customer: Customer }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    }),
  register: (payload: { name: string; password: string; password_confirmation: string; email?: string; phone?: string }) =>
    apiFetch<{ token: string; customer: Customer }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  requestOtp: (channel: "email" | "phone", login: string) =>
    apiFetch<{ message?: string }>("/api/auth/request-otp", {
      method: "POST",
      body: JSON.stringify(channel === "email" ? { channel, email: login } : { channel, phone: login }),
    }),
  verifyOtp: (channel: "email" | "phone", login: string, code: string) =>
    apiFetch<{ token: string; customer: Customer }>("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(
        channel === "email" ? { channel, email: login, code } : { channel, phone: login, code }
      ),
    }),
  forgot: (email: string) =>
    apiFetch<{ message?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  reset: (email: string, code: string, password: string) =>
    apiFetch<{ token?: string; customer?: Customer; message?: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, password, password_confirmation: password }),
    }),
  me: () => apiFetch<Customer>("/api/customer/me", { auth: true }),
  logout: () => apiFetch<void>("/api/customer/logout", { method: "POST", auth: true }),
  orders: () =>
    apiFetch<Array<{ id: number; reference: string; total: number; order_status: string; created_at: string }>>(
      "/api/customer/orders",
      { auth: true }
    ),
  order: (reference: string, phone?: string) => {
    const qs = phone ? `?phone=${encodeURIComponent(phone)}` : "";
    return apiFetch<Record<string, unknown>>(`/api/orders/${encodeURIComponent(reference)}${qs}`, { auth: true });
  },
  wishlist: () => apiFetch<Product[]>("/api/customer/wishlist", { auth: true }),
  wishlistAdd: (productId: number) =>
    apiFetch<unknown>("/api/customer/wishlist", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ product_id: productId }),
    }),
  wishlistRemove: (productId: number) =>
    apiFetch<unknown>(`/api/customer/wishlist/${productId}`, { method: "DELETE", auth: true }),
  brands: () =>
    apiFetch<Array<{ id: number; name: string; slug: string; description?: string | null; products_count?: number }>>(
      "/api/brands"
    ),
  brand: (slug: string) =>
    apiFetch<{ brand: { id: number; name: string; description?: string | null }; products: Product[] }>(
      `/api/brands/${slug}`
    ),
  services: () =>
    apiFetch<{
      services: Array<{ id: number; title: string; slug: string; short_description?: string | null }>;
      settings?: { intro_title?: string; intro_text?: string; request_form_enabled?: boolean };
    }>("/api/services"),
  service: (slug: string) =>
    apiFetch<{
      service: { id: number; title: string; slug: string; short_description?: string | null; full_content?: string | null };
      settings?: { request_form_enabled?: boolean };
    }>(`/api/services/${slug}`),
  serviceRequest: (slug: string, payload: { customer_name: string; phone: string; email?: string; message: string }) =>
    apiFetch<{ message: string }>(`/api/services/${slug}/request`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  showroomList: () =>
    apiFetch<Array<{ id: number; name: string; address: string; city?: string | null; phone?: string | null; opening_hours?: string | null }>>(
      "/api/showrooms"
    ),
  realizations: () =>
    apiFetch<Array<{ id: number; title: string; description: string | null; image_url: string; tag: string | null }>>(
      "/api/realizations"
    ),
  page: (key: string) => apiFetch<{ page_key: string; blocks: Record<string, unknown> }>(`/api/pages/${key}`),
  quote: (payload: {
    product_id?: number;
    name: string;
    phone: string;
    email?: string;
    company_name?: string;
    quantity?: number;
    message: string;
  }) =>
    apiFetch<{ message: string }>("/api/quotes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
