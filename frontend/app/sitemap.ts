import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { flattenCategories, siteBaseUrl } from "@/lib/seo";

const STATIC_PATHS: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/produits", changeFrequency: "daily", priority: 0.9 },
  { path: "/categories", changeFrequency: "weekly", priority: 0.85 },
  { path: "/promotions", changeFrequency: "daily", priority: 0.85 },
  { path: "/reconditionne", changeFrequency: "weekly", priority: 0.75 },
  { path: "/destockage", changeFrequency: "weekly", priority: 0.75 },
  { path: "/marques", changeFrequency: "weekly", priority: 0.7 },
  { path: "/services", changeFrequency: "weekly", priority: 0.75 },
  { path: "/showrooms", changeFrequency: "monthly", priority: 0.75 },
  { path: "/realisations", changeFrequency: "monthly", priority: 0.7 },
  { path: "/a-propos", changeFrequency: "monthly", priority: 0.65 },
  { path: "/devis", changeFrequency: "monthly", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.75 },
  { path: "/comment-commander", changeFrequency: "monthly", priority: 0.7 },
  { path: "/livraison", changeFrequency: "monthly", priority: 0.7 },
  { path: "/paiement", changeFrequency: "monthly", priority: 0.7 },
  { path: "/retours", changeFrequency: "monthly", priority: 0.65 },
  { path: "/politique-confidentialite", changeFrequency: "yearly", priority: 0.4 },
  { path: "/cgu", changeFrequency: "yearly", priority: 0.4 },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.4 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
];

async function fetchJson<T>(url: string, ms = 8000): Promise<T | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function fetchAllProducts(): Promise<Array<{ slug: string }>> {
  const all: Array<{ slug: string }> = [];
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  let page = 1;
  let lastPage = 1;
  do {
    const qs = new URLSearchParams({
      page: String(page),
      per_page: "100",
      paginated: "1",
    });
    const body = await fetchJson<{
      data?: Array<{ slug: string }>;
      meta?: { last_page?: number };
    } | Array<{ slug: string }>>(`${API_URL}/api/products?${qs}`, 10000);
    if (!body) break;
    const items: Array<{ slug: string }> = Array.isArray(body)
      ? body
      : Array.isArray(body?.data)
        ? body.data
        : [];
    all.push(...items);
    lastPage = Number((!Array.isArray(body) && body?.meta?.last_page) || 1);
    page += 1;
  } while (page <= lastPage && page <= 20);
  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBaseUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: p.path === "/" ? base : `${base}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  try {
    const [categoriesRes, brands, servicesRes, products] = await Promise.all([
      api.getCategories().catch(() => null),
      api.getBrands().catch(() => [] as Array<{ slug: string }>),
      api.getServices().catch(() => null),
      fetchAllProducts().catch(() => [] as Array<{ slug: string }>),
    ]);

    const categories = flattenCategories(categoriesRes?.tree || []);
    const categoryPages: MetadataRoute.Sitemap = categories
      .filter((c) => c.is_active !== false && c.slug)
      .map((c) => ({
        url: `${base}/categorie/${c.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));

    const brandPages: MetadataRoute.Sitemap = (brands || [])
      .filter((b) => b.slug)
      .map((b) => ({
        url: `${base}/marque/${b.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

    const servicePages: MetadataRoute.Sitemap = (servicesRes?.services || [])
      .filter((s) => s.slug)
      .map((s) => ({
        url: `${base}/services/${s.slug}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));

    const productPages: MetadataRoute.Sitemap = products
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${base}/produits/${p.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.85,
      }));

    return [...staticPages, ...categoryPages, ...brandPages, ...servicePages, ...productPages];
  } catch {
    // Ne jamais casser le sitemap : au minimum les pages statiques
    return staticPages;
  }
}
