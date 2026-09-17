"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import { imageUrl, type SiteSettings } from "@/lib/api";

const empty: SiteSettings = {
  brand: { name: "DK MEUBLE", logo_url: "" },
  contact: {
    whatsapp: "",
    phone_display: "",
    phone_tel: "",
    phones: "",
    email: "",
    address: "",
    hours: "",
    maps_embed: "",
  },
  socials: { facebook: "", instagram: "", tiktok: "", youtube: "" },
  footer: { trust: ["", "", ""] },
  seo: { title: "", description: "" },
};

function normalizeForm(data: Partial<SiteSettings> | SiteSettings): SiteSettings {
  return {
    brand: {
      name: String(data.brand?.name ?? empty.brand.name),
      logo_url: String(data.brand?.logo_url ?? empty.brand.logo_url),
    },
    contact: { ...empty.contact, ...data.contact },
    socials: { ...empty.socials, ...data.socials },
    footer: {
      trust: [
        data.footer?.trust?.[0] || "",
        data.footer?.trust?.[1] || "",
        data.footer?.trust?.[2] || "",
      ],
    },
    seo: { ...empty.seo, ...data.seo },
  };
}

export default function AdminParametresPage() {
  const [form, setForm] = useState<SiteSettings>(empty);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminApi
      .getSettings()
      .then((data) => {
        setForm(normalizeForm(data));
        setLoaded(true);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!loaded) {
      setError("Impossible d’enregistrer : les paramètres n’ont pas pu être chargés.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const saved = await adminApi.updateSettings(form);
      setForm(normalizeForm(saved));
      setMessage("Paramètres enregistrés. Le site se met à jour automatiquement sous ~15 s.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function onLogoPicked(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const saved = await adminApi.uploadLogo(file);
      setForm(normalizeForm(saved));
      setMessage("Logo mis à jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function clearLogo() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const next: SiteSettings = {
        ...form,
        brand: { name: form.brand.name, logo_url: "" },
      };
      const saved = await adminApi.updateSettings(next);
      setForm(normalizeForm(saved));
      setMessage("Logo retiré — icône par défaut rétablie.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-brand-black/50">Chargement…</div>;
  }

  const logoPreview = form.brand.logo_url ? imageUrl(form.brand.logo_url) : "";

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-brand-black">Paramètres</h1>
      <p className="mt-1 text-sm text-brand-black/60">
        Logo, téléphone, WhatsApp, email et réseaux sociaux affichés sur le site. Laissez vide un
        champ pour ne pas l’afficher.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-3xl space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-black">Identité / Logo</h2>
          <p className="mt-1 text-xs text-brand-black/50">
            Visible dans le header. Sans image, l’icône maison orange est utilisée.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-black">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-brand-orange" fill="currentColor">
                  <path d="M12 3 3 10h2v9h5v-5h4v5h5v-9h2L12 3Z" />
                </svg>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onLogoPicked(e.target.files?.[0])}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {uploading ? "Upload…" : "Uploader une image"}
              </button>
              {form.brand.logo_url && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={clearLogo}
                  className="rounded-full border border-brand-black/15 px-4 py-2 text-sm font-semibold"
                >
                  Retirer le logo
                </button>
              )}
            </div>
          </div>

          <label className="mt-4 block text-sm">
            <span className="text-brand-black/60">Nom affiché (ex. DK MEUBLE)</span>
            <input
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.brand.name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  brand: { name: e.target.value, logo_url: f.brand.logo_url },
                }))
              }
            />
          </label>

          <label className="mt-3 block text-sm">
            <span className="text-brand-black/60">
              Ou URL du logo (https://… ou chemin storage)
            </span>
            <input
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              placeholder="https://… ou brand/logo.png"
              value={form.brand.logo_url}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  brand: { name: f.brand.name, logo_url: e.target.value },
                }))
              }
            />
          </label>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-black">Contact</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["whatsapp", "WhatsApp (ex. 22177…)"],
                ["phone_display", "Téléphone affiché (principal)"],
                ["phone_tel", "Téléphone (lien tel:)"],
                ["email", "Email"],
                ["address", "Adresse"],
                ["hours", "Horaires"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-sm">
                <span className="text-brand-black/60">{label}</span>
                <input
                  className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                  value={form.contact[key]}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      contact: { ...f.contact, [key]: e.target.value },
                    }))
                  }
                />
              </label>
            ))}
            <label className="block text-sm sm:col-span-2">
              <span className="text-brand-black/60">
                Numéros au clic sur l’icône appel (un par ligne)
              </span>
              <textarea
                rows={4}
                placeholder={"775666232\n774091928"}
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2 font-mono text-sm"
                value={form.contact.phones || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    contact: { ...f.contact, phones: e.target.value },
                  }))
                }
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-brand-black/60">URL embed Google Maps</span>
              <input
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                placeholder="https://www.google.com/maps/embed?pb=..."
                value={form.contact.maps_embed}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    contact: { ...f.contact, maps_embed: e.target.value },
                  }))
                }
              />
              <p className="mt-1 text-xs text-brand-black/45">
                Sur Google Maps : Partager → Intégrer une carte → copier l’URL du{" "}
                <code className="rounded bg-black/5 px-1">src</code> (ou tout le code iframe).
                Ne collez pas simplement www.google.com — Google bloque l’affichage dans une iframe.
              </p>
            </label>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-black">Réseaux sociaux</h2>
          <p className="mt-1 text-xs text-brand-black/50">
            Collez l’URL complète, ex. https://facebook.com/dkmeuble
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["facebook", "Facebook", "https://facebook.com/..."],
                ["instagram", "Instagram", "https://instagram.com/..."],
                ["tiktok", "TikTok", "https://tiktok.com/@..."],
                ["youtube", "YouTube", "https://youtube.com/@..."],
              ] as const
            ).map(([key, label, placeholder]) => (
              <label key={key} className="block text-sm">
                <span className="text-brand-black/60">{label}</span>
                <input
                  className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                  placeholder={placeholder}
                  value={form.socials[key]}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      socials: { ...f.socials, [key]: e.target.value },
                    }))
                  }
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-black">Bandeau footer</h2>
          <div className="mt-4 grid gap-3">
            {form.footer.trust.map((t, i) => (
              <label key={i} className="block text-sm">
                <span className="text-brand-black/60">Libellé {i + 1}</span>
                <input
                  className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                  value={t}
                  onChange={(e) => {
                    const trust = [...form.footer.trust];
                    trust[i] = e.target.value;
                    setForm((f) => ({ ...f, footer: { trust } }));
                  }}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-black">SEO</h2>
          <label className="mt-4 block text-sm">
            <span className="text-brand-black/60">Titre par défaut</span>
            <input
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.seo.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, seo: { ...f.seo, title: e.target.value } }))
              }
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-brand-black/60">Description</span>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
              value={form.seo.description}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  seo: { ...f.seo, description: e.target.value },
                }))
              }
            />
          </label>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <button
          type="submit"
          disabled={saving || !loaded}
          className="rounded-full bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
