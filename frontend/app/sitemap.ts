import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/$/, "");

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/produits`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/realisations`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/a-propos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/devis`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  const products = await api.getProducts({ per_page: "100", page: "1" }).catch(() => []);
  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/produits/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
