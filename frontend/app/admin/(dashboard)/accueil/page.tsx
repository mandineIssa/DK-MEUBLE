"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminApi,
  type AdminHomepageItem,
  type AdminHomepagePayload,
  type AdminHomepageSection,
  type AdminHomepageSlide,
  type AdminProduct,
} from "@/lib/adminApi";
import type { Category } from "@/lib/api";

type Tab = "sections" | "slides" | "items" | "settings";

const TYPE_LABELS: Record<string, string> = {
  hero: "Hero / Slider",
  trust_badges: "Réassurance",
  category_grid: "Grille catégories",
  product_carousel: "Carrousel produits",
  brands: "Marques",
  newsletter: "Newsletter",
  socials: "Réseaux sociaux",
};

export default function AdminHomepagePage() {
  const [tab, setTab] = useState<Tab>("sections");
  const [data, setData] = useState<AdminHomepagePayload | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const [home, cats, prods] = await Promise.all([
        adminApi.getHomepage(),
        adminApi.getCategories(),
        adminApi.getProducts({ light: true, all: true }),
      ]);
      setData(home);
      setCategories(cats.tree || cats.flat || []);
      setProducts(prods);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveSettings(partial: Record<string, unknown>) {
    setMsg("");
    setErr("");
    try {
      await adminApi.updateHomepageSettings(partial);
      setMsg("Réglages enregistrés.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    }
  }

  if (loading && !data) {
    return <div className="p-6 text-sm text-brand-black/60">Chargement…</div>;
  }

  if (!data) {
    return <div className="p-6 text-sm text-red-600">{err || "Impossible de charger la page d'accueil."}</div>;
  }

  const sections = [...data.sections].sort((a, b) => a.display_order - b.display_order);
  const hero = sections.find((s) => s.type === "hero");
  const trust = sections.find((s) => s.type === "trust_badges");
  const grid = sections.find((s) => s.type === "category_grid");
  const flatCats = flattenCategories(categories);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-brand-black">Page d&apos;accueil</h1>
        <p className="mt-1 text-sm text-brand-black/60">
          Pilotez hero, réassurance, catégories, carrousels, newsletter, footer et WhatsApp.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["sections", "Sections"],
            ["slides", "Slides hero"],
            ["items", "Trust & catégories"],
            ["settings", "Réglages"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === key ? "bg-brand-orange text-white" : "bg-white text-brand-black"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {msg ? <p className="mb-3 text-sm text-green-700">{msg}</p> : null}
      {err ? <p className="mb-3 text-sm text-red-600">{err}</p> : null}

      {tab === "sections" ? (
        <SectionsPanel
          sections={sections}
          flatCats={flatCats}
          products={products}
          onReload={load}
          setMsg={setMsg}
          setErr={setErr}
        />
      ) : null}

      {tab === "slides" ? (
        <SlidesPanel
          sectionId={hero?.id}
          slides={hero?.slides || []}
          onReload={load}
          setMsg={setMsg}
          setErr={setErr}
        />
      ) : null}

      {tab === "items" ? (
        <ItemsPanel
          trust={trust}
          grid={grid}
          flatCats={flatCats}
          onReload={load}
          setMsg={setMsg}
          setErr={setErr}
        />
      ) : null}

      {tab === "settings" ? (
        <SettingsPanel data={data} onSave={saveSettings} />
      ) : null}
    </div>
  );
}

function flattenCategories(cats: Category[]): Category[] {
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

function SectionsPanel({
  sections,
  flatCats,
  products,
  onReload,
  setMsg,
  setErr,
}: {
  sections: AdminHomepageSection[];
  flatCats: Category[];
  products: AdminProduct[];
  onReload: () => Promise<void>;
  setMsg: (s: string) => void;
  setErr: (s: string) => void;
}) {
  async function toggle(section: AdminHomepageSection) {
    try {
      await adminApi.updateHomepageSection(section.id, { is_active: !section.is_active });
      setMsg("Section mise à jour.");
      await onReload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function move(id: number, dir: -1 | 1) {
    const ids = sections.map((s) => s.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    try {
      await adminApi.reorderHomepageSections(ids);
      setMsg("Ordre mis à jour.");
      await onReload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function addCarousel() {
    try {
      await adminApi.createHomepageSection({
        type: "product_carousel",
        title: "Nouvelle section produits",
        selection_mode: "recent",
        products_limit: 8,
        is_active: true,
      });
      setMsg("Section créée.");
      await onReload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function saveCarousel(section: AdminHomepageSection, form: FormData) {
    try {
      const mode = String(form.get("selection_mode") || "recent");
      const featured = String(form.get("featured_product_ids") || "")
        .split(",")
        .map((x) => parseInt(x.trim(), 10))
        .filter((n) => !Number.isNaN(n));
      await adminApi.updateHomepageSection(section.id, {
        title: String(form.get("title") || ""),
        category_id: form.get("category_id") ? Number(form.get("category_id")) : null,
        banner_link: String(form.get("banner_link") || "") || null,
        selection_mode: mode,
        products_limit: Number(form.get("products_limit") || 8),
        featured_product_ids: mode === "manual" ? featured : undefined,
      });
      setMsg("Carrousel enregistré.");
      await onReload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={addCarousel}
          className="rounded-full bg-brand-black px-4 py-2 text-sm font-semibold text-white"
        >
          + Carrousel produits
        </button>
      </div>
      {sections.map((section) => (
        <div key={section.id} className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-brand-black">
                {TYPE_LABELS[section.type] || section.type}
                {section.title ? ` — ${section.title}` : ""}
              </p>
              <p className="text-xs text-brand-black/50">Ordre {section.display_order}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => move(section.id, -1)} className="rounded-lg border px-2 py-1 text-xs">
                ↑
              </button>
              <button type="button" onClick={() => move(section.id, 1)} className="rounded-lg border px-2 py-1 text-xs">
                ↓
              </button>
              <button
                type="button"
                onClick={() => toggle(section)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  section.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                }`}
              >
                {section.is_active ? "Actif" : "Inactif"}
              </button>
              {section.type === "product_carousel" ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm("Supprimer cette section ?")) return;
                    await adminApi.deleteHomepageSection(section.id);
                    await onReload();
                  }}
                  className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                >
                  Supprimer
                </button>
              ) : null}
            </div>
          </div>

          {section.type === "product_carousel" ? (
            <form
              className="mt-4 grid gap-3 md:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault();
                await saveCarousel(section, new FormData(e.currentTarget));
              }}
            >
              <label className="text-xs font-medium">
                Titre
                <input
                  name="title"
                  defaultValue={section.title || ""}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-medium">
                Catégorie
                <select
                  name="category_id"
                  defaultValue={section.category_id || ""}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">Toutes</option>
                  {flatCats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium">
                Mode sélection
                <select
                  name="selection_mode"
                  defaultValue={section.selection_mode || "recent"}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="recent">Plus récents</option>
                  <option value="bestseller">Meilleures ventes</option>
                  <option value="on_sale">En promo</option>
                  <option value="manual">Manuel</option>
                </select>
              </label>
              <label className="text-xs font-medium">
                Nombre de produits
                <input
                  name="products_limit"
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={section.products_limit || 8}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-medium md:col-span-2">
                Lien « Voir tout »
                <input
                  name="banner_link"
                  defaultValue={section.banner_link || ""}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-medium md:col-span-2">
                IDs produits (mode manuel, séparés par des virgules)
                <input
                  name="featured_product_ids"
                  defaultValue={(section.featured_products || []).map((f) => f.product_id).join(", ")}
                  placeholder={products
                    .slice(0, 3)
                    .map((p) => p.id)
                    .join(", ")}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
              <button
                type="submit"
                className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white md:col-span-2 md:w-fit"
              >
                Enregistrer
              </button>
            </form>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SlidesPanel({
  sectionId,
  slides,
  onReload,
  setMsg,
  setErr,
}: {
  sectionId?: number;
  slides: AdminHomepageSlide[];
  onReload: () => Promise<void>;
  setMsg: (s: string) => void;
  setErr: (s: string) => void;
}) {
  const [desktop, setDesktop] = useState("");
  const [mobile, setMobile] = useState("");

  async function upload(file: File, kind: string) {
    const res = await adminApi.uploadHomepageImage(file, kind);
    return res.path;
  }

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await adminApi.createHomepageSlide({
        section_id: sectionId,
        image_desktop: desktop || String(form.get("image_desktop") || ""),
        image_mobile: mobile || null,
        title: String(form.get("title") || "") || null,
        subtitle: String(form.get("subtitle") || "") || null,
        link_url: String(form.get("link_url") || "") || null,
        start_date: String(form.get("start_date") || "") || null,
        end_date: String(form.get("end_date") || "") || null,
        is_active: true,
      });
      setMsg("Slide ajouté.");
      setDesktop("");
      setMobile("");
      e.currentTarget.reset();
      await onReload();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bold">Ajouter un slide</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-medium">
            Image desktop (fichier)
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  setDesktop(await upload(f, "desktop"));
                } catch (err) {
                  setErr(err instanceof Error ? err.message : "Upload échoué");
                }
              }}
            />
            {desktop ? <span className="text-[11px] text-green-700">OK : {desktop}</span> : null}
          </label>
          <label className="text-xs font-medium">
            Image mobile (optionnel)
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  setMobile(await upload(f, "mobile"));
                } catch (err) {
                  setErr(err instanceof Error ? err.message : "Upload échoué");
                }
              }}
            />
          </label>
          <label className="text-xs font-medium">
            Ou URL desktop
            <input name="image_desktop" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium">
            Titre
            <input name="title" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium">
            Sous-titre
            <input name="subtitle" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium">
            Lien
            <input name="link_url" placeholder="/produits" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium">
            Début affichage
            <input name="start_date" type="datetime-local" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium">
            Fin affichage
            <input name="end_date" type="datetime-local" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </label>
        </div>
        <button type="submit" className="mt-4 rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white">
          Ajouter
        </button>
      </form>

      {slides.map((slide) => (
        <div key={slide.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{slide.title || "Sans titre"}</p>
            <p className="truncate text-xs text-brand-black/50">{slide.image_desktop}</p>
            <p className="text-xs text-brand-black/50">{slide.link_url || "Pas de lien"}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                await adminApi.updateHomepageSlide(slide.id, { is_active: !slide.is_active });
                await onReload();
              }}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold"
            >
              {slide.is_active ? "Actif" : "Inactif"}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Supprimer ce slide ?")) return;
                await adminApi.deleteHomepageSlide(slide.id);
                setMsg("Slide supprimé.");
                await onReload();
              }}
              className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ItemsPanel({
  trust,
  grid,
  flatCats,
  onReload,
  setMsg,
  setErr,
}: {
  trust?: AdminHomepageSection;
  grid?: AdminHomepageSection;
  flatCats: Category[];
  onReload: () => Promise<void>;
  setMsg: (s: string) => void;
  setErr: (s: string) => void;
}) {
  async function addTrust(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!trust) return;
    const form = new FormData(e.currentTarget);
    try {
      await adminApi.createHomepageItem({
        section_id: trust.id,
        item_type: "trust",
        title: String(form.get("title") || ""),
        subtitle: String(form.get("subtitle") || ""),
        icon: String(form.get("icon") || "shield"),
        link_url: String(form.get("link_url") || "") || null,
      });
      setMsg("Badge ajouté.");
      e.currentTarget.reset();
      await onReload();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur");
    }
  }

  async function addTile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!grid) return;
    const form = new FormData(e.currentTarget);
    try {
      const catId = Number(form.get("category_id"));
      await adminApi.createHomepageItem({
        section_id: grid.id,
        item_type: "category_tile",
        category_id: catId || null,
        title: String(form.get("title") || "") || null,
        image_url: String(form.get("image_url") || "") || null,
        link_url: String(form.get("link_url") || "") || null,
      });
      setMsg("Tuile ajoutée.");
      e.currentTarget.reset();
      await onReload();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bold">Trust badges</h2>
        <ul className="mb-4 space-y-2">
          {(trust?.items || []).map((item: AdminHomepageItem) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {item.title} — {item.subtitle}
              </span>
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={async () => {
                  await adminApi.deleteHomepageItem(item.id);
                  await onReload();
                }}
              >
                Suppr.
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={addTrust} className="grid gap-2">
          <input name="title" placeholder="Titre" required className="rounded-lg border px-3 py-2 text-sm" />
          <input name="subtitle" placeholder="Sous-texte" className="rounded-lg border px-3 py-2 text-sm" />
          <select name="icon" className="rounded-lg border px-3 py-2 text-sm">
            <option value="truck">truck</option>
            <option value="shield">shield</option>
            <option value="headset">headset</option>
            <option value="lock">lock</option>
          </select>
          <input name="link_url" placeholder="Lien optionnel" className="rounded-lg border px-3 py-2 text-sm" />
          <button type="submit" className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white">
            Ajouter badge
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bold">Grille catégories</h2>
        <ul className="mb-4 space-y-2">
          {(grid?.items || []).map((item: AdminHomepageItem) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{item.title || item.category?.name}</span>
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={async () => {
                  await adminApi.deleteHomepageItem(item.id);
                  await onReload();
                }}
              >
                Suppr.
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={addTile} className="grid gap-2">
          <select name="category_id" className="rounded-lg border px-3 py-2 text-sm">
            <option value="">Choisir une catégorie</option>
            {flatCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input name="title" placeholder="Titre (optionnel)" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="image_url" placeholder="URL image (optionnel)" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="link_url" placeholder="Lien (optionnel)" className="rounded-lg border px-3 py-2 text-sm" />
          <button type="submit" className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white">
            Ajouter tuile
          </button>
        </form>
      </div>
    </div>
  );
}

function SettingsPanel({
  data,
  onSave,
}: {
  data: AdminHomepagePayload;
  onSave: (partial: Record<string, unknown>) => Promise<void>;
}) {
  const hp = (data.homepage_settings || {}) as Record<string, unknown>;
  const newsletter = (hp.newsletter || {}) as Record<string, unknown>;
  const wa = (hp.whatsapp_widget || {}) as Record<string, unknown>;
  const nav = (Array.isArray(hp.nav_secondary) ? hp.nav_secondary : []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <form
        className="rounded-2xl bg-white p-4 shadow-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          await onSave({
            homepage: {
              ...hp,
              agency_credit: String(form.get("agency_credit") || ""),
              newsletter: { ...newsletter, enabled: false },
              whatsapp_widget: {
                ...wa,
                enabled: form.get("wa_enabled") === "on",
                phone: String(form.get("wa_phone") || ""),
                message: String(form.get("wa_message") || ""),
                agent_image: String(form.get("wa_agent") || ""),
              },
            },
            contacts_services: {
              commercial: String(form.get("commercial") || ""),
              recrutement: String(form.get("recrutement") || ""),
              reclamations: String(form.get("reclamations") || ""),
            },
          });
        }}
      >
        <h2 className="mb-3 font-bold">WhatsApp & contacts</h2>
        <p className="mb-3 text-sm text-brand-black/55">
          Newsletter et réseaux sociaux : à gérer dans{" "}
          <a href="/admin/footer" className="font-semibold text-brand-orange hover:underline">
            Admin → Footer
          </a>{" "}
          (évite le doublon avec le bas de page).
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input name="wa_enabled" type="checkbox" defaultChecked={wa.enabled !== false} />
            Widget WhatsApp actif
          </label>
          <input name="wa_phone" defaultValue={String(wa.phone || "")} placeholder="Téléphone WhatsApp" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="wa_message" defaultValue={String(wa.message || "")} placeholder="Message prérempli" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="wa_agent" defaultValue={String(wa.agent_image || "")} placeholder="URL image agent" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />

          <input name="agency_credit" defaultValue={String(hp.agency_credit || "")} placeholder="Mention agence" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />

          <input name="commercial" defaultValue={data.contacts_services?.commercial || ""} placeholder="Email commercial" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="recrutement" defaultValue={data.contacts_services?.recrutement || ""} placeholder="Email recrutement" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="reclamations" defaultValue={data.contacts_services?.reclamations || ""} placeholder="Email réclamations" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
        </div>
        <button type="submit" className="mt-4 rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white">
          Enregistrer
        </button>
      </form>

      <form
        className="rounded-2xl bg-white p-4 shadow-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const next = nav.length
            ? nav.map((link, i) => ({
                ...link,
                label: String(form.get(`nav_label_${i}`) || link.label),
                href: String(form.get(`nav_href_${i}`) || link.href),
                enabled: form.get(`nav_enabled_${i}`) === "on",
                order: i,
              }))
            : [
                { label: "Promotion", href: "/promotions", enabled: true, order: 0 },
                { label: "Destockage", href: "/destockage", enabled: true, order: 1 },
                { label: "Reconditionné", href: "/reconditionne", enabled: true, order: 2 },
                { label: "Services", href: "/services", enabled: true, order: 3 },
                { label: "Contact", href: "/contact", enabled: true, order: 4 },
              ].map((link, i) => ({
                ...link,
                label: String(form.get(`nav_label_${i}`) || link.label),
                href: String(form.get(`nav_href_${i}`) || link.href),
                enabled: form.get(`nav_enabled_${i}`) === "on",
                order: i,
              }));
          await onSave({ homepage: { ...hp, nav_secondary: next } });
        }}
      >
        <h2 className="mb-3 font-bold">Menu secondaire (header)</h2>
        <div className="space-y-3">
          {(nav.length
            ? nav
            : [
                { label: "Promotion", href: "/promotions", enabled: true },
                { label: "Destockage", href: "/destockage", enabled: true },
                { label: "Reconditionné", href: "/reconditionne", enabled: true },
                { label: "Services", href: "/services", enabled: true },
                { label: "Contact", href: "/contact", enabled: true },
              ]
          ).map((link, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <input
                name={`nav_label_${i}`}
                defaultValue={String(link.label || "")}
                className="rounded-lg border px-3 py-2 text-sm"
              />
              <input
                name={`nav_href_${i}`}
                defaultValue={String(link.href || "")}
                className="rounded-lg border px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input name={`nav_enabled_${i}`} type="checkbox" defaultChecked={link.enabled !== false} />
                Actif
              </label>
            </div>
          ))}
        </div>
        <button type="submit" className="mt-4 rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white">
          Enregistrer le menu
        </button>
      </form>
    </div>
  );
}
