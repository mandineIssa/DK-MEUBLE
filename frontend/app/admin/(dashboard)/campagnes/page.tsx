"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminApi, AdminCampaign } from "@/lib/adminApi";

export default function AdminCampagnesPage() {
  const [items, setItems] = useState<AdminCampaign[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: "",
    channel: "both" as "sms" | "email" | "both",
    subject: "",
    body: "",
    audience: "opt_in",
  });

  async function load() {
    setItems(await adminApi.getCampaigns());
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    setMessage("");
    try {
      const created = await adminApi.createCampaign({ ...form, send_now: true });
      setMessage(
        `Campagne envoyée — SMS: ${created.sent_sms}, Email: ${created.sent_email}, Échecs: ${created.failed}`
      );
      setForm({ title: "", channel: "both", subject: "", body: "", audience: "opt_in" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-brand-black">Campagnes SMS / Email</h1>
      <p className="mt-1 text-sm text-brand-black/60">
        Promotions envoyées aux clients inscrits (opt-in). SMS via Twilio ou log ; email via MAIL_*.
      </p>

      <form onSubmit={onSubmit} className="mt-6 max-w-2xl space-y-3 rounded-2xl bg-white p-6 shadow-sm">
        <label className="block text-sm">
          <span className="text-brand-black/60">Titre *</span>
          <input
            required
            className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-brand-black/60">Canal</span>
            <select
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.channel}
              onChange={(e) =>
                setForm((f) => ({ ...f, channel: e.target.value as "sms" | "email" | "both" }))
              }
            >
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="both">SMS + Email</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-brand-black/60">Audience</span>
            <select
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.audience}
              onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
            >
              <option value="opt_in">Opt-in (recommandé)</option>
              <option value="all">Tous les clients</option>
              <option value="b2b">Entreprises B2B seulement</option>
            </select>
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-brand-black/60">Sujet email</span>
          <input
            className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="text-brand-black/60">Message *</span>
          <textarea
            required
            rows={5}
            className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="Promo -10% cette semaine sur l'électroménager…"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
        <button
          type="submit"
          disabled={sending}
          className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {sending ? "Envoi…" : "Créer et envoyer"}
        </button>
      </form>

      <div className="mt-8 space-y-3">
        <h2 className="font-bold text-brand-black">Historique</h2>
        {items.map((c) => (
          <article key={c.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-bold">{c.title}</p>
                <p className="text-xs uppercase text-brand-black/50">
                  {c.channel} · {c.audience} · {c.status}
                </p>
              </div>
              <p className="text-sm text-brand-black/60">
                SMS {c.sent_sms} · Email {c.sent_email} · Échecs {c.failed}
              </p>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-brand-black/70">{c.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
