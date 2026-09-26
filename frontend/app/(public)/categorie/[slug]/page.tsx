import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { api } from "@/lib/api";
import CategoryPlp from "@/components/category/CategoryPlp";
import JsonLd from "@/components/seo/JsonLd";
import {
  buildBreadcrumbSchema,
  buildCategorySchema,
  buildPageMetadata,
  truncateMeta,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
  searchParams:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] || "";
  return v || "";
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  const sp = await Promise.resolve(searchParams);
  try {
    const data = await api.getCategory(slug);
    if (data.redirect_to || !data.category) {
      return { title: "Catégorie", robots: { index: false, follow: true } };
    }

    const page = Number(firstParam(sp.page) || "1") || 1;
    const hasFilters = Object.keys(sp || {}).some(
      (k) => k !== "page" && firstParam(sp[k])
    );
    const path =
      page > 1 ? `/categorie/${data.category.slug}?page=${page}` : `/categorie/${data.category.slug}`;

    const description = truncateMeta(
      data.category.meta_description ||
        data.category.description ||
        `${data.category.name} à Dakar — meubles et électroménager DK HOMETECH, livraison Sénégal.`
    );

    return buildPageMetadata({
      title:
        data.category.meta_title ||
        `${data.category.name} à Dakar | DK HOMETECH`,
      description,
      path,
      image: data.category.image_path,
      noIndex: hasFilters,
    });
  } catch {
    return { title: "Catégorie", robots: { index: false, follow: true } };
  }
}

export default async function CategoryListingPage({ params, searchParams }: PageProps) {
  const { slug } = await Promise.resolve(params);
  const sp = await Promise.resolve(searchParams);

  let data;
  try {
    const qs = new URLSearchParams();
    Object.entries(sp || {}).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((item) => qs.append(k, item));
      else if (v) qs.append(k, v);
    });
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${API_URL}/api/categories/${slug}?${qs.toString()}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) notFound();
    data = await res.json();
  } catch {
    notFound();
  }

  if (data.redirect_to) {
    permanentRedirect(`/categorie/${data.redirect_to}`);
  }

  if (!data.category) notFound();

  const breadcrumb = data.category.breadcrumb || [];
  const crumbs = [
    { name: "Accueil", path: "/" },
    ...breadcrumb.map((b: { name: string; slug: string }) => ({
      name: b.name,
      path: `/categorie/${b.slug}`,
    })),
  ];
  if (!breadcrumb.some((b: { slug: string }) => b.slug === data.category.slug)) {
    crumbs.push({ name: data.category.name, path: `/categorie/${data.category.slug}` });
  }

  return (
    <>
      <JsonLd data={[buildBreadcrumbSchema(crumbs), buildCategorySchema(data.category)]} />
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Chargement…
          </div>
        }
      >
        <CategoryPlp slug={slug} initial={data} />
      </Suspense>
    </>
  );
}
