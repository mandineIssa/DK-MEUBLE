import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, imageUrl } from "@/lib/api";
import ProductDetailClient from "./ProductDetailClient";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await api.getProduct(params.slug).catch(() => null);
  if (!product) return { title: "Produit introuvable" };

  const cover = product.images?.[0];
  const description =
    product.meta_description ||
    product.description?.slice(0, 155) ||
    `${product.name} — ${product.category?.name || "DK MEUBLE"} à Dakar`;

  return {
    title: product.meta_title || product.name,
    description,
    openGraph: {
      title: `${product.name} | DK MEUBLE`,
      description,
      images: cover ? [{ url: imageUrl(cover.path) }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await api.getProduct(params.slug).catch(() => null);
  if (!product) notFound();
  return <ProductDetailClient product={product} />;
}
