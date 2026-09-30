"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/adminApi";
import { imageUrl, type SiteSettings } from "@/lib/api";

const defaultProductPage: NonNullable<SiteSettings["product_page"]> = {
  show_delivery: true,
  delivery_title: "Livraison estimée",
  delivery_line_1: "Dakar : 24–48 h · 5 000 FCFA",
  delivery_line_2: "Autres régions : 3–7 jours · 8 000 FCFA",
  delivery_link_label: "Voir la livraison",
  delivery_is_example: true,
  show_installation: true,
  installation_title: "Installation disponible",
  installation_text: "Pose et mise en service sur demande.",
  installation_link_label: "Voir les services",
  show_installment: true,
  installment_title: "Paiement échelonné",
  installment_text: "À partir de 20 000 FCFA / mois",
  installment_link_label: "Voir les conditions",
  installment_is_example: true,
  show_share: true,
  share_title: "Partager",
  example_discount: "",
  example_stock: "",
  reviews: [
    { name: "Awa D.", city: "Dakar", rating: 5, body: "Livraison rapide à Dakar et équipe très disponible. Je recommande." },
    { name: "Boubacar S.", city: "Thiès", rating: 5, body: "Installation soignée et conseils clairs en magasin. Service impeccable." },
    { name: "Fatou K.", city: "Mbour", rating: 4, body: "Bon accueil et suivi après la commande." },
  ],
};

const empty: SiteSettings = {
  brand: { name: "DK HOMETECH", logo_url: "" },
  contact: {
    whatsapp: "",
    phone_display: "",
    phone_tel: "",
    phones: "",
    email: "",
    address: "",
    hours: "",
    maps_embed: "",
    video_url: "",
    video_poster: "",
  },
  socials: { facebook: "", instagram: "", tiktok: "", youtube: "" },
  footer: { trust: ["", "", ""] },
  seo: { title: "", description: "" },
  topbar: {
    enabled: true,
    text_1: "Livraison partout au Sénégal",
    text_2: "Paiement Wave, Orange Money, espèces",
    phone_label: "Appelez-nous",
    show_phone: true,
    phone: "",
  },
  product_page: defaultProductPage,
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
    topbar: {
      enabled: data.topbar?.enabled !== false,
      text_1: String(data.topbar?.text_1 ?? empty.topbar?.text_1 ?? ""),
      text_2: String(data.topbar?.text_2 ?? empty.topbar?.text_2 ?? ""),
      phone_label: String(data.topbar?.phone_label ?? empty.topbar?.phone_label ?? ""),
      show_phone: data.topbar?.show_phone !== false,
      phone: String(data.topbar?.phone ?? ""),
    },
    product_page: {
      ...defaultProductPage,
      ...data.product_page,
      reviews: [0, 1, 2].map((i) => ({
        name: String(data.product_page?.reviews?.[i]?.name ?? defaultProductPage.reviews?.[i]?.name ?? ""),
        city: String(data.product_page?.reviews?.[i]?.city ?? defaultProductPage.reviews?.[i]?.city ?? ""),
        rating: Number(data.product_page?.reviews?.[i]?.rating ?? defaultProductPage.reviews?.[i]?.rating ?? 5),
        body: String(data.product_page?.reviews?.[i]?.body ?? defaultProductPage.reviews?.[i]?.body ?? ""),
      })),
    },
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
        Logo, téléphone, WhatsApp, e-mail et réseaux affichés sur le site. Un champ vide n’apparaît pas.
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
            <span className="text-brand-black/60">Nom affiché (ex. DK HOMETECH)</span>
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
          <h2 className="font-bold text-brand-black">Bandeau supérieur</h2>
          <p className="mt-1 text-xs text-brand-black/50">
            La barre noire tout en haut du site. Le numéro, s’il est vide, reprend le téléphone principal.
          </p>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.topbar?.enabled !== false}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  topbar: { ...f.topbar, enabled: e.target.checked },
                }))
              }
            />
            Afficher le bandeau
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-brand-black/60">Texte 1</span>
              <input
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                value={form.topbar?.text_1 || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, topbar: { ...f.topbar, text_1: e.target.value } }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-brand-black/60">Texte 2</span>
              <input
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                value={form.topbar?.text_2 || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, topbar: { ...f.topbar, text_2: e.target.value } }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-brand-black/60">Libellé du téléphone</span>
              <input
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                value={form.topbar?.phone_label || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, topbar: { ...f.topbar, phone_label: e.target.value } }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-brand-black/60">Téléphone du bandeau</span>
              <input
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                placeholder="783133828"
                value={form.topbar?.phone || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, topbar: { ...f.topbar, phone: e.target.value } }))
                }
              />
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.topbar?.show_phone !== false}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  topbar: { ...f.topbar, show_phone: e.target.checked },
                }))
              }
            />
            Afficher le téléphone
          </label>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-black">Fiche produit</h2>
          <p className="mt-1 text-xs text-brand-black/50">
            Livraison, installation et paiement concernent les services du magasin. Les caractéristiques affichées viennent de chaque produit. Laissez un texte vide pour le masquer.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["delivery_title", "Titre livraison"],
                ["delivery_line_1", "Livraison, ligne 1"],
                ["delivery_line_2", "Livraison, ligne 2"],
                ["delivery_link_label", "Lien livraison"],
                ["installation_title", "Titre installation"],
                ["installation_text", "Texte installation"],
                ["installation_link_label", "Lien installation"],
                ["installment_title", "Titre paiement échelonné"],
                ["installment_text", "Texte paiement échelonné"],
                ["installment_link_label", "Lien paiement"],
                ["share_title", "Titre partage"],
                ["example_discount", "Badge réduction d’exemple"],
                ["example_stock", "Badge stock d’exemple"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-sm">
                <span className="text-brand-black/60">{label}</span>
                <input
                  className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                  value={String(form.product_page?.[key] ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      product_page: { ...f.product_page, [key]: e.target.value },
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            {(
              [
                ["show_delivery", "Afficher la livraison"],
                ["delivery_is_example", "Marquer la livraison comme exemple"],
                ["show_installation", "Afficher l’installation"],
                ["show_installment", "Afficher le paiement échelonné"],
                ["installment_is_example", "Marquer le paiement comme exemple"],
                ["show_share", "Afficher le partage"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.product_page?.[key] !== false}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      product_page: { ...f.product_page, [key]: e.target.checked },
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            <p className="text-sm font-semibold text-brand-black">Avis sur les services</p>
            {(form.product_page?.reviews || []).map((review, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-black/5 p-3 sm:grid-cols-4">
                <input
                  className="rounded-xl border border-brand-black/10 px-3 py-2 text-sm"
                  placeholder="Prénom"
                  value={review.name || ""}
                  onChange={(e) =>
                    setForm((f) => {
                      const reviews = [...(f.product_page?.reviews || [])];
                      reviews[index] = { ...reviews[index], name: e.target.value };
                      return { ...f, product_page: { ...f.product_page, reviews } };
                    })
                  }
                />
                <input
                  className="rounded-xl border border-brand-black/10 px-3 py-2 text-sm"
                  placeholder="Ville"
                  value={review.city || ""}
                  onChange={(e) =>
                    setForm((f) => {
                      const reviews = [...(f.product_page?.reviews || [])];
                      reviews[index] = { ...reviews[index], city: e.target.value };
                      return { ...f, product_page: { ...f.product_page, reviews } };
                    })
                  }
                />
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="rounded-xl border border-brand-black/10 px-3 py-2 text-sm"
                  value={review.rating ?? 5}
                  onChange={(e) =>
                    setForm((f) => {
                      const reviews = [...(f.product_page?.reviews || [])];
                      reviews[index] = { ...reviews[index], rating: Number(e.target.value) };
                      return { ...f, product_page: { ...f.product_page, reviews } };
                    })
                  }
                />
                <input
                  className="rounded-xl border border-brand-black/10 px-3 py-2 text-sm sm:col-span-4"
                  placeholder="Commentaire"
                  value={review.body || ""}
                  onChange={(e) =>
                    setForm((f) => {
                      const reviews = [...(f.product_page?.reviews || [])];
                      reviews[index] = { ...reviews[index], body: e.target.value };
                      return { ...f, product_page: { ...f.product_page, reviews } };
                    })
                  }
                />
              </div>
            ))}
          </div>
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
            <label className="block text-sm sm:col-span-2">
              <span className="text-brand-black/60">Lien de la vidéo du magasin</span>
              <input
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                placeholder="https://www.youtube.com/watch?v=... ou https://.../visite.mp4"
                value={form.contact.video_url || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    contact: { ...f.contact, video_url: e.target.value },
                  }))
                }
              />
              <p className="mt-1 text-xs text-brand-black/45">
                YouTube, Facebook ou fichier .mp4. Si ce champ est vide, la vidéo du magasin déjà sur le site est affichée.
              </p>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-brand-black/60">Image d’attente de la vidéo</span>
              <input
                className="mt-1 w-full rounded-xl border border-brand-black/10 px-3 py-2"
                placeholder="/contact-visite-dk-hometech.png"
                value={form.contact.video_poster || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    contact: { ...f.contact, video_poster: e.target.value },
                  }))
                }
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-black">Réseaux sociaux</h2>
          <p className="mt-1 text-xs text-brand-black/50">
            Collez l’URL complète, ex. https://facebook.com/dkhometech
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

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-black">Assistant et fournisseur IA</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Le modèle, l’adresse du fournisseur, le délai, les tentatives, l’affichage de l’assistant et les consignes du magasin se règlent dans Intelligence.
            La clé API reste uniquement dans le fichier .env du serveur (AI_API_KEY). Elle n’est pas saisie ici.
          </p>
          <p className="mt-3 text-sm text-brand-black/70">
            Sur une fiche produit : « Générer la description avec l'assistant » propose un texte à relire, et « Retirer le fond » ajoute une image sans remplacer l’originale.
          </p>
          <Link href="/admin/intelligence" className="mt-4 inline-block text-sm font-semibold text-brand-orange">
            Ouvrir les réglages Intelligence
          </Link>
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
