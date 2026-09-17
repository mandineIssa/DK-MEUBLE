"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";

type Col = {
  id: number;
  title: string;
  display_order: number;
  is_active: boolean;
  links: Array<{
    id: number;
    footer_column_id: number;
    label: string;
    url: string;
    display_order: number;
    is_active: boolean;
    opens_new_tab: boolean;
  }>;
};

type LegalSection = { title: string; body: string };

type LegalPage = {
  hero: { eyebrow: string; title: string; subtitle: string };
  intro: string;
  sections: LegalSection[];
  updated_label: string;
};

const EMPTY_LEGAL: LegalPage = {
  hero: { eyebrow: "Légal", title: "", subtitle: "" },
  intro: "",
  sections: [],
  updated_label: "",
};

function normalizeLegal(blocks: Record<string, unknown> | undefined): LegalPage {
  const hero = (blocks?.hero || {}) as Record<string, string>;
  const sectionsRaw = Array.isArray(blocks?.sections) ? blocks!.sections : [];
  return {
    hero: {
      eyebrow: String(hero.eyebrow || "Légal"),
      title: String(hero.title || ""),
      subtitle: String(hero.subtitle || ""),
    },
    intro: String(blocks?.intro || ""),
    sections: sectionsRaw.map((s) => {
      const row = (s || {}) as Record<string, string>;
      return { title: String(row.title || ""), body: String(row.body || "") };
    }),
    updated_label: String(blocks?.updated_label || ""),
  };
}

export default function AdminFooterPage() {
  const [tab, setTab] = useState<"settings" | "columns" | "socials" | "payments" | "legal">(
    "settings"
  );
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [columns, setColumns] = useState<Col[]>([]);
  const [socials, setSocials] = useState<
    Array<{ id: number; platform: string; url: string; is_active: boolean }>
  >([]);
  const [payments, setPayments] = useState<Array<{ id: number; name: string; logo_path: string }>>([]);
  const [msg, setMsg] = useState("");
  const [newCol, setNewCol] = useState("");
  const [linkDraft, setLinkDraft] = useState<Record<number, { label: string; url: string }>>({});
  const [socialDraft, setSocialDraft] = useState({ platform: "facebook", url: "" });
  const [payName, setPayName] = useState("");
  const [payFile, setPayFile] = useState<File | null>(null);
  const [legalKey, setLegalKey] = useState<"privacy" | "cgu">("privacy");
  const [legal, setLegal] = useState<LegalPage>(EMPTY_LEGAL);
  const [legalBusy, setLegalBusy] = useState(false);

  async function refresh() {
    const res = await adminApi.getFooterAdmin();
    setSettings(res.settings || {});
    setColumns(res.columns || []);
    setSocials(res.socials || []);
    setPayments(res.payments || []);
  }

  async function loadLegal(key: "privacy" | "cgu") {
    setLegalBusy(true);
    try {
      const page = await adminApi.getPage(key);
      setLegal(normalizeLegal(page.blocks));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur chargement page légale");
      setLegal(EMPTY_LEGAL);
    } finally {
      setLegalBusy(false);
    }
  }

  useEffect(() => {
    refresh().catch((e) => setMsg(e instanceof Error ? e.message : "Erreur"));
  }, []);

  useEffect(() => {
    if (tab === "legal") {
      loadLegal(legalKey).catch(() => null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, legalKey]);

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await adminApi.updateFooterSettings(settings);
      setMsg("Réglages footer enregistrés.");
      await refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function saveLegal(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    setLegalBusy(true);
    try {
      await adminApi.updatePage(legalKey, {
        hero: legal.hero,
        intro: legal.intro,
        sections: legal.sections,
        updated_label: legal.updated_label,
      });
      setMsg(
        legalKey === "privacy"
          ? "Politique de confidentialité enregistrée."
          : "CGU enregistrées."
      );
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLegalBusy(false);
    }
  }

  const settingFields = [
    ["newsletter_title", "Titre newsletter", "input"],
    ["newsletter_text", "Texte newsletter (avant le lien confidentialité)", "textarea"],
    ["newsletter_privacy_link_label", "Libellé du lien « Politique de confidentialité »", "input"],
    ["newsletter_privacy_url", "URL page confidentialité", "input"],
    ["newsletter_legal_intro", "Intro conditions légales", "textarea"],
    ["newsletter_legal_link_label", "Libellé lien orange (conditions)", "input"],
    ["newsletter_legal_url", "URL conditions légales (CGU)", "input"],
    ["newsletter_privacy_label", "Libellé case RGPD (checkbox)", "textarea"],
    ["newsletter_disclaimer", "Mention désabonnement (bas du formulaire)", "textarea"],
    ["newsletter_cta", "Bouton s'abonner", "input"],
    ["app_block_title", "Titre bloc app", "input"],
    ["app_block_subtitle", "Sous-titre app", "input"],
    ["app_store_url", "URL App Store (vide = masqué)", "input"],
    ["google_play_url", "URL Google Play (vide = masqué)", "input"],
    ["contact_heading", "Titre bloc Contact", "input"],
    ["company_name", "Nom entreprise", "input"],
    ["company_address", "Adresse", "input"],
    ["company_phones", "Téléphones (séparés par virgule)", "input"],
    ["socials_heading", "Titre réseaux sociaux", "input"],
    ["payments_heading", "Titre modes de paiement", "input"],
    ["payments_empty_text", "Texte si aucun logo paiement", "input"],
    ["brands_heading", "Titre marques", "input"],
    ["copyright_text", "Texte copyright", "input"],
  ] as const;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-extrabold text-brand-black">Footer</h1>
      <p className="mt-1 text-sm text-brand-black/50">
        Tout le bas de page est paramétrable ici : newsletter, liens, réseaux, paiements et pages
        légales.
      </p>
      {msg ? <p className="mt-3 text-sm font-medium text-brand-orange">{msg}</p> : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["settings", "Réglages & textes"],
            ["legal", "Pages légales"],
            ["columns", "Colonnes & liens"],
            ["socials", "Réseaux"],
            ["payments", "Paiements"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-full px-4 py-2 text-xs font-bold ${
              tab === k ? "bg-brand-orange text-white" : "border bg-white"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="rounded-full border bg-white px-4 py-2 text-xs font-bold"
          onClick={() =>
            adminApi
              .seedFooter()
              .then((r) => {
                setMsg(r.seeded ? `Seed OK (${r.columns} colonnes)` : "Déjà seedé");
                return refresh();
              })
              .catch((e) => setMsg(e instanceof Error ? e.message : "Erreur"))
          }
        >
          Importer structure par défaut
        </button>
      </div>

      {tab === "settings" ? (
        <form onSubmit={saveSettings} className="mt-6 max-w-2xl space-y-3 rounded-2xl bg-white p-6 shadow-sm">
          {settingFields.map(([key, label, kind]) => (
            <label key={key} className="block text-sm">
              {label}
              {kind === "textarea" ? (
                <textarea
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  rows={3}
                  value={String(settings[key] ?? "")}
                  onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                />
              ) : (
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={String(settings[key] ?? "")}
                  onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                />
              )}
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(settings.show_newsletter ?? true)}
              onChange={(e) => setSettings((s) => ({ ...s, show_newsletter: e.target.checked }))}
            />
            Afficher le bandeau newsletter
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(settings.show_brands ?? true)}
              onChange={(e) => setSettings((s) => ({ ...s, show_brands: e.target.checked }))}
            />
            Afficher les marques dans le footer
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(settings.brands_only_featured ?? false)}
              onChange={(e) => setSettings((s) => ({ ...s, brands_only_featured: e.target.checked }))}
            />
            Uniquement marques mises en avant
          </label>
          <label className="block text-sm">
            Nombre de colonnes (3–5)
            <input
              type="number"
              min={3}
              max={5}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={Number(settings.columns_count ?? 4)}
              onChange={(e) => setSettings((s) => ({ ...s, columns_count: Number(e.target.value) }))}
            />
          </label>
          <button type="submit" className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-bold text-white">
            Enregistrer
          </button>
        </form>
      ) : null}

      {tab === "legal" ? (
        <form onSubmit={saveLegal} className="mt-6 max-w-3xl space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLegalKey("privacy")}
              className={`rounded-full px-4 py-2 text-xs font-bold ${
                legalKey === "privacy" ? "bg-brand-black text-white" : "border"
              }`}
            >
              Politique de confidentialité
            </button>
            <button
              type="button"
              onClick={() => setLegalKey("cgu")}
              className={`rounded-full px-4 py-2 text-xs font-bold ${
                legalKey === "cgu" ? "bg-brand-black text-white" : "border"
              }`}
            >
              CGU
            </button>
          </div>

          {legalBusy && !legal.hero.title && !legal.intro ? (
            <p className="text-sm text-brand-black/50">Chargement…</p>
          ) : (
            <>
              <label className="block text-sm">
                Sur-titre
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={legal.hero.eyebrow}
                  onChange={(e) =>
                    setLegal((l) => ({ ...l, hero: { ...l.hero, eyebrow: e.target.value } }))
                  }
                />
              </label>
              <label className="block text-sm">
                Titre de la page
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={legal.hero.title}
                  onChange={(e) =>
                    setLegal((l) => ({ ...l, hero: { ...l.hero, title: e.target.value } }))
                  }
                />
              </label>
              <label className="block text-sm">
                Sous-titre
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={legal.hero.subtitle}
                  onChange={(e) =>
                    setLegal((l) => ({ ...l, hero: { ...l.hero, subtitle: e.target.value } }))
                  }
                />
              </label>
              <label className="block text-sm">
                Introduction
                <textarea
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  rows={4}
                  value={legal.intro}
                  onChange={(e) => setLegal((l) => ({ ...l, intro: e.target.value }))}
                />
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Sections</p>
                  <button
                    type="button"
                    className="rounded-full border px-3 py-1 text-xs font-bold"
                    onClick={() =>
                      setLegal((l) => ({
                        ...l,
                        sections: [...l.sections, { title: "Nouvelle section", body: "" }],
                      }))
                    }
                  >
                    + Section
                  </button>
                </div>
                {legal.sections.map((section, index) => (
                  <div key={index} className="rounded-xl border border-black/10 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <input
                        className="flex-1 rounded-lg border px-2 py-1 text-sm font-semibold"
                        value={section.title}
                        onChange={(e) =>
                          setLegal((l) => {
                            const sections = [...l.sections];
                            sections[index] = { ...sections[index], title: e.target.value };
                            return { ...l, sections };
                          })
                        }
                        placeholder="Titre de section"
                      />
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-600"
                        onClick={() =>
                          setLegal((l) => ({
                            ...l,
                            sections: l.sections.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        Supprimer
                      </button>
                    </div>
                    <textarea
                      className="w-full rounded-lg border px-2 py-2 text-sm"
                      rows={4}
                      value={section.body}
                      onChange={(e) =>
                        setLegal((l) => {
                          const sections = [...l.sections];
                          sections[index] = { ...sections[index], body: e.target.value };
                          return { ...l, sections };
                        })
                      }
                      placeholder="Contenu de la section…"
                    />
                  </div>
                ))}
              </div>

              <label className="block text-sm">
                Mention de mise à jour
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={legal.updated_label}
                  onChange={(e) => setLegal((l) => ({ ...l, updated_label: e.target.value }))}
                />
              </label>

              <button
                type="submit"
                disabled={legalBusy}
                className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {legalBusy ? "Enregistrement…" : "Enregistrer la page"}
              </button>
            </>
          )}
        </form>
      ) : null}

      {tab === "columns" ? (
        <div className="mt-6 space-y-4">
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newCol.trim()) return;
              await adminApi.createFooterColumn({ title: newCol.trim() });
              setNewCol("");
              await refresh();
            }}
          >
            <input
              value={newCol}
              onChange={(e) => setNewCol(e.target.value)}
              placeholder="Nouvelle colonne…"
              className="flex-1 rounded-xl border px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white">
              Ajouter colonne
            </button>
          </form>

          {columns.map((col) => (
            <div key={col.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="rounded-lg border px-2 py-1 text-sm font-bold"
                  defaultValue={col.title}
                  onBlur={(e) => {
                    if (e.target.value !== col.title) {
                      adminApi.updateFooterColumn(col.id, { title: e.target.value }).then(refresh);
                    }
                  }}
                />
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={col.is_active}
                    onChange={(e) =>
                      adminApi.updateFooterColumn(col.id, { is_active: e.target.checked }).then(refresh)
                    }
                  />
                  Active
                </label>
                <button
                  type="button"
                  className="ml-auto text-xs font-semibold text-red-600"
                  onClick={() => adminApi.deleteFooterColumn(col.id).then(refresh)}
                >
                  Supprimer
                </button>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center gap-2 border-b border-black/5 py-1">
                    <span className="font-medium">{l.label}</span>
                    <span className="text-xs text-brand-black/45">{l.url}</span>
                    <button
                      type="button"
                      className="ml-auto text-xs text-red-600"
                      onClick={() => adminApi.deleteFooterLink(l.id).then(refresh)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <form
                className="mt-3 flex flex-wrap gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const draft = linkDraft[col.id] || { label: "", url: "" };
                  if (!draft.label || !draft.url) return;
                  await adminApi.createFooterLink({
                    footer_column_id: col.id,
                    label: draft.label,
                    url: draft.url,
                  });
                  setLinkDraft((d) => ({ ...d, [col.id]: { label: "", url: "" } }));
                  await refresh();
                }}
              >
                <input
                  placeholder="Libellé"
                  className="rounded-lg border px-2 py-1 text-sm"
                  value={linkDraft[col.id]?.label || ""}
                  onChange={(e) =>
                    setLinkDraft((d) => ({
                      ...d,
                      [col.id]: { ...(d[col.id] || { label: "", url: "" }), label: e.target.value },
                    }))
                  }
                />
                <input
                  placeholder="/url ou https://…"
                  className="min-w-[12rem] flex-1 rounded-lg border px-2 py-1 text-sm"
                  value={linkDraft[col.id]?.url || ""}
                  onChange={(e) =>
                    setLinkDraft((d) => ({
                      ...d,
                      [col.id]: { ...(d[col.id] || { label: "", url: "" }), url: e.target.value },
                    }))
                  }
                />
                <button type="submit" className="rounded-full bg-brand-black px-3 py-1 text-xs font-bold text-white">
                  + Lien
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "socials" ? (
        <div className="mt-6 max-w-xl space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <ul className="space-y-2 text-sm">
            {socials.map((s) => (
              <li key={s.id} className="flex items-center gap-2 border-b border-black/5 py-2">
                <span className="w-24 font-semibold capitalize">{s.platform}</span>
                <span className="flex-1 truncate text-xs text-brand-black/50">{s.url}</span>
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => adminApi.deleteFooterSocial(s.id).then(refresh)}
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await adminApi.upsertFooterSocial(socialDraft);
              setSocialDraft({ platform: "facebook", url: "" });
              await refresh();
            }}
          >
            <select
              className="rounded-lg border px-2 py-1 text-sm"
              value={socialDraft.platform}
              onChange={(e) => setSocialDraft((d) => ({ ...d, platform: e.target.value }))}
            >
              {["facebook", "instagram", "tiktok", "x", "youtube", "whatsapp"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              className="min-w-[14rem] flex-1 rounded-lg border px-2 py-1 text-sm"
              placeholder="https://…"
              value={socialDraft.url}
              onChange={(e) => setSocialDraft((d) => ({ ...d, url: e.target.value }))}
              required
            />
            <button type="submit" className="rounded-full bg-brand-orange px-4 py-1.5 text-xs font-bold text-white">
              Enregistrer
            </button>
          </form>
        </div>
      ) : null}

      {tab === "payments" ? (
        <div className="mt-6 max-w-xl space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <ul className="space-y-2 text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between border-b border-black/5 py-2">
                <span>{p.name}</span>
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => adminApi.deleteFooterPayment(p.id).then(refresh)}
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
          <form
            className="space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!payFile || !payName.trim()) return;
              await adminApi.uploadFooterPayment(payName.trim(), payFile);
              setPayName("");
              setPayFile(null);
              setMsg("Logo paiement ajouté.");
              await refresh();
            }}
          >
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="Nom (Wave, Orange Money…)"
              value={payName}
              onChange={(e) => setPayName(e.target.value)}
              required
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPayFile(e.target.files?.[0] || null)}
              required
            />
            <button type="submit" className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white">
              Uploader logo
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
