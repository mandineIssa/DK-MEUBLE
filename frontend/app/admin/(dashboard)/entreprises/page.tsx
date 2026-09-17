"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminApi, AdminCompany } from "@/lib/adminApi";

const empty = {
  name: "",
  ninea: "",
  phone: "",
  email: "",
  address: "",
  city: "Dakar",
  notes: "",
  status: "active",
};

export default function AdminEntreprisesPage() {
  const [items, setItems] = useState<AdminCompany[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<AdminCompany | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(await adminApi.getCompanies());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await adminApi.updateCompany(editing.id, form);
      } else {
        await adminApi.createCompany(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm(empty);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Entreprises B2B</h1>
          <p className="text-sm text-brand-black/60">Comptes sociétés, devis groupés et factures</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setForm(empty);
            setShowForm(true);
          }}
          className="rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white"
        >
          + Entreprise
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["name", "Raison sociale *"],
                ["ninea", "NINEA"],
                ["phone", "Téléphone"],
                ["email", "Email"],
                ["address", "Adresse"],
                ["city", "Ville"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-sm">
                <span className="text-brand-black/60">{label}</span>
                <input
                  className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  required={key === "name"}
                />
              </label>
            ))}
          </div>
          <label className="block text-sm">
            <span className="text-brand-black/60">Notes</span>
            <textarea
              rows={2}
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white">
              {editing ? "Mettre à jour" : "Créer"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border px-4 py-2 text-sm">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-black text-white">
            <tr>
              <th className="px-4 py-3 text-left">Entreprise</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Clients</th>
              <th className="px-4 py-3 text-left">Devis</th>
              <th className="px-4 py-3 text-left">Factures</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-brand-black/50">
                  Chargement…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-brand-black/50">
                  Aucune entreprise.
                </td>
              </tr>
            )}
            {items.map((c) => (
              <tr key={c.id} className="border-t border-black/5">
                <td className="px-4 py-3 font-semibold">{c.name}</td>
                <td className="px-4 py-3 text-brand-black/70">
                  {c.phone || "—"}
                  <br />
                  {c.email || ""}
                </td>
                <td className="px-4 py-3">{c.customers_count ?? 0}</td>
                <td className="px-4 py-3">{c.b2b_quotes_count ?? 0}</td>
                <td className="px-4 py-3">{c.invoices_count ?? 0}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="mr-2 font-semibold text-brand-orange"
                    onClick={() => {
                      setEditing(c);
                      setForm({
                        name: c.name,
                        ninea: c.ninea || "",
                        phone: c.phone || "",
                        email: c.email || "",
                        address: c.address || "",
                        city: c.city || "Dakar",
                        notes: c.notes || "",
                        status: c.status || "active",
                      });
                      setShowForm(true);
                    }}
                  >
                    Éditer
                  </button>
                  <button
                    type="button"
                    className="text-red-600"
                    onClick={async () => {
                      if (!confirm("Supprimer cette entreprise ?")) return;
                      await adminApi.deleteCompany(c.id);
                      await load();
                    }}
                  >
                    Suppr.
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
