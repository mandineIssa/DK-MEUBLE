"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, PromoSettings } from "@/lib/adminApi";

export default function AdminPromoSettingsPage() {
  const [form, setForm] = useState<PromoSettings | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi
      .getPromotionSettings()
      .then(setForm)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await adminApi.updatePromotionSettings(form);
      setForm(updated);
      setMessage("Réglages enregistrés.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setSaving(false);
    }
  }

  if (!form && !error) {
    return <p className="p-8 text-sm text-brand-black/50">Chargement…</p>;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Réglages Promo</h1>
          <p className="mt-1 text-sm text-brand-black/60">
            Seuils, durée, validation et texte légal — rien n’est codé en dur côté front.
          </p>
        </div>
        <Link
          href="/admin/promotions"
          className="rounded-full border border-brand-black/15 px-4 py-2 text-sm font-semibold hover:bg-brand-black/5"
        >
          ← Promotions
        </Link>
      </div>

      {form ? (
        <form onSubmit={onSubmit} className="mt-6 max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-brand-black/60">Réduction min (%)</span>
              <input
                type="number"
                min={0}
                max={99}
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                value={form.min_discount_percent}
                onChange={(e) =>
                  setForm((f) => f && { ...f, min_discount_percent: Number(e.target.value) })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-brand-black/60">Réduction max (%)</span>
              <input
                type="number"
                min={1}
                max={99}
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                value={form.max_discount_percent}
                onChange={(e) =>
                  setForm((f) => f && { ...f, max_discount_percent: Number(e.target.value) })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-brand-black/60">Durée min (jours)</span>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                value={form.min_duration_days}
                onChange={(e) =>
                  setForm((f) => f && { ...f, min_duration_days: Number(e.target.value) })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-brand-black/60">Durée max (jours)</span>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                value={form.max_duration_days}
                onChange={(e) =>
                  setForm((f) => f && { ...f, max_duration_days: Number(e.target.value) })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-brand-black/60">Max promotions actives</span>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                value={form.max_active}
                onChange={(e) => setForm((f) => f && { ...f, max_active: Number(e.target.value) })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-brand-black/60">Alerte expiration (jours avant)</span>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                value={form.expiry_alert_days}
                onChange={(e) =>
                  setForm((f) => f && { ...f, expiry_alert_days: Number(e.target.value) })
                }
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.require_approval}
              onChange={(e) =>
                setForm((f) => f && { ...f, require_approval: e.target.checked })
              }
            />
            Validation manuelle obligatoire (nouvelle promo → brouillon)
          </label>

          <label className="block text-sm">
            <span className="text-brand-black/60">Nom vendeur par défaut</span>
            <input
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.default_vendor_name}
              onChange={(e) =>
                setForm((f) => f && { ...f, default_vendor_name: e.target.value })
              }
            />
          </label>

          <label className="block text-sm">
            <span className="text-brand-black/60">Texte légal (bas de page publique)</span>
            <textarea
              rows={4}
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.legal_text}
              onChange={(e) => setForm((f) => f && { ...f, legal_text: e.target.value })}
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.newsletter_enabled}
              onChange={(e) =>
                setForm((f) => f && { ...f, newsletter_enabled: e.target.checked })
              }
            />
            Newsletter meilleures offres
          </label>

          <label className="block text-sm">
            <span className="text-brand-black/60">Fréquence newsletter</span>
            <select
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.newsletter_frequency}
              onChange={(e) =>
                setForm(
                  (f) =>
                    f && {
                      ...f,
                      newsletter_frequency: e.target.value as PromoSettings["newsletter_frequency"],
                    }
                )
              }
            >
              <option value="weekly">Hebdomadaire</option>
              <option value="biweekly">Bi-mensuel</option>
              <option value="monthly">Mensuel</option>
            </select>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
