"use client";

import { useState } from "react";
import { adminApi } from "@/lib/adminApi";

export default function GenerateProductCopyButton() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function generate(form: HTMLFormElement) {
    const data = new FormData(form);
    const category = form.querySelector<HTMLSelectElement>("[name=category_id]");
    const brand = form.querySelector<HTMLSelectElement>("[name=brand_id]");
    setBusy(true);
    setNote("");
    try {
      const copy = await adminApi.describeProduct({
        name: String(data.get("name") || ""),
        category: category?.selectedOptions[0]?.text || "",
        brand: brand?.selectedOptions[0]?.text === "— Aucune —" ? "" : brand?.selectedOptions[0]?.text || "",
        specs: String(data.get("specs_text") || ""),
        price: data.get("price") ? Number(data.get("price")) : null,
        warranty: String(data.get("warranty") || ""),
      });
      const set = (name: string, value: string) => {
        const field = form.elements.namedItem(name);
        if (field && "value" in field) field.value = value;
      };
      set("short_description", copy.short_description || "");
      set("description", copy.description || "");
      set("specs_text", copy.specs || String(data.get("specs_text") || ""));
      set("meta_title", copy.seo_title || "");
      set("meta_description", copy.meta_description || "");
      setNote("Texte proposé. Relisez-le avant d'enregistrer.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Génération impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          const form = e.currentTarget.closest("form");
          if (form) generate(form);
        }}
        className="rounded-full border border-brand-orange px-4 py-2 text-sm font-bold text-brand-orange"
      >
        {busy ? "Rédaction…" : "Générer la description avec l'assistant"}
      </button>
      {note ? <p className="mt-2 text-xs text-brand-black/70">{note}</p> : null}
    </div>
  );
}
