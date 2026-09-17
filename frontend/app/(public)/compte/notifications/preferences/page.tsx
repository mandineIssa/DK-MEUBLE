"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  customerApi,
  hasCustomerSession,
  type CustomerNotificationPreference,
} from "@/lib/customerApi";

const LABELS: Record<string, string> = {
  order_placed: "Nouvelle commande",
  order_status: "Statut de commande",
  price_drop: "Baisse de prix (favoris)",
  back_in_stock: "Retour en stock",
  favorite_removed: "Favori indisponible",
  abandoned_cart: "Panier abandonné",
  promo_ending: "Fin de promotion",
  newsletter: "Newsletter",
  category_promo: "Promos catégorie",
  chat_message: "Message chat",
  chat_reply: "Réponse chat",
  service_request: "Demandes de service",
  content_report: "Signalements",
};

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<CustomerNotificationPreference[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    hasCustomerSession().then((ok) => {
      if (!ok) {
        router.replace("/compte/connexion");
        return;
      }
      customerApi
        .getNotificationPreferences()
        .then((r) => setPrefs(r.data))
        .catch(() => router.replace("/compte/connexion"));
    });
  }, [router]);

  function toggle(type: string, channel: keyof CustomerNotificationPreference, value: boolean) {
    setPrefs((list) =>
      list.map((p) => (p.type === type ? { ...p, [channel]: value } : p)),
    );
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await customerApi.updateNotificationPreferences(prefs);
      setPrefs(res.data);
      setMsg("Préférences enregistrées.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link href="/compte/notifications" className="text-sm font-semibold text-brand-orange">
        ← Notifications
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold">Préférences de notification</h1>
      <p className="mt-1 text-sm text-brand-black/50">
        Les alertes de commande (transactionnelles) restent toujours actives.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-brand-black/45">
              <th className="px-4 py-3">Type</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">SMS</th>
              <th className="px-3 py-3">WhatsApp</th>
              <th className="px-3 py-3">In-app</th>
            </tr>
          </thead>
          <tbody>
            {prefs.map((p) => (
              <tr key={p.type} className="border-b border-black/5">
                <td className="px-4 py-3 font-medium">
                  {LABELS[p.type] || p.type}
                  {p.locked ? (
                    <span className="ml-2 text-[10px] font-bold uppercase text-brand-orange">obligatoire</span>
                  ) : null}
                </td>
                {(["email_enabled", "sms_enabled", "whatsapp_enabled", "in_app_enabled"] as const).map((ch) => (
                  <td key={ch} className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={Boolean(p[ch])}
                      disabled={p.locked}
                      onChange={(e) => toggle(p.type, ch, e.target.checked)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {msg ? <p className="text-sm text-brand-black/60">{msg}</p> : null}
      </div>
    </div>
  );
}
