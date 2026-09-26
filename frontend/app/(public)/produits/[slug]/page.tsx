import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import JsonLd from "@/components/seo/JsonLd";
import {
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildProductSchema,
  truncateMeta,
} from "@/lib/seo";
import ProductDetailClient from "./ProductDetailClient";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await api.getProduct(params.slug).catch(() => null);
  if (!product) {
    return { title: "Produit introuvable", robots: { index: false, follow: true } };
  }

  const cover = product.images?.[0];
  const description = truncateMeta(
    product.meta_description ||
      product.short_description ||
      product.description ||
      `${product.name} — ${product.category?.name || "DK HOMETECH"} disponible à Dakar, Sénégal.`
  );

  return buildPageMetadata({
    title: product.meta_title || `${product.name} | DK HOMETECH Sénégal`,
    description,
    path: `/produits/${product.slug}`,
    image: cover?.path,
    type: "product",
  });
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await api.getProduct(params.slug).catch(() => null);
  if (!product) notFound();

  const reviews = await api.getProductReviews(product.slug).catch(() => null);
  const average = reviews?.average || 0;
  const count = reviews?.count || 0;

  const crumbs = [
    { name: "Accueil", path: "/" },
    ...(product.category?.slug
      ? [{ name: product.category.name, path: `/categorie/${product.category.slug}` }]
      : [{ name: "Produits", path: "/produits" }]),
    { name: product.name, path: `/produits/${product.slug}` },
  ];

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema(crumbs),
          buildProductSchema(product, {
            average: count > 0 ? average : undefined,
            count: count > 0 ? count : undefined,
          }),
        ]}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
