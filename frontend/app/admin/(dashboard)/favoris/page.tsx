"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/adminApi";

type WishlistRow = {
  id: number;
  price_at_save: number | null;
  created_at: string;
  customer?: { id: number; name: string | null; phone: string | null; email: string | null };
  product?: { id: number; name: string; slug: string; price: number | null; status?: string };
};

export default function AdminFavorisPage() {
  const [rows, setRows] = useState<WishlistRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  async function load(q = search) {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getWishlists(q || undefined);
      setRows(res.data || []);
      setTotal(res.total ?? res.data?.length ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("").catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    load(search).catch(() => {});
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-extrabold text-brand-black">Favoris clients</h1>
      <p className="mt-1 text-sm text-brand-black/50">
        Produits ajoutés aux favoris (surveillance prix / stock)
      </p>

      <form onSubmit={onSearch} className="mt-6 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Client, téléphone ou produit…"
          className="min-w-[16rem] flex-1 rounded-xl border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white">
          Rechercher
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <p className="mt-3 text-xs text-brand-black/45">{loading ? "Chargement…" : `${total} favori(s)`}</p>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-brand-black/45">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Prix au save</th>
              <th className="px-4 py-3">Ajouté le</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-brand-black/45">
                  Aucun favori enregistré pour le moment.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-black/5">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{r.customer?.name || "Client"}</p>
                    <p className="text-xs text-brand-black/50">
                      {r.customer?.phone || r.customer?.email || "—"}
                    </p>
                    {r.customer?.id ? (
                      <Link href="/admin/clients" className="text-xs font-semibold text-brand-orange">
                        Voir clients
                      </Link>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {r.product ? (
                      <>
                        <p className="font-medium">{r.product.name}</p>
                        <Link
                          href={`/produits/${r.product.slug}`}
                          target="_blank"
                          className="text-xs text-brand-orange"
                        >
                          Voir fiche
                        </Link>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.price_at_save != null
                      ? `${r.price_at_save.toLocaleString("fr-FR")} FCFA`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-black/55">
                    {new Date(r.created_at).toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
