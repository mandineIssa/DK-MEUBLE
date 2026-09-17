"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { adminApi, CategoryModuleSettings } from "@/lib/adminApi";
import type { Category } from "@/lib/api";
import EntityMediaPanel from "@/components/admin/EntityMediaPanel";

type FormState = {
  name: string;
  slug: string;
  parent_id: string;
  description: string;
  is_active: boolean;
  is_popular: boolean;
  meta_title: string;
  meta_description: string;
  attr_name: string;
  attr_type: string;
  attr_options: string;
};

const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  parent_id: "",
  description: "",
  is_active: true,
  is_popular: false,
  meta_title: "",
  meta_description: "",
  attr_name: "",
  attr_type: "select",
  attr_options: "",
});

export default function AdminCategoriesPage() {
  const [tree, setTree] = useState<Category[]>([]);
  const [flat, setFlat] = useState<Category[]>([]);
  const [settings, setSettings] = useState<CategoryModuleSettings | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dragId, setDragId] = useState<number | null>(null);

  async function load() {
    const data = await adminApi.getCategories();
    setTree(data.tree);
    setFlat(data.flat);
    setSettings(data.settings);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, []);

  const parentOptions = useMemo(
    () => flat.filter((c) => !editing || c.id !== editing.id),
    [flat, editing]
  );

  function startEdit(c: Category) {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      parent_id: c.parent_id ? String(c.parent_id) : "",
      description: c.description || "",
      is_active: c.is_active !== false,
      is_popular: !!c.is_popular,
      meta_title: c.meta_title || "",
      meta_description: c.meta_description || "",
      attr_name: "",
      attr_type: "select",
      attr_options: "",
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      description: form.description || null,
      is_active: form.is_active,
      is_popular: form.is_popular,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
    };
    try {
      if (editing) {
        await adminApi.updateCategory(editing.id, payload);
        setMessage("Catégorie mise à jour.");
      } else {
        await adminApi.createCategory(payload);
        setMessage("Catégorie créée.");
      }
      setEditing(null);
      setForm(emptyForm());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function handleDelete(c: Category) {
    const needsMove = (c.products_count || 0) > 0 || (c.children?.length || 0) > 0;
    let moveTo: number | undefined;
    if (needsMove) {
      const raw = prompt(
        `Reclasser produits/sous-catégories vers quelle catégorie (id) ?\nDisponibles: ${flat
          .filter((x) => x.id !== c.id)
          .map((x) => `${x.id}=${x.name}`)
          .join(", ")}`
      );
      if (!raw) return;
      moveTo = Number(raw);
      if (!moveTo) return;
    } else if (!confirm(`Supprimer « ${c.name} » ?`)) {
      return;
    }
    try {
      await adminApi.deleteCategory(c.id, moveTo);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function move(c: Category, dir: -1 | 1) {
    const siblings = flat
      .filter((x) => (x.parent_id || null) === (c.parent_id || null))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const idx = siblings.findIndex((x) => x.id === c.id);
    const swap = siblings[idx + dir];
    if (!swap) return;
    const items = siblings.map((s, i) => ({
      id: s.id,
      parent_id: s.parent_id ?? null,
      display_order: i,
    }));
    const a = items[idx];
    const b = items[idx + dir];
    items[idx] = { ...a, display_order: b.display_order };
    items[idx + dir] = { ...b, display_order: a.display_order };
    // simpler: swap display_order values
    await adminApi.reorderCategories([
      { id: c.id, parent_id: c.parent_id ?? null, display_order: swap.display_order || 0 },
      { id: swap.id, parent_id: swap.parent_id ?? null, display_order: c.display_order || 0 },
    ]);
    await load();
  }

  async function onDropOnto(target: Category) {
    if (!dragId || dragId === target.id) return;
    const dragged = flat.find((c) => c.id === dragId);
    if (!dragged) return;
    try {
      await adminApi.updateCategory(dragId, {
        parent_id: target.id,
        display_order: (target.children?.length || 0) + 1,
      } as Partial<Category>);
      setDragId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Déplacement impossible");
    }
  }

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    try {
      setSettings(await adminApi.updateCategorySettings(settings));
      setMessage("Réglages enregistrés.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réglages");
    }
  }

  async function seedTree() {
    if (!confirm("Importer l’arborescence électroménager suggérée (sans écraser les slugs existants) ?")) {
      return;
    }
    try {
      const res = await adminApi.seedSuggestedCategories();
      setMessage(res.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur seed");
    }
  }

  async function addAttribute() {
    if (!editing || !form.attr_name) return;
    try {
      await adminApi.createCategoryAttribute(editing.id, {
        name: form.attr_name,
        field_type: form.attr_type,
        options: form.attr_options
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setForm((f) => ({ ...f, attr_name: "", attr_options: "" }));
      setMessage("Attribut ajouté.");
      const updated = await adminApi.updateCategory(editing.id, {});
      setEditing(updated);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur attribut");
    }
  }

  function renderNode(c: Category, depth = 0) {
    return (
      <li key={c.id} className="border-t border-brand-black/5">
        <div
          draggable
          onDragStart={() => setDragId(c.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDropOnto(c)}
          className="flex flex-wrap items-center gap-2 px-3 py-2.5"
          style={{ paddingLeft: 12 + depth * 18 }}
        >
          <span className="cursor-grab text-brand-black/30">⋮⋮</span>
          <span className="font-semibold text-brand-black">{c.name}</span>
          <span className="text-xs text-brand-black/45">/{c.slug}</span>
          <span className="rounded-full bg-brand-black/5 px-2 py-0.5 text-xs">
            {c.products_count ?? 0} prod.
          </span>
          {!c.is_active && <span className="text-xs text-red-600">inactive</span>}
          {c.is_popular && <span className="text-xs text-brand-orange">★ populaire</span>}
          <span className="ml-auto flex flex-wrap gap-1">
            <button type="button" className="text-xs font-semibold" onClick={() => move(c, -1)}>
              ↑
            </button>
            <button type="button" className="text-xs font-semibold" onClick={() => move(c, 1)}>
              ↓
            </button>
            <button
              type="button"
              className="text-xs font-semibold text-brand-orange"
              onClick={() => startEdit(c)}
            >
              Éditer
            </button>
            <button
              type="button"
              className="text-xs font-semibold text-red-600"
              onClick={() => handleDelete(c)}
            >
              Suppr.
            </button>
          </span>
        </div>
        {c.children && c.children.length > 0 && (
          <ul>{c.children.map((child) => renderNode(child, depth + 1))}</ul>
        )}
      </li>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Catégories</h1>
          <p className="text-sm text-brand-black/60">
            Arborescence électroménager — compteurs dynamiques, aucun hardcode public.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={seedTree}
            className="rounded-full border border-brand-black/15 px-4 py-2 text-sm font-semibold"
          >
            Importer suggestion
          </button>
          <Link
            href="/categories"
            className="rounded-full bg-brand-black px-4 py-2 text-sm font-semibold text-white"
          >
            Voir la page publique
          </Link>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid max-w-3xl gap-3 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 font-bold">
          {editing ? `Modifier #${editing.id}` : "Nouvelle catégorie"}
        </h2>
        <label className="block text-sm">
          <span className="text-brand-black/60">Nom *</span>
          <input
            required
            className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="text-brand-black/60">Slug</span>
          <input
            className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-brand-black/60">Parent (vide = catégorie principale)</span>
          <select
            className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
            value={form.parent_id}
            onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
          >
            <option value="">— Racine —</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-brand-black/60">Description</span>
          <textarea
            rows={2}
            className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="text-brand-black/60">Meta title</span>
          <input
            className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
            value={form.meta_title}
            onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="text-brand-black/60">Meta description</span>
          <input
            className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
            value={form.meta_description}
            onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_popular}
            onChange={(e) => setForm((f) => ({ ...f, is_popular: e.target.checked }))}
          />
          Catégorie populaire
        </label>
        <div className="sm:col-span-2 flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white"
          >
            {editing ? "Enregistrer" : "Ajouter"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(emptyForm());
              }}
              className="rounded-full border px-4 py-2.5 text-sm"
            >
              Annuler
            </button>
          )}
        </div>

        {editing && (
          <div className="sm:col-span-2">
            <EntityMediaPanel type="categories" entityId={editing.id} title="Photos catégorie" />
          </div>
        )}

        {editing && (
          <div className="sm:col-span-2 space-y-2 border-t border-brand-black/10 pt-3">
            <p className="text-sm font-semibold">Attribut de filtre</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                placeholder="Nom (ex: Capacité L)"
                className="rounded-xl border border-brand-black/10 px-3 py-2 text-sm"
                value={form.attr_name}
                onChange={(e) => setForm((f) => ({ ...f, attr_name: e.target.value }))}
              />
              <select
                className="rounded-xl border border-brand-black/10 px-3 py-2 text-sm"
                value={form.attr_type}
                onChange={(e) => setForm((f) => ({ ...f, attr_type: e.target.value }))}
              >
                <option value="select">Liste</option>
                <option value="number">Nombre</option>
                <option value="boolean">Oui/Non</option>
              </select>
              <input
                placeholder="Options (a, b, c)"
                className="rounded-xl border border-brand-black/10 px-3 py-2 text-sm"
                value={form.attr_options}
                onChange={(e) => setForm((f) => ({ ...f, attr_options: e.target.value }))}
              />
            </div>
            <button
              type="button"
              onClick={addAttribute}
              className="rounded-full border border-brand-black/15 px-4 py-2 text-xs font-semibold"
            >
              Ajouter l’attribut
            </button>
          </div>
        )}
      </form>

      {settings && (
        <form
          onSubmit={saveSettings}
          className="mt-6 max-w-3xl space-y-3 rounded-2xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-bold">Réglages module</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-brand-black/60">Profondeur max</span>
              <select
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                value={settings.max_depth}
                onChange={(e) =>
                  setSettings((s) => s && { ...s, max_depth: Number(e.target.value) })
                }
              >
                <option value={2}>2 niveaux</option>
                <option value={3}>3 niveaux</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-brand-black/60">Tri par défaut</span>
              <select
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                value={settings.default_sort}
                onChange={(e) =>
                  setSettings(
                    (s) =>
                      s && {
                        ...s,
                        default_sort: e.target.value as CategoryModuleSettings["default_sort"],
                      }
                  )
                }
              >
                <option value="newest">Plus récents</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="promo">Offres spéciales</option>
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.hide_empty}
              onChange={(e) => setSettings((s) => s && { ...s, hide_empty: e.target.checked })}
            />
            Masquer les catégories vides sur le public
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.show_breadcrumb}
              onChange={(e) =>
                setSettings((s) => s && { ...s, show_breadcrumb: e.target.checked })
              }
            />
            Afficher le fil d’Ariane
          </label>
          <button
            type="submit"
            className="rounded-full bg-brand-black px-5 py-2.5 text-sm font-semibold text-white"
          >
            Enregistrer les réglages
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-3 text-sm text-green-700">{message}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <ul>{tree.map((c) => renderNode(c))}</ul>
        {tree.length === 0 && <p className="p-6 text-brand-black/50">Aucune catégorie.</p>}
      </div>
    </div>
  );
}
