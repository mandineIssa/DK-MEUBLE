"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminApi, AdminDeliveryZone } from "@/lib/adminApi";

export default function AdminLivraisonPage() {
  const [items, setItems] = useState<AdminDeliveryZone[]>([]);
  const [form, setForm] = useState({ zone_name: "", city: "", delivery_fee: "0", estimated_delay: "" });
  const [error, setError] = useState("");

  async function load() {
    setItems(await adminApi.getDeliveryZones());
  }
  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await adminApi.createDeliveryZone({
        ...form,
        delivery_fee: Number(form.delivery_fee),
      });
      setForm({ zone_name: "", city: "", delivery_fee: "0", estimated_delay: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-extrabold">Zones de livraison</h1>
      <p className="mt-1 text-sm text-brand-black/55">
        Ces zones apparaissent dans le tunnel de commande (« À domicile ») avec le frais associé.
        Vous pouvez ajouter, modifier ou supprimer librement.
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex max-w-2xl flex-wrap gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <input required placeholder="Zone * (ex. Dakar — Plateau)" className="min-w-[14rem] flex-1 rounded-xl border px-3 py-2" value={form.zone_name} onChange={(e) => setForm((f) => ({ ...f, zone_name: e.target.value }))} />
        <input placeholder="Ville" className="rounded-xl border px-3 py-2" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
        <input required type="number" placeholder="Frais (FCFA)" className="w-36 rounded-xl border px-3 py-2" value={form.delivery_fee} onChange={(e) => setForm((f) => ({ ...f, delivery_fee: e.target.value }))} />
        <input placeholder="Délai (ex. 24–48 h)" className="rounded-xl border px-3 py-2" value={form.estimated_delay} onChange={(e) => setForm((f) => ({ ...f, estimated_delay: e.target.value }))} />
        <button type="submit" className="rounded-full bg-brand-orange px-5 py-2 text-sm font-semibold text-white">Ajouter</button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <ul className="mt-6 space-y-2">
        {items.map((z) => (
          <li key={z.id} className="flex justify-between rounded-xl bg-white p-4 shadow-sm">
            <span>
              <strong>{z.zone_name}</strong> — {z.delivery_fee.toLocaleString("fr-FR")} FCFA
              {z.estimated_delay ? ` · ${z.estimated_delay}` : ""}
            </span>
            <button type="button" className="text-sm font-semibold text-red-600" onClick={() => adminApi.deleteDeliveryZone(z.id).then(load)}>
              Suppr.
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
