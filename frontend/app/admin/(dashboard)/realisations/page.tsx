"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { adminApi, AdminRealization } from "@/lib/adminApi";
import { imageUrl } from "@/lib/api";
import EntityMediaPanel from "@/components/admin/EntityMediaPanel";

const emptyForm: {
  title: string;
  description: string;
  image_url: string;
  tag: string;
  sort_order: number;
  status: "draft" | "published";
} = {
  title: "",
  description: "",
  image_url: "",
  tag: "",
  sort_order: 0,
  status: "published",
};

export default function AdminRealisationsPage() {
  const [items, setItems] = useState<AdminRealization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminRealization | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setItems(await adminApi.getRealizations());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  }

  function openEdit(item: AdminRealization) {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description || "",
      image_url: item.image_url,
      tag: item.tag || "",
      sort_order: item.sort_order,
      status: item.status === "draft" ? "draft" : "published",
    });
    setShowForm(true);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await adminApi.updateRealization(editing.id, form);
      } else {
        await adminApi.createRealization(form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cette réalisation ?")) return;
    await adminApi.deleteRealization(id);
    load();
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Réalisations</h1>
          <p className="text-sm text-brand-black/60">Portfolio affiché sur le site</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white"
        >
          Ajouter
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 max-w-2xl space-y-3 rounded-2xl bg-white p-6 shadow-sm"
        >
          <h2 className="font-bold">{editing ? "Modifier" : "Nouvelle réalisation"}</h2>
          {(
            [
              ["title", "Titre"],
              ["tag", "Tag"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="text-brand-black/60">{label}</span>
              <input
                required={key === "title"}
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </label>
          ))}
          {editing ? (
            <EntityMediaPanel type="realizations" entityId={editing.id} title="Photos réalisation" />
          ) : (
            <p className="text-xs text-brand-black/50">
              Enregistre d’abord la réalisation, puis ajoute plusieurs photos.
            </p>
          )}
          <label className="block text-sm">
            <span className="text-brand-black/60">URL image (optionnel / legacy)</span>
            <input
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
            />
          </label>          <label className="block text-sm">
            <span className="text-brand-black/60">Description</span>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <div className="flex gap-3">
            <label className="block text-sm">
              <span className="text-brand-black/60">Ordre</span>
              <input
                type="number"
                className="mt-1 w-24 rounded-xl border border-brand-black/10 px-3 py-2"
                value={form.sort_order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-brand-black/60">Statut</span>
              <select
                className="mt-1 rounded-xl border border-brand-black/10 px-3 py-2"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as "draft" | "published",
                  }))
                }
              >
                <option value="published">Publié</option>
                <option value="draft">Brouillon</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="rounded-full bg-brand-orange px-5 py-2 text-sm font-semibold text-white"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border px-5 py-2 text-sm"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && <p className="text-brand-black/50">Chargement…</p>}
        {!loading && items.length === 0 && (
          <p className="text-brand-black/50">Aucune réalisation.</p>
        )}
        {items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="relative aspect-[4/3]">
              <Image
                src={imageUrl(item.image_url)}
                alt={item.title}
                fill
                className="object-cover"
                sizes="33vw"
              />
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold text-brand-orange">{item.tag}</p>
              <h3 className="font-bold text-brand-black">{item.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-brand-black/60">
                {item.description}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="rounded-full bg-brand-black px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Éditer
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
