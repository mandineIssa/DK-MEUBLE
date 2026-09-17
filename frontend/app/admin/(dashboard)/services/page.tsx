"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, type AdminService } from "@/lib/adminApi";
import { SERVICE_ICON_KEYS, SERVICE_ICON_LABELS } from "@/components/services/ServiceCard";
import EntityMediaPanel from "@/components/admin/EntityMediaPanel";

const ICONS = [...SERVICE_ICON_KEYS, "ac", "desk"] as string[];

export default function AdminServicesPage() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [editing, setEditing] = useState<AdminService | null>(null);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAdminServices();
      setServices(data.services || []);
      setSettings(data.settings || {});
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setErr("");
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get("title") || ""),
      slug: String(form.get("slug") || "") || undefined,
      icon: String(form.get("icon") || "") || null,
      short_description: String(form.get("short_description") || ""),
      full_content: String(form.get("full_content") || ""),
      cta_label: String(form.get("cta_label") || "") || null,
      cta_link: String(form.get("cta_link") || "") || null,
      meta_title: String(form.get("meta_title") || "") || null,
      meta_description: String(form.get("meta_description") || "") || null,
      is_active: form.get("is_active") === "on",
      is_featured: form.get("is_featured") === "on",
    };
    try {
      if (editing) {
        await adminApi.updateService(editing.id, payload);
        setMsg("Service mis à jour.");
      } else {
        await adminApi.createService(payload);
        setMsg("Service créé.");
      }
      setEditing(null);
      setCreating(false);
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur");
    }
  }

  async function saveSettings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await adminApi.updateServiceSettings({
        intro_title: String(form.get("intro_title") || ""),
        intro_text: String(form.get("intro_text") || ""),
        request_form_enabled: form.get("request_form_enabled") === "on",
        home_featured_limit: Number(form.get("home_featured_limit") || 4),
      });
      setMsg("Paramètres enregistrés.");
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur");
    }
  }

  if (loading) return <p className="p-6 text-sm text-brand-black/60">Chargement…</p>;

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Services</h1>
          <p className="text-sm text-brand-black/60">Prestations vitrine (distinctes de À propos).</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/services/demandes"
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold"
          >
            Demandes
          </Link>
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setEditing(null);
            }}
            className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white"
          >
            + Ajouter
          </button>
        </div>
      </div>

      {msg ? <p className="mb-3 text-sm text-green-700">{msg}</p> : null}
      {err ? <p className="mb-3 text-sm text-red-600">{err}</p> : null}

      <form onSubmit={saveSettings} className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bold">Paramètres de la page</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            name="intro_title"
            defaultValue={String(settings.intro_title || "")}
            placeholder="Titre d'intro"
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            name="home_featured_limit"
            type="number"
            min={0}
            max={12}
            defaultValue={Number(settings.home_featured_limit ?? 4)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <textarea
            name="intro_text"
            defaultValue={String(settings.intro_text || "")}
            placeholder="Texte d'introduction"
            className="min-h-[70px] rounded-lg border px-3 py-2 text-sm md:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              name="request_form_enabled"
              type="checkbox"
              defaultChecked={settings.request_form_enabled !== false}
            />
            Formulaire de demande actif sur les pages détail
          </label>
        </div>
        <button type="submit" className="mt-3 rounded-full bg-brand-black px-4 py-2 text-sm font-semibold text-white">
          Enregistrer les paramètres
        </button>
      </form>

      {(creating || editing) && (
        <form onSubmit={saveForm} className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-bold">{editing ? "Modifier le service" : "Nouveau service"}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              name="title"
              required
              defaultValue={editing?.title || ""}
              placeholder="Titre"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              name="slug"
              defaultValue={editing?.slug || ""}
              placeholder="Slug (auto si vide)"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <select name="icon" defaultValue={editing?.icon || "delivery"} className="rounded-lg border px-3 py-2 text-sm">
              {ICONS.map((icon) => (
                <option key={icon} value={icon}>
                  {SERVICE_ICON_LABELS[icon] || icon}
                </option>
              ))}
            </select>
            <input
              name="cta_label"
              defaultValue={editing?.cta_label || "Voir plus"}
              placeholder="Label bouton"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              name="cta_link"
              defaultValue={editing?.cta_link || ""}
              placeholder="Lien CTA (optionnel)"
              className="rounded-lg border px-3 py-2 text-sm md:col-span-2"
            />
            <textarea
              name="short_description"
              defaultValue={editing?.short_description || ""}
              placeholder="Description courte (face hover)"
              className="min-h-[70px] rounded-lg border px-3 py-2 text-sm md:col-span-2"
            />
            <textarea
              name="full_content"
              defaultValue={editing?.full_content || ""}
              placeholder="Contenu HTML de la page détail"
              className="min-h-[140px] rounded-lg border px-3 py-2 text-sm md:col-span-2"
            />
            <input
              name="meta_title"
              defaultValue={editing?.meta_title || ""}
              placeholder="Meta title SEO"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              name="meta_description"
              defaultValue={editing?.meta_description || ""}
              placeholder="Meta description SEO"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input name="is_active" type="checkbox" defaultChecked={editing?.is_active ?? true} />
              Actif
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input name="is_featured" type="checkbox" defaultChecked={editing?.is_featured ?? false} />
              Mis en avant
            </label>
          </div>
          {editing ? (
            <div className="mt-3">
              <EntityMediaPanel type="services" entityId={editing.id} title="Photos service" />
            </div>
          ) : (
            <p className="mt-3 text-xs text-brand-black/50">
              Après création, tu pourras ajouter plusieurs photos.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button type="submit" className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white">
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
              className="rounded-full border px-4 py-2 text-sm"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {services.map((service) => (
          <div key={service.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <div>
              <p className="font-bold text-brand-black">{service.title}</p>
              <p className="text-xs text-brand-black/50">
                /services/{service.slug} · {service.icon || "—"} ·{" "}
                {service.is_active ? "actif" : "inactif"}
                {service.requests_count != null ? ` · ${service.requests_count} demandes` : ""}
              </p>
              <p className="mt-1 line-clamp-1 text-sm text-brand-black/65">{service.short_description}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(service);
                  setCreating(false);
                }}
                className="rounded-full bg-brand-black px-3 py-1.5 text-xs font-semibold text-white"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm("Supprimer ce service ?")) return;
                  await adminApi.deleteService(service.id);
                  await load();
                }}
                className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
