"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";

const PAGES = [
  { key: "home", label: "Accueil" },
  { key: "about", label: "À propos" },
  { key: "contact", label: "Contact" },
  { key: "devis", label: "Devis" },
  { key: "realizations", label: "Réalisations (textes)" },
  { key: "privacy", label: "Politique de confidentialité" },
  { key: "cgu", label: "CGU" },
] as const;

export default function AdminContenuPage() {
  const [pageKey, setPageKey] = useState<(typeof PAGES)[number]["key"]>("home");
  const [jsonText, setJsonText] = useState("{}");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    setMessage("");
    adminApi
      .getPage(pageKey)
      .then((data) => setJsonText(JSON.stringify(data.blocks, null, 2)))
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [pageKey]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const blocks = JSON.parse(jsonText) as Record<string, unknown>;
      const saved = await adminApi.updatePage(pageKey, blocks);
      setJsonText(JSON.stringify(saved.blocks, null, 2));
      setMessage("Contenu enregistré.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "JSON invalide ou échec d'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-brand-black">Contenu des pages</h1>
      <p className="mt-1 text-sm text-brand-black/60">
        Modifiez les textes et images des pages publiques (format JSON structuré).
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {PAGES.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPageKey(p.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              pageKey === p.key
                ? "bg-brand-orange text-white"
                : "bg-white text-brand-black shadow-sm"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 max-w-4xl">
        {loading ? (
          <p className="text-brand-black/50">Chargement…</p>
        ) : (
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={28}
            className="w-full rounded-2xl border border-brand-black/10 bg-white p-4 font-mono text-xs leading-relaxed shadow-sm"
            spellCheck={false}
          />
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-3 text-sm text-green-700">{message}</p>}

        <button
          type="submit"
          disabled={saving || loading}
          className="mt-4 rounded-full bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer cette page"}
        </button>
      </form>
    </div>
  );
}
