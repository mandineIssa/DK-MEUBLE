import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { flattenCategories, siteBaseUrl } from "@/lib/seo";

const STATIC_PATHS: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }> = [
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

async function fetchAllProducts(): Promise<Array<{ slug: string }>> {
  const all: Array<{ slug: string }> = [];
  let page = 1;
  let lastPage = 1;
  do {
    const qs = new URLSearchParams({
      page: String(page),
      per_page: "100",
      paginated: "1",
    });
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${API_URL}/api/products?${qs}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    }).catch(() => null);
    if (!res?.ok) break;
    const body = await res.json();
    const items: Array<{ slug: string }> = Array.isArray(body)
      ? body
      : Array.isArray(body?.data)
        ? body.data
        : [];
    all.push(...items);
    lastPage = Number(body?.meta?.last_page || 1);
    page += 1;
  } while (page <= lastPage && page <= 50);
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

  const [categoriesRes, brands, servicesRes, products] = await Promise.all([
    api.getCategories().catch(() => null),
    api.getBrands().catch(() => [] as Array<{ slug: string }>),
    api.getServices().catch(() => null),
    fetchAllProducts(),
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
}
