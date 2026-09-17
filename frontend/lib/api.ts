const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Category = {
  id: number;
  parent_id?: number | null;
  name: string;
  slug: string;
  icon?: string | null;
  image_path?: string | null;
  description?: string | null;
  display_order?: number;
  is_active?: boolean;
  is_popular?: boolean;
  popular_order?: number;
  meta_title?: string | null;
  meta_description?: string | null;
  products_count?: number;
  children?: Category[];
};

export type CategoryTreeResponse = {
  tree: Category[];
  popular: Category[];
  settings: {
    show_breadcrumb: boolean;
    default_sort: string;
    hide_empty: boolean;
  };
};

export type CategoryShowResponse = {
  category: Category & {
    breadcrumb?: Array<{ id: number; name: string; slug: string }>;
  };
  children: Array<{ id: number; name: string; slug: string; products_count: number }>;
  attributes: Array<{
    id: number;
    name: string;
    slug: string;
    field_type: string;
    options?: Array<{ id: number; value: string }>;
  }>;
  products: Product[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    sort: string;
  };
  facets?: {
    categories: Array<{
      id: number;
      name: string;
      slug: string;
      count: number;
      children?: Array<{ id: number; name: string; slug: string; count: number }>;
    }>;
    brands: Array<{ id: number; name: string; slug: string; count: number }>;
    conditions: Array<{ value: string; label: string; count: number }>;
    availability: Array<{ value: string; label: string; count: number }>;
    attributes: Array<{
      id: number;
      name: string;
      slug: string;
      field_type: string;
      options?: Array<{ id: number; value: string; count: number }>;
    }>;
  };
  price_bounds?: { min: number; max: number };
  settings: {
    show_breadcrumb?: boolean;
    default_sort: string;
    default_view?: string;
    realtime_filter?: boolean;
    accordion_mode?: "exclusive" | "multiple";
    show_subcategories?: boolean;
    category_filter_title?: string;
    accent_color?: string;
    view_modes?: Record<string, boolean>;
    category_order?: string;
    popularity_logic?: string;
    filters?: Record<string, boolean>;
    sort_options?: Array<{ value: string; label: string; enabled?: boolean }>;
    per_page?: number;
  };
  redirect_to?: string;
};

export type ProductImage = {
  id: number;
  path: string;
  order: number;
  role?: string | null;
  label?: string | null;
};

export type Brand = {
  id: number;
  name: string;
  slug: string;
  logo_path?: string | null;
  description?: string | null;
  is_featured?: boolean;
  products_count?: number;
  meta_title?: string | null;
  meta_description?: string | null;
};

export type Showroom = {
  id: number;
  name: string;
  address: string;
  city?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  opening_hours?: string | null;
  pivot?: { stock_quantity?: number | null; is_available?: boolean };
};

export type Product = {
  id: number;
  category: Category;
  brand?: Brand | null;
  name: string;
  slug: string;
  sku?: string | null;
  description: string;
  short_description?: string | null;
  price: number | null;
  promo_price?: number | null;
  effective_price?: number | null;
  compare_at_price?: number | null;
  discount_percent?: number | null;
  badge_label?: string | null;
  condition?: "neuf" | "reconditionne";
  is_clearance?: boolean;
  stock_quantity?: number | null;
  specs?: Record<string, unknown> | null;
  meta_title?: string | null;
  meta_description?: string | null;
  is_customizable: boolean;
  images: ProductImage[];
  showrooms?: Showroom[];
};

export type QuotePayload = {
  product_id?: number;
  name: string;
  phone: string;
  email?: string;
  company_name?: string;
  quantity?: number;
  dimensions?: string;
  message: string;
};

export type ContactPayload = {
  name: string;
  phone: string;
  email?: string;
  message: string;
};

export type SiteSettings = {
  brand: {
    name: string;
    logo_url: string;
  };
  contact: {
    whatsapp: string;
    phone_display: string;
    phone_tel: string;
    /** Numéros affichés au clic sur l’icône appel (un par ligne) */
    phones: string;
    email: string;
    address: string;
    hours: string;
    maps_embed: string;
  };
  socials: {
    facebook: string;
    instagram: string;
    tiktok: string;
    youtube: string;
  };
  footer: {
    trust: string[];
  };
  seo: {
    title: string;
    description: string;
  };
  legal?: {
    cgv: string;
    mentions: string;
  };
  contacts_services?: {
    commercial: string;
    recrutement: string;
    reclamations: string;
  };
  payment_logos?: Array<{ url: string; label?: string }>;
  homepage?: {
    nav_secondary?: Array<{ label: string; href: string; enabled?: boolean; order?: number }>;
    newsletter?: {
      enabled?: boolean;
      title?: string;
      subtitle?: string;
      cta_label?: string;
      provider?: string;
    };
    whatsapp_widget?: {
      enabled?: boolean;
      phone?: string;
      message?: string;
      agent_image?: string;
    };
    footer_about?: string;
    footer_info_links?: Array<{ label: string; href: string; enabled?: boolean }>;
    agency_credit?: string;
  };
};

export type HomepageSlide = {
  id: number;
  image_desktop: string | null;
  image_mobile: string | null;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
  display_order: number;
};

export type HomepageItem = {
  id: number;
  item_type: string;
  title: string | null;
  subtitle: string | null;
  icon: string | null;
  image_url: string | null;
  link_url: string | null;
  category?: { id: number; name: string; slug: string } | null;
  display_order: number;
};

export type HomepageSection = {
  id: number;
  type: string;
  title: string | null;
  subtitle: string | null;
  display_order: number;
  banner_image: string | null;
  banner_link: string | null;
  selection_mode: string | null;
  products_limit: number;
  meta?: Record<string, unknown>;
  category?: { id: number; name: string; slug: string } | null;
  slides?: HomepageSlide[];
  items?: HomepageItem[];
  products?: Product[];
  brands?: Array<{
    id: number;
    name: string;
    slug: string;
    logo_path?: string | null;
    logo_url?: string | null;
  }>;
};

export type HomepagePayload = {
  sections: HomepageSection[];
  nav_secondary: Array<{ label: string; href: string; enabled?: boolean; order?: number }>;
  newsletter: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    cta_label?: string;
    provider?: string;
  };
  whatsapp_widget: {
    enabled?: boolean;
    phone?: string;
    message?: string;
    agent_image?: string;
  };
  footer: {
    about?: string;
    info_links?: Array<{ label: string; href: string; enabled?: boolean }>;
    agency_credit?: string;
    payment_logos?: Array<{ url: string; label?: string }>;
    contacts_services?: Record<string, string>;
  };
  socials: SiteSettings["socials"];
  contact: SiteSettings["contact"];
  brand: SiteSettings["brand"];
};

export type ServiceItem = {
  id: number;
  title: string;
  slug: string;
  icon?: string | null;
  icon_image?: string | null;
  short_description?: string | null;
  cta_label?: string | null;
  cta_link?: string | null;
  display_order?: number;
  is_featured?: boolean;
};

export type ServiceSettings = {
  intro_title?: string;
  intro_text?: string;
  request_form_enabled?: boolean;
  home_featured_limit?: number;
};

export type NavigationItem = {
  id: number;
  label: string;
  href: string | null;
  linked_category?: { id: number; name: string; slug: string } | null;
  children?: NavigationItem[];
};

export type NavigationSection = {
  id: number;
  label: string;
  icon?: string | null;
  href: string | null;
  has_panel: boolean;
  linked_category?: { id: number; name: string; slug: string } | null;
  items: NavigationItem[];
};

export type NavigationPayload = {
  sections: NavigationSection[];
  settings: {
    columns?: number;
    mobile_mode?: string;
    show_icons?: boolean;
    show_product_counts?: boolean;
  };
};

export type PagePayload = {
  page_key: string;
  blocks: Record<string, unknown>;
};

export type Promotion = {
  id: number;
  product_id: number;
  category_id: number | null;
  price_original: number;
  price_promo: number;
  discount_percent: number;
  discount_label: string;
  discount_type: string;
  start_date: string;
  end_date: string;
  status: string;
  stock_quantity: number | null;
  is_featured: boolean;
  vendor_name: string | null;
  product?: Product;
  category?: Category | null;
};

export type PromotionsResponse = {
  data: Promotion[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
  };
  categories: Array<{ id: number; name: string; slug: string; count: number }>;
  legal_text: string;
};

export type Realization = {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  tag: string | null;
  sort_order: number;
  status: "draft" | "published";
};

function customerBearer(): Record<string, string> {
  return {};
}

async function request<T>(
  path: string,
  options?: RequestInit & { cache?: RequestCache }
): Promise<T> {
  const { headers: optHeaders, cache, ...rest } = options || {};
  const isBrowser = typeof window !== "undefined";
  const useBff = isBrowser && path.startsWith("/api/quotes") && options?.method === "POST";
  const url = useBff
    ? `/api/bff/${path.replace(/^\/api\//, "")}`
    : `${API_URL}${path}`;

  const init: RequestInit = {
    ...rest,
    ...(cache !== undefined
      ? { cache }
      : path.includes("/settings") || path.includes("/pages/")
        ? { cache: "no-store" as RequestCache }
        : {}),
    credentials: useBff ? "same-origin" : rest.credentials,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...customerBearer(),
      ...(optHeaders as Record<string, string> | undefined),
    },
  };

  if (!isBrowser && init.cache !== "no-store") {
    Object.assign(init, { next: { revalidate: 30 } });
  }

  const res = await fetch(url, init);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Une erreur est survenue, veuillez réessayer.");
  }

  return res.json();
}

export const api = {
  getCategories: () => request<CategoryTreeResponse>("/api/categories", { cache: "no-store" }),

  getCategory: (slug: string, params?: Record<string, string>) => {
    const qs = new URLSearchParams(
      Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== "") as [string, string][]
    ).toString();
    return request<CategoryShowResponse>(`/api/categories/${slug}${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
    });
  },

  getProducts: async (params?: {
    category?: string;
    search?: string;
    sort?: string;
    brand?: string;
    clearance?: string;
    condition?: string;
    promo?: string;
    min_price?: string;
    max_price?: string;
    page?: string;
    per_page?: string;
    paginated?: string;
  }) => {
    const qs = new URLSearchParams(
      Object.entries(params || {}).filter(([, v]) => v) as [string, string][]
    ).toString();
    // Avec page/paginated l’API renvoie { data, meta } ; sinon un tableau.
    const res = await request<Product[] | { data: Product[]; meta?: unknown }>(
      `/api/products${qs ? `?${qs}` : ""}`,
      { cache: "no-store" }
    );
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  getProduct: (slug: string) =>
    request<Product>(`/api/products/${slug}`, { cache: "no-store" }),

  getBrands: (featured?: boolean) =>
    request<Brand[]>(`/api/brands${featured ? "?featured=1" : ""}`, { cache: "no-store" }),

  getBrand: (slug: string) =>
    request<{ brand: Brand; products: Product[]; meta: { total: number; current_page: number; last_page: number } }>(
      `/api/brands/${slug}`,
      { cache: "no-store" }
    ),

  getShowrooms: () => request<Showroom[]>("/api/showrooms", { cache: "no-store" }),

  getDeliveryZones: () =>
    request<
      Array<{
        id: number;
        zone_name: string;
        city: string | null;
        delivery_fee: number;
        estimated_delay: string | null;
      }>
    >("/api/delivery-zones", { cache: "no-store" }),

  getCheckoutOptions: () =>
    request<{
      guest_enabled: boolean;
      payment_methods: Array<{ key: string; label: string; enabled: boolean }>;
      stock_per_showroom: boolean;
    }>("/api/checkout/options", { cache: "no-store" }),

  getOrder: (reference: string, phone?: string) => {
    const qs = phone ? `?phone=${encodeURIComponent(phone)}` : "";
    return request(`/api/orders/${reference}${qs}`, { cache: "no-store" });
  },

  getSettings: () => request<SiteSettings>("/api/settings", { cache: "no-store" }),

  getPage: (pageKey: string) =>
    request<PagePayload>(`/api/pages/${pageKey}`, { cache: "no-store" }),

  getHomepage: () => request<HomepagePayload>("/api/homepage", { cache: "no-store" }),

  getNavigation: () => request<NavigationPayload>("/api/navigation", { cache: "no-store" }),

  getFooter: () =>
    request<{
      settings: {
        newsletter_title: string;
        newsletter_text: string;
        newsletter_legal_intro?: string | null;
        newsletter_legal_link_label?: string | null;
        newsletter_legal_url?: string | null;
        newsletter_privacy_label: string;
        newsletter_privacy_url: string;
        newsletter_privacy_link_label?: string | null;
        newsletter_disclaimer?: string | null;
        newsletter_cta: string;
        show_newsletter: boolean;
        app_block_title: string;
        app_block_subtitle: string;
        app_store_url: string | null;
        google_play_url: string | null;
        show_app_block: boolean;
        company_name: string;
        company_address: string;
        company_phones: string;
        copyright_text: string;
        contact_heading?: string;
        socials_heading?: string;
        payments_heading?: string;
        brands_heading?: string;
        payments_empty_text?: string;
        columns_count: number;
        brand_name: string;
        logo_url: string | null;
      };
      columns: Array<{
        id: number;
        title: string;
        links: Array<{ id: number; label: string; url: string; opens_new_tab: boolean }>;
      }>;
      socials: Array<{ id: number; platform: string; url: string }>;
      payments: Array<{ id: number; name: string; logo_url: string | null }>;
      brands: Array<{ id: number; name: string; slug: string; href: string }>;
    }>("/api/footer", { cache: "no-store" }),

  getServices: () =>
    request<{
      services: ServiceItem[];
      settings: ServiceSettings;
    }>("/api/services", { cache: "no-store" }),

  getService: (slug: string) =>
    request<{
      service: ServiceItem & {
        full_content?: string | null;
        meta_title?: string | null;
        meta_description?: string | null;
      };
      settings: ServiceSettings;
      siblings: ServiceItem[];
    }>(`/api/services/${slug}`, { cache: "no-store" }),

  requestService: async (
    slug: string,
    data: {
      customer_name: string;
      phone: string;
      email?: string;
      product_reference?: string;
      message: string;
    }
  ) => {
    const res = await fetch(`${API_URL}/api/services/${slug}/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Envoi impossible.");
    }
    return res.json() as Promise<{ message: string; id: number }>;
  },

  subscribeNewsletter: async (email: string) => {
    const res = await fetch(`${API_URL}/api/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Inscription impossible.");
    }
    return res.json() as Promise<{ message: string }>;
  },

  getRealizations: () => request<Realization[]>("/api/realizations"),

  getPromotions: (params?: {
    category?: string;
    sort?: string;
    featured?: string;
    page?: string;
    per_page?: string;
  }) => {
    const qs = new URLSearchParams(
      Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== "") as [string, string][]
    ).toString();
    return request<PromotionsResponse>(`/api/promotions${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
    });
  },

  getPromotion: (id: number) => request<Promotion>(`/api/promotions/${id}`),

  async searchByImage(file: File) {
    const body = new FormData();
    body.append("image", file);
    const res = await fetch(`${API_URL}/api/products/search-by-image`, {
      method: "POST",
      headers: { Accept: "application/json" },
      body,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Recherche par image impossible.");
    }
    return res.json() as Promise<{
      products: Product[];
      keywords: string[];
      image_url: string;
      fallback: boolean;
    }>;
  },

  sendQuote: (payload: QuotePayload) =>
    request<{ message: string }>("/api/quotes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  sendContact: (payload: ContactPayload) =>
    request<{ message: string }>("/api/contact", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export function imageUrl(path: string | null | undefined) {
  const raw = String(path || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/storage/")) return `${API_URL}${raw}`;
  if (raw.startsWith("storage/")) return `${API_URL}/${raw}`;
  return `${API_URL}/storage/${raw.replace(/^\//, "")}`;
}
