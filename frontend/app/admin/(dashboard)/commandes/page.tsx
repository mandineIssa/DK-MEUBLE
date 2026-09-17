"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, AdminOrder } from "@/lib/adminApi";

const statuses = ["", "en_attente", "confirmee", "en_preparation", "expediee", "livree", "annulee"];

export default function AdminCommandesPage() {
  const [items, setItems] = useState<AdminOrder[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setItems(await adminApi.getOrders(status ? { status } : undefined));
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, [status]);

  async function setOrderStatus(id: number, order_status: string) {
    await adminApi.updateOrderStatus(id, { order_status });
    await load();
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Commandes</h1>
        <div className="flex gap-2">
          <Link href="/admin/livraison" className="rounded-full border px-4 py-2 text-sm font-semibold">
            Zones livraison
          </Link>
          <Link href="/admin/commandes/reglages" className="rounded-full border px-4 py-2 text-sm font-semibold">
            Réglages
          </Link>
        </div>
      </div>
      <select className="mt-4 rounded-xl border bg-white px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
        {statuses.map((s) => (
          <option key={s || "all"} value={s}>{s || "Tous les statuts"}</option>
        ))}
      </select>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 space-y-3">
        {items.map((o) => (
          <article key={o.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-bold">{o.reference}</p>
                <p className="text-sm text-brand-black/60">
                  {o.customer_name} · {o.phone} · {o.payment_method}
                </p>
                <p className="text-sm font-semibold text-brand-orange">
                  {o.total.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
              <select
                className="rounded-xl border px-2 py-1 text-sm"
                value={o.order_status}
                onChange={(e) => setOrderStatus(o.id, e.target.value)}
              >
                {statuses.filter(Boolean).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </article>
        ))}
        {items.length === 0 && <p className="text-sm text-brand-black/50">Aucune commande.</p>}
      </div>
    </div>
  );
}
