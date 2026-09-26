import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { api, imageUrl } from "@/lib/api";
import PromoWaButton from "@/components/PromoWaButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: 'Promotions',
  description:
    'Offres et promotions électroménager et meubles à Dakar — DK HOMETECH.',
  path: '/promotions',
});

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

function daysLeft(iso: string): number | null {
  try {
    const end = new Date(iso);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Number.isFinite(diff) ? diff : null;
  } catch {
    return null;
  }
}

export default async function PromotionsPage({
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
    { value: "discount", label: "Meilleure réduction" },
    { value: "price_asc", label: "Prix croissant" },
    { value: "price_desc", label: "Prix décroissant" },
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
    return `/promotions${qs ? `?${qs}` : ""}`;
  }

  const topDiscount =
    result.data.length > 0
      ? Math.max(...result.data.map((p) => Math.round(p.discount_percent || 0)))
      : 0;

  return (
    <div className="bg-[var(--content-bg-alt)]">
      {/* Hero */}
      <section
        className="border-b bg-[var(--body-bg)]"
        style={{ borderColor: "var(--border-light)" }}
      >
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <nav className="mb-4 text-xs font-medium" aria-label="Fil d’Ariane">
            <ol className="flex flex-wrap items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <li>
                <Link href="/" className="hover:text-[var(--accent-primary)]">
                  Accueil
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li style={{ color: "var(--text-primary)" }}>Promotions</li>
            </ol>
          </nav>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: "var(--accent-primary)" }}
              >
                Offres
              </p>
              <h1
                className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-[2.75rem]"
                style={{ color: "var(--text-primary)" }}
              >
                Promotions en cours
              </h1>
              <p className="mt-3 max-w-xl text-base" style={{ color: "var(--text-secondary)" }}>
                Électroménager et mobilier en promo à Dakar — stocks limités, prix mis à jour
                régulièrement.
              </p>
              <span
                className="mt-5 block h-1 w-16 rounded-full"
                style={{ background: "var(--accent-primary)" }}
                aria-hidden
              />
            </div>

            <ul className="grid grid-cols-3 gap-3 sm:max-w-md">
              {[
                {
                  label: "Offres",
                  value: String(result.meta.total),
                },
                {
                  label: "Jusqu’à",
                  value: topDiscount > 0 ? `-${topDiscount}%` : "—",
                },
                {
                  label: "Catégories",
                  value: String(result.categories.length || "—"),
                },
              ].map((h) => (
                <li
                  key={h.label}
                  className="rounded-xl border px-3 py-3 text-center"
                  style={{
                    borderColor: "var(--border-light)",
                    background: "var(--content-bg-alt)",
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                    {h.label}
                  </p>
                  <p className="mt-0.5 text-xl font-extrabold" style={{ color: "var(--accent-primary)" }}>
                    {h.value}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Tri */}
          <div className="mt-8 flex flex-wrap gap-2">
            {sortOptions.map((o) => {
              const active = sort === o.value;
              return (
                <Link
                  key={o.value}
                  href={hrefFor({ sort: o.value })}
                  className="rounded-full px-4 py-2 text-sm font-semibold transition"
                  style={
                    active
                      ? { background: "var(--accent-primary)", color: "#fff" }
                      : {
                          background: "var(--content-bg-alt)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-light)",
                        }
                  }
                >
                  {o.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-[240px_1fr] md:px-6 md:py-10">
        {/* Filtres catégories */}
        <aside
          className="h-fit rounded-2xl border bg-[var(--body-bg)] p-4 shadow-sm"
          style={{ borderColor: "var(--border-light)" }}
        >
          <p
            className="mb-3 text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--text-secondary)" }}
          >
            Catégories
          </p>
          <ul className="space-y-1">
            <li>
              <Link
                href={hrefFor({ category: "" })}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition"
                style={
                  !category
                    ? { background: "var(--accent-primary)", color: "#fff" }
                    : { color: "var(--text-primary)" }
                }
              >
                <span>Toutes</span>
                <span className="text-xs opacity-80">{result.meta.total}</span>
              </Link>
            </li>
            {result.categories.map((c) => {
              const active = category === c.slug;
              return (
                <li key={c.slug}>
                  <Link
                    href={hrefFor({ category: c.slug })}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:opacity-90"
                    style={
                      active
                        ? { background: "var(--accent-primary)", color: "#fff" }
                        : { color: "var(--text-primary)" }
                    }
                  >
                    <span>{c.name}</span>
                    <span className="text-xs opacity-80">{c.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div
            className="mt-6 rounded-xl p-3 text-xs leading-relaxed"
            style={{ background: "var(--content-bg-alt)", color: "var(--text-secondary)" }}
          >
            Les stocks promo sont limités. Une offre peut être retirée dès rupture.
          </div>
        </aside>

        <div>
          {result.data.length === 0 ? (
            <div
              className="rounded-2xl border bg-[var(--body-bg)] px-6 py-14 text-center shadow-sm"
              style={{ borderColor: "var(--border-light)" }}
            >
              <p className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                Aucune promotion active
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                Revenez bientôt ou parcourez tout le catalogue.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/produits"
                  className="rounded-full px-5 py-2.5 text-sm font-bold text-white"
                  style={{ background: "var(--accent-primary)" }}
                >
                  Voir les produits
                </Link>
                <Link
                  href="/destockage"
                  className="rounded-full border px-5 py-2.5 text-sm font-bold"
                  style={{ borderColor: "var(--text-primary)", color: "var(--text-primary)" }}
                >
                  Déstockage
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {result.data.map((promo) => {
                const product = promo.product;
                const img = product?.images?.[0]?.path;
                const slug = product?.slug;
                const left = daysLeft(promo.end_date);
                const endingSoon = left !== null && left >= 0 && left <= 3;

                return (
                  <article
                    key={promo.id}
                    className="group overflow-hidden rounded-2xl border bg-[var(--body-bg)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    style={{ borderColor: "var(--border-light)" }}
                  >
                    <Link href={slug ? `/produits/${slug}` : "/produits"} className="block">
                      <div
                        className="relative aspect-[4/3]"
                        style={{ background: "var(--content-bg-alt)" }}
                      >
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl(img)}
                            alt={product?.name || "Promo"}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className="flex h-full items-center justify-center text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Photo à venir
                          </div>
                        )}
                        <span
                          className="absolute left-3 top-3 rounded-sm px-2.5 py-1 text-xs font-bold text-white"
                          style={{ background: "var(--badge-bg, var(--accent-primary))" }}
                        >
                          {promo.discount_label || `-${Math.round(promo.discount_percent)} %`}
                        </span>
                        {endingSoon ? (
                          <span
                            className="absolute right-3 top-3 rounded-sm px-2 py-1 text-[10px] font-bold uppercase text-white"
                            style={{ background: "var(--danger-color)" }}
                          >
                            {left === 0 ? "Expire aujourd’hui" : `${left} j restants`}
                          </span>
                        ) : null}
                      </div>
                    </Link>

                    <div className="space-y-2 p-4">
                      <p
                        className="text-[11px] font-medium uppercase tracking-wide"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {promo.vendor_name || product?.brand?.name || "DK HOMETECH"}
                      </p>
                      <Link
                        href={slug ? `/produits/${slug}` : "/produits"}
                        className="line-clamp-2 font-bold transition hover:opacity-80"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {product?.name || "Produit"}
                      </Link>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="price-current text-lg font-extrabold">
                          {promo.price_promo.toLocaleString("fr-FR")} FCFA
                        </span>
                        <span className="price-compare text-sm">
                          {promo.price_original.toLocaleString("fr-FR")} FCFA
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        Expire le {formatDate(promo.end_date)}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link
                          href={slug ? `/produits/${slug}` : "/produits"}
                          className="btn-accent inline-flex flex-1 items-center justify-center rounded-full px-3 py-2 text-xs font-bold"
                        >
                          Voir l’offre
                        </Link>
                        <PromoWaButton
                          productName={product?.name || "produit"}
                          pricePromo={promo.price_promo}
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {result.meta.last_page > 1 ? (
            <nav className="mt-8 flex flex-wrap justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: result.meta.last_page }, (_, i) => i + 1).map((p) => {
                const active = result.meta.current_page === p;
                return (
                  <Link
                    key={p}
                    href={hrefFor({ page: String(p) })}
                    className="rounded-full px-4 py-2 text-sm font-semibold"
                    style={
                      active
                        ? { background: "var(--accent-primary)", color: "#fff" }
                        : {
                            background: "var(--body-bg)",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border-light)",
                          }
                    }
                  >
                    {p}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          {result.legal_text ? (
            <p
              className="mt-10 rounded-2xl border p-5 text-sm leading-relaxed shadow-sm"
              style={{
                borderColor: "var(--border-light)",
                background: "var(--body-bg)",
                color: "var(--text-secondary)",
              }}
            >
              {result.legal_text}
            </p>
          ) : (
            <p
              className="mt-10 rounded-2xl border p-5 text-sm leading-relaxed shadow-sm"
              style={{
                borderColor: "var(--border-light)",
                background: "var(--body-bg)",
                color: "var(--text-secondary)",
              }}
            >
              Ces offres sont proposées par DK HOMETECH. Les stocks sont limités ; une promotion
              peut être retirée dès rupture. Les prix affichés sont valables jusqu’à la date
              d’expiration indiquée.{" "}
              <Link href="/retours" className="font-semibold hover:underline" style={{ color: "var(--accent-primary)" }}>
                Politique de retours
              </Link>
              {" · "}
              <Link href="/paiement" className="font-semibold hover:underline" style={{ color: "var(--accent-primary)" }}>
                Paiement
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
