"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";

type FilterChild = {
  id: number;
  name?: string;
  slug?: string;
  enabled: boolean;
  label?: string | null;
};

type FilterItem = {
  id: number;
  name?: string;
  slug?: string;
  enabled: boolean;
  label?: string | null;
  children: FilterChild[];
};

type PlpSettings = {
  filters: Record<string, boolean>;
  sort_options: Array<{ value: string; label: string; enabled: boolean }>;
  default_sort: string;
  default_view: string;
  view_modes: Record<string, boolean>;
  accordion_mode: "exclusive" | "multiple";
  show_subcategories: boolean;
  category_order: "manual" | "alpha" | "custom";
  category_filter_title: string;
  category_filter_items: FilterItem[];
  accent_color: string;
  popularity_logic: "quotes" | "manual";
  per_page: number;
  realtime_filter: boolean;
  infinite_scroll: boolean;
  show_breadcrumb: boolean;
};

function moveItem<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export default function AdminPlpSettingsPage() {
  const [form, setForm] = useState<PlpSettings | null>(null);
  const [openRoots, setOpenRoots] = useState<Record<number, boolean>>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    adminApi
      .getPlpSettings()
      .then((s) => {
        const settings = s as PlpSettings;
        setForm({
          ...settings,
          category_filter_title: settings.category_filter_title || "Catégories de produits",
          category_filter_items: settings.category_filter_items || [],
        });
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Erreur"));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    try {
      // Nettoyer le payload : ne garder que id/enabled/label/children
      const payload = {
        ...form,
        category_filter_items: (form.category_filter_items || []).map((item) => ({
          id: item.id,
          enabled: item.enabled !== false,
          label: item.label || null,
          children: (item.children || []).map((ch) => ({
            id: ch.id,
            enabled: ch.enabled !== false,
            label: ch.label || null,
          })),
        })),
      };
      setForm((await adminApi.updatePlpSettings(payload)) as PlpSettings);
      setMsg("Réglages PLP enregistrés.");
      setErr("");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur");
    }
  }

  function moveSort(i: number, dir: -1 | 1) {
    if (!form) return;
    setForm({ ...form, sort_options: moveItem(form.sort_options, i, dir) });
  }

  function updateRoot(i: number, patch: Partial<FilterItem>) {
    if (!form) return;
    const next = [...form.category_filter_items];
    next[i] = { ...next[i], ...patch };
    setForm({ ...form, category_filter_items: next, category_order: "custom" });
  }

  function updateChild(ri: number, ci: number, patch: Partial<FilterChild>) {
    if (!form) return;
    const next = [...form.category_filter_items];
    const children = [...(next[ri].children || [])];
    children[ci] = { ...children[ci], ...patch };
    next[ri] = { ...next[ri], children };
    setForm({ ...form, category_filter_items: next, category_order: "custom" });
  }

  function setAllEnabled(enabled: boolean) {
    if (!form) return;
    setForm({
      ...form,
      category_filter_items: form.category_filter_items.map((item) => ({
        ...item,
        enabled,
        children: (item.children || []).map((ch) => ({ ...ch, enabled })),
      })),
      category_order: "custom",
    });
  }

  if (!form) return <p className="p-6 text-sm text-brand-black/60">Chargement…</p>;

  const filterKeys = [
    ["category", "Catégories"],
    ["price", "Prix"],
    ["brand", "Marques"],
    ["condition", "État"],
    ["attributes", "Attributs"],
    ["availability", "Disponibilité"],
  ] as const;

  const viewKeys = [
    ["grid_2", "Grille 2 col."],
    ["grid_3", "Grille 3 col."],
    ["grid_4", "Grille 4 col."],
    ["list", "Vue liste"],
  ] as const;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-extrabold">Réglages listing (PLP)</h1>
      <p className="mt-1 text-sm text-brand-black/60">
        Titre, catégories / sous-catégories du filtre, barre vue/tri.
      </p>
      {msg ? <p className="mt-3 text-sm text-green-700">{msg}</p> : null}
      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}

      <form onSubmit={onSubmit} className="mt-6 max-w-3xl space-y-8 rounded-2xl bg-white p-5 shadow-sm">
        {/* —— Catégories de produits —— */}
        <div>
          <h2 className="mb-3 font-bold">Bloc « Catégories de produits »</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium sm:col-span-2">
              Titre affiché dans la sidebar
              <input
                type="text"
                value={form.category_filter_title || ""}
                onChange={(e) => setForm({ ...form, category_filter_title: e.target.value })}
                placeholder="Catégories de produits"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-medium">
              Accordéon
              <select
                value={form.accordion_mode || "multiple"}
                onChange={(e) =>
                  setForm({ ...form, accordion_mode: e.target.value as "exclusive" | "multiple" })
                }
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="multiple">Plusieurs groupes ouverts</option>
                <option value="exclusive">Un seul groupe à la fois</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm sm:mt-6">
              <input
                type="checkbox"
                checked={form.show_subcategories !== false}
                onChange={(e) => setForm({ ...form, show_subcategories: e.target.checked })}
              />
              Afficher les sous-catégories
            </label>
            <label className="text-xs font-medium sm:col-span-2">
              Couleur d’accent (case cochée + texte actif)
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={form.accent_color || "#FF7A00"}
                  onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                  className="h-10 w-12 cursor-pointer rounded border"
                />
                <input
                  type="text"
                  value={form.accent_color || "#FF7A00"}
                  onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono"
                />
              </div>
            </label>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">Catégories & sous-catégories visibles</p>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  className="rounded-full border px-3 py-1 font-semibold"
                  onClick={() => setAllEnabled(true)}
                >
                  Tout activer
                </button>
                <button
                  type="button"
                  className="rounded-full border px-3 py-1 font-semibold"
                  onClick={() => setAllEnabled(false)}
                >
                  Tout masquer
                </button>
              </div>
            </div>
            <p className="mb-3 text-xs text-brand-black/50">
              Coche = visible dans le filtre. ↑↓ = ordre d’affichage. Libellé optionnel pour
              renommer sans toucher à la catégorie catalogue.
            </p>

            <ul className="max-h-[480px] space-y-2 overflow-y-auto rounded-xl border border-black/5 p-2">
              {(form.category_filter_items || []).map((item, i) => {
                const open = openRoots[item.id] ?? true;
                return (
                  <li key={item.id} className="rounded-lg bg-[#fafafa] p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.enabled !== false}
                        onChange={(e) => updateRoot(i, { enabled: e.target.checked })}
                        title="Visible"
                      />
                      <button
                        type="button"
                        className="text-xs text-brand-black/50"
                        onClick={() => setOpenRoots((o) => ({ ...o, [item.id]: !open }))}
                      >
                        {open ? "▾" : "▸"}
                      </button>
                      <span className="min-w-0 flex-1 text-sm font-semibold">
                        {item.name || item.slug || `#${item.id}`}
                      </span>
                      <input
                        type="text"
                        value={item.label || ""}
                        placeholder="Libellé custom"
                        onChange={(e) => updateRoot(i, { label: e.target.value || null })}
                        className="w-36 rounded border px-2 py-1 text-xs"
                      />
                      <button type="button" className="text-xs font-bold" onClick={() => {
                        setForm({
                          ...form,
                          category_filter_items: moveItem(form.category_filter_items, i, -1),
                          category_order: "custom",
                        });
                      }}>
                        ↑
                      </button>
                      <button type="button" className="text-xs font-bold" onClick={() => {
                        setForm({
                          ...form,
                          category_filter_items: moveItem(form.category_filter_items, i, 1),
                          category_order: "custom",
                        });
                      }}>
                        ↓
                      </button>
                    </div>

                    {open && form.show_subcategories !== false && (item.children || []).length > 0 ? (
                      <ul className="mt-2 space-y-1 border-l border-black/10 pl-4">
                        {(item.children || []).map((ch, ci) => (
                          <li key={ch.id} className="flex flex-wrap items-center gap-2 py-0.5">
                            <input
                              type="checkbox"
                              checked={ch.enabled !== false}
                              onChange={(e) => updateChild(i, ci, { enabled: e.target.checked })}
                            />
                            <span className="min-w-0 flex-1 text-xs text-brand-black/80">
                              {ch.name || ch.slug || `#${ch.id}`}
                            </span>
                            <input
                              type="text"
                              value={ch.label || ""}
                              placeholder="Libellé"
                              onChange={(e) => updateChild(i, ci, { label: e.target.value || null })}
                              className="w-28 rounded border px-2 py-0.5 text-xs"
                            />
                            <button
                              type="button"
                              className="text-[10px] font-bold"
                              onClick={() =>
                                updateRoot(i, {
                                  children: moveItem(item.children || [], ci, -1),
                                })
                              }
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="text-[10px] font-bold"
                              onClick={() =>
                                updateRoot(i, {
                                  children: moveItem(item.children || [], ci, 1),
                                })
                              }
                            >
                              ↓
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
              {(form.category_filter_items || []).length === 0 ? (
                <li className="p-3 text-sm text-brand-black/50">
                  Aucune catégorie active. Crée des catégories dans le module Catalogue.
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div>
          <h2 className="mb-2 font-bold">Autres filtres sidebar</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {filterKeys.map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(form.filters?.[key])}
                  onChange={(e) =>
                    setForm((f) => f && { ...f, filters: { ...f.filters, [key]: e.target.checked } })
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 font-bold">Barre Vue / Tri</h2>
          <p className="mb-2 text-xs text-brand-black/50">Modes d’affichage disponibles</p>
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            {viewKeys.map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.view_modes?.[key] !== false}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      view_modes: { ...(form.view_modes || {}), [key]: e.target.checked },
                    })
                  }
                />
                {label}
              </label>
            ))}
          </div>

          <p className="mb-2 text-xs text-brand-black/50">Options de tri (ordre = dropdown)</p>
          <ul className="space-y-2">
            {(form.sort_options || []).map((opt, i) => (
              <li key={opt.value} className="flex flex-wrap items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={opt.enabled !== false}
                  onChange={(e) => {
                    const next = [...form.sort_options];
                    next[i] = { ...opt, enabled: e.target.checked };
                    setForm({ ...form, sort_options: next });
                  }}
                />
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => {
                    const next = [...form.sort_options];
                    next[i] = { ...opt, label: e.target.value };
                    setForm({ ...form, sort_options: next });
                  }}
                  className="min-w-[140px] flex-1 rounded border px-2 py-1"
                />
                <span className="text-brand-black/40">({opt.value})</span>
                <button type="button" className="text-xs font-semibold" onClick={() => moveSort(i, -1)}>
                  ↑
                </button>
                <button type="button" className="text-xs font-semibold" onClick={() => moveSort(i, 1)}>
                  ↓
                </button>
              </li>
            ))}
          </ul>

          <label className="mt-3 block text-xs font-medium">
            Logique « Popularité »
            <select
              value={form.popularity_logic || "quotes"}
              onChange={(e) =>
                setForm({ ...form, popularity_logic: e.target.value as "quotes" | "manual" })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="quotes">Nombre de devis / demandes</option>
              <option value="manual">Ordre catalogue (id décroissant)</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">
            Tri par défaut
            <select
              value={form.default_sort}
              onChange={(e) => setForm({ ...form, default_sort: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              {(form.sort_options || []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium">
            Vue par défaut
            <select
              value={form.default_view}
              onChange={(e) => setForm({ ...form, default_view: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="grid_2">Grille 2 col.</option>
              <option value="grid_3">Grille 3 col.</option>
              <option value="grid_4">Grille 4 col.</option>
              <option value="list">Liste</option>
            </select>
          </label>
          <label className="text-xs font-medium">
            Produits / page
            <input
              type="number"
              min={6}
              max={48}
              value={form.per_page}
              onChange={(e) => setForm({ ...form, per_page: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:mt-6">
            <input
              type="checkbox"
              checked={form.realtime_filter}
              onChange={(e) => setForm({ ...form, realtime_filter: e.target.checked })}
            />
            Filtrage temps réel (AJAX)
          </label>
        </div>

        <button type="submit" className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-bold text-white">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
