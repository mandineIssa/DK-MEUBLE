"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function HomeNewsletter({
  title,
  subtitle,
  ctaLabel,
  enabled = true,
}: {
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
  enabled?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (!enabled) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const res = await api.subscribeNewsletter(email);
      setMsg(res.message);
      setEmail("");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-brand-black text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="max-w-md">
          <h2 className="text-2xl font-extrabold tracking-tight">{title || "Newsletter"}</h2>
          <p className="mt-2 text-sm text-white/70">
            {subtitle || "Recevez nos offres et nouveautés"}
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre e-mail"
            className="flex-1 rounded-full border-0 px-4 py-3 text-sm text-brand-black outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-brand-orange px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {ctaLabel || "S'inscrire"}
          </button>
        </form>
        {msg ? <p className="text-sm text-green-300 md:w-full">{msg}</p> : null}
        {err ? <p className="text-sm text-red-300 md:w-full">{err}</p> : null}
      </div>
    </section>
  );
}
