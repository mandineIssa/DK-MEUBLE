"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { imageUrl, type CategoryShowResponse, type Product } from "@/lib/api";
import { useCart } from "@/components/CartProvider";
import ProductQuickView from "@/components/home/ProductQuickView";
import CategoryFilterSidebar from "@/components/category/CategoryFilterSidebar";
import ViewSortBar, { type ViewMode } from "@/components/category/ViewSortBar";

const VIEW_KEY = "dk_plp_view";

function readView(defaultView: ViewMode): ViewMode {
  if (typeof window === "undefined") return defaultView;
  const v = (window.localStorage.getItem(VIEW_KEY) ||
    window.sessionStorage.getItem(VIEW_KEY)) as ViewMode | null;
  return v || defaultView;
}

type PlpSettings = {
  default_view?: ViewMode;
  default_sort?: string;
  realtime_filter?: boolean;
  show_breadcrumb?: boolean;
  accordion_mode?: "exclusive" | "multiple";
  show_subcategories?: boolean;
  category_filter_title?: string;
  accent_color?: string;
  view_modes?: Partial<Record<ViewMode, boolean>>;
  filters?: Record<string, boolean>;
  sort_options?: Array<{ value: string; label: string; enabled?: boolean }>;
};

export default function CategoryPlp({
  slug,
  initial,
}: {
  slug: string;
  initial: CategoryShowResponse;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState(initial);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const settings = (data.settings || {}) as PlpSettings;
  const [view, setView] = useState<ViewMode>(settings.default_view || "grid_4");
  const [priceMin, setPriceMin] = useState(searchParams.get("min_price") || "");
  const [priceMax, setPriceMax] = useState(searchParams.get("max_price") || "");
  const realtime = settings.realtime_filter !== false;
  const accent = settings.accent_color || "#FF7A00";

  useEffect(() => {
    setView(readView((settings.default_view || "grid_4") as ViewMode));
  }, [settings.default_view]);

  const selectedCategories = useMemo(
    () => searchParams.getAll("category").filter(Boolean),
    [searchParams]
  );
  const selectedBrands = useMemo(() => searchParams.getAll("brand").filter(Boolean), [searchParams]);
  const condition = searchParams.get("condition") || "";
  const sort = searchParams.get("sort") || settings.default_sort || data.meta.sort || "default";
  const page = searchParams.get("page") || "1";
  const inStock = searchParams.get("in_stock") || "";

  const filters = settings.filters || {
    category: true,
    price: true,
    brand: true,
    condition: true,
    attributes: true,
    availability: true,
  };

  const sortOptions = (
    settings.sort_options || [
      { value: "default", label: "Tri par défaut", enabled: true },
      { value: "popular", label: "Popularité", enabled: true },
      { value: "newest", label: "Nouveauté", enabled: true },
      { value: "price_asc", label: "Prix croissant", enabled: true },
      { value: "price_desc", label: "Prix décroissant", enabled: true },
      { value: "promo", label: "Meilleures réductions", enabled: true },
    ]
  ).filter((o) => o.enabled !== false);

  const buildParams = useCallback(
    (overrides: Record<string, string | string[] | null | undefined> = {}) => {
      const next: Record<string, string | string[]> = {};
      const cats = ("category" in overrides ? overrides.category : selectedCategories) as
        | string[]
        | null
        | undefined;
      const brands = ("brand" in overrides ? overrides.brand : selectedBrands) as
        | string[]
        | null
        | undefined;

      if (Array.isArray(cats) && cats.length) next.category = cats;
      if (Array.isArray(brands) && brands.length) next.brand = brands;

      const scalar = (key: string, current: string) => {
        const v = key in overrides ? overrides[key] : current;
        if (typeof v === "string" && v) next[key] = v;
      };
      scalar("condition", condition);
      scalar("min_price", "min_price" in overrides ? String(overrides.min_price || "") : priceMin);
      scalar("max_price", "max_price" in overrides ? String(overrides.max_price || "") : priceMax);
      scalar("sort", sort);
      scalar("in_stock", inStock);

      const pageVal = "page" in overrides ? overrides.page : page;
      if (typeof pageVal === "string" && pageVal && pageVal !== "1") next.page = pageVal;

      searchParams.forEach((val, key) => {
        if (key.startsWith("attr_") && !(key in overrides)) {
          const existing = next[key];
          if (Array.isArray(existing)) existing.push(val);
          else if (existing) next[key] = [String(existing), val];
          else next[key] = val;
        }
      });
      Object.entries(overrides).forEach(([k, v]) => {
        if (k.startsWith("attr_")) {
          if (v == null || v === "") delete next[k];
          else next[k] = v as string | string[];
        }
      });

      return next;
    },
    [selectedCategories, selectedBrands, condition, priceMin, priceMax, sort, inStock, page, searchParams]
  );

  const pushParams = useCallback(
    (overrides: Record<string, string | string[] | null | undefined>, resetPage = true) => {
      const next = buildParams({
        ...overrides,
        ...(resetPage ? { page: "1" } : {}),
      });
      const qs = new URLSearchParams();
      Object.entries(next).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach((item) => qs.append(k, item));
        else if (v) qs.set(k, v);
      });
      const url = `${pathname}${qs.toString() ? `?${qs}` : ""}`;
      startTransition(() => {
        router.replace(url, { scroll: false });
      });
    },
    [buildParams, pathname, router]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const qs = new URLSearchParams();
        searchParams.forEach((v, k) => qs.append(k, v));
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API_URL}/api/categories/${slug}?${qs.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as CategoryShowResponse;
        if (!cancelled) {
          setData(json);
          setPriceMin(searchParams.get("min_price") || "");
          setPriceMax(searchParams.get("max_price") || "");
        }
      } catch {
        /* ignore */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug, searchParams]);

  function toggleInList(list: string[], value: string) {
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
  }

  function changeView(v: ViewMode) {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
      sessionStorage.setItem(VIEW_KEY, v);
    } catch {
      /* ignore */
    }
  }

  const gridClass =
    view === "grid_2"
      ? "grid gap-4 sm:grid-cols-2"
      : view === "grid_4"
        ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : view === "list"
          ? "flex flex-col gap-3"
          : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";

  const facets = data.facets;
  const bounds = data.price_bounds || { min: 0, max: 0 };

  // Fil d’Ariane : le filtre le plus spécifique (sous-catégorie cochée > catégorie > page)
  const breadcrumb = useMemo(() => {
    const base = data.category.breadcrumb || [];
    if (!selectedCategories.length) return base;
    const nodes = facets?.categories || [];
    let best: { name: string; slug: string; id: number } | null = null;
    for (const cat of nodes) {
      for (const child of cat.children || []) {
        if (selectedCategories.includes(child.slug)) {
          best = { id: child.id, name: child.name, slug: child.slug };
        }
      }
      if (!best && selectedCategories.includes(cat.slug)) {
        best = { id: cat.id, name: cat.name, slug: cat.slug };
      }
    }
    if (!best) return base;
    // Construire Accueil > parent éventuel > sélection
    const parent = nodes.find(
      (c) => c.slug === best!.slug || (c.children || []).some((ch) => ch.slug === best!.slug)
    );
    const crumbs: Array<{ id: number; name: string; slug: string }> = [];
    if (parent && parent.slug !== best.slug) {
      crumbs.push({ id: parent.id, name: parent.name, slug: parent.slug });
    }
    crumbs.push(best);
    return crumbs;
  }, [data.category.breadcrumb, selectedCategories, facets?.categories]);

  const resultLabel = (
    <>
      <span className="font-bold text-brand-black">{data.meta.total}</span> produit
      {data.meta.total > 1 ? "s" : ""}
      {pending ? "…" : ""}
    </>
  );

  const Filters = (
    <div className="space-y-8" style={{ ["--plp-accent" as string]: accent }}>
      {filters.category !== false && facets?.categories?.length ? (
        <CategoryFilterSidebar
          categories={facets.categories}
          selectedIds={selectedCategories}
          onChange={(ids) => pushParams({ category: ids })}
          accordionMode={settings.accordion_mode || "multiple"}
          showSubcategories={settings.show_subcategories !== false}
          accentColor={accent}
          title={settings.category_filter_title || "Catégories de produits"}
        />
      ) : null}

      {filters.price !== false ? (
        <div>
          <h4 className="mb-3 text-base font-bold text-[#1a1a1a]">Prix (FCFA)</h4>
          <p className="mb-2 text-[11px] text-[#888]">
            Bornes : {bounds.min.toLocaleString("fr-FR")} – {bounds.max.toLocaleString("fr-FR")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="Min"
              className="rounded border border-[#ddd] px-2 py-2 text-sm"
            />
            <input
              type="number"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="Max"
              className="rounded border border-[#ddd] px-2 py-2 text-sm"
            />
          </div>
          <input
            type="range"
            min={bounds.min || 0}
            max={bounds.max || 1000000}
            value={Number(priceMax || bounds.max || 0)}
            onChange={(e) => setPriceMax(e.target.value)}
            onMouseUp={() => realtime && pushParams({ min_price: priceMin, max_price: priceMax })}
            onTouchEnd={() => realtime && pushParams({ min_price: priceMin, max_price: priceMax })}
            className="mt-3 w-full"
            style={{ accentColor: accent }}
          />
          <button
            type="button"
            onClick={() => pushParams({ min_price: priceMin, max_price: priceMax })}
            className="mt-2 w-full py-2 text-xs font-bold text-white"
            style={{ background: accent }}
          >
            Filtrer
          </button>
        </div>
      ) : null}

      {filters.brand !== false && facets?.brands?.length ? (
        <div>
          <h4 className="mb-3 text-base font-bold text-[#1a1a1a]">Marque</h4>
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {facets.brands.map((b) => (
              <li key={b.id}>
                <label className="flex cursor-pointer items-center justify-between gap-2 py-1.5 text-sm">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(b.slug)}
                      onChange={() => pushParams({ brand: toggleInList(selectedBrands, b.slug) })}
                      className="accent-[var(--plp-accent)]"
                    />
                    {b.name}
                  </span>
                  <span className="text-xs text-[#aaa]">{b.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {filters.condition !== false && facets?.conditions?.length ? (
        <div>
          <h4 className="mb-3 text-base font-bold text-[#1a1a1a]">État</h4>
          <ul className="space-y-1">
            {facets.conditions.map((c) => (
              <li key={c.value}>
                <label className="flex cursor-pointer items-center justify-between gap-2 py-1.5 text-sm">
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="condition"
                      checked={condition === c.value}
                      onChange={() => pushParams({ condition: c.value })}
                    />
                    {c.label}
                  </span>
                  <span className="text-xs text-[#aaa]">{c.count}</span>
                </label>
              </li>
            ))}
            {condition ? (
              <button
                type="button"
                className="text-xs font-semibold"
                style={{ color: accent }}
                onClick={() => pushParams({ condition: "" })}
              >
                Effacer
              </button>
            ) : null}
          </ul>
        </div>
      ) : null}

      {filters.availability !== false && facets?.availability?.length ? (
        <div>
          <h4 className="mb-3 text-base font-bold text-[#1a1a1a]">Disponibilité</h4>
          <ul className="space-y-1">
            {facets.availability.map((a) => (
              <li key={a.value}>
                <label className="flex cursor-pointer items-center justify-between gap-2 py-1.5 text-sm">
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="in_stock"
                      checked={inStock === a.value}
                      onChange={() => pushParams({ in_stock: a.value })}
                    />
                    {a.label}
                  </span>
                  <span className="text-xs text-[#aaa]">{a.count}</span>
                </label>
              </li>
            ))}
            {inStock ? (
              <button
                type="button"
                className="text-xs font-semibold"
                style={{ color: accent }}
                onClick={() => pushParams({ in_stock: "" })}
              >
                Effacer
              </button>
            ) : null}
          </ul>
        </div>
      ) : null}

      {filters.attributes !== false &&
        facets?.attributes?.map((attr) => (
          <div key={attr.id}>
            <h4 className="mb-3 text-base font-bold text-[#1a1a1a]">{attr.name}</h4>
            <ul className="space-y-1">
              {(attr.options || []).map((opt) => {
                const key = `attr_${attr.id}`;
                const selected = searchParams.getAll(key).includes(opt.value);
                return (
                  <li key={opt.id}>
                    <label className="flex cursor-pointer items-center justify-between gap-2 py-1.5 text-sm">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            const current = searchParams.getAll(key);
                            const next = selected
                              ? current.filter((x) => x !== opt.value)
                              : [...current, opt.value];
                            pushParams({ [key]: next });
                          }}
                        />
                        {opt.value}
                      </span>
                      <span className="text-xs text-[#aaa]">{opt.count}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
    </div>
  );

  return (
    <div className="bg-white" style={{ ["--plp-accent" as string]: accent }}>
      <section className="border-b border-[#eee] bg-[#fafafa]">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
          {settings.show_breadcrumb !== false && (
            <nav className="mb-2 flex flex-wrap gap-1 text-sm text-[#999]">
              <Link href="/" className="hover:text-[var(--plp-accent)]">
                Home
              </Link>
              {breadcrumb.map((b) => (
                <span key={b.id} className="flex items-center gap-1">
                  <span>&gt;</span>
                  <Link href={`/categorie/${b.slug}`} className="hover:text-[var(--plp-accent)]">
                    {b.name}
                  </Link>
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-2xl font-extrabold text-[#1a1a1a] md:text-3xl">{data.category.name}</h1>
          {data.category.description ? (
            <p className="mt-2 max-w-2xl text-sm text-[#666]">{data.category.description}</p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-[260px_1fr] md:px-6 md:py-10">
        <aside className="hidden h-fit md:block">{Filters}</aside>

        <div>
          <div className="mb-2 md:hidden">
            <button
              type="button"
              className="rounded border border-[#ddd] bg-white px-4 py-2 text-sm font-semibold"
              onClick={() => setFiltersOpen(true)}
            >
              Filtrer
            </button>
          </div>

          <ViewSortBar
            viewMode={view}
            onViewChange={changeView}
            sortOptions={sortOptions}
            currentSort={sort}
            onSortChange={(v) => pushParams({ sort: v })}
            enabledViews={settings.view_modes}
            accentColor={accent}
            className="mb-5 w-full border-b border-[#eee] pb-4"
            resultLabel={`${data.meta.total} produit${data.meta.total > 1 ? "s" : ""}${pending ? "…" : ""}`}
          />

          <p className="mb-4 hidden text-sm text-[#666] md:block">{resultLabel}</p>

          {data.products.length === 0 ? (
            <p className="border border-[#eee] p-8 text-center text-[#666]">
              Aucun produit ne correspond à ces filtres.
            </p>
          ) : (
            <div className={gridClass}>
              {data.products.map((p) => (
                <PlpProductCard key={p.id} product={p} list={view === "list"} accent={accent} />
              ))}
            </div>
          )}

          {data.meta.last_page > 1 ? (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {Array.from({ length: data.meta.last_page }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => pushParams({ page: String(p) }, false)}
                  className={`min-w-10 px-3 py-2 text-sm font-semibold ${
                    data.meta.current_page === p
                      ? "text-white"
                      : "border border-[#ddd] bg-white text-[#333]"
                  }`}
                  style={data.meta.current_page === p ? { background: accent } : undefined}
                >
                  {p}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[min(100%,320px)] overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold">Filtres</p>
              <button type="button" onClick={() => setFiltersOpen(false)} className="text-sm font-semibold">
                Fermer
              </button>
            </div>
            {Filters}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PlpProductCard({
  product,
  list,
  accent,
}: {
  product: Product;
  list?: boolean;
  accent: string;
}) {
  const cover = product.images?.[0];
  const effective = product.effective_price ?? product.price;
  const compare = product.compare_at_price;
  const { addToCart } = useCart();
  const [busy, setBusy] = useState(false);
  const [quick, setQuick] = useState(false);

  async function onAdd() {
    if (effective == null) return;
    setBusy(true);
    try {
      await addToCart(product.id, 1);
    } finally {
      setBusy(false);
    }
  }

  if (list) {
    return (
      <article className="flex gap-4 border border-[#e8e8e8] bg-white p-3">
        <Link
          href={`/produits/${product.slug}`}
          className="relative h-28 w-36 shrink-0 overflow-hidden bg-[#f5f5f5]"
        >
          {cover ? (
            <Image src={imageUrl(cover.path)} alt={product.name} fill className="object-cover" sizes="144px" />
          ) : null}
          {product.badge_label ? (
            <span
              className="absolute right-2 top-2 px-1.5 py-0.5 text-[10px] font-bold text-white"
              style={{ background: accent }}
            >
              {product.badge_label}
            </span>
          ) : null}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase text-[#999]">{product.category?.name}</p>
          <Link
            href={`/produits/${product.slug}`}
            className="line-clamp-2 font-bold uppercase text-[#1a1a1a]"
            title={product.name}
          >
            {product.name}
          </Link>
          <div className="mt-1 flex items-baseline gap-2">
            {compare ? (
              <p className="text-xs line-through" style={{ color: accent }}>
                {compare.toLocaleString("fr-FR")} FCFA
              </p>
            ) : null}
            <p className="font-bold" style={{ color: accent }}>
              {effective != null ? `${effective.toLocaleString("fr-FR")} FCFA` : "Sur devis"}
            </p>
          </div>
          {effective != null ? (
            <button
              type="button"
              disabled={busy}
              onClick={onAdd}
              className="mt-2 bg-brand-black px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              Ajouter au panier
            </button>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <>
      <article className="group relative border border-[#e8e8e8] bg-white">
        <div className="relative aspect-square bg-white">
          <Link href={`/produits/${product.slug}`}>
            {cover ? (
              <Image
                src={imageUrl(cover.path)}
                alt={product.name}
                fill
                loading="lazy"
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
            ) : null}
          </Link>
          {product.badge_label ? (
            <span
              className="absolute right-2 top-2 px-2 py-0.5 text-[11px] font-bold text-white"
              style={{ background: accent }}
            >
              {product.badge_label}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setQuick(true)}
            className="absolute bottom-3 left-1/2 hidden -translate-x-1/2 bg-white/95 px-3 py-1.5 text-xs font-bold text-brand-black shadow opacity-0 transition group-hover:opacity-100 md:inline-flex"
          >
            Aperçu rapide
          </button>
        </div>
        <div className="border-t border-[#f0f0f0] p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#999]">
            {product.category?.name}
          </p>
          <Link
            href={`/produits/${product.slug}`}
            className="mt-0.5 line-clamp-2 text-sm font-bold uppercase text-[#1a1a1a]"
            title={product.name}
          >
            {product.name}
          </Link>
          <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
            {compare ? (
              <p className="text-[11px] line-through" style={{ color: accent }}>
                {compare.toLocaleString("fr-FR")} FCFA
              </p>
            ) : null}
            <p className="text-sm font-bold" style={{ color: accent }}>
              {effective != null ? `${effective.toLocaleString("fr-FR")} FCFA` : "Sur devis"}
            </p>
          </div>
        </div>
      </article>
      {quick ? <ProductQuickView product={product} onClose={() => setQuick(false)} /> : null}
    </>
  );
}
