const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function endpoint(path: string) {
  if (typeof window !== "undefined") {
    return `/api/bff${path.replace(/^\/api/, "")}`;
  }
  return `${API_URL}${path}`;
}

function networkError() {
  return new Error("Connexion impossible. Vérifiez le réseau et réessayez.");
}

export type AiProduct = {
  id: number;
  name: string;
  slug: string;
  sku?: string | null;
  price?: number | null;
  effective_price?: number | null;
  stock_quantity?: number | null;
  is_customizable?: boolean;
  short_description?: string | null;
  specs?: Record<string, string> | null;
  images?: Array<{ path: string }>;
  similarity?: number;
};

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(endpoint(path), {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw networkError();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Le service est indisponible.");
  return data as T;
}

export const aiApi = {
  status: () =>
    fetch(endpoint("/api/ai/status"), { headers: { Accept: "application/json" } }).then((r) => r.json()),
  search: (query: string, source: "text" | "voice" = "text") =>
    post<{ parsed: { max_price?: number | null; multi?: boolean }; products: AiProduct[]; message: string }>(
      "/api/ai/search",
      { query, source }
    ),
  chat: (body: { message: string; session_id?: string; product_slug?: string; page_path?: string }) =>
    post<{ session_id: string; reply: string; products: AiProduct[] }>("/api/ai/chat", body),
  compare: (slugs: string[]) =>
    post<{ analysis: string; rows: Array<{ label: string; values: string[] }>; missing: string[] }>("/api/ai/compare", { slugs }),
  plan: (body: Record<string, unknown>) =>
    post<{
      items: Array<{ product: AiProduct; quantity: number; note: string | null }>;
      total: number;
      budget: number | null;
      message: string;
    }>("/api/ai/plan", body),
  forYou: (slugs: string[], visitorId = "") =>
    post<{ products: AiProduct[]; message: string }>("/api/ai/for-you", {
      slugs,
      visitor_id: visitorId || undefined,
    }),
  recommendations: async (slug: string) => {
    const res = await fetch(endpoint(`/api/ai/recommendations/${encodeURIComponent(slug)}`), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { similar: [], also: [], budget: [], complement: [] };
    return res.json() as Promise<{
      similar: AiProduct[];
      also: AiProduct[];
      budget: AiProduct[];
      complement: AiProduct[];
    }>;
  },
  cartSuggestions: (productIds: number[]) =>
    post<{ products: AiProduct[] }>("/api/ai/cart-suggestions", { product_ids: productIds }),
  planPdf: async (body: Record<string, unknown>) => {
    let res: Response;
    try {
      res = await fetch(endpoint("/api/ai/plan/pdf"), {
        method: "POST",
        headers: { Accept: "application/pdf, application/json", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      throw networkError();
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "PDF indisponible.");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "estimation-dk-hometech.pdf";
    link.click();
    URL.revokeObjectURL(url);
  },
};
