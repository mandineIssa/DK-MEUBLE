"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import {
  applyThemeToDocument,
  DEFAULT_SITE_THEME,
  normalizeTheme,
  type SiteTheme,
} from "@/lib/theme";

const COLOR_FIELDS: Array<[keyof SiteTheme, string]> = [
  ["accent_primary", "Accent primaire (header, boutons, prix, footer)"],
  ["accent_primary_hover", "Accent au survol"],
  ["header_bg", "Fond header"],
  ["header_nav_bg", "Fond barre de navigation"],
  ["body_bg", "Fond pages / cartes"],
  ["content_bg_alt", "Fond alterné (listing / sections)"],
  ["text_primary", "Texte principal"],
  ["text_secondary", "Texte secondaire"],
  ["border_light", "Bordures"],
  ["price_color", "Prix actuel / promo"],
  ["price_strikethrough", "Prix barré"],
  ["badge_bg", "Fond badges réduction"],
  ["success_color", "Succès"],
  ["danger_color", "Erreur / rupture"],
];

export default function AdminThemePage() {
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_SITE_THEME);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi
      .getSettings()
      .then((s) => {
        const next = normalizeTheme((s as { theme?: unknown }).theme);
        setTheme(next);
        applyThemeToDocument(next);
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : "Erreur"));
  }, []);

  // Aperçu live dans l’admin
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await adminApi.updateSettings({ theme });
      setMsg("Thème enregistré. L’accent est aussi appliqué au footer.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function setColor(key: keyof SiteTheme, value: string) {
    setTheme((t) => {
      const next = { ...t, [key]: value };
      // Garder prix & badge alignés sur l’accent si l’admin change uniquement l’accent
      if (key === "accent_primary") {
        if (t.price_color === t.accent_primary) next.price_color = value;
        if (t.badge_bg === t.accent_primary) next.badge_bg = value;
      }
      return next;
    });
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-extrabold text-brand-black">Thème du site</h1>
      <p className="mt-1 max-w-2xl text-sm text-brand-black/50">
        Thème clair Jumia pour le header et le corps. Une seule couleur d’accent pilote boutons,
        prix, badges et le footer sombre. Aucune couleur n’est codée en dur côté front.
      </p>
      {msg ? <p className="mt-3 text-sm font-medium text-brand-orange">{msg}</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={onSave} className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
          {COLOR_FIELDS.map(([key, label]) => (
            <label key={key} className="flex flex-wrap items-center gap-3 text-sm">
              <span className="w-64 shrink-0">{label}</span>
              <input
                type="color"
                className="h-9 w-12 cursor-pointer rounded border"
                value={
                  /^#[0-9a-fA-F]{6}$/.test(String(theme[key]))
                    ? String(theme[key])
                    : "#000000"
                }
                onChange={(e) => setColor(key, e.target.value)}
              />
              <input
                className="min-w-[8rem] flex-1 rounded-xl border px-3 py-2 font-mono text-xs"
                value={String(theme[key] ?? "")}
                onChange={(e) => setColor(key, e.target.value)}
              />
            </label>
          ))}

          <label className="flex items-center gap-2 pt-2 text-sm">
            <input
              type="checkbox"
              checked={theme.use_alt_bg_sections}
              onChange={(e) =>
                setTheme((t) => ({ ...t, use_alt_bg_sections: e.target.checked }))
              }
            />
            Alterner les fonds (blanc / gris clair) entre sections d’accueil
          </label>

          <label className="block text-sm">
            Seuil scroll header compact (px)
            <input
              type="number"
              min={0}
              max={500}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={theme.header_compact_scroll}
              onChange={(e) =>
                setTheme((t) => ({
                  ...t,
                  header_compact_scroll: Number(e.target.value) || 0,
                }))
              }
            />
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              className="rounded-full border px-4 py-2 text-xs font-bold"
              onClick={() => setTheme(DEFAULT_SITE_THEME)}
            >
              Réinitialiser (style clair Jumia)
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? "Enregistrement…" : "Enregistrer le thème"}
            </button>
          </div>
        </form>

        {/* Aperçu live */}
        <aside className="space-y-4">
          <div
            className="overflow-hidden rounded-2xl border shadow-sm"
            style={{ borderColor: theme.border_light }}
          >
            <div
              className="flex items-center gap-2 border-b px-3 py-2.5"
              style={{
                background: theme.header_bg,
                borderColor: theme.border_light,
                color: theme.text_primary,
              }}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: theme.accent_primary }}
              >
                ★
              </span>
              <span className="text-xs font-bold">
                DK <span style={{ color: theme.accent_primary }}>HOMETECH</span>
              </span>
              <div
                className="ml-auto flex flex-1 max-w-[140px] overflow-hidden rounded border text-[10px]"
                style={{ borderColor: theme.border_light }}
              >
                <span className="flex-1 px-2 py-1.5" style={{ color: theme.text_secondary }}>
                  Rechercher…
                </span>
                <span
                  className="px-2 py-1.5 font-bold text-white"
                  style={{ background: theme.accent_primary }}
                >
                  OK
                </span>
              </div>
            </div>
            <div
              className="p-4"
              style={{ background: theme.content_bg_alt }}
            >
              <div
                className="overflow-hidden rounded-xl bg-white"
                style={{ border: `1px solid ${theme.border_light}` }}
              >
                <div
                  className="relative h-24"
                  style={{ background: theme.content_bg_alt }}
                >
                  <span
                    className="absolute left-2 top-2 rounded-sm px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ background: theme.badge_bg }}
                  >
                    -15%
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-[10px] uppercase" style={{ color: theme.text_secondary }}>
                    Samsung
                  </p>
                  <p className="text-sm font-bold" style={{ color: theme.text_primary }}>
                    Réfrigérateur 300L
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-sm font-bold" style={{ color: theme.price_color }}>
                      189 000 FCFA
                    </span>
                    <span
                      className="text-[11px] line-through"
                      style={{ color: theme.price_strikethrough }}
                    >
                      220 000
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mt-3 w-full rounded-full py-2 text-xs font-bold text-white"
                    style={{ background: theme.accent_primary }}
                  >
                    Ajouter au panier
                  </button>
                </div>
              </div>
              <p className="mt-3 text-center text-[10px]" style={{ color: theme.text_secondary }}>
                Aperçu header + carte produit
              </p>
            </div>
            <div
              className="px-3 py-2 text-center text-[10px] text-white"
              style={{ background: "#3d3d3d" }}
            >
              Footer accent →{" "}
              <span style={{ color: theme.accent_primary }} className="font-bold">
                {theme.accent_primary}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
