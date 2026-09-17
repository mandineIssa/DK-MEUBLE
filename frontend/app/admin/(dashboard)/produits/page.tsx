"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import Image from "next/image";
import { adminApi, AdminProduct } from "@/lib/adminApi";
import { api, Category, imageUrl } from "@/lib/api";
import AdminMultiImageGallery, { type GalleryImage } from "@/components/admin/AdminMultiImageGallery";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [error, setError] = useState("");
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try {
      const [prods, catsRes, brandsList] = await Promise.all([
        adminApi.getProducts({ per_page: 100 }),
        adminApi.getCategories().catch(() => null),
        adminApi.getBrands().catch(() => []),
      ]);
      setProducts(prods);
      setBrands(brandsList);
      const flat =
        catsRes?.flat ||
        (await api
          .getCategories()
          .then((r) => {
            const out: Category[] = [];
            const walk = (nodes: Category[]) => {
              nodes.forEach((n) => {
                out.push(n);
                if (n.children) walk(n.children);
              });
            };
            walk(r.tree || []);
            return out;
          })
          .catch(() => [] as Category[]));
      setCategories(flat);
      return prods;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
      return [] as AdminProduct[];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setPendingFiles([]);
    setShowForm(true);
    setError("");
  }

  function openEdit(p: AdminProduct) {
    setEditing(p);
    setPendingFiles([]);
    setShowForm(true);
    setError("");
  }

  function galleryImages(p: AdminProduct | null): GalleryImage[] {
    return (p?.images || []).map((img) => ({
      id: img.id,
      path: img.path,
      role: img.role,
      label: img.label,
      order: img.order,
    }));
  }

  async function refreshEditing(productId: number) {
    const list = await load();
    const fresh = list.find((x) => x.id === productId) || null;
    if (fresh) setEditing(fresh);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const categoryId = Number(form.get("category_id"));

    if (!name || !categoryId) {
      setError("Le nom et la catégorie sont obligatoires.");
      return;
    }

    const payload = {
      category_id: categoryId,
      brand_id: form.get("brand_id") ? Number(form.get("brand_id")) : null,
      name,
      sku: String(form.get("sku") || "") || null,
      description: String(form.get("description") || ""),
      short_description: String(form.get("short_description") || "") || null,
      price: form.get("price") ? Number(form.get("price")) : null,
      promo_price: form.get("promo_price") ? Number(form.get("promo_price")) : null,
      stock_quantity:
        form.get("stock_quantity") !== "" && form.get("stock_quantity") != null
          ? Number(form.get("stock_quantity"))
          : null,
      condition: (form.get("condition") as string) || "neuf",
      is_clearance: form.get("is_clearance") === "on",
      is_customizable: form.get("is_customizable") === "on",
      status: (form.get("status") as "draft" | "published" | "archived") || "published",
    };

    setSaving(true);
    try {
      if (editing) {
        await adminApi.updateProduct(editing.id, payload);
        setShowForm(false);
        setEditing(null);
        await load();
      } else {
        const created = await adminApi.createProduct(payload);
        if (pendingFiles.length > 0) {
          await adminApi.uploadProductImage(created.id, pendingFiles, { role: "cover" });
          setPendingFiles([]);
        }
        setShowForm(false);
        setEditing(null);
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce produit ?")) return;
    await adminApi.deleteProduct(id);
    if (editing?.id === id) {
      setShowForm(false);
      setEditing(null);
    }
    load();
  }

  async function handleImageChange(productId: number, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(productId);
    setError("");
    try {
      await adminApi.uploadProductImage(productId, file);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload.");
    } finally {
      setUploadingId(null);
      e.target.value = "";
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Produits</h1>
          <p className="text-sm text-brand-black/60">Catalogue publié sur le site</p>
        </div>
        <button
          onClick={() =>
            showForm
              ? (setShowForm(false), setEditing(null), setPendingFiles([]))
              : openCreate()
          }
          className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-orange-dark"
        >
          {showForm ? "Annuler" : "＋ Ajouter un produit"}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 rounded-2xl border border-brand-black/10 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-brand-black">Import / Export CSV</h2>
        <p className="mt-1 text-sm text-brand-black/55">
          Télécharge le template complet, remplis-le (Excel ou Google Sheets), puis uploade-le ici.
          Séparateur <strong>;</strong> · colonnes clés : <code>name</code>,{" "}
          <code>category_slug</code>. Mise à jour si le <code>slug</code> existe déjà.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white"
            onClick={() =>
              adminApi
                .downloadProductsCsv("template")
                .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
            }
          >
            Télécharger le template
          </button>
          <button
            type="button"
            className="rounded-full border border-brand-black/20 bg-white px-4 py-2 text-sm font-bold"
            onClick={() =>
              adminApi
                .downloadProductsCsv("export")
                .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
            }
          >
            Exporter le catalogue
          </button>
          <label className="cursor-pointer rounded-full bg-brand-black px-4 py-2 text-sm font-bold text-white">
            {importBusy ? "Import en cours…" : "Uploader un CSV"}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={importBusy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setImportBusy(true);
                setImportMsg("");
                setImportErrors([]);
                setError("");
                try {
                  const res = await adminApi.importProductsCsv(file);
                  setImportMsg(res.message);
                  setImportErrors(res.errors || []);
                  await load();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Échec import");
                } finally {
                  setImportBusy(false);
                }
              }}
            />
          </label>
        </div>
        {importMsg ? <p className="mt-3 text-sm font-medium text-whatsapp">{importMsg}</p> : null}
        {importErrors.length > 0 ? (
          <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-xs text-red-600">
            {importErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        ) : null}
        <details className="mt-4 text-xs text-brand-black/60">
          <summary className="cursor-pointer font-semibold text-brand-black/80">
            Colonnes du template
          </summary>
          <p className="mt-2 leading-relaxed">
            sku, name*, slug, category_slug*, brand_slug, short_description, description, price,
            promo_price, stock_quantity, condition (neuf|reconditionne), is_clearance (0/1),
            is_customizable (0/1), status (draft|published|archived), meta_title, meta_description,
            image_urls (URLs séparées par | )
          </p>
        </details>
      </div>

      {showForm && (
        <form
          key={editing?.id || "new"}
          onSubmit={handleSubmit}
          className="mt-6 grid max-w-2xl gap-4 rounded-2xl bg-white p-6 shadow-sm"
        >
          <h2 className="font-bold text-brand-black">
            {editing ? "Modifier le produit" : "Nouveau produit"}
          </h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black/70">Catégorie</label>
            <select
              name="category_id"
              required
              className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
              defaultValue={editing?.category_id || ""}
            >
              <option value="" disabled>
                Choisir…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black/70">Marque</label>
            <select
              name="brand_id"
              className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
              defaultValue={editing?.brand_id || ""}
            >
              <option value="">— Aucune —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black/70">SKU</label>
            <input
              name="sku"
              defaultValue={editing?.sku || ""}
              className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black/70">Nom</label>
            <input
              name="name"
              required
              defaultValue={editing?.name || ""}
              className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black/70">Résumé</label>
            <input
              name="short_description"
              defaultValue={editing?.short_description || ""}
              className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black/70">Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={editing?.description || ""}
              className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-black/70">
                Prix (vide = sur devis)
              </label>
              <input
                name="price"
                type="number"
                defaultValue={editing?.price ?? ""}
                className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-black/70">Prix promo</label>
              <input
                name="promo_price"
                type="number"
                defaultValue={editing?.promo_price ?? ""}
                className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-black/70">Stock</label>
              <input
                name="stock_quantity"
                type="number"
                defaultValue={editing?.stock_quantity ?? ""}
                className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-black/70">État</label>
              <select
                name="condition"
                defaultValue={editing?.condition || "neuf"}
                className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
              >
                <option value="neuf">Neuf</option>
                <option value="reconditionne">Reconditionné</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black/70">Statut</label>
            <select
              name="status"
              defaultValue={editing?.status || "published"}
              className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
            >
              <option value="published">Publié</option>
              <option value="draft">Brouillon</option>
              <option value="archived">Archivé</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-brand-black/70">
            <input type="checkbox" name="is_clearance" defaultChecked={editing?.is_clearance} />{" "}
            Déstockage
          </label>
          <label className="flex items-center gap-2 text-sm text-brand-black/70">
            <input
              type="checkbox"
              name="is_customizable"
              defaultChecked={editing?.is_customizable}
            />{" "}
            Produit personnalisable
          </label>

          <div className="border-t border-black/5 pt-4">
            {editing ? (
              <AdminMultiImageGallery
                title="Photos du produit"
                hint="Ajoute plusieurs photos (devant, arrière, détail…). La première sert de couverture sur le site."
                images={galleryImages(editing)}
                uploading={galleryUploading}
                onUpload={async (files, meta) => {
                  setGalleryUploading(true);
                  setError("");
                  try {
                    await adminApi.uploadProductImage(editing.id, files, meta);
                    await refreshEditing(editing.id);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Échec upload photo");
                  } finally {
                    setGalleryUploading(false);
                  }
                }}
                onUpdate={async (id, data) => {
                  await adminApi.updateProductImage(editing.id, id, data);
                  await refreshEditing(editing.id);
                }}
                onDelete={async (id) => {
                  await adminApi.deleteProductImage(editing.id, id);
                  await refreshEditing(editing.id);
                }}
                onReorder={async (order) => {
                  await adminApi.reorderProductImages(editing.id, order);
                  await refreshEditing(editing.id);
                }}
              />
            ) : (
              <div className="rounded-xl border border-black/10 bg-[#fafafa] p-3">
                <p className="text-sm font-bold text-brand-black">Photos du produit</p>
                <p className="mt-1 text-xs text-brand-black/50">
                  Sélectionne une ou plusieurs images ; elles seront uploadées à l’enregistrement.
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="mt-3 block w-full text-sm"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setPendingFiles((prev) => [...prev, ...files]);
                    e.target.value = "";
                  }}
                />
                {pendingFiles.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-xs text-brand-black/70">
                    {pendingFiles.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2">
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          className="shrink-0 font-semibold text-red-600"
                          onClick={() =>
                            setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))
                          }
                        >
                          Retirer
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || galleryUploading}
            className="w-fit rounded-full bg-brand-black px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-black text-white">
            <tr>
              <th className="px-4 py-3 font-semibold">Photo</th>
              <th className="px-4 py-3 font-semibold">Nom</th>
              <th className="px-4 py-3 font-semibold">Prix</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-4 py-6 text-brand-black/50" colSpan={5}>
                  Chargement...
                </td>
              </tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-brand-black/50" colSpan={5}>
                  Aucun produit pour le moment.
                </td>
              </tr>
            )}
            {products.map((p) => {
              const cover = p.images?.[0];
              return (
                <tr key={p.id} className="border-t border-black/5">
                  <td className="px-4 py-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-[#eee]">
                      {cover ? (
                        <Image
                          src={imageUrl(cover.path)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-[10px] text-brand-black/40">
                          —
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-black">{p.name}</td>
                  <td className="px-4 py-3 font-semibold text-brand-orange">
                    {p.price ? `${p.price.toLocaleString("fr-FR")} FCFA` : "Sur devis"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        p.status === "published"
                          ? "bg-whatsapp/15 text-whatsapp"
                          : "bg-brand-black/10 text-brand-black/60"
                      }`}
                    >
                      {p.status === "published" ? "Publié" : "Brouillon"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="text-sm font-semibold text-brand-orange hover:underline"
                      >
                        Éditer
                      </button>
                      <label className="cursor-pointer text-sm font-semibold text-[#2B7CFF] hover:underline">
                        {uploadingId === p.id ? "Upload…" : "＋ Photo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={uploadingId === p.id}
                          onChange={(e) => handleImageChange(p.id, e)}
                        />
                      </label>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
