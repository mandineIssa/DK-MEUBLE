"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminApi, AdminCustomer } from "@/lib/adminApi";

export default function AdminClientsPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminCustomer | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  async function load(q?: string) {
    setLoading(true);
    setError("");
    try {
      setCustomers(await adminApi.getCustomers(q));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = window.setInterval(() => load(search || undefined), 20000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openEdit(c: AdminCustomer) {
    setEditing(c);
    setForm({
      name: c.name || "",
      email: c.email || "",
      phone: c.phone || "",
    });
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await adminApi.updateCustomer(editing.id, form);
      setEditing(null);
      load(search || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce compte client ?")) return;
    try {
      await adminApi.deleteCustomer(id);
      load(search || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
    }
  }

  function authLabel(c: AdminCustomer) {
    const parts: string[] = [];
    if (c.phone) parts.push("Téléphone");
    if (c.google_id) parts.push("Google");
    if (c.facebook_id) parts.push("Facebook");
    return parts.join(" · ") || "—";
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Clients inscrits</h1>
          <p className="text-sm text-brand-black/60">
            Comptes créés via téléphone (OTP) ou Google / Facebook.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(search || undefined);
          }}
          className="flex gap-2"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, tél, email…"
            className="rounded-xl border border-brand-black/10 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white"
          >
            Chercher
          </button>
        </form>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {editing && (
        <form
          onSubmit={handleSave}
          className="mt-6 max-w-lg space-y-3 rounded-2xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-bold">Modifier le client #{editing.id}</h2>
          {(["name", "phone", "email"] as const).map((key) => (
            <label key={key} className="block text-sm">
              <span className="capitalize text-brand-black/60">{key}</span>
              <input
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </label>
          ))}
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-full border px-4 py-2 text-sm"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-black text-white">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Connexion</th>
              <th className="px-4 py-3">Devis</th>
              <th className="px-4 py-3">Favoris</th>
              <th className="px-4 py-3">Inscrit le</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-brand-black/50">
                  Chargement…
                </td>
              </tr>
            )}
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-brand-black/50">
                  Aucun client inscrit pour le moment.
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-black/5">
                <td className="px-4 py-3 font-medium">{c.name || "—"}</td>
                <td className="px-4 py-3">{c.phone || "—"}</td>
                <td className="px-4 py-3">{c.email || "—"}</td>
                <td className="px-4 py-3 text-xs text-brand-black/60">{authLabel(c)}</td>
                <td className="px-4 py-3">{c.quotes_count ?? 0}</td>
                <td className="px-4 py-3">{c.wishlists_count ?? 0}</td>
                <td className="px-4 py-3 text-brand-black/60">
                  {new Date(c.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="mr-2 font-semibold text-brand-orange"
                  >
                    Éditer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="font-semibold text-red-600"
                  >
                    Supprimer
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
