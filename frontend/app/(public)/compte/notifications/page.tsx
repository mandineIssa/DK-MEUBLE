"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  customerApi,
  hasCustomerSession,
  type CustomerNotification,
} from "@/lib/customerApi";

const TYPE_LABELS: Record<string, string> = {
  order_placed: "Commandes",
  order_status: "Commandes",
  price_drop: "Favoris",
  back_in_stock: "Favoris",
  favorite_removed: "Favoris",
  abandoned_cart: "Panier",
  promo_ending: "Promos",
  newsletter: "Newsletter",
  chat_reply: "Chat",
  chat_message: "Chat",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [type, setType] = useState("");
  const [items, setItems] = useState<CustomerNotification[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load(p = page, t = type) {
    setLoading(true);
    try {
      const res = await customerApi.getNotifications({ page: p, type: t || undefined });
      setItems(res.data.data || []);
      setLastPage(res.data.last_page || 1);
      setPage(res.data.current_page || 1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    hasCustomerSession().then((ok) => {
      if (!ok) {
        router.replace("/compte/connexion");
        return;
      }
      load(1, type).catch(() => router.replace("/compte/connexion"));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, type]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Mes notifications</h1>
          <p className="mt-1 text-sm text-brand-black/50">Commandes, favoris, panier et alertes</p>
        </div>
        <div className="flex gap-2">
          <Link href="/compte/notifications/preferences" className="rounded-full border px-4 py-2 text-xs font-bold">
            Préférences
          </Link>
          <button
            type="button"
            className="rounded-full bg-brand-orange px-4 py-2 text-xs font-bold text-white"
            onClick={() => customerApi.markAllNotificationsRead().then(() => load())}
          >
            Tout marquer lu
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setType("")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${type === "" ? "bg-brand-black text-white" : "bg-white border"}`}
        >
          Toutes
        </button>
        {["order_status", "price_drop", "abandoned_cart", "promo_ending"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${type === t ? "bg-brand-black text-white" : "bg-white border"}`}
          >
            {TYPE_LABELS[t] || t}
          </button>
        ))}
      </div>

      <ul className="mt-6 space-y-2">
        {loading ? (
          <li className="rounded-2xl bg-white p-6 text-sm text-brand-black/45">Chargement…</li>
        ) : items.length === 0 ? (
          <li className="rounded-2xl bg-white p-6 text-sm text-brand-black/45">Aucune notification.</li>
        ) : (
          items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={async () => {
                  if (!n.is_read) await customerApi.markNotificationRead(n.id).catch(() => {});
                  if (n.link) router.push(n.link);
                  else load();
                }}
                className={`w-full rounded-2xl border px-4 py-4 text-left ${n.is_read ? "border-black/5 bg-white" : "border-brand-orange/30 bg-brand-orange/5"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{n.title}</p>
                    <p className="mt-1 text-sm text-brand-black/65">{n.message}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-brand-black/40">
                    {TYPE_LABELS[n.type] || n.type}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-brand-black/35">
                  {new Date(n.created_at).toLocaleString("fr-FR")}
                </p>
              </button>
            </li>
          ))
        )}
      </ul>

      {lastPage > 1 ? (
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="rounded-full border px-4 py-2 text-xs font-bold disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="px-2 py-2 text-xs">
            {page} / {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => load(page + 1)}
            className="rounded-full border px-4 py-2 text-xs font-bold disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      ) : null}
    </div>
  );
}
