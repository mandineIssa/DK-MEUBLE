"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";

export default function ServiceRequestForm({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setErr("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await api.requestService(slug, {
        customer_name: String(form.get("customer_name") || ""),
        phone: String(form.get("phone") || ""),
        email: String(form.get("email") || "") || undefined,
        product_reference: String(form.get("product_reference") || "") || undefined,
        message: String(form.get("message") || ""),
      });
      setMsg(res.message);
      e.currentTarget.reset();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur d'envoi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <input
        name="customer_name"
        required
        placeholder="Nom complet"
        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
      />
      <input
        name="phone"
        required
        placeholder="Téléphone"
        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
      />
      <input
        name="email"
        type="email"
        placeholder="E-mail (optionnel)"
        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
      />
      <input
        name="product_reference"
        placeholder="Appareil / référence (optionnel)"
        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
      />
      <textarea
        name="message"
        required
        rows={4}
        placeholder="Décrivez votre besoin"
        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
      />
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-brand-black py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {busy ? "Envoi…" : "Envoyer la demande"}
      </button>
      {msg ? <p className="text-sm text-green-700">{msg}</p> : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
    </form>
  );
}
