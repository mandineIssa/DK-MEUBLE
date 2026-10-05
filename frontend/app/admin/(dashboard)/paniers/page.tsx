"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, type AdminCart } from "@/lib/adminApi";
import { imageUrl } from "@/lib/api";
import { formatSnPhone } from "@/lib/phone";

type Status = "all" | "active" | "waiting";

const FILTERS: Array<{ id: Status; label: string }> = [
  { id: "all", label: "Tous" },
  { id: "active", label: "Actifs" },
  { id: "waiting", label: "En attente" },
];

function money(value: number) {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

function whenLabel(iso: string | null) {
  if (!iso) return "Date inconnue";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "À l’instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Il y a 1 jour" : `Il y a ${days} jours`;
}

export default function AdminCartsPage() {
  const [rows, setRows] = useState<AdminCart[]>([]);
  const [summary, setSummary] = useState({ carts: 0, active: 0, waiting: 0, items: 0, value: 0 });
  const [status, setStatus] = useState<Status>("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async (targetPage: number, targetStatus: Status, targetQuery: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getCarts({
        search: targetQuery || undefined,
        status: targetStatus,
        page: targetPage,
        per_page: 12,
      });
      setRows(res.data || []);
      setSummary(res.summary);
      setPage(res.current_page || 1);
      setLastPage(res.last_page || 1);
      setTotal(res.total || 0);
      setOpenId((current) => (res.data || []).some((row) => row.id === current) ? current : res.data?.[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les paniers.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, status, query).catch(() => {});
  }, [load, page, status, query]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }

  const cards = [
    { label: "Paniers avec articles", value: summary.carts.toLocaleString("fr-FR"), hint: "Visibles dans cette liste" },
    { label: "Actifs", value: summary.active.toLocaleString("fr-FR"), hint: "Modifiés dans les 24 dernières heures" },
    { label: "En attente", value: summary.waiting.toLocaleString("fr-FR"), hint: "Aucun changement depuis 24 h" },
    { label: "Valeur catalogue", value: money(summary.value), hint: `${summary.items.toLocaleString("fr-FR")} article(s) au total` },
  ];

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-brand-black">Paniers</h1>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-brand-black/60">
        Produits ajoutés par les visiteurs avant la commande. Un panier actif a été modifié dans les 24 dernières heures.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-orange">{card.label}</p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums text-brand-black">{loading && rows.length === 0 ? "…" : card.value}</p>
            <p className="mt-1 text-xs text-brand-black/50">{card.hint}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                setStatus(filter.id);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                status === filter.id ? "bg-brand-black text-white" : "bg-white text-brand-black shadow-sm"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <form onSubmit={onSearch} className="flex w-full gap-2 lg:max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Client, téléphone ou produit…"
            className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-orange"
          />
          <button type="submit" className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white">
            Rechercher
          </button>
        </form>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <p className="mt-4 text-xs text-brand-black/45">
        {loading ? "Chargement…" : `${total} panier${total > 1 ? "s" : ""}`}
      </p>

      <div className="mt-3 space-y-3">
        {!loading && rows.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm">
            <p className="font-bold text-brand-black">
              {query
                ? "Aucun panier ne correspond"
                : status === "active"
                  ? "Aucun panier actif"
                  : status === "waiting"
                    ? "Aucun panier en attente"
                    : "Aucun panier à afficher"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-brand-black/55">
              {query
                ? "Essayez un autre nom, un téléphone ou le nom d’un produit."
                : status === "active"
                  ? "Les paniers modifiés dans les 24 dernières heures s’affichent ici."
                  : "Dès qu’un visiteur ajoute un produit, le panier apparaît ici avec les articles, les quantités et le total."}
            </p>
          </div>
        ) : (
          rows.map((cart) => {
            const open = openId === cart.id;
            const person = cart.customer?.name?.trim() || "Visiteur non connecté";
            const contact = cart.customer?.phone
              ? formatSnPhone(cart.customer.phone).display
              : cart.customer?.email || "Sans téléphone ni e-mail";
            return (
              <article key={cart.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : cart.id)}
                  className="flex w-full flex-wrap items-center gap-3 px-4 py-4 text-left sm:px-5"
                  aria-expanded={open}
                >
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                      cart.status === "active" ? "bg-green-100 text-green-800" : "bg-brand-orange/15 text-brand-orange-dark"
                    }`}
                  >
                    {cart.status === "active" ? "Actif" : "En attente"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-brand-black">{person}</span>
                    <span className="block text-xs text-brand-black/50">{contact}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-extrabold tabular-nums text-brand-black">{money(cart.subtotal)}</span>
                    <span className="block text-xs text-brand-black/45">
                      {cart.quantity} article{cart.quantity > 1 ? "s" : ""} · {whenLabel(cart.updated_at)}
                    </span>
                  </span>
                </button>
                {open ? (
                  <div className="border-t border-black/5 px-4 py-3 sm:px-5">
                    <ul className="divide-y divide-black/5">
                      {cart.items.map((item) => {
                        const src = imageUrl(item.image);
                        return (
                          <li key={`${cart.id}-${item.product_id}`} className="flex items-center gap-3 py-3">
                            <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#f3f3f3]">
                              {src ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={src} alt="" className="h-full w-full object-cover" />
                              ) : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              {item.slug ? (
                                <Link href={`/produits/${item.slug}`} className="font-semibold text-brand-black hover:text-brand-orange">
                                  {item.name}
                                </Link>
                              ) : (
                                <span className="font-semibold text-brand-black">{item.name}</span>
                              )}
                              <span className="mt-0.5 block text-xs text-brand-black/50">
                                {item.quantity} × {money(item.unit_price)}
                                {!item.available ? " · plus au catalogue" : ""}
                              </span>
                            </span>
                            <span className="text-sm font-bold tabular-nums text-brand-black">{money(item.line_total)}</span>
                          </li>
                        );
                      })}
                    </ul>
                    {cart.customer?.id ? (
                      <Link href="/admin/clients" className="mt-1 inline-block text-xs font-bold text-brand-orange">
                        Voir la fiche clients
                      </Link>
                    ) : (
                      <p className="text-xs text-brand-black/45">Ce visiteur n’a pas ouvert de compte.</p>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>

      {lastPage > 1 ? (
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-full border bg-white px-4 py-2 text-sm font-bold disabled:opacity-40"
          >
            Précédent
          </button>
          <p className="text-sm text-brand-black/55">
            Page {page} sur {lastPage}
          </p>
          <button
            type="button"
            disabled={page >= lastPage || loading}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-full border bg-white px-4 py-2 text-sm font-bold disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      ) : null}
    </div>
  );
}
