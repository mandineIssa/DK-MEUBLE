"use client";

import { FormEvent, useState } from "react";

const STEPS = ["Commande reçue", "Paiement confirmé", "Préparation", "Prête", "En livraison", "Livrée"];

function stepIndex(status: string, payment: string): number {
  if (status === "livree") return 5;
  if (status === "expediee") return 4;
  if (status === "en_preparation") return 2;
  if (status === "confirmee" || ["paye", "paid", "confirme"].includes(payment)) return 1;
  return 0;
}

export default function SuiviPage() {
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOrder(null);
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const qs = phone.trim() ? `?phone=${encodeURIComponent(phone.trim())}` : "";
    const res = await fetch(`${api}/api/orders/${encodeURIComponent(reference.trim())}${qs}`, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      setError("Commande introuvable. Vérifiez la référence et le téléphone.");
      return;
    }
    setOrder(await res.json());
  }

  const current = order ? stepIndex(String(order.order_status || ""), String(order.payment_status || "")) : -1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <h1 className="text-3xl font-extrabold text-brand-black">Suivre ma commande</h1>
      <p className="mt-2 text-sm text-brand-black/70">Les étapes suivent le statut enregistré. « Prête » n'est pas un statut séparé : elle est atteinte quand la commande est expédiée.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <label className="block text-sm font-semibold">Référence
          <input value={reference} onChange={(e) => setReference(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" required />
        </label>
        <label className="block text-sm font-semibold">Téléphone utilisé pour la commande
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" />
        </label>
        <button className="rounded-full bg-brand-orange px-5 py-3 text-sm font-bold text-white">Voir le suivi</button>
      </form>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      {order ? (
        <ol className="mt-6 space-y-3">
          {STEPS.map((label, index) => (
            <li key={label} className={`rounded-2xl px-4 py-3 text-sm font-bold ${index <= current ? "bg-brand-orange text-white" : "bg-white text-brand-black/50"}`}>
              {index + 1}. {label}
            </li>
          ))}
          {order.order_status === "annulee" ? <li className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">Commande annulée</li> : null}
        </ol>
      ) : null}
    </div>
  );
}
