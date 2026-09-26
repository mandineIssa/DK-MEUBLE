import type { Metadata } from "next";
import type { Brand, Category, Product } from "@/lib/api";
import { imageUrl } from "@/lib/api";
import type { SiteInfo } from "@/lib/site";

export const SITE_NAME = "DK HOMETECH";
export const DEFAULT_LOCALE = "fr_SN";
export const PRICE_CURRENCY = "XOF";

export function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path = "/"): string {
  const base = siteBaseUrl();
  if (!path || path === "/") return base;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function absoluteImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  const url = imageUrl(path);
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
  return url.startsWith("/") ? `${api}${url}` : url;
}

export type SeoInput = {
  title: string;
  description?: string;
  path: string;
  image?: string | null;
  type?: "website" | "article" | "product";
  noIndex?: boolean;
  keywords?: string[];
};

export function buildPageMetadata(input: SeoInput): Metadata {
  const url = absoluteUrl(input.path);
  const description = (input.description || "").trim() || undefined;
  const image = input.image
    ? /^https?:\/\//i.test(input.image)
      ? input.image
      : absoluteImageUrl(input.image) || input.image
    : undefined;
  const images = image ? [{ url: image }] : undefined;

  return {
    title: input.title,
    description,
    keywords: input.keywords,
    alternates: { canonical: url },
    robots: input.noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
    openGraph: {
      type: input.type === "article" ? "article" : "website",
      locale: DEFAULT_LOCALE,
      url,
      siteName: SITE_NAME,
      title: input.title.includes(SITE_NAME) ? input.title : `${input.title} | ${SITE_NAME}`,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title.includes(SITE_NAME) ? input.title : `${input.title} | ${SITE_NAME}`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export const NOINDEX_METADATA: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: undefined },
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function truncateMeta(text: string, max = 155): string {
  const t = stripHtml(text);
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export function productAvailability(product: Product): string {
  if (product.stock_quantity == null) return "https://schema.org/InStock";
  if (product.stock_quantity > 0) return "https://schema.org/InStock";
  return "https://schema.org/OutOfStock";
}

export function buildOrganizationSchema(site: SiteInfo) {
  const sameAs = Object.values(site.socialUrls || {}).filter(Boolean);
  const logo = site.logoUrl
    ? site.logoUrl.startsWith("http")
      ? site.logoUrl
      : absoluteImageUrl(site.logoUrl)
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "FurnitureStore", "LocalBusiness"],
    name: site.name || SITE_NAME,
    alternateName: ["DKHOMETECH", "DK HomeTech", "dkhometech", "DK Home Tech"],
    legalName: site.name || SITE_NAME,
    url: absoluteUrl("/"),
    logo: logo || undefined,
    email: site.email || undefined,
    telephone: site.phoneTel || site.phoneDisplay || undefined,
    address: site.address
      ? {
          "@type": "PostalAddress",
          streetAddress: site.address,
          addressLocality: "Dakar",
          addressCountry: "SN",
        }
      : {
          "@type": "PostalAddress",
          addressLocality: "Dakar",
          addressCountry: "SN",
        },
    openingHours: site.hours || undefined,
    areaServed: [
      { "@type": "City", name: "Dakar" },
      { "@type": "Country", name: "Sénégal" },
    ],
    sameAs: sameAs.length ? sameAs : undefined,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
      alternateName: ["DKHOMETECH", "dkhometech"],
    },
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: ["DKHOMETECH", "dkhometech.sn"],
    url: absoluteUrl("/"),
    inLanguage: "fr-SN",
    publisher: { "@type": "Organization", name: SITE_NAME },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/produits")}?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildProductSchema(
  product: Product,
  opts?: { average?: number; count?: number }
) {
  const price = product.effective_price ?? product.price;
  const images = (product.images || [])
    .map((img) => absoluteImageUrl(img.path))
    .filter(Boolean) as string[];
  const description = truncateMeta(
    product.meta_description ||
      product.short_description ||
      product.description ||
      product.name,
    5000
  );

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    sku: product.sku || undefined,
    url: absoluteUrl(`/produits/${product.slug}`),
    image: images.length ? images : undefined,
    brand: product.brand?.name
      ? { "@type": "Brand", name: product.brand.name }
      : { "@type": "Brand", name: SITE_NAME },
    category: product.category?.name || undefined,
  };

  if (price != null && Number.isFinite(price)) {
    schema.offers = {
      "@type": "Offer",
      url: absoluteUrl(`/produits/${product.slug}`),
      priceCurrency: PRICE_CURRENCY,
      price: String(price),
      availability: productAvailability(product),
      itemCondition:
        product.condition === "reconditionne"
          ? "https://schema.org/UsedCondition"
          : "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
    };
  }

  if (opts?.count && opts.count > 0 && opts.average && opts.average > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(opts.average),
      reviewCount: String(opts.count),
      bestRating: "5",
      worstRating: "1",
    };
  }

  return schema;
}

export function buildCategorySchema(category: Category & { breadcrumb?: Array<{ name: string; slug: string }> }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: truncateMeta(
      category.meta_description || category.description || `Produits ${category.name} chez ${SITE_NAME} à Dakar`,
      300
    ),
    url: absoluteUrl(`/categorie/${category.slug}`),
  };
}

export function buildBrandSchema(brand: Brand) {
  return {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: brand.name,
    description: brand.description || undefined,
    url: absoluteUrl(`/marque/${brand.slug}`),
    logo: brand.logo_path ? absoluteImageUrl(brand.logo_path) : undefined,
  };
}

export function flattenCategories(tree: Category[]): Category[] {
  const out: Category[] = [];
  const walk = (nodes: Category[]) => {
    for (const n of nodes) {
      out.push(n);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(tree);
  return out;
}
