"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminInvoice } from "@/lib/adminApi";

export default function AdminFacturesPage() {
  const [items, setItems] = useState<AdminInvoice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(await adminApi.getInvoices());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-brand-black">Factures B2B</h1>
      <p className="mt-1 text-sm text-brand-black/60">
        Factures liées aux devis groupés. Créez-les depuis Devis B2B → « Générer facture ».
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-black text-white">
            <tr>
              <th className="px-4 py-3 text-left">Réf.</th>
              <th className="px-4 py-3 text-left">Entreprise</th>
              <th className="px-4 py-3 text-left">Titre</th>
              <th className="px-4 py-3 text-left">Montant</th>
              <th className="px-4 py-3 text-left">Statut</th>
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
                  Aucune facture.
                </td>
              </tr>
            )}
            {items.map((inv) => (
              <tr key={inv.id} className="border-t border-black/5">
                <td className="px-4 py-3 font-mono text-xs">{inv.reference}</td>
                <td className="px-4 py-3">{inv.company?.name}</td>
                <td className="px-4 py-3">{inv.title}</td>
                <td className="px-4 py-3 font-semibold text-brand-orange">
                  {inv.amount.toLocaleString("fr-FR")} FCFA
                </td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-lg border px-2 py-1"
                    value={inv.status}
                    onChange={async (e) => {
                      await adminApi.updateInvoice(inv.id, { status: e.target.value });
                      await load();
                    }}
                  >
                    <option value="draft">Brouillon</option>
                    <option value="sent">Envoyée</option>
                    <option value="paid">Payée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-red-600"
                    onClick={async () => {
                      if (!confirm("Supprimer ?")) return;
                      await adminApi.deleteInvoice(inv.id);
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
