"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/adminApi";

export default function AdminCommandesReglagesPage() {
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.getOrderSettings().then(setForm).catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    try {
      setForm(await adminApi.updateOrderSettings(form));
      setMessage("Enregistré");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  if (!form) return <p className="p-8">Chargement…</p>;

  return (
    <div className="p-6 md:p-8">
      <Link href="/admin/commandes" className="text-sm text-brand-orange">← Commandes</Link>
      <h1 className="mt-2 text-2xl font-extrabold">Réglages commandes</h1>
      <form onSubmit={onSubmit} className="mt-6 max-w-xl space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(form.guest_enabled)}
            onChange={(e) => setForm((f) => f && { ...f, guest_enabled: e.target.checked })}
          />
          Commande invité autorisée
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(form.confirmation_enabled)}
            onChange={(e) => setForm((f) => f && { ...f, confirmation_enabled: e.target.checked })}
          />
          SMS de confirmation
        </label>
        <label className="block text-sm">
          Message confirmation
          <textarea
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={String(form.confirmation_sms || "")}
            onChange={(e) => setForm((f) => f && { ...f, confirmation_sms: e.target.value })}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
        <button type="submit" className="rounded-full bg-brand-orange px-5 py-2 text-sm font-semibold text-white">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
