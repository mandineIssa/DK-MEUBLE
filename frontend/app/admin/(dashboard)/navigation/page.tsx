"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  adminApi,
  type AdminMenuItem,
  type AdminMenuSection,
  type AdminNavigationPayload,
} from "@/lib/adminApi";
import type { Category } from "@/lib/api";

function flattenCats(cats: Category[]): Category[] {
  const out: Category[] = [];
  const walk = (list: Category[]) => {
    for (const c of list) {
      out.push(c);
      if (c.children?.length) walk(c.children);
    }
  };
  walk(cats);
  return out;
}

export default function AdminNavigationPage() {
  const [data, setData] = useState<AdminNavigationPayload | null>(null);
  const [flatCats, setFlatCats] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const [nav, cats] = await Promise.all([adminApi.getNavigationAdmin(), adminApi.getCategories()]);
      setData(nav);
      setFlatCats(flattenCats(cats.tree || cats.flat || []));
      if (!selectedId && nav.sections[0]) setSelectedId(nav.sections[0].id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sections = data?.sections || [];
  const selected = sections.find((s) => s.id === selectedId) || null;

  async function addSection(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const created = await adminApi.createMenuSection({
        label: String(form.get("label") || ""),
        linked_category_id: form.get("linked_category_id")
          ? Number(form.get("linked_category_id"))
          : null,
        custom_url: String(form.get("custom_url") || "") || null,
        is_active: true,
      });
      setMsg("Section créée.");
      e.currentTarget.reset();
      await load();
      setSelectedId(created.id);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur");
    }
  }

  async function saveSection(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const form = new FormData(e.currentTarget);
    try {
      await adminApi.updateMenuSection(selected.id, {
        label: String(form.get("label") || ""),
        linked_category_id: form.get("linked_category_id")
          ? Number(form.get("linked_category_id"))
          : null,
        custom_url: String(form.get("custom_url") || "") || null,
        is_active: form.get("is_active") === "on",
      });
      setMsg("Section enregistrée.");
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur");
    }
  }

  async function addItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const form = new FormData(e.currentTarget);
    try {
      await adminApi.createMenuItem({
        menu_section_id: selected.id,
        label: String(form.get("label") || ""),
        linked_category_id: form.get("linked_category_id")
          ? Number(form.get("linked_category_id"))
          : null,
        custom_url: String(form.get("custom_url") || "") || null,
        is_active: true,
      });
      setMsg("Lien ajouté.");
      e.currentTarget.reset();
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur");
    }
  }

  async function moveSection(id: number, dir: -1 | 1) {
    const ids = sections.map((s) => s.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await adminApi.reorderMenuSections(ids);
    await load();
  }

  if (loading && !data) {
    return <p className="p-6 text-sm text-brand-black/60">Chargement…</p>;
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-brand-black">Méga-menu / Navigation</h1>
        <p className="mt-1 text-sm text-brand-black/60">
          Structure d’affichage du header, indépendante de la taxonomie produit. Les liens pointent
          vers les URLs canoniques des catégories.
        </p>
      </div>

      {msg ? <p className="mb-3 text-sm text-green-700">{msg}</p> : null}
      {err ? <p className="mb-3 text-sm text-red-600">{err}</p> : null}

      {(data?.broken_links?.length || 0) > 0 ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold">Liens à corriger ({data!.broken_links.length})</p>
          <ul className="mt-2 space-y-1">
            {data!.broken_links.map((b) => (
              <li key={`${b.type}-${b.id}`}>
                [{b.type}] {b.label}
                {b.section ? ` · section ${b.section}` : ""} —{" "}
                {b.reason === "missing" ? "catégorie supprimée" : "catégorie inactive"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          await adminApi.updateNavigationSettings({
            columns: Number(form.get("columns") || 4),
            mobile_mode: String(form.get("mobile_mode") || "accordion"),
            show_icons: form.get("show_icons") === "on",
          });
          setMsg("Paramètres enregistrés.");
          await load();
        }}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm"
      >
        <label className="text-xs font-medium">
          Colonnes desktop
          <input
            name="columns"
            type="number"
            min={2}
            max={6}
            defaultValue={Number(data?.settings?.columns ?? 4)}
            className="mt-1 block w-24 rounded-lg border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-medium">
          Mobile
          <select
            name="mobile_mode"
            defaultValue={String(data?.settings?.mobile_mode || "accordion")}
            className="mt-1 block rounded-lg border px-3 py-2 text-sm"
          >
            <option value="accordion">Accordéon</option>
            <option value="list">Liste</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="show_icons"
            type="checkbox"
            defaultChecked={Boolean(data?.settings?.show_icons)}
          />
          Afficher icônes
        </label>
        <button type="submit" className="rounded-full bg-brand-black px-4 py-2 text-sm font-semibold text-white">
          Enregistrer
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <h2 className="mb-2 text-sm font-bold">Sections (colonne gauche)</h2>
            <ul className="space-y-1">
              {sections.map((section: AdminMenuSection) => (
                <li key={section.id}>
                  <div
                    className={`flex items-center gap-1 rounded-lg ${
                      selectedId === section.id ? "bg-brand-orange/10" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(section.id)}
                      className="min-w-0 flex-1 truncate px-2 py-2 text-left text-sm font-semibold"
                    >
                      {section.label}
                      {!section.is_active ? " (off)" : ""}
                    </button>
                    <button type="button" className="px-1 text-xs" onClick={() => moveSection(section.id, -1)}>
                      ↑
                    </button>
                    <button type="button" className="px-1 text-xs" onClick={() => moveSection(section.id, 1)}>
                      ↓
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={addSection} className="space-y-2 rounded-2xl bg-white p-3 shadow-sm">
            <h3 className="text-sm font-bold">Nouvelle section</h3>
            <input name="label" required placeholder="Libellé" className="w-full rounded-lg border px-3 py-2 text-sm" />
            <select name="linked_category_id" className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Catégorie liée (optionnel)</option>
              {flatCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              name="custom_url"
              placeholder="URL custom (ex. /destockage)"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white">
              Ajouter
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {selected ? (
            <>
              <form onSubmit={saveSection} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-bold">Éditer : {selected.label}</h2>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600"
                    onClick={async () => {
                      if (!confirm("Supprimer cette section et ses liens ?")) return;
                      await adminApi.deleteMenuSection(selected.id);
                      setSelectedId(null);
                      await load();
                    }}
                  >
                    Supprimer
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    name="label"
                    defaultValue={selected.label}
                    className="rounded-lg border px-3 py-2 text-sm"
                  />
                  <select
                    name="linked_category_id"
                    defaultValue={selected.linked_category_id || ""}
                    className="rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="">Pas de catégorie</option>
                    {flatCats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="custom_url"
                    defaultValue={selected.custom_url || ""}
                    placeholder="URL custom"
                    className="rounded-lg border px-3 py-2 text-sm md:col-span-2"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input name="is_active" type="checkbox" defaultChecked={selected.is_active} />
                    Active
                  </label>
                </div>
                <button type="submit" className="mt-3 rounded-full bg-brand-black px-4 py-2 text-sm font-semibold text-white">
                  Enregistrer la section
                </button>
              </form>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <h3 className="mb-3 font-bold">Liens de la grille (droite)</h3>
                <ul className="mb-4 space-y-2">
                  {(selected.items || []).map((item: AdminMenuItem) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/5 px-3 py-2 text-sm">
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-xs text-brand-black/50">
                          → {item.category ? `/categorie/${item.category.slug}` : item.custom_url || "sans lien"}
                          {item.category && item.label !== item.category.name
                            ? ` (réel : ${item.category.name})`
                            : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-red-600"
                        onClick={async () => {
                          await adminApi.deleteMenuItem(item.id);
                          await load();
                        }}
                      >
                        Suppr.
                      </button>
                    </li>
                  ))}
                  {!selected.items?.length ? (
                    <p className="text-sm text-brand-black/50">
                      Aucun lien — la section sera un lien direct (comme Destockage).
                    </p>
                  ) : null}
                </ul>

                <form onSubmit={addItem} className="grid gap-2 md:grid-cols-2">
                  <input name="label" required placeholder="Libellé affiché" className="rounded-lg border px-3 py-2 text-sm" />
                  <select name="linked_category_id" className="rounded-lg border px-3 py-2 text-sm">
                    <option value="">Choisir une catégorie réelle</option>
                    {flatCats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="custom_url"
                    placeholder="Ou URL custom"
                    className="rounded-lg border px-3 py-2 text-sm md:col-span-2"
                  />
                  <button type="submit" className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white md:w-fit">
                    Ajouter un lien
                  </button>
                </form>
              </div>
            </>
          ) : (
            <p className="rounded-2xl bg-white p-6 text-sm text-brand-black/60">
              Sélectionnez une section à gauche.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
