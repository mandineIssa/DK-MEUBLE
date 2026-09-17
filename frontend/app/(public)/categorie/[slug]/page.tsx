import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import CategoryPlp from "@/components/category/CategoryPlp";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const { slug } = await Promise.resolve(params);
  try {
    const data = await api.getCategory(slug);
    if (data.redirect_to || !data.category) {
      return { title: "Catégorie" };
    }
    return {
      title: data.category.meta_title || data.category.name,
      description:
        data.category.meta_description ||
        data.category.description ||
        `Produits ${data.category.name} — DK MEUBLE`,
    };
  } catch {
    return { title: "Catégorie" };
  }
}

export default async function CategoryListingPage({
  params,
  searchParams,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
  searchParams:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await Promise.resolve(params);
  const sp = await Promise.resolve(searchParams);

  const query: Record<string, string> = {};
  Object.entries(sp || {}).forEach(([k, v]) => {
    if (Array.isArray(v)) query[k] = v.join(",");
    else if (v) query[k] = v;
  });

  let data;
  try {
    // Prefer multi category via raw query string for SSR
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
    if (!res.ok) throw new Error("not found");
    data = await res.json();
  } catch {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Catégorie introuvable</h1>
        <Link href="/categories" className="mt-4 inline-block text-brand-orange">
          Voir toutes les catégories
        </Link>
      </div>
    );
  }

  if (data.redirect_to) {
    redirect(`/categorie/${data.redirect_to}`);
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-brand-black/50">Chargement…</div>}>
      <CategoryPlp slug={slug} initial={data} />
    </Suspense>
  );
}
