/** Client auth V2 — token Sanctum stocké en cookie httpOnly (via /api/customer/session) */

export type CustomerProfile = {
  id: number;
  phone: string | null;
  name: string | null;
  email: string | null;
  phone_verified_at?: string | null;
  is_b2b?: boolean;
  sms_opt_in?: boolean;
  email_opt_in?: boolean;
  company?: {
    id: number;
    name: string;
    ninea: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null;
  quotes?: Array<{
    id: number;
    name: string;
    phone: string;
    message: string;
    status: string;
    created_at: string;
    product?: { id: number; name: string; slug: string } | null;
  }>;
  b2b_quotes?: Array<{
    id: number;
    reference: string;
    title: string;
    status: string;
    total_amount: number;
    items?: Array<{ label: string; quantity: number; unit_price: number }>;
  }>;
  invoices?: Array<{
    id: number;
    reference: string;
    title: string;
    amount: number;
    status: string;
    due_at: string | null;
  }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function bff<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers: optHeaders, ...rest } = options || {};
  const method = (rest.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(optHeaders as Record<string, string> | undefined),
  };
  // Ne pas forcer Content-Type sur DELETE/GET sans corps
  if (rest.body != null && method !== "GET" && method !== "DELETE") {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const res = await fetch(`/api/bff/${path.replace(/^\//, "")}`, {
    ...rest,
    credentials: "same-origin",
    headers,
  });

  if (res.status === 401) {
    await fetch("/api/customer/session", { method: "DELETE" }).catch(() => {});
    throw new Error("Session expirée. Reconnectez-vous.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      body.message ||
      (body.errors && Object.values(body.errors).flat().join(" ")) ||
      "Une erreur est survenue.";
    throw new Error(typeof msg === "string" ? msg : "Une erreur est survenue.");
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function setCustomerToken(token: string) {
  const res = await fetch("/api/customer/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error("Impossible d'enregistrer la session.");
}

export async function clearCustomerToken() {
  await fetch("/api/customer/session", { method: "DELETE" }).catch(() => {});
}

export async function hasCustomerSession(): Promise<boolean> {
  const res = await fetch("/api/customer/session", { cache: "no-store" });
  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data.authenticated);
}

export const customerApi = {
  requestOtp: (phone: string) =>
    bff<{ message: string; phone: string; debug?: string; debug_code?: string }>("auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  verifyOtp: async (phone: string, code: string) => {
    const data = await bff<{
      token: string;
      customer: { id: number; phone: string; name: string | null; email: string | null };
      is_new: boolean;
    }>("auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    });
    await setCustomerToken(data.token);
    return data;
  },

  me: () => bff<CustomerProfile>("customer/me"),

  updateProfile: (data: {
    name?: string;
    email?: string;
    sms_opt_in?: boolean;
    email_opt_in?: boolean;
  }) =>
    bff("customer/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  registerCompany: (data: {
    name: string;
    ninea?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
  }) =>
    bff<{ message: string; company: { id: number; name: string } }>("customer/company", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: async () => {
    try {
      await bff("customer/logout", { method: "POST" });
    } finally {
      await clearCustomerToken();
    }
  },

  getOrders: () => bff<Array<Record<string, unknown>>>("customer/orders"),
  cancelOrder: (id: number) =>
    bff(`customer/orders/${id}/cancel`, { method: "POST" }),
  getWishlist: () => bff<import("@/lib/api").Product[]>("customer/wishlist"),
  addWishlist: (productId: number) =>
    bff("customer/wishlist", {
      method: "POST",
      body: JSON.stringify({ product_id: productId }),
    }),
  removeWishlist: (productId: number) =>
    bff(`customer/wishlist/${productId}`, { method: "DELETE" }),

  getNotifications: (params?: { type?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.page) qs.set("page", String(params.page));
    const q = qs.toString();
    return bff<{
      unread_count: number;
      data: {
        data: CustomerNotification[];
        current_page: number;
        last_page: number;
      };
    }>(`customer/notifications${q ? `?${q}` : ""}`);
  },
  getUnreadCount: () => bff<{ unread_count: number }>("customer/notifications/unread-count"),
  markNotificationRead: (id: number) =>
    bff(`customer/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () =>
    bff("customer/notifications/read-all", { method: "PATCH" }),
  getNotificationPreferences: () =>
    bff<{ data: CustomerNotificationPreference[] }>("customer/notification-preferences"),
  updateNotificationPreferences: (preferences: CustomerNotificationPreference[]) =>
    bff<{ data: CustomerNotificationPreference[] }>("customer/notification-preferences", {
      method: "PUT",
      body: JSON.stringify({ preferences }),
    }),

  openProductChat: (productId: number) =>
    bff<{ id: number; product_id: number; status: string }>("customer/product-chats", {
      method: "POST",
      body: JSON.stringify({ product_id: productId }),
    }),
  getProductChatMessages: (chatId: number, after?: number) => {
    const qs = after ? `?after=${after}` : "";
    return bff<{ data: Array<{ id: number; body: string; sender_type: "customer" | "admin"; created_at: string }> }>(
      `customer/product-chats/${chatId}/messages${qs}`
    );
  },
  sendProductChatMessage: (chatId: number, body: string) =>
    bff<{
      id: number;
      body: string;
      sender_type: "customer" | "admin";
      created_at: string;
      auto_replies?: Array<{
        id: number;
        body: string;
        sender_type: "customer" | "admin";
        created_at: string;
      }>;
    }>(`customer/product-chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  oauthUrl: (provider: "google" | "facebook") =>
    `${API_URL}/api/auth/oauth/${provider}/redirect`,

  async getOAuthProviders() {
    const res = await fetch(`${API_URL}/api/auth/oauth/providers`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { google: false, facebook: false };
    return res.json() as Promise<{ google: boolean; facebook: boolean }>;
  },
};

export type CustomerNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type CustomerNotificationPreference = {
  type: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  in_app_enabled: boolean;
  locked?: boolean;
};
