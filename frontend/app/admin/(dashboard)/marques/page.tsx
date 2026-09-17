"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminApi, AdminBrand } from "@/lib/adminApi";
import EntityMediaPanel from "@/components/admin/EntityMediaPanel";

export default function AdminMarquesPage() {
  const [items, setItems] = useState<AdminBrand[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    is_featured: false,
    show_in_footer: true,
    is_active: true,
  });
  const [editing, setEditing] = useState<AdminBrand | null>(null);

  async function load() {
    setItems(await adminApi.getBrands());
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (editing) await adminApi.updateBrand(editing.id, form);
      else await adminApi.createBrand(form);
      setForm({
        name: "",
        slug: "",
        description: "",
        is_featured: false,
        show_in_footer: true,
        is_active: true,
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-extrabold">Marques</h1>
      <form onSubmit={onSubmit} className="mt-6 max-w-xl space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <input
          required
          placeholder="Nom *"
          className="w-full rounded-xl border px-3 py-2"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          placeholder="Slug"
          className="w-full rounded-xl border px-3 py-2"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
        />
        <textarea
          placeholder="Description"
          className="w-full rounded-xl border px-3 py-2"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
          />
          Marque en vedette (bandeau)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.show_in_footer}
            onChange={(e) => setForm((f) => ({ ...f, show_in_footer: e.target.checked }))}
          />
          Afficher dans le footer
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="rounded-full bg-brand-orange px-5 py-2 text-sm font-semibold text-white">
          {editing ? "Enregistrer" : "Ajouter"}
        </button>
        {editing ? (
          <EntityMediaPanel type="brands" entityId={editing.id} title="Photos / logos marque" />
        ) : null}
      </form>
      <ul className="mt-6 space-y-2">
        {items.map((b) => (
          <li key={b.id} className="flex justify-between rounded-xl bg-white p-4 shadow-sm">
            <div>
              <p className="font-bold">
                {b.name} {b.is_featured ? "★" : ""}
              </p>
              <p className="text-xs text-brand-black/50">/{b.slug} · {b.products_count ?? 0} produits</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-sm font-semibold text-brand-orange"
                onClick={() => {
                  setEditing(b);
                  setForm({
                    name: b.name,
                    slug: b.slug,
                    description: b.description || "",
                    is_featured: b.is_featured,
                    show_in_footer: b.show_in_footer !== false,
                    is_active: b.is_active,
                  });
                }}
              >
                Éditer
              </button>
              <button
                type="button"
                className="text-sm font-semibold text-red-600"
                onClick={() => adminApi.deleteBrand(b.id).then(load)}
              >
                Suppr.
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
