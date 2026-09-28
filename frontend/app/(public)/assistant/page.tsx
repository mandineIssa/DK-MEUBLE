"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, type Category, type Product } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

function flatten(nodes: Category[]): Category[] {
  const out: Category[] = [];
  for (const n of nodes) {
    out.push(n);
    if (n.children?.length) out.push(...flatten(n.children));
  }
  return out;
}

export default function AssistantPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [brand, setBrand] = useState("");
  const [capacity, setCapacity] = useState("");
  const [priority, setPriority] = useState("");
  const [results, setResults] = useState<Product[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getCategories().then((r) => setCategories(flatten(r.tree || []))).catch(() => setCategories([]));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const list = await api.getProducts({
        category: category || undefined,
        per_page: "48",
        max_price: budget || undefined,
      });
      const q = brand.trim().toLowerCase();
      const cap = capacity.trim().toLowerCase();
      let filtered = list.filter((p) => {
        const blob = `${p.name} ${p.brand?.name || ""} ${p.short_description || ""} ${p.description || ""}`.toLowerCase();
        if (q && !blob.includes(q)) return false;
        if (cap && !blob.includes(cap)) return false;
        return true;
      });
      if (priority === "prix") {
        filtered = [...filtered].sort(
          (a, b) => (a.effective_price ?? a.price ?? Number.MAX_SAFE_INTEGER) - (b.effective_price ?? b.price ?? Number.MAX_SAFE_INTEGER)
        );
      }
      setResults(filtered.slice(0, 12));
    } catch {
      setResults([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <h1 className="text-3xl font-extrabold text-brand-black">Vous ne savez pas lequel choisir ?</h1>
      <p className="mt-2 text-sm text-brand-black/65">
        Les suggestions viennent du catalogue en ligne. Si rien ne correspond, un conseiller peut affiner le besoin.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <label className="block text-sm font-semibold">
          Budget maximum (FCFA)
          <input
            inputMode="numeric"
            value={budget}
            onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))}
            className="mt-1 w-full rounded-xl border px-3 py-2"
            placeholder="Ex. 300000"
          />
        </label>
        <label className="block text-sm font-semibold">
          Produit recherché
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2">
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Marque ou mot-clé
          <input value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" />
        </label>
        <label className="block text-sm font-semibold">
          Capacité ou usage (optionnel)
          <input value={capacity} onChange={(e) => setCapacity(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Ex. 300 L, 2 places" />
        </label>
        <label className="block text-sm font-semibold">
          Priorité
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2">
            <option value="">Sans tri particulier</option>
            <option value="prix">Prix le plus bas</option>
          </select>
        </label>
        <button type="submit" disabled={busy} className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {busy ? "Recherche…" : "Voir les recommandations"}
        </button>
      </form>
      {results && results.length === 0 ? (
        <p className="mt-6 text-sm">
          Aucun produit du catalogue ne correspond.{" "}
          <Link href="/contact" className="font-bold text-brand-orange">
            Contacter un conseiller
          </Link>
        </p>
      ) : null}
      {results && results.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
