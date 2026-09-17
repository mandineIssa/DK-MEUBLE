"use client";

import { useEffect, useState } from "react";
import { adminApi, Quote } from "@/lib/adminApi";

const statusLabels: Record<Quote["status"], string> = {
  new: "Nouveau",
  contacted: "Contacté",
  closed: "Clôturé",
};

const statusStyle: Record<Quote["status"], string> = {
  new: "bg-brand-orange/15 text-brand-orange",
  contacted: "bg-[#2B7CFF]/15 text-[#2B7CFF]",
  closed: "bg-brand-black/10 text-brand-black/60",
};

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setQuotes(await adminApi.getQuotes().catch(() => []));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStatusChange(id: number, status: Quote["status"]) {
    await adminApi.updateQuoteStatus(id, status);
    load();
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-brand-black">Demandes de devis</h1>
      <p className="text-sm text-brand-black/60">Prospects particuliers et entreprises</p>

      <div className="mt-6 space-y-4">
        {loading && <p className="text-brand-black/50">Chargement...</p>}
        {!loading && quotes.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center text-brand-black/50 shadow-sm">
            Aucune demande de devis pour le moment.
          </div>
        )}

        {quotes.map((q) => (
          <div key={q.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-brand-black">{q.name}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[q.status]}`}>
                    {statusLabels[q.status]}
                  </span>
                </div>
                {q.company_name && (
                  <p className="text-sm text-brand-orange font-medium">{q.company_name}</p>
                )}
                <p className="mt-1 text-sm text-brand-black/60">
                  {q.phone}
                  {q.email ? ` · ${q.email}` : ""}
                </p>
                {q.product && (
                  <p className="mt-1 text-sm text-brand-black/70">Produit : {q.product.name}</p>
                )}
                {(q.quantity || q.dimensions) && (
                  <p className="text-sm text-brand-black/70">
                    {q.quantity ? `Qté : ${q.quantity}` : ""}
                    {q.dimensions ? ` · ${q.dimensions}` : ""}
                  </p>
                )}
              </div>

              <select
                value={q.status}
                onChange={(e) => handleStatusChange(q.id, e.target.value as Quote["status"])}
                className="rounded-xl border border-brand-black/15 px-3 py-2 text-sm"
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <p className="mt-3 whitespace-pre-line rounded-xl bg-[#f5f5f5] p-3 text-sm text-brand-black">
              {q.message}
            </p>
            <p className="mt-3 text-xs text-brand-black/40">
              Reçu le {new Date(q.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
