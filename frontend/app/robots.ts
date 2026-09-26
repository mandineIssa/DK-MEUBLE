import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = siteBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/admin",
        "/panier",
        "/panier/",
        "/commande",
        "/commande/",
        "/compte",
        "/compte/",
        "/api/",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
