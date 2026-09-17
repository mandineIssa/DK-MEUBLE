"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  adminApi,
  AdminProduct,
  AdminPromotion,
  PromoSettings,
} from "@/lib/adminApi";

const statuses: Array<AdminPromotion["status"] | ""> = [
  "",
  "draft",
  "active",
  "expired",
  "out_of_stock",
  "rejected",
];

function toInputDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminPromotionsPage() {
  const [items, setItems] = useState<AdminPromotion[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [settings, setSettings] = useState<PromoSettings | null>(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    product_id: "",
    price_original: "",
    price_promo: "",
    start_date: "",
    end_date: "",
    status: "draft" as AdminPromotion["status"],
    stock_quantity: "",
    is_featured: false,
    vendor_name: "",
    notes: "",
  });

  async function load() {
    const [promos, prods, sett] = await Promise.all([
      adminApi.getPromotions({ status: status || undefined, search: search || undefined }),
      adminApi.getProducts({ light: true, all: true }),
      adminApi.getPromotionSettings(),
    ]);
    setItems(promos);
    setProducts(prods);
    setSettings(sett);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === form.product_id),
    [products, form.product_id]
  );

  function resetForm() {
    setEditingId(null);
    setForm({
      product_id: "",
      price_original: "",
      price_promo: "",
      start_date: "",
      end_date: "",
      status: "draft",
      stock_quantity: "",
      is_featured: false,
      vendor_name: settings?.default_vendor_name || "DK MEUBLE",
      notes: "",
    });
  }

  function startEdit(p: AdminPromotion) {
    setEditingId(p.id);
    setForm({
      product_id: String(p.product_id),
      price_original: String(p.price_original),
      price_promo: String(p.price_promo),
      start_date: toInputDate(p.start_date),
      end_date: toInputDate(p.end_date),
      status: p.status,
      stock_quantity: p.stock_quantity === null ? "" : String(p.stock_quantity),
      is_featured: p.is_featured,
      vendor_name: p.vendor_name || "",
      notes: p.notes || "",
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const payload = {
      product_id: Number(form.product_id),
      price_original: Number(form.price_original),
      price_promo: Number(form.price_promo),
      start_date: form.start_date,
      end_date: form.end_date,
      status: form.status,
      stock_quantity: form.stock_quantity === "" ? null : Number(form.stock_quantity),
      is_featured: form.is_featured,
      vendor_name: form.vendor_name || null,
      notes: form.notes || null,
    };
    try {
      if (editingId) {
        await adminApi.updatePromotion(editingId, payload);
        setMessage("Promotion mise à jour.");
      } else {
        await adminApi.createPromotion(payload);
        setMessage("Promotion créée.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  async function setPromoStatus(id: number, next: AdminPromotion["status"]) {
    setError("");
    try {
      await adminApi.updatePromotionStatus(id, next);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec statut");
    }
  }

  async function toggleFeatured(p: AdminPromotion) {
    try {
      await adminApi.updatePromotion(p.id, { is_featured: !p.is_featured });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  async function remove(id: number) {
    if (!confirm("Supprimer cette promotion ?")) return;
    await adminApi.deletePromotion(id);
    await load();
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Promotions</h1>
          <p className="mt-1 text-sm text-brand-black/60">
            Gestion des offres publiques — réduction recalculée automatiquement.
          </p>
        </div>
        <Link
          href="/admin/promotions/reglages"
          className="rounded-full border border-brand-black/15 px-4 py-2 text-sm font-semibold hover:bg-brand-black/5"
        >
          Réglages Promo
        </Link>
      </div>

      <form onSubmit={onSubmit} className="mt-6 max-w-3xl space-y-3 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-bold text-brand-black">
          {editingId ? `Modifier #${editingId}` : "Nouvelle promotion"}
        </h2>
        <label className="block text-sm">
          <span className="text-brand-black/60">Produit *</span>
          <select
            required
            className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
            value={form.product_id}
            onChange={(e) => {
              const id = e.target.value;
              const prod = products.find((p) => String(p.id) === id);
              setForm((f) => ({
                ...f,
                product_id: id,
                price_original:
                  f.price_original || (prod?.price ? String(prod.price) : f.price_original),
              }));
            }}
          >
            <option value="">Choisir…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.price ? ` — ${p.price.toLocaleString("fr-FR")} FCFA` : ""}
              </option>
            ))}
          </select>
          {selectedProduct?.price ? (
            <span className="mt-1 block text-xs text-brand-black/50">
              Prix catalogue : {selectedProduct.price.toLocaleString("fr-FR")} FCFA
            </span>
          ) : null}
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-brand-black/60">Prix original (FCFA) *</span>
            <input
              required
              type="number"
              min={1}
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.price_original}
              onChange={(e) => setForm((f) => ({ ...f, price_original: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="text-brand-black/60">Prix promo (FCFA) *</span>
            <input
              required
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.price_promo}
              onChange={(e) => setForm((f) => ({ ...f, price_promo: e.target.value }))}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-brand-black/60">Début *</span>
            <input
              required
              type="datetime-local"
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="text-brand-black/60">Fin *</span>
            <input
              required
              type="datetime-local"
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.end_date}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="text-brand-black/60">Statut</span>
            <select
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as AdminPromotion["status"] }))
              }
            >
              <option value="draft">Brouillon</option>
              <option value="active">Active</option>
              <option value="expired">Expirée</option>
              <option value="out_of_stock">Rupture</option>
              <option value="rejected">Rejetée</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-brand-black/60">Stock promo</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.stock_quantity}
              onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))}
              placeholder="Illimité"
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
            />
            Mise en avant
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-brand-black/60">Vendeur affiché</span>
          <input
            className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
            value={form.vendor_name}
            onChange={(e) => setForm((f) => ({ ...f, vendor_name: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="text-brand-black/60">Notes internes</span>
          <textarea
            rows={2}
            className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </label>
        {settings ? (
          <p className="text-xs text-brand-black/50">
            Réduction autorisée : {settings.min_discount_percent}% – {settings.max_discount_percent}% ·
            Durée : {settings.min_duration_days}–{settings.max_duration_days} jours · Max actives :{" "}
            {settings.max_active}
          </p>
        ) : null}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white"
          >
            {editingId ? "Enregistrer" : "Créer"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-brand-black/15 px-5 py-2.5 text-sm font-semibold"
            >
              Annuler
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-8 flex flex-wrap gap-3">
        <input
          className="rounded-xl border border-brand-black/10 bg-white px-3 py-2 text-sm"
          placeholder="Rechercher un produit…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") load().catch(() => undefined);
          }}
        />
        <select
          className="rounded-xl border border-brand-black/10 bg-white px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {statuses.map((s) => (
            <option key={s || "all"} value={s}>
              {s ? s : "Tous les statuts"}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => load().catch((err) => setError(err instanceof Error ? err.message : "Erreur"))}
          className="rounded-full bg-brand-black px-4 py-2 text-sm font-semibold text-white"
        >
          Filtrer
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((p) => (
          <article key={p.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-brand-black">{p.product?.name || `Produit #${p.product_id}`}</p>
                <p className="mt-1 text-sm text-brand-black/60">
                  <span className="font-semibold text-brand-orange">
                    {p.price_promo.toLocaleString("fr-FR")} FCFA
                  </span>{" "}
                  <span className="line-through">
                    {p.price_original.toLocaleString("fr-FR")} FCFA
                  </span>{" "}
                  · -{Math.round(p.discount_percent)}% · {p.status}
                  {p.is_featured ? " · ★ featured" : ""}
                </p>
                <p className="text-xs text-brand-black/45">
                  {new Date(p.start_date).toLocaleDateString("fr-FR")} →{" "}
                  {new Date(p.end_date).toLocaleDateString("fr-FR")}
                  {p.stock_quantity !== null ? ` · stock ${p.stock_quantity}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.status === "draft" && (
                  <button
                    type="button"
                    onClick={() => setPromoStatus(p.id, "active")}
                    className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Approuver
                  </button>
                )}
                {p.status !== "rejected" && p.status !== "expired" && (
                  <button
                    type="button"
                    onClick={() => setPromoStatus(p.id, "rejected")}
                    className="rounded-full bg-red-600/90 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Rejeter
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleFeatured(p)}
                  className="rounded-full border border-brand-black/15 px-3 py-1.5 text-xs font-semibold"
                >
                  {p.is_featured ? "Retirer une vedette" : "Mettre en avant"}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  className="rounded-full border border-brand-black/15 px-3 py-1.5 text-xs font-semibold"
                >
                  Éditer
                </button>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </article>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-brand-black/50">Aucune promotion.</p>
        )}
      </div>
    </div>
  );
}
