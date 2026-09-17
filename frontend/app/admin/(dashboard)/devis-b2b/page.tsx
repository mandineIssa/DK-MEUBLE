"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminApi, AdminB2bQuote, AdminCompany, AdminProduct } from "@/lib/adminApi";

type ItemRow = {
  product_id: string;
  label: string;
  quantity: string;
  unit_price: string;
  dimensions: string;
};

const emptyItem = (): ItemRow => ({
  product_id: "",
  label: "",
  quantity: "1",
  unit_price: "",
  dimensions: "",
});

export default function AdminDevisB2bPage() {
  const [quotes, setQuotes] = useState<AdminB2bQuote[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

  async function load() {
    const [q, c, p] = await Promise.all([
      adminApi.getB2bQuotes(),
      adminApi.getCompanies(),
      adminApi.getProducts({ light: true, all: true }),
    ]);
    setQuotes(q);
    setCompanies(c);
    setProducts(p);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await adminApi.createB2bQuote({
        company_id: Number(companyId),
        title,
        notes: notes || null,
        status: "sent",
        items: items.map((it) => ({
          product_id: it.product_id ? Number(it.product_id) : null,
          label: it.label || undefined,
          quantity: Number(it.quantity) || 1,
          unit_price: it.unit_price ? Number(it.unit_price) : undefined,
          dimensions: it.dimensions || null,
        })),
      });
      setShowForm(false);
      setTitle("");
      setNotes("");
      setItems([emptyItem()]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Devis groupés B2B</h1>
          <p className="text-sm text-brand-black/60">Plusieurs lignes produits par devis entreprise</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white"
        >
          + Devis B2B
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-brand-black/60">Entreprise *</span>
              <select
                required
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                <option value="">Choisir…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-brand-black/60">Titre *</span>
              <input
                required
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Équipement bureaux — lot 1"
              />
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Lignes</p>
            {items.map((it, idx) => (
              <div key={idx} className="grid gap-2 rounded-xl bg-[#f5f5f5] p-3 sm:grid-cols-5">
                <select
                  className="rounded-lg border border-brand-black/10 px-2 py-2 text-sm sm:col-span-2"
                  value={it.product_id}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const prod = products.find((p) => String(p.id) === pid);
                    setItems((rows) =>
                      rows.map((r, i) =>
                        i === idx
                          ? {
                              ...r,
                              product_id: pid,
                              label: prod?.name || r.label,
                              unit_price: prod?.price != null ? String(prod.price) : r.unit_price,
                            }
                          : r
                      )
                    );
                  }}
                >
                  <option value="">Produit (optionnel)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  className="rounded-lg border px-2 py-2 text-sm"
                  placeholder="Libellé"
                  value={it.label}
                  onChange={(e) =>
                    setItems((rows) => rows.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r)))
                  }
                />
                <input
                  className="rounded-lg border px-2 py-2 text-sm"
                  placeholder="Qté"
                  value={it.quantity}
                  onChange={(e) =>
                    setItems((rows) => rows.map((r, i) => (i === idx ? { ...r, quantity: e.target.value } : r)))
                  }
                />
                <input
                  className="rounded-lg border px-2 py-2 text-sm"
                  placeholder="Prix U."
                  value={it.unit_price}
                  onChange={(e) =>
                    setItems((rows) => rows.map((r, i) => (i === idx ? { ...r, unit_price: e.target.value } : r)))
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="text-sm font-semibold text-brand-orange"
              onClick={() => setItems((rows) => [...rows, emptyItem()])}
            >
              + Ajouter une ligne
            </button>
          </div>

          <label className="block text-sm">
            <span className="text-brand-black/60">Notes</span>
            <textarea
              rows={2}
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <div className="flex gap-2">
            <button type="submit" className="rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white">
              Créer le devis
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border px-4 py-2 text-sm">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {quotes.map((q) => (
          <article key={q.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase text-brand-orange">{q.reference}</p>
                <h2 className="font-bold text-brand-black">{q.title}</h2>
                <p className="text-sm text-brand-black/60">{q.company?.name}</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-brand-orange">
                  {q.total_amount.toLocaleString("fr-FR")} FCFA
                </p>
                <p className="text-xs uppercase text-brand-black/50">{q.status}</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-brand-black/70">
              {(q.items || []).map((it) => (
                <li key={it.id}>
                  {it.quantity}× {it.label} — {(it.quantity * it.unit_price).toLocaleString("fr-FR")} FCFA
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                className="text-sm font-semibold text-brand-orange"
                onClick={async () => {
                  await adminApi.createInvoice({
                    company_id: q.company_id,
                    b2b_quote_id: q.id,
                    title: `Facture — ${q.title}`,
                    status: "sent",
                  });
                  alert("Facture créée depuis ce devis.");
                }}
              >
                Générer facture
              </button>
              <button
                type="button"
                className="text-sm text-red-600"
                onClick={async () => {
                  if (!confirm("Supprimer ?")) return;
                  await adminApi.deleteB2bQuote(q.id);
                  await load();
                }}
              >
                Supprimer
              </button>
            </div>
          </article>
        ))}
        {quotes.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-brand-black/50 shadow-sm">Aucun devis B2B.</p>
        )}
      </div>
    </div>
  );
}
