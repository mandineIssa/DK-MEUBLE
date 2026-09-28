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

  const [reviews, categoryProducts, latestProducts, settings] = await Promise.all([
    api.getProductReviews(product.slug).catch(() => null),
    product.category?.slug
      ? api.getProducts({ category: product.category.slug, per_page: "8" }).catch(() => [])
      : Promise.resolve([]),
    api.getProducts({ per_page: "8" }).catch(() => []),
    api.getSettings().catch(() => null),
  ]);
  const settingsProductPage = settings?.product_page;
  const similarProducts = [...categoryProducts, ...latestProducts]
    .filter((item, index, list) => item.id !== product.id && list.findIndex((row) => row.id === item.id) === index)
    .slice(0, 4);
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
      <ProductDetailClient
        product={product}
        similarProducts={similarProducts}
        reviewAverage={count > 0 ? average : 4.8}
        reviewCount={count > 0 ? count : (settingsProductPage?.reviews?.filter((r) => r.body).length || 0)}
        reviewsAreExample={count === 0}
        productPage={settingsProductPage}
      />
    </>
  );
}
