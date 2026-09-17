"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminReview } from "@/lib/adminApi";

export default function AdminAvisPage() {
  const [items, setItems] = useState<AdminReview[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setItems(await adminApi.getReviews(filter || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-brand-black">Avis clients</h1>
      <p className="mt-1 text-sm text-brand-black/60">Modération des notes et commentaires produits</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          ["", "Tous"],
          ["pending", "En attente"],
          ["approved", "Approuvés"],
          ["rejected", "Rejetés"],
        ].map(([v, label]) => (
          <button
            key={v || "all"}
            type="button"
            onClick={() => setFilter(v)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              filter === v ? "bg-brand-orange text-white" : "bg-white text-brand-black"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-3">
        {items.map((r) => (
          <article key={r.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-bold text-brand-black">{r.product?.name || `Produit #${r.product_id}`}</p>
                <p className="text-sm text-brand-black/60">
                  {r.author_name} — {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </p>
              </div>
              <span className="text-xs font-semibold uppercase text-brand-orange">{r.status}</span>
            </div>
            {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
            <p className="mt-1 text-sm text-brand-black/70 whitespace-pre-line">{r.body}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.status !== "approved" && (
                <button
                  type="button"
                  className="rounded-full bg-brand-orange px-3 py-1.5 text-xs font-semibold text-white"
                  onClick={async () => {
                    await adminApi.updateReviewStatus(r.id, "approved");
                    await load();
                  }}
                >
                  Approuver
                </button>
              )}
              {r.status !== "rejected" && (
                <button
                  type="button"
                  className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                  onClick={async () => {
                    await adminApi.updateReviewStatus(r.id, "rejected");
                    await load();
                  }}
                >
                  Rejeter
                </button>
              )}
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-600"
                onClick={async () => {
                  if (!confirm("Supprimer ?")) return;
                  await adminApi.deleteReview(r.id);
                  await load();
                }}
              >
                Supprimer
              </button>
            </div>
          </article>
        ))}
        {items.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-brand-black/50 shadow-sm">Aucun avis.</p>
        )}
      </div>
    </div>
  );
}
