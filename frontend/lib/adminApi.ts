import type { Category, Realization, SiteSettings } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Quote = {
  id: number;
  product?: { name: string } | null;
  name: string;
  phone: string;
  email: string | null;
  company_name: string | null;
  quantity: number | null;
  dimensions: string | null;
  message: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
};

export type ContactMessage = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: "new" | "read";
  created_at: string;
};

export type AdminCustomer = {
  id: number;
  phone: string | null;
  name: string | null;
  email: string | null;
  google_id: string | null;
  facebook_id: string | null;
  phone_verified_at: string | null;
  quotes_count?: number;
  wishlists_count?: number;
  created_at: string;
  quotes?: Array<{
    id: number;
    name: string;
    phone: string;
    message: string;
    status: string;
    created_at: string;
    product?: { id: number; name: string; slug: string } | null;
  }>;
};

export type AdminProduct = {
  id: number;
  category_id: number;
  brand_id?: number | null;
  name: string;
  slug: string;
  sku?: string | null;
  description: string;
  short_description?: string | null;
  price: number | null;
  promo_price?: number | null;
  condition?: string;
  is_clearance?: boolean;
  stock_quantity?: number | null;
  specs?: Record<string, unknown> | null;
  is_customizable: boolean;
  status: "draft" | "published" | "archived";
  images?: { id: number; path: string; order: number; role?: string | null; label?: string | null }[];
};

export type AdminRealization = Realization;

export type VisitsStats = {
  range: { from: string; to: string };
  summary: {
    pageviews: number;
    unique_visitors: number;
    sessions: number;
    today: number;
    yesterday: number;
    this_month: number;
    unique_today: number;
    avg_per_day: number;
  };
  daily: Array<{ date: string; label: string; views: number; visitors: number }>;
  monthly: Array<{ month: string; label: string; views: number; visitors: number }>;
  top_pages: Array<{ path: string; title: string | null; views: number }>;
  sources: Array<{ key: string; label: string; views: number; pct: number }>;
  devices: Array<{ key: string; label: string; views: number; pct: number }>;
  recent: Array<{
    id: number;
    path: string;
    title: string | null;
    source: string | null;
    device: string | null;
    created_at: string | null;
  }>;
};

const ADMIN_TOKEN_KEY = "dk_admin_token";

/** Token admin en localStorage (persiste, pas de cookie CSRF). */
export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(ADMIN_TOKEN_KEY) ||
    sessionStorage.getItem(ADMIN_TOKEN_KEY)
  );
}

export function setAdminToken(token: string | null) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extra,
  };
  const token = getAdminToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function redirectToLogin() {
  setAdminToken(null);
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
    window.location.replace("/admin/login");
  }
}

async function adminRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = authHeaders({
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  });

  // credentials: omit → aucun cookie session / CSRF (auth Bearer uniquement)
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "omit",
    headers,
  });

  if (res.status === 401) {
    redirectToLogin();
    throw new Error("Session expirée, veuillez vous reconnecter.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      body.message ||
      (body.errors && Object.values(body.errors).flat().join(" ")) ||
      "Une erreur est survenue.";
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const adminApi = {
  async login(email: string, password: string) {
    // Fetch dédié : pas de redirect 401, pas de cookies
    const res = await fetch(`${API_URL}/api/admin/login`, {
      method: "POST",
      credentials: "omit",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        body.message ||
        (body.errors && Object.values(body.errors).flat().join(" ")) ||
        "Identifiants incorrects.";
      throw new Error(typeof msg === "string" ? msg : "Identifiants incorrects.");
    }

    const token = body.token as string | undefined;
    if (!token) {
      throw new Error("Connexion refusée : jeton manquant. Redéployez le backend.");
    }
    setAdminToken(token);
    return body as { message: string; token: string; user?: { id: number; name: string; email: string } };
  },

  me: () =>
    adminRequest<{ id: number; name: string; email: string }>("/api/admin/me"),

  async logout() {
    try {
      await adminRequest("/api/admin/logout", { method: "POST" });
    } finally {
      setAdminToken(null);
    }
  },

  getProducts: async (params?: { light?: boolean; all?: boolean; per_page?: number; q?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.light) qs.set("light", "1");
    if (params?.all) qs.set("all", "1");
    if (params?.per_page) qs.set("per_page", String(params.per_page));
    if (params?.q) qs.set("q", params.q);
    if (params?.page) qs.set("page", String(params.page));
    const q = qs.toString();
    const res = await adminRequest<AdminProduct[] | { data: AdminProduct[] }>(
      `/api/admin/products${q ? `?${q}` : ""}`,
    );
    return Array.isArray(res) ? res : res.data || [];
  },
  getDashboardStats: () =>
    adminRequest<{
      products: number;
      products_published: number;
      quotes_new: number;
      messages_new: number;
    }>("/api/admin/dashboard/stats"),
  createProduct: (data: Partial<AdminProduct>) =>
    adminRequest<AdminProduct>("/api/admin/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProduct: (id: number, data: Partial<AdminProduct>) =>
    adminRequest<AdminProduct>(`/api/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: number) =>
    adminRequest(`/api/admin/products/${id}`, { method: "DELETE" }),

  async uploadProductImage(
    id: number,
    fileOrFiles: File | File[],
    meta?: { role?: string; label?: string }
  ) {
    const body = new FormData();
    const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    if (files.length === 1) {
      body.append("image", files[0]);
    } else {
      files.forEach((f) => body.append("images[]", f));
    }
    if (meta?.role) body.append("role", meta.role);
    if (meta?.label) body.append("label", meta.label);
    const headers = authHeaders();

    const res = await fetch(`${API_URL}/api/admin/products/${id}/images`, {
      method: "POST",
      credentials: "omit",
      headers,
      body,
    });

    if (res.status === 401) {
      redirectToLogin();
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Échec de l'upload.");
    }
    return res.json();
  },

  updateProductImage: (
    productId: number,
    imageId: number,
    data: { role?: string | null; label?: string | null; order?: number }
  ) =>
    adminRequest(`/api/admin/products/${productId}/images/${imageId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteProductImage: (productId: number, imageId: number) =>
    adminRequest(`/api/admin/products/${productId}/images/${imageId}`, { method: "DELETE" }),

  reorderProductImages: (productId: number, order: number[]) =>
    adminRequest(`/api/admin/products/${productId}/images/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ order }),
    }),

  async uploadEntityMedia(
    type: "categories" | "brands" | "realizations" | "services" | "showrooms",
    id: number,
    files: File[],
    meta?: { role?: string; label?: string }
  ) {
    const body = new FormData();
    if (files.length === 1) body.append("image", files[0]);
    else files.forEach((f) => body.append("images[]", f));
    if (meta?.role) body.append("role", meta.role);
    if (meta?.label) body.append("label", meta.label);
    const headers = authHeaders();
    const res = await fetch(`${API_URL}/api/admin/${type}/${id}/media`, {
      method: "POST",
      credentials: "omit",
      headers,
      body,
    });
    if (res.status === 401) {
      redirectToLogin();
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Échec de l'upload.");
    }
    return res.json();
  },

  getEntityMedia: (
    type: "categories" | "brands" | "realizations" | "services" | "showrooms",
    id: number
  ) =>
    adminRequest<
      Array<{ id: number; path: string; role?: string | null; label?: string | null; display_order: number }>
    >(`/api/admin/${type}/${id}/media`),

  updateMedia: (mediaId: number, data: { role?: string | null; label?: string | null; display_order?: number }) =>
    adminRequest(`/api/admin/media/${mediaId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteMedia: (mediaId: number) =>
    adminRequest(`/api/admin/media/${mediaId}`, { method: "DELETE" }),

  reorderEntityMedia: (
    type: "categories" | "brands" | "realizations" | "services" | "showrooms",
    id: number,
    order: number[]
  ) =>
    adminRequest(`/api/admin/${type}/${id}/media/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ order }),
    }),

  getQuotes: async () => {
    const res = await adminRequest<Quote[] | { data: Quote[] }>("/api/admin/quotes?per_page=50");
    return Array.isArray(res) ? res : res.data || [];
  },
  updateQuoteStatus: (id: number, status: Quote["status"]) =>
    adminRequest<Quote>(`/api/admin/quotes/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getMessages: async () => {
    const res = await adminRequest<ContactMessage[] | { data: ContactMessage[] }>(
      "/api/admin/messages?per_page=50",
    );
    return Array.isArray(res) ? res : res.data || [];
  },
  updateMessageStatus: (id: number, status: ContactMessage["status"]) =>
    adminRequest<ContactMessage>(`/api/admin/messages/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getCustomers: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return adminRequest<AdminCustomer[]>(`/api/admin/customers${qs}`);
  },
  getWishlists: (search?: string) => {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    const q = qs.toString();
    return adminRequest<{
      data: Array<{
        id: number;
        price_at_save: number | null;
        created_at: string;
        customer?: { id: number; name: string | null; phone: string | null; email: string | null };
        product?: { id: number; name: string; slug: string; price: number | null; status?: string };
      }>;
      total: number;
    }>(`/api/admin/wishlists${q ? `?${q}` : ""}`);
  },
  getCustomer: (id: number) =>
    adminRequest<AdminCustomer>(`/api/admin/customers/${id}`),
  updateCustomer: (id: number, data: Partial<AdminCustomer>) =>
    adminRequest<AdminCustomer>(`/api/admin/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteCustomer: (id: number) =>
    adminRequest(`/api/admin/customers/${id}`, { method: "DELETE" }),

  getSettings: () => adminRequest<SiteSettings>("/api/admin/settings"),
  updateSettings: (data: Partial<SiteSettings>) =>
    adminRequest<SiteSettings>("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  async uploadLogo(file: File) {
    const body = new FormData();
    body.append("logo", file);
    const headers = authHeaders();

    const res = await fetch(`${API_URL}/api/admin/settings/logo`, {
      method: "POST",
      credentials: "omit",
      headers,
      body,
    });

    if (res.status === 401) {
      redirectToLogin();
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Échec de l'upload du logo.");
    }
    return res.json() as Promise<SiteSettings>;
  },

  getPage: (pageKey: string) =>
    adminRequest<{ page_key: string; blocks: Record<string, unknown> }>(
      `/api/admin/pages/${pageKey}`
    ),
  updatePage: (pageKey: string, blocks: Record<string, unknown>) =>
    adminRequest<{ page_key: string; blocks: Record<string, unknown> }>(
      `/api/admin/pages/${pageKey}`,
      {
        method: "PUT",
        body: JSON.stringify({ blocks }),
      }
    ),

  getRealizations: () => adminRequest<AdminRealization[]>("/api/admin/realizations"),
  createRealization: (data: Partial<AdminRealization>) =>
    adminRequest<AdminRealization>("/api/admin/realizations", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateRealization: (id: number, data: Partial<AdminRealization>) =>
    adminRequest<AdminRealization>(`/api/admin/realizations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteRealization: (id: number) =>
    adminRequest(`/api/admin/realizations/${id}`, { method: "DELETE" }),

  getCategories: () =>
    adminRequest<{ tree: Category[]; flat: Category[]; settings: CategoryModuleSettings }>(
      "/api/admin/categories"
    ),
  createCategory: (data: Partial<Category>) =>
    adminRequest<Category>("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCategory: (id: number, data: Partial<Category>) =>
    adminRequest<Category>(`/api/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: number, moveToId?: number) => {
    const qs = moveToId ? `?move_to_id=${moveToId}` : "";
    return adminRequest(`/api/admin/categories/${id}${qs}`, { method: "DELETE" });
  },
  reorderCategories: (items: Array<{ id: number; parent_id: number | null; display_order: number }>) =>
    adminRequest("/api/admin/categories/reorder", {
      method: "PATCH",
      body: JSON.stringify({ items }),
    }),
  getCategorySettings: () =>
    adminRequest<CategoryModuleSettings>("/api/admin/categories-settings"),
  updateCategorySettings: (data: Partial<CategoryModuleSettings>) =>
    adminRequest<CategoryModuleSettings>("/api/admin/categories-settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  seedSuggestedCategories: () =>
    adminRequest<{ message: string; tree: Category[] }>("/api/admin/categories/seed-suggested", {
      method: "POST",
    }),
  createCategoryAttribute: (
    categoryId: number,
    data: {
      name: string;
      field_type: string;
      options?: string[];
      slug?: string;
    }
  ) =>
    adminRequest(`/api/admin/categories/${categoryId}/attributes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteCategoryAttribute: (categoryId: number, attributeId: number) =>
    adminRequest(`/api/admin/categories/${categoryId}/attributes/${attributeId}`, {
      method: "DELETE",
    }),

  getCompanies: () => adminRequest<AdminCompany[]>("/api/admin/companies"),
  createCompany: (data: Partial<AdminCompany> & { customer_id?: number }) =>
    adminRequest<AdminCompany>("/api/admin/companies", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCompany: (id: number, data: Partial<AdminCompany>) =>
    adminRequest<AdminCompany>(`/api/admin/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCompany: (id: number) =>
    adminRequest(`/api/admin/companies/${id}`, { method: "DELETE" }),

  getB2bQuotes: () => adminRequest<AdminB2bQuote[]>("/api/admin/b2b-quotes"),
  createB2bQuote: (data: Record<string, unknown>) =>
    adminRequest<AdminB2bQuote>("/api/admin/b2b-quotes", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateB2bQuote: (id: number, data: Record<string, unknown>) =>
    adminRequest<AdminB2bQuote>(`/api/admin/b2b-quotes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteB2bQuote: (id: number) =>
    adminRequest(`/api/admin/b2b-quotes/${id}`, { method: "DELETE" }),

  getInvoices: () => adminRequest<AdminInvoice[]>("/api/admin/invoices"),
  createInvoice: (data: Record<string, unknown>) =>
    adminRequest<AdminInvoice>("/api/admin/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateInvoice: (id: number, data: Record<string, unknown>) =>
    adminRequest<AdminInvoice>(`/api/admin/invoices/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteInvoice: (id: number) =>
    adminRequest(`/api/admin/invoices/${id}`, { method: "DELETE" }),

  getReviews: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return adminRequest<AdminReview[]>(`/api/admin/reviews${qs}`);
  },
  updateReviewStatus: (id: number, status: AdminReview["status"]) =>
    adminRequest<AdminReview>(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteReview: (id: number) =>
    adminRequest(`/api/admin/reviews/${id}`, { method: "DELETE" }),

  getCampaigns: () => adminRequest<AdminCampaign[]>("/api/admin/campaigns"),
  createCampaign: (data: Record<string, unknown>) =>
    adminRequest<AdminCampaign>("/api/admin/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  sendCampaign: (id: number) =>
    adminRequest<AdminCampaign>(`/api/admin/campaigns/${id}/send`, {
      method: "POST",
    }),
  deleteCampaign: (id: number) =>
    adminRequest(`/api/admin/campaigns/${id}`, { method: "DELETE" }),

  getBrands: () => adminRequest<AdminBrand[]>("/api/admin/brands"),
  createBrand: (data: Record<string, unknown>) =>
    adminRequest<AdminBrand>("/api/admin/brands", { method: "POST", body: JSON.stringify(data) }),
  updateBrand: (id: number, data: Record<string, unknown>) =>
    adminRequest<AdminBrand>(`/api/admin/brands/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBrand: (id: number) => adminRequest(`/api/admin/brands/${id}`, { method: "DELETE" }),

  getShowrooms: () => adminRequest<AdminShowroom[]>("/api/admin/showrooms"),
  createShowroom: (data: Record<string, unknown>) =>
    adminRequest<AdminShowroom>("/api/admin/showrooms", { method: "POST", body: JSON.stringify(data) }),
  updateShowroom: (id: number, data: Record<string, unknown>) =>
    adminRequest<AdminShowroom>(`/api/admin/showrooms/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteShowroom: (id: number) => adminRequest(`/api/admin/showrooms/${id}`, { method: "DELETE" }),

  getOrders: async (params?: { status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    qs.set("per_page", "50");
    const res = await adminRequest<AdminOrder[] | { data: AdminOrder[] }>(
      `/api/admin/orders?${qs.toString()}`,
    );
    return Array.isArray(res) ? res : res.data || [];
  },
  getOrder: (id: number) => adminRequest<AdminOrder>(`/api/admin/orders/${id}`),
  updateOrderStatus: (id: number, data: Record<string, unknown>) =>
    adminRequest<AdminOrder>(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  async downloadOrderReceipt(id: number, reference: string) {
    const headers = authHeaders({ Accept: "application/pdf" });
    const res = await fetch(`${API_URL}/api/admin/orders/${id}/receipt`, {
      credentials: "omit",
      headers,
    });
    if (res.status === 401) {
      redirectToLogin();
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }
    if (!res.ok) throw new Error("Téléchargement du reçu impossible.");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recu-${reference}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
  getOrderSettings: () => adminRequest<Record<string, unknown>>("/api/admin/orders/settings"),
  updateOrderSettings: (data: Record<string, unknown>) =>
    adminRequest<Record<string, unknown>>("/api/admin/orders/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getDeliveryZones: () => adminRequest<AdminDeliveryZone[]>("/api/admin/delivery-zones"),
  createDeliveryZone: (data: Record<string, unknown>) =>
    adminRequest<AdminDeliveryZone>("/api/admin/delivery-zones", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateDeliveryZone: (id: number, data: Record<string, unknown>) =>
    adminRequest<AdminDeliveryZone>(`/api/admin/delivery-zones/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteDeliveryZone: (id: number) =>
    adminRequest(`/api/admin/delivery-zones/${id}`, { method: "DELETE" }),

  getPromotions: (params?: { status?: string; search?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params || {}).filter(([, v]) => v) as [string, string][]
    ).toString();
    return adminRequest<AdminPromotion[]>(`/api/admin/promotions${qs ? `?${qs}` : ""}`);
  },
  createPromotion: (data: Record<string, unknown>) =>
    adminRequest<AdminPromotion>("/api/admin/promotions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePromotion: (id: number, data: Record<string, unknown>) =>
    adminRequest<AdminPromotion>(`/api/admin/promotions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updatePromotionStatus: (id: number, status: AdminPromotion["status"]) =>
    adminRequest<AdminPromotion>(`/api/admin/promotions/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deletePromotion: (id: number) =>
    adminRequest(`/api/admin/promotions/${id}`, { method: "DELETE" }),
  getPromotionSettings: () =>
    adminRequest<PromoSettings>("/api/admin/promotions/settings"),
  updatePromotionSettings: (data: Partial<PromoSettings>) =>
    adminRequest<PromoSettings>("/api/admin/promotions/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getHomepage: () => adminRequest<AdminHomepagePayload>("/api/admin/homepage"),
  createHomepageSection: (data: Record<string, unknown>) =>
    adminRequest<AdminHomepageSection>("/api/admin/homepage/sections", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateHomepageSection: (id: number, data: Record<string, unknown>) =>
    adminRequest<AdminHomepageSection>(`/api/admin/homepage/sections/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteHomepageSection: (id: number) =>
    adminRequest(`/api/admin/homepage/sections/${id}`, { method: "DELETE" }),
  reorderHomepageSections: (order: number[]) =>
    adminRequest("/api/admin/homepage/sections/reorder", {
      method: "PATCH",
      body: JSON.stringify({ order }),
    }),
  createHomepageSlide: (data: Record<string, unknown>) =>
    adminRequest<AdminHomepageSlide>("/api/admin/homepage/slides", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateHomepageSlide: (id: number, data: Record<string, unknown>) =>
    adminRequest<AdminHomepageSlide>(`/api/admin/homepage/slides/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteHomepageSlide: (id: number) =>
    adminRequest(`/api/admin/homepage/slides/${id}`, { method: "DELETE" }),
  createHomepageItem: (data: Record<string, unknown>) =>
    adminRequest<AdminHomepageItem>("/api/admin/homepage/items", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateHomepageItem: (id: number, data: Record<string, unknown>) =>
    adminRequest<AdminHomepageItem>(`/api/admin/homepage/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteHomepageItem: (id: number) =>
    adminRequest(`/api/admin/homepage/items/${id}`, { method: "DELETE" }),
  updateHomepageSettings: (data: Record<string, unknown>) =>
    adminRequest("/api/admin/homepage/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getNewsletterSubscribers: () =>
    adminRequest<AdminNewsletterSubscriber[]>("/api/admin/newsletter-subscribers"),
  deleteNewsletterSubscriber: (id: number) =>
    adminRequest(`/api/admin/newsletter-subscribers/${id}`, { method: "DELETE" }),
  getPlpSettings: () => adminRequest<Record<string, unknown>>("/api/admin/settings/plp"),
  updatePlpSettings: (data: Record<string, unknown>) =>
    adminRequest<Record<string, unknown>>("/api/admin/settings/plp", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getVisitsStats: (period: string = "30d") =>
    adminRequest<VisitsStats>(`/api/admin/analytics/visits?period=${encodeURIComponent(period)}`),

  visitsExportUrl: (period: string = "30d") =>
    `${API_URL}/api/admin/analytics/visits/export?period=${encodeURIComponent(period)}`,

  async uploadHomepageImage(file: File, kind = "desktop") {
    const body = new FormData();
    body.append("image", file);
    body.append("kind", kind);
    const headers = authHeaders();
    const res = await fetch(`${API_URL}/api/admin/homepage/upload`, {
      method: "POST",
      credentials: "omit",
      headers,
      body,
    });
    if (res.status === 401) {
      redirectToLogin();
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Échec de l'upload.");
    }
    return res.json() as Promise<{ path: string; url: string }>;
  },

  getAdminServices: () =>
    adminRequest<{ services: AdminService[]; settings: Record<string, unknown> }>("/api/admin/services"),
  createService: (data: Record<string, unknown>) =>
    adminRequest<AdminService>("/api/admin/services", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id: number, data: Record<string, unknown>) =>
    adminRequest<AdminService>(`/api/admin/services/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteService: (id: number) => adminRequest(`/api/admin/services/${id}`, { method: "DELETE" }),
  reorderServices: (order: number[]) =>
    adminRequest("/api/admin/services/reorder", { method: "PATCH", body: JSON.stringify({ order }) }),
  getServiceSettings: () => adminRequest<Record<string, unknown>>("/api/admin/services/settings"),
  updateServiceSettings: (data: Record<string, unknown>) =>
    adminRequest("/api/admin/services/settings", { method: "PUT", body: JSON.stringify(data) }),
  getServiceRequests: (params?: { status?: string; service?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params || {}).filter(([, v]) => v) as [string, string][]
    ).toString();
    return adminRequest<AdminServiceRequest[]>(`/api/admin/service-requests${qs ? `?${qs}` : ""}`);
  },
  updateServiceRequestStatus: (id: number, data: Record<string, unknown>) =>
    adminRequest<AdminServiceRequest>(`/api/admin/service-requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getNavigationAdmin: () => adminRequest<AdminNavigationPayload>("/api/admin/navigation"),
  createMenuSection: (data: Record<string, unknown>) =>
    adminRequest<AdminMenuSection>("/api/admin/navigation/sections", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMenuSection: (id: number, data: Record<string, unknown>) =>
    adminRequest<AdminMenuSection>(`/api/admin/navigation/sections/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteMenuSection: (id: number) =>
    adminRequest(`/api/admin/navigation/sections/${id}`, { method: "DELETE" }),
  reorderMenuSections: (order: number[]) =>
    adminRequest("/api/admin/navigation/sections/reorder", {
      method: "PATCH",
      body: JSON.stringify({ order }),
    }),
  createMenuItem: (data: Record<string, unknown>) =>
    adminRequest<AdminMenuItem>("/api/admin/navigation/items", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMenuItem: (id: number, data: Record<string, unknown>) =>
    adminRequest<AdminMenuItem>(`/api/admin/navigation/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteMenuItem: (id: number) =>
    adminRequest(`/api/admin/navigation/items/${id}`, { method: "DELETE" }),
  reorderMenuItems: (order: number[]) =>
    adminRequest("/api/admin/navigation/items/reorder", {
      method: "PATCH",
      body: JSON.stringify({ order }),
    }),
  updateNavigationSettings: (data: Record<string, unknown>) =>
    adminRequest("/api/admin/navigation/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  exportProductsCsvUrl: () =>
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/products/export`,

  async downloadProductsCsv(kind: "template" | "export" = "template") {
    const path =
      kind === "template"
        ? "/api/admin/products/import-template"
        : "/api/admin/products/export";
    const headers = authHeaders({ Accept: "text/csv" });
    const res = await fetch(`${API_URL}${path}`, {
      credentials: "omit",
      headers,
    });
    if (res.status === 401) {
      redirectToLogin();
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }
    if (!res.ok) throw new Error("Téléchargement impossible.");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      kind === "template"
        ? "template-import-produits.csv"
        : `produits-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  async importProductsCsv(file: File) {
    const body = new FormData();
    body.append("file", file);
    const headers = authHeaders();
    const res = await fetch(`${API_URL}/api/admin/products/import`, {
      method: "POST",
      credentials: "omit",
      headers,
      body,
    });
    if (res.status === 401) {
      redirectToLogin();
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Échec de l'import.");
    }
    return data as {
      created: number;
      updated: number;
      skipped: number;
      errors: string[];
      message: string;
    };
  },

  getNotificationSettings: () =>
    adminRequest<Record<string, unknown>>("/api/admin/notifications/settings"),
  updateNotificationSettings: (data: Record<string, unknown>) =>
    adminRequest<Record<string, unknown>>("/api/admin/notifications/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getNotificationTemplates: () =>
    adminRequest<{
      data: AdminNotificationTemplate[];
      types: string[];
      channels: string[];
      variables: string[];
    }>("/api/admin/notifications/templates"),
  saveNotificationTemplate: (data: Record<string, unknown>) =>
    adminRequest<AdminNotificationTemplate>("/api/admin/notifications/templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateNotificationTemplate: (id: number, data: Record<string, unknown>) =>
    adminRequest<AdminNotificationTemplate>(`/api/admin/notifications/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  previewNotificationTemplate: (data: Record<string, unknown>) =>
    adminRequest<{ subject: string; body: string }>("/api/admin/notifications/templates/preview", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  seedNotificationTemplates: () =>
    adminRequest<{ seeded: number }>("/api/admin/notifications/templates/seed", { method: "POST" }),
  getNotificationStats: () =>
    adminRequest<AdminNotificationStats>("/api/admin/notifications/stats"),
  getFailedNotifications: () =>
    adminRequest<{ data: AdminNotificationLog[] }>("/api/admin/notifications/failed"),
  resendFailedNotification: (id: number) =>
    adminRequest(`/api/admin/notifications/failed/${id}/resend`, { method: "POST" }),
  getContentReports: () =>
    adminRequest<{ data: AdminContentReport[] }>("/api/admin/content-reports"),
  updateContentReport: (id: number, status: string) =>
    adminRequest(`/api/admin/content-reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getProductChats: () =>
    adminRequest<{
      data: Array<{
        id: number;
        status: string;
        last_message_at: string | null;
        unread_count?: number;
        product?: { id: number; name: string; slug: string };
        customer?: { id: number; name: string | null; phone: string | null };
      }>;
    }>("/api/admin/product-chats"),
  getProductChatMessages: (id: number) =>
    adminRequest<{
      chat: { id: number };
      data: Array<{ id: number; body: string; sender_type: string; created_at: string }>;
    }>(`/api/admin/product-chats/${id}/messages`),
  replyProductChat: (id: number, body: string) =>
    adminRequest(`/api/admin/product-chats/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  getFooterAdmin: () =>
    adminRequest<{
      settings: Record<string, unknown>;
      columns: Array<{
        id: number;
        title: string;
        display_order: number;
        is_active: boolean;
        links: Array<{
          id: number;
          footer_column_id: number;
          label: string;
          url: string;
          display_order: number;
          is_active: boolean;
          opens_new_tab: boolean;
        }>;
      }>;
      socials: Array<{
        id: number;
        platform: string;
        url: string;
        is_active: boolean;
        display_order: number;
      }>;
      payments: Array<{
        id: number;
        name: string;
        logo_path: string;
        display_order: number;
        is_active: boolean;
      }>;
    }>("/api/admin/footer"),
  updateFooterSettings: (data: Record<string, unknown>) =>
    adminRequest("/api/admin/footer/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  seedFooter: () => adminRequest<{ seeded: boolean; columns?: number }>("/api/admin/footer/seed", { method: "POST" }),
  createFooterColumn: (data: { title: string; is_active?: boolean }) =>
    adminRequest("/api/admin/footer/columns", { method: "POST", body: JSON.stringify(data) }),
  updateFooterColumn: (id: number, data: Record<string, unknown>) =>
    adminRequest(`/api/admin/footer/columns/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteFooterColumn: (id: number) =>
    adminRequest(`/api/admin/footer/columns/${id}`, { method: "DELETE" }),
  reorderFooterColumns: (order: number[]) =>
    adminRequest("/api/admin/footer/columns/reorder", {
      method: "PATCH",
      body: JSON.stringify({ order }),
    }),
  createFooterLink: (data: Record<string, unknown>) =>
    adminRequest("/api/admin/footer/links", { method: "POST", body: JSON.stringify(data) }),
  updateFooterLink: (id: number, data: Record<string, unknown>) =>
    adminRequest(`/api/admin/footer/links/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteFooterLink: (id: number) =>
    adminRequest(`/api/admin/footer/links/${id}`, { method: "DELETE" }),
  reorderFooterLinks: (order: number[]) =>
    adminRequest("/api/admin/footer/links/reorder", {
      method: "PATCH",
      body: JSON.stringify({ order }),
    }),
  upsertFooterSocial: (data: Record<string, unknown>) =>
    adminRequest("/api/admin/footer/socials", { method: "POST", body: JSON.stringify(data) }),
  reorderFooterSocials: (order: number[]) =>
    adminRequest("/api/admin/footer/socials/reorder", {
      method: "PATCH",
      body: JSON.stringify({ order }),
    }),
  deleteFooterSocial: (id: number) =>
    adminRequest(`/api/admin/footer/socials/${id}`, { method: "DELETE" }),
  async uploadFooterPayment(name: string, file: File) {
    const body = new FormData();
    body.append("name", name);
    body.append("logo", file);
    const headers = authHeaders();
    const res = await fetch(`${API_URL}/api/admin/footer/payments`, {
      method: "POST",
      credentials: "omit",
      headers,
      body,
    });
    if (res.status === 401) {
      redirectToLogin();
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Upload paiement échoué");
    }
    return res.json();
  },
  updateFooterPayment: (id: number, data: Record<string, unknown>) =>
    adminRequest(`/api/admin/footer/payments/${id}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  reorderFooterPayments: (order: number[]) =>
    adminRequest("/api/admin/footer/payments/reorder", {
      method: "PATCH",
      body: JSON.stringify({ order }),
    }),
  deleteFooterPayment: (id: number) =>
    adminRequest(`/api/admin/footer/payments/${id}`, { method: "DELETE" }),
};

export type AdminNotificationTemplate = {
  id: number;
  type: string;
  channel: string;
  subject: string | null;
  body_template: string;
  is_active: boolean;
};

export type AdminNotificationStats = {
  by_type: Record<string, number>;
  by_channel: Record<string, number>;
  by_status: Record<string, number>;
  sent_7d: number;
  failed_7d: number;
};

export type AdminNotificationLog = {
  id: number;
  type: string;
  channel: string;
  recipient: string | null;
  status: string;
  error: string | null;
  attempts: number;
  created_at: string;
};

export type AdminContentReport = {
  id: number;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  customer?: { id: number; name: string | null; phone: string | null } | null;
};

export type AdminMenuItem = {
  id: number;
  menu_section_id: number;
  parent_id: number | null;
  label: string;
  linked_category_id: number | null;
  custom_url: string | null;
  display_order: number;
  is_active: boolean;
  category?: { id: number; name: string; slug: string; is_active?: boolean } | null;
  children?: AdminMenuItem[];
};

export type AdminMenuSection = {
  id: number;
  label: string;
  linked_category_id: number | null;
  custom_url: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  category?: { id: number; name: string; slug: string; is_active?: boolean } | null;
  items?: AdminMenuItem[];
};

export type AdminNavigationPayload = {
  sections: AdminMenuSection[];
  settings: Record<string, unknown>;
  broken_links: Array<{
    type: string;
    id: number;
    label: string;
    section?: string;
    linked_category_id: number | null;
    reason: string;
  }>;
  preview?: unknown;
};

export type AdminService = {
  id: number;
  title: string;
  slug: string;
  icon: string | null;
  icon_image: string | null;
  short_description: string | null;
  full_content: string | null;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  cta_label: string | null;
  cta_link: string | null;
  meta_title: string | null;
  meta_description: string | null;
  requests_count?: number;
};

export type AdminServiceRequest = {
  id: number;
  service_id: number;
  customer_name: string;
  phone: string;
  email: string | null;
  product_reference: string | null;
  message: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  service?: { id: number; title: string; slug: string };
};

export type AdminNewsletterSubscriber = {
  id: number;
  email: string;
  source: string;
  subscribed_at: string;
  created_at: string;
};

export type AdminHomepageSlide = {
  id: number;
  section_id: number | null;
  image_desktop: string;
  image_mobile: string | null;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
};

export type AdminHomepageItem = {
  id: number;
  section_id: number;
  item_type: string;
  title: string | null;
  subtitle: string | null;
  icon: string | null;
  image_url: string | null;
  link_url: string | null;
  category_id: number | null;
  display_order: number;
  is_active: boolean;
  category?: { id: number; name: string; slug: string } | null;
};

export type AdminHomepageSection = {
  id: number;
  type: string;
  title: string | null;
  subtitle: string | null;
  category_id: number | null;
  banner_image: string | null;
  banner_link: string | null;
  selection_mode: string | null;
  products_limit: number;
  display_order: number;
  is_active: boolean;
  meta?: Record<string, unknown> | null;
  category?: { id: number; name: string; slug: string } | null;
  slides?: AdminHomepageSlide[];
  items?: AdminHomepageItem[];
  featured_products?: Array<{
    id: number;
    product_id: number;
    display_order: number;
    product?: { id: number; name: string; slug: string };
  }>;
};

export type AdminHomepagePayload = {
  sections: AdminHomepageSection[];
  homepage_settings: Record<string, unknown>;
  socials: Record<string, string>;
  payment_logos: Array<{ url: string; label?: string }>;
  contacts_services: Record<string, string>;
  contact: Record<string, string>;
};

export type AdminBrand = {
  id: number;
  name: string;
  slug: string;
  logo_path: string | null;
  description: string | null;
  is_featured: boolean;
  show_in_footer?: boolean;
  is_active: boolean;
  display_order: number;
  products_count?: number;
};

export type AdminShowroom = {
  id: number;
  name: string;
  address: string;
  city: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: string | null;
  is_active: boolean;
  display_order: number;
};

export type AdminOrder = {
  id: number;
  reference: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  delivery_method: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  items?: Array<{ product_name: string; quantity: number; unit_price: number; subtotal: number }>;
};

export type AdminDeliveryZone = {
  id: number;
  zone_name: string;
  city: string | null;
  delivery_fee: number;
  estimated_delay: string | null;
  is_active: boolean;
  display_order: number;
};

export type AdminPromotion = {
  id: number;
  product_id: number;
  category_id: number | null;
  price_original: number;
  price_promo: number;
  discount_percent: number;
  discount_type: string;
  start_date: string;
  end_date: string;
  status: "draft" | "active" | "expired" | "out_of_stock" | "rejected";
  stock_quantity: number | null;
  is_featured: boolean;
  featured_order: number;
  vendor_name: string | null;
  notes: string | null;
  product?: AdminProduct & { images?: { id: number; path: string; order: number }[] };
  category?: Category | null;
  creator?: { id: number; name: string; email: string } | null;
};

export type PromoSettings = {
  min_discount_percent: number;
  max_discount_percent: number;
  min_duration_days: number;
  max_duration_days: number;
  max_active: number;
  require_approval: boolean;
  legal_text: string;
  newsletter_enabled: boolean;
  newsletter_frequency: "weekly" | "biweekly" | "monthly";
  expiry_alert_days: number;
  default_vendor_name: string;
};

export type CategoryModuleSettings = {
  max_depth: number;
  hide_empty: boolean;
  show_breadcrumb: boolean;
  default_sort: "newest" | "price_asc" | "price_desc" | "promo";
};

export type AdminCompany = {
  id: number;
  name: string;
  ninea: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  status: string;
  customers_count?: number;
  b2b_quotes_count?: number;
  invoices_count?: number;
};

export type AdminB2bQuote = {
  id: number;
  reference: string;
  company_id: number;
  title: string;
  notes: string | null;
  status: string;
  total_amount: number;
  valid_until: string | null;
  company?: { id: number; name: string };
  items?: Array<{
    id: number;
    label: string;
    quantity: number;
    unit_price: number;
    product_id: number | null;
  }>;
};

export type AdminInvoice = {
  id: number;
  reference: string;
  company_id: number;
  b2b_quote_id: number | null;
  title: string;
  amount: number;
  status: string;
  issued_at: string | null;
  due_at: string | null;
  company?: { id: number; name: string };
  quote?: { id: number; reference: string } | null;
};

export type AdminReview = {
  id: number;
  product_id: number;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  product?: { id: number; name: string; slug: string };
};

export type AdminCampaign = {
  id: number;
  title: string;
  channel: "sms" | "email" | "both";
  subject: string | null;
  body: string;
  audience: string;
  status: string;
  sent_sms: number;
  sent_email: number;
  failed: number;
  sent_at: string | null;
};
