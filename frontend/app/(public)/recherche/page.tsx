"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, type Category, type Product } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

export default function RecherchePage() {
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getCategories().then((r) => setCategories(r.tree || [])).catch(() => setCategories([]));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term.length < 2) return;
    setBusy(true);
    try {
      setProducts(await api.getProducts({ search: term, per_page: "24" }));
    } catch {
      setProducts([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="text-3xl font-extrabold text-brand-black">Recherche</h1>
      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Réfrigérateur, bureau, TV…"
          className="min-w-0 flex-1 rounded-full border bg-white px-4 py-3 text-sm"
          aria-label="Rechercher un produit"
        />
        <button type="submit" className="rounded-full bg-brand-orange px-5 text-sm font-bold text-white">
          OK
        </button>
      </form>
      {products ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {categories
            .filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()))
            .slice(0, 6)
            .map((c) => (
              <Link key={c.id} href={`/categorie/${c.slug}`} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-black shadow-sm">
                Catégorie · {c.name}
              </Link>
            ))}
        </div>
      ) : null}
      {busy ? <p className="mt-6 text-sm">Recherche…</p> : null}
      {products && products.length === 0 ? (
        <p className="mt-6 text-sm text-brand-black/70">Aucun produit pour « {q} ». Essayez un mot plus court ou une catégorie.</p>
      ) : null}
      {products && products.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
