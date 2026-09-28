"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, imageUrl, type Product } from "@/lib/api";
import { useCompare } from "@/components/CompareProvider";

export default function ComparerPage() {
  const { items, remove, clear } = useCompare();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(items.map((i) => api.getProduct(i.slug).catch(() => null))).then((rows) => {
      if (!cancelled) setProducts(rows.filter((p): p is Product => Boolean(p)));
    });
    return () => {
      cancelled = true;
    };
  }, [items]);

  const rows: Array<{ label: string; value: (p: Product) => string }> = [
    {
      label: "Prix",
      value: (p) => {
        const n = p.effective_price ?? p.price;
        return n != null ? `${n.toLocaleString("fr-FR")} FCFA` : "Sur devis";
      },
    },
    { label: "Marque", value: (p) => p.brand?.name || "—" },
    { label: "Catégorie", value: (p) => p.category?.name || "—" },
    { label: "Référence", value: (p) => p.sku || "—" },
    {
      label: "Stock",
      value: (p) =>
        p.stock_quantity == null ? "Non indiqué" : p.stock_quantity > 0 ? String(p.stock_quantity) : "Rupture",
    },
    {
      label: "État",
      value: (p) => (p.condition === "reconditionne" ? "Reconditionné" : "Neuf"),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="text-3xl font-extrabold text-brand-black">Comparer</h1>
      <p className="mt-2 text-sm text-brand-black/60">Jusqu’à 3 produits. Les cases vides signifient que la fiche ne contient pas cette information.</p>
      {products.length === 0 ? (
        <p className="mt-8 text-brand-black/70">
          Aucun produit sélectionné. Ouvrez une fiche et choisissez Comparer.
        </p>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="p-4">Caractéristique</th>
                  {products.map((p) => (
                    <th key={p.id} className="p-4">
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl(p.images[0].path)} alt="" className="mb-2 h-24 w-24 rounded-lg object-cover" />
                      ) : null}
                      <Link href={`/produits/${p.slug}`} className="font-bold text-brand-black hover:text-brand-orange">
                        {p.name}
                      </Link>
                      <button type="button" className="mt-2 block text-xs text-brand-black/50" onClick={() => remove(p.id)}>
                        Retirer
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-t border-black/5">
                    <th className="p-4 font-semibold">{row.label}</th>
                    {products.map((p) => (
                      <td key={p.id} className="p-4">
                        {row.value(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={clear} className="mt-4 text-sm font-semibold text-brand-black/60">
            Vider la comparaison
          </button>
        </>
      )}
    </div>
  );
}
