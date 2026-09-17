import Link from "next/link";
import { api, imageUrl } from "@/lib/api";
import PromoWaButton from "@/components/PromoWaButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Promotions",
  description: "Offres et promotions électroménager et meubles à Dakar — DK MEUBLE.",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function PromoPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string; page?: string };
}) {
  const category = searchParams.category || "";
  const sort = searchParams.sort || "discount";
  const page = searchParams.page || "1";

  const result = await api
    .getPromotions({ category, sort, page, per_page: "24" })
    .catch(() => ({
      data: [],
      meta: { total: 0, current_page: 1, last_page: 1, per_page: 24 },
      categories: [],
      legal_text: "",
    }));

  const sortOptions = [
    { value: "discount", label: "Réduction" },
    { value: "price_asc", label: "Prix ↑" },
    { value: "price_desc", label: "Prix ↓" },
    { value: "ending", label: "Expire bientôt" },
  ];

  function hrefFor(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    const next = {
      category,
      sort,
      page: "1",
      ...overrides,
    };
    if (next.category) p.set("category", next.category);
    if (next.sort && next.sort !== "discount") p.set("sort", next.sort);
    if (next.page && next.page !== "1") p.set("page", next.page);
    const qs = p.toString();
    return `/promo${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="bg-[#ececec]">
      <section className="bg-brand-black text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 py-10 md:px-6 md:py-12">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-brand-orange">Offres</p>
            <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Promo</h1>
            <p className="mt-2 text-white/70">
              {result.meta.total} offre{result.meta.total > 1 ? "s" : ""} en cours
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((o) => (
              <Link
                key={o.value}
                href={hrefFor({ sort: o.value })}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  sort === o.value
                    ? "bg-brand-orange text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {o.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-[240px_1fr] md:px-6 md:py-10">
        <aside className="h-fit rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-black/50">
            Catégories
          </p>
          <ul className="space-y-1">
            <li>
              <Link
                href={hrefFor({ category: "" })}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  !category
                    ? "bg-brand-orange text-white"
                    : "text-brand-black hover:bg-brand-orange/10"
                }`}
              >
                <span>Toutes</span>
                <span className="text-xs opacity-80">{result.meta.total}</span>
              </Link>
            </li>
            {result.categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={hrefFor({ category: c.slug })}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    category === c.slug
                      ? "bg-brand-orange text-white"
                      : "text-brand-black hover:bg-brand-orange/10"
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="text-xs opacity-80">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <div>
          {result.data.length === 0 ? (
            <p className="rounded-2xl bg-white p-8 text-center text-brand-black/60 shadow-sm">
              Aucune promotion active pour le moment.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {result.data.map((promo) => {
                const product = promo.product;
                const img = product?.images?.[0]?.path;
                const slug = product?.slug;
                return (
                  <article
                    key={promo.id}
                    className="overflow-hidden rounded-2xl bg-white shadow-sm"
                  >
                    <Link href={slug ? `/produits/${slug}` : "/produits"} className="block">
                      <div className="relative aspect-[4/3] bg-brand-black/5">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl(img)}
                            alt={product?.name || "Promo"}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                        <span className="absolute left-3 top-3 rounded-full bg-brand-orange px-3 py-1 text-xs font-bold text-white">
                          {promo.discount_label || `-${Math.round(promo.discount_percent)} %`}
                        </span>
                      </div>
                    </Link>
                    <div className="space-y-2 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-brand-black/45">
                        {promo.vendor_name || "DK MEUBLE"}
                      </p>
                      <Link
                        href={slug ? `/produits/${slug}` : "/produits"}
                        className="line-clamp-2 font-bold text-brand-black hover:text-brand-orange"
                      >
                        {product?.name || "Produit"}
                      </Link>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-lg font-extrabold text-brand-orange">
                          {promo.price_promo.toLocaleString("fr-FR")} FCFA
                        </span>
                        <span className="text-sm text-brand-black/45 line-through">
                          {promo.price_original.toLocaleString("fr-FR")} FCFA
                        </span>
                      </div>
                      <p className="text-xs text-brand-black/55">
                        Expire le {formatDate(promo.end_date)}
                      </p>
                      <PromoWaButton
                        productName={product?.name || "produit"}
                        pricePromo={promo.price_promo}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {result.meta.last_page > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: result.meta.last_page }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={hrefFor({ page: String(p) })}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    result.meta.current_page === p
                      ? "bg-brand-orange text-white"
                      : "bg-white text-brand-black"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}

          {result.legal_text ? (
            <p className="mt-10 rounded-2xl bg-white/80 p-5 text-sm leading-relaxed text-brand-black/65 shadow-sm">
              {result.legal_text}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
