import Link from "next/link";
import { api, imageUrl } from "@/lib/api";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: 'Catégories — Meubles et électroménager',
  description:
    'Toutes les catégories meubles, mobilier de bureau et électroménager DK HOMETECH à Dakar.',
  path: '/categories',
});

export default async function CategoriesPage() {
  const data = await api.getCategories().catch(() => ({
    tree: [],
    popular: [],
    settings: { show_breadcrumb: true, default_sort: "newest", hide_empty: false },
  }));

  return (
    <div className="bg-[#ececec]">
      <section className="bg-brand-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
          <p className="text-sm font-medium uppercase tracking-wider text-brand-orange">Catalogue</p>
          <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Catégories</h1>
          <p className="mt-2 text-white/70">
            Électroménager organisé par familles et sous-familles
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-6 md:py-10">
        {data.popular.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-extrabold text-brand-black">Catégories populaires</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.popular.map((cat) => (
                <article key={cat.id} className="rounded-2xl bg-white p-5 shadow-sm">
                  <Link
                    href={`/categorie/${cat.slug}`}
                    className="text-lg font-bold text-brand-black hover:text-brand-orange"
                  >
                    {cat.name}{" "}
                    <span className="text-sm font-medium text-brand-black/45">
                      ({cat.products_count ?? 0})
                    </span>
                  </Link>
                  {cat.children && cat.children.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {cat.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/categorie/${child.slug}`}
                            className="text-sm text-brand-black/70 hover:text-brand-orange"
                          >
                            {child.name} ({child.products_count ?? 0})
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-xl font-extrabold text-brand-black">Toutes les catégories</h2>
          <div className="space-y-10">
            {data.tree.map((cat) => (
              <div key={cat.id}>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                  <Link
                    href={`/categorie/${cat.slug}`}
                    className="text-xl font-extrabold text-brand-black hover:text-brand-orange"
                  >
                    {cat.name}{" "}
                    <span className="text-sm font-medium text-brand-black/45">
                      ({cat.products_count ?? 0})
                    </span>
                  </Link>
                </div>

                {(cat.children || []).length > 0 ? (
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {(cat.children || []).map((child) => (
                      <Link
                        key={child.id}
                        href={`/categorie/${child.slug}`}
                        className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
                      >
                        <div className="relative aspect-square bg-[#eee]">
                          {child.image_path ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageUrl(child.image_path)}
                              alt={child.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-2xl font-extrabold text-brand-orange/35">
                              {child.name.slice(0, 1)}
                            </div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="line-clamp-2 text-sm font-bold text-brand-black group-hover:text-brand-orange">
                            {child.name}
                          </p>
                          <p className="text-[11px] text-brand-black/45">
                            {child.products_count ?? 0} produit{(child.products_count ?? 0) > 1 ? "s" : ""}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    href={`/categorie/${cat.slug}`}
                    className="inline-flex overflow-hidden rounded-xl bg-white shadow-sm"
                  >
                    {cat.image_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl(cat.image_path)}
                        alt={cat.name}
                        className="h-40 w-64 object-cover"
                      />
                    ) : null}
                  </Link>
                )}
              </div>
            ))}
          </div>
          {data.tree.length === 0 && (
            <p className="rounded-2xl bg-white p-8 text-center text-brand-black/55 shadow-sm">
              Aucune catégorie active pour le moment.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
