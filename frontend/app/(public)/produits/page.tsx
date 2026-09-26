import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import VisualSearchResults from "@/components/VisualSearchResults";
import HomeSearchBar from "@/components/HomeSearchBar";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; visual?: string };
}): Promise<Metadata> {
  const isSearch = Boolean(searchParams.search || searchParams.visual === "1");
  return buildPageMetadata({
    title: "Nos produits — Meubles & électroménager à Dakar",
    description:
      "Catalogue électroménager, meubles, armoires, bureaux et TV à Dakar — DK HOMETECH, livraison Sénégal.",
    path: "/produits",
    noIndex: isSearch,
  });
}

const fallbackFilters = [
  { slug: "", name: "Tous les produits" },
  { slug: "electromenager", name: "Électroménager" },
  { slug: "meubles", name: "Meubles & Armoires" },
  { slug: "bureaux", name: "Bureaux" },
  { slug: "tv-audio", name: "TV & Audio" },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; visual?: string };
}) {
  const isVisual = searchParams.visual === "1";

  const [productsRaw, categoriesRes] = await Promise.all([
    isVisual
      ? Promise.resolve([])
      : api
          .getProducts({
            ...searchParams,
            per_page: "48",
            page: "1",
          })
          .catch(() => []),
    api.getCategories().catch(() => null),
  ]);
  const products = Array.isArray(productsRaw) ? productsRaw : [];

  const categories = categoriesRes?.tree
    ? categoriesRes.tree.flatMap((c) => [
        { slug: c.slug, name: c.name },
        ...(c.children || []).map((ch) => ({ slug: ch.slug, name: `↳ ${ch.name}` })),
      ])
    : [];

  const filters =
    categories.length > 0
      ? [{ slug: "", name: "Tous les produits" }, ...categories]
      : fallbackFilters;

  return (
    <div className="bg-[#ececec]">
      <section className="bg-brand-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
          <p className="text-sm font-medium uppercase tracking-wider text-brand-orange">Catalogue</p>
          <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">
            {isVisual ? "Résultats recherche image" : "Nos produits"}
          </h1>
          {searchParams.search && !isVisual && (
            <p className="mt-2 text-white/70">Recherche : « {searchParams.search} »</p>
          )}
        </div>
      </section>

      <HomeSearchBar />

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-[240px_1fr] md:px-6 md:py-10">
        <aside className="h-fit rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-black/50">
            Catégories
          </p>
          <ul className="space-y-1">
            {filters.map((f) => {
              const active = (searchParams.category || "") === f.slug && !isVisual;
              const href = f.slug ? `/produits?category=${f.slug}` : "/produits";
              return (
                <li key={f.slug || "all"}>
                  <Link
                    href={href}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-brand-orange text-white"
                        : "text-brand-black hover:bg-brand-orange/10"
                    }`}
                  >
                    {f.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <div>
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 md:hidden">
            {filters.map((f) => {
              const active = (searchParams.category || "") === f.slug && !isVisual;
              const href = f.slug ? `/produits?category=${f.slug}` : "/produits";
              return (
                <Link
                  key={f.slug || "all-m"}
                  href={href}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                    active ? "bg-brand-orange text-white" : "bg-white text-brand-black"
                  }`}
                >
                  {f.name}
                </Link>
              );
            })}
          </div>

          {isVisual ? (
            <VisualSearchResults />
          ) : products.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center">
              <p className="text-brand-black/70">Aucun produit à afficher pour le moment.</p>
              <Link
                href="/contact"
                className="mt-4 inline-flex rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white"
              >
                Nous contacter
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
